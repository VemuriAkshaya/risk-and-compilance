import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supplierService } from '../services/supplierService';
import { Supplier, ComplianceDocument } from '../types/supplier';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge, RiskBadge, ComplianceBadge, PerformanceBadge } from '../components/common/Badge';
import { SapCard } from '../components/common/Card';
import { ConfirmActionModal, ActionType } from '../components/dialogs/ConfirmActionModal';
import { ReassessRiskModal } from '../components/dialogs/ReassessRiskModal';
import { RenewDocumentModal } from '../components/dialogs/RenewDocumentModal';
import { DocumentViewerModal } from '../components/dialogs/DocumentViewerModal';
import { RiskRadarChart } from '../components/charts/RiskRadarChart';
import {
  Building2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Edit2,
  FileCheck,
  Upload,
  AlertOctagon,
  Calendar,
  CreditCard,
  Mail,
  Phone,
  Globe,
  MapPin,
  Award,
  RefreshCw,
  Eye,
  Download,
  Trash2,
} from 'lucide-react';

export const SupplierDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can, userRole } = useAuth();
  const { success, error, warning, info } = useToast();


  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'risk' | 'compliance' | 'performance' | 'purchase'>('info');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState<ActionType>('BLOCK');
  const [reassessModalOpen, setReassessModalOpen] = useState(false);
  const [renewDocModalOpen, setRenewDocModalOpen] = useState(false);
  const [selectedDocForRenew, setSelectedDocForRenew] = useState<ComplianceDocument | null>(null);
  const [viewerModalOpen, setViewerModalOpen] = useState(false);
  const [selectedDocForView, setSelectedDocForView] = useState<ComplianceDocument | null>(null);

  // Quick Performance Edit state
  const [perfModalOpen, setPerfModalOpen] = useState(false);
  const [editQuality, setEditQuality] = useState(85);
  const [editDelivery, setEditDelivery] = useState(85);
  const [editNotes, setEditNotes] = useState('');


  const loadSupplierData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await supplierService.getSupplierById(id);
      if (!data) {
        error('Not Found', `Supplier ${id} does not exist in master records.`);
        navigate('/suppliers');
        return;
      }
      setSupplier(data);
      if (data.performance) {
        setEditQuality(data.performance.qualityScore);
        setEditDelivery(data.performance.deliveryScore);
        setEditNotes(data.performance.notes || '');
      }
    } catch (err: any) {
      error('Failed to load supplier', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSupplierData();
  }, [id]);

  if (isLoading || !supplier) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading supplier details...</div>;
  }

  const hasExpiredDocs = supplier.documents.some((d) => d.status === 'EXPIRED');

  // Business Rule Actions:
  const handleApprove = async () => {
    // RULE 1: Supplier with expired compliance cannot be approved!
    if (hasExpiredDocs || supplier.complianceStatus === 'NON_COMPLIANT') {
      error(
        'Approval Blocked by Compliance Policy',
        `Supplier ${supplier.name} has active expired compliance documents. Resolve expired certificates before approval.`
      );
      return;
    }

    // RULE 2: HIGH risk supplier requires review.
    if (supplier.riskLevel === 'HIGH') {
      setConfirmActionType('APPROVE_HIGH_RISK');
      setConfirmModalOpen(true);
      return;
    }

    // Direct approval for Low/Medium risk with valid compliance
    try {
      await supplierService.approveSupplier(supplier.id);
      success('Supplier Approved', `${supplier.name} (${supplier.id}) approved for procurement orders.`);
      loadSupplierData();
    } catch (err: any) {
      error('Approval Failed', err.message);
    }
  };

  const handleConfirmModalAction = async (reason: string) => {
    if (!supplier) return;

    try {
      if (confirmActionType === 'APPROVE_HIGH_RISK') {
        await supplierService.approveSupplier(supplier.id, {
          reviewNotes: reason,
          overrideHighRiskWarning: true,
        });
        success('High-Risk Approval Granted', `${supplier.name} cleared under executive governance waiver.`);
      } else if (confirmActionType === 'BLOCK') {
        await supplierService.blockSupplier(supplier.id, reason);
        warning('Supplier Blocked', `${supplier.name} has been placed in BLOCKED status.`);
      } else if (confirmActionType === 'REJECT') {
        await supplierService.rejectSupplier(supplier.id, reason);
        error('Supplier Application Rejected', `${supplier.name} status shifted to REJECTED.`);
      }
      loadSupplierData();
    } catch (err: any) {
      error('Operation Failed', err.message);
      throw err;
    }
  };

  const handleUnblock = async () => {
    // Cannot unblock if documents are expired!
    if (hasExpiredDocs) {
      error(
        'Unblock Prohibited',
        `Cannot unblock ${supplier.name}. Active compliance certificates are expired. Renew documents first.`
      );
      return;
    }

    try {
      await supplierService.unblockSupplier(supplier.id);
      info('Supplier Unblocked', `${supplier.name} unblocked and shifted to UNDER REVIEW for procurement clearing.`);
      loadSupplierData();
    } catch (err: any) {
      error('Unblock Failed', err.message);
    }
  };

  const handleSaveRiskReassessment = async (factors: any) => {
    try {
      const res = await supplierService.reassessRisk(supplier.id, factors);
      success(
        'Risk Profile Recalculated',
        `New Risk Score: ${res.newScore} (${res.newLevel}). ${
          res.newLevel === 'HIGH' ? 'Governance review hold applied.' : ''
        }`
      );
      loadSupplierData();
    } catch (err: any) {
      error('Reassessment Error', err.message);
      throw err;
    }
  };

  const handleSaveRenewDocument = async (docData: any) => {
    try {
      if (selectedDocForRenew) {
        await supplierService.renewComplianceDocument(supplier.id, selectedDocForRenew.id, docData);
        success(
          'Document Renewed',
          `Certificate [${docData.documentType}] updated. Expiry: ${docData.expiryDate}.`
        );
      } else {
        await supplierService.addComplianceDocument(supplier.id, docData);
        success('Document Added', `Certificate [${docData.documentType}] registered.`);
      }
      setSelectedDocForRenew(null);
      loadSupplierData();
    } catch (err: any) {
      error('Document Update Failed', err.message);
      throw err;
    }
  };

  const handleOpenViewer = (doc: ComplianceDocument) => {
    setSelectedDocForView(doc);
    setViewerModalOpen(true);
  };

  const handleDownloadDoc = (doc: ComplianceDocument) => {
    if (!supplier) return;
    supplierService.downloadDocumentDossier(doc, supplier.name);
    success('Certificate Dossier Downloaded', `Downloaded verified record for ${doc.documentType}.`);
  };

  const handleDeleteDoc = async (doc: ComplianceDocument) => {
    if (!supplier) return;
    if (!can('DELETE_DOCUMENTS')) {
      error('Unauthorized', 'Your role does not permit deleting verified compliance certificates.');
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete certificate [${doc.documentType} #${doc.documentNumber}]?`)) {
      try {
        await supplierService.deleteComplianceDocument(supplier.id, doc.id);
        warning('Document Deleted', `Certificate ${doc.documentNumber} removed.`);
        loadSupplierData();
      } catch (err: any) {
        error('Deletion Failed', err.message);
      }
    }
  };


  const handleSavePerformance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supplierService.updatePerformance(supplier.id, editQuality, editDelivery, editNotes);
      success(
        'Performance Scorecard Updated',
        `Quality: ${editQuality}%, Delivery: ${editDelivery}% → Overall Score: ${Math.round(
          (editQuality + editDelivery) / 2
        )}%`
      );
      setPerfModalOpen(false);
      loadSupplierData();
    } catch (err: any) {
      error('Performance Update Failed', err.message);
    }
  };

  return (
    <div>
      {/* Back button & Breadcrumb */}
      <div style={{ marginBottom: '14px' }}>
        <Link to="/suppliers" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0 }}>
          <ArrowLeft size={16} />
          <span>Back to All Suppliers</span>
        </Link>
      </div>

      {/* Enterprise Header Dossier Card */}
      <div
        className="sap-card"
        style={{
          padding: '24px',
          marginBottom: '20px',
          borderLeft: `6px solid ${
            supplier.supplierStatus === 'APPROVED'
              ? 'var(--sap-success)'
              : supplier.supplierStatus === 'BLOCKED'
              ? 'var(--sap-error)'
              : 'var(--sap-primary)'
          }`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'var(--sap-font-mono)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: 'var(--sap-primary)',
                  backgroundColor: 'var(--sap-primary-light)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}
              >
                {supplier.id}
              </span>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--sap-text-primary)' }}>
                {supplier.name}
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '0.85rem', color: '#64748b' }}>
              <span>{supplier.category}</span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} />
                {supplier.city}, {supplier.country} ({supplier.countryCode})
              </span>
              <span>•</span>
              <span>Tax ID: {supplier.taxId}</span>
            </div>

            {/* Badges Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
              <StatusBadge status={supplier.supplierStatus} />
              <RiskBadge level={supplier.riskLevel} score={supplier.riskScore} />
              <ComplianceBadge status={supplier.complianceStatus} />
              <PerformanceBadge status={supplier.performance.status} score={supplier.performance.overallScore} />
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Reassess Risk */}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setReassessModalOpen(true)}
              title="Recalculate 5-dimensional risk rating"
            >
              <Sliders size={16} />
              <span>Reassess Risk</span>
            </button>

            {/* Edit Master Data */}
            <Link to={`/suppliers/${supplier.id}/edit`} className="btn btn-secondary">
              <Edit2 size={16} />
              <span>Edit</span>
            </Link>

            {/* Approve Action */}
            {supplier.supplierStatus !== 'APPROVED' && (
              <button
                type="button"
                className="btn btn-success"
                onClick={handleApprove}
                disabled={hasExpiredDocs}
                title={
                  hasExpiredDocs
                    ? 'Cannot approve: Expired compliance documents exist'
                    : supplier.riskLevel === 'HIGH'
                    ? 'Requires executive compliance review'
                    : 'Approve supplier for procurement'
                }
              >
                <CheckCircle2 size={16} />
                <span>Approve</span>
              </button>
            )}

            {/* Unblock Action */}
            {supplier.supplierStatus === 'BLOCKED' && (
              <button
                type="button"
                className="btn btn-warning"
                onClick={handleUnblock}
                disabled={hasExpiredDocs}
                title={hasExpiredDocs ? 'Renew expired documents before unblocking' : 'Unblock supplier'}
              >
                <RefreshCw size={16} />
                <span>Unblock</span>
              </button>
            )}

            {/* Block Action */}
            {supplier.supplierStatus !== 'BLOCKED' && supplier.supplierStatus !== 'REJECTED' && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  setConfirmActionType('BLOCK');
                  setConfirmModalOpen(true);
                }}
                title="Lock supplier with audit reason"
              >
                <ShieldAlert size={16} />
                <span>Block</span>
              </button>
            )}

            {/* Reject Action */}
            {supplier.supplierStatus === 'UNDER_REVIEW' && (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ color: '#ba1717' }}
                onClick={() => {
                  setConfirmActionType('REJECT');
                  setConfirmModalOpen(true);
                }}
                title="Reject supplier application"
              >
                <XCircle size={16} />
                <span>Reject</span>
              </button>
            )}
          </div>
        </div>

        {/* Business Rule Lock Alert Notice */}
        {supplier.supplierStatus === 'BLOCKED' && (
          <div className="sap-alert-banner alert-danger" style={{ marginTop: '16px', marginBottom: 0 }}>
            <AlertOctagon size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Supplier Locked (BLOCKED Status)</strong>
              <div>Reason: {supplier.blockReason || 'Compliance documents expired.'}</div>
              {hasExpiredDocs && (
                <div style={{ marginTop: '4px', fontSize: '0.8rem' }}>
                  Renew the expired certificates in the <strong>Compliance Documents</strong> tab to enable unblocking and purchasing clearance.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="sap-card">
        <div className="sap-tabs-header">
          <button
            type="button"
            className={`sap-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <span>Supplier Information</span>
          </button>

          <button
            type="button"
            className={`sap-tab-btn ${activeTab === 'risk' ? 'active' : ''}`}
            onClick={() => setActiveTab('risk')}
          >
            <span>Risk Assessment</span>
            <span className="tab-badge">{supplier.riskScore}/100</span>
          </button>

          <button
            type="button"
            className={`sap-tab-btn ${activeTab === 'compliance' ? 'active' : ''}`}
            onClick={() => setActiveTab('compliance')}
          >
            <span>Compliance Documents</span>
            <span className="tab-badge">{supplier.documents.length}</span>
          </button>

          <button
            type="button"
            className={`sap-tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            <span>Performance Scorecard</span>
            <span className="tab-badge">{supplier.performance.overallScore}%</span>
          </button>

          <button
            type="button"
            className={`sap-tab-btn ${activeTab === 'purchase' ? 'active' : ''}`}
            onClick={() => setActiveTab('purchase')}
          >
            <span>Purchase &amp; Orders</span>
            <span className="tab-badge">{supplier.purchaseOrders.length}</span>
          </button>
        </div>

        <div className="sap-tab-content">
          {/* TAB 1: Supplier Information */}
          {activeTab === 'info' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', color: '#1e293b' }}>
                  Company Profile &amp; Governance
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.86rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Legal Entity Name:</span>{' '}
                    <strong>{supplier.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Tax / VAT Registration:</span>{' '}
                    <strong style={{ fontFamily: 'var(--sap-font-mono)' }}>{supplier.taxId}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Primary Category:</span>{' '}
                    <span>{supplier.category}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Registered Headquarters:</span>{' '}
                    <span>{supplier.address}, {supplier.city}, {supplier.country}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Website:</span>{' '}
                    {supplier.website ? (
                      <a href={supplier.website} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
                        {supplier.website}
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>SAP Registry ID:</span>{' '}
                    <span style={{ fontFamily: 'var(--sap-font-mono)' }}>{supplier.id}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Initial Registration Date:</span>{' '}
                    <span>{supplier.createdAt}</span>
                  </div>
                  {supplier.approvedBy && (
                    <div>
                      <span style={{ color: '#64748b' }}>Approved By:</span>{' '}
                      <strong>{supplier.approvedBy}</strong> ({supplier.approvalDate})
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', color: '#1e293b' }}>
                  Commercial Contact &amp; Accounts
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.86rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Lead Representative:</span>{' '}
                    <strong>{supplier.contactPerson}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Contact Email:</span>{' '}
                    <a href={`mailto:${supplier.contactEmail}`}>{supplier.contactEmail}</a>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Phone:</span>{' '}
                    <span>{supplier.contactPhone}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Payment Terms:</span>{' '}
                    <strong>{supplier.paymentTerms}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Billing Currency:</span>{' '}
                    <span>{supplier.spendCurrency}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Bank Account IBAN:</span>{' '}
                    <span style={{ fontFamily: 'var(--sap-font-mono)' }}>{supplier.bankIban || 'On File'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Annual Spend Commitment:</span>{' '}
                    <strong>{supplier.annualSpend.toLocaleString()} {supplier.spendCurrency}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Risk Assessment */}
          {activeTab === 'risk' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: '#1e293b' }}>
                  Multi-Dimensional Risk Spider Radar
                </h3>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <RiskRadarChart assessment={supplier.riskAssessment} width={340} height={280} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                    Risk Breakdown &amp; Factors
                  </h3>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setReassessModalOpen(true)}
                  >
                    <Sliders size={14} />
                    <span>Recalculate Scores</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Financial */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
                    <span style={{ fontWeight: 600 }}>Financial Stability (25% Weight)</span>
                    <span style={{ fontWeight: 700 }}>{supplier.riskAssessment?.financialScore ?? 20} / 100</span>
                  </div>

                  {/* Operational */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
                    <span style={{ fontWeight: 600 }}>Operational Continuity (25% Weight)</span>
                    <span style={{ fontWeight: 700 }}>{supplier.riskAssessment?.operationalScore ?? 25} / 100</span>
                  </div>

                  {/* Geopolitical */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
                    <span style={{ fontWeight: 600 }}>Geopolitical Exposure (20% Weight)</span>
                    <span style={{ fontWeight: 700 }}>{supplier.riskAssessment?.geopoliticalScore ?? 30} / 100</span>
                  </div>

                  {/* ESG */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
                    <span style={{ fontWeight: 600 }}>ESG &amp; Labor Standards (15% Weight)</span>
                    <span style={{ fontWeight: 700 }}>{supplier.riskAssessment?.esgScore ?? 25} / 100</span>
                  </div>

                  {/* Cyber */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
                    <span style={{ fontWeight: 600 }}>Cyber Security &amp; IP Protection (15% Weight)</span>
                    <span style={{ fontWeight: 700 }}>{supplier.riskAssessment?.cyberScore ?? 25} / 100</span>
                  </div>
                </div>

                <div style={{ marginTop: '20px', padding: '14px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e40af' }}>
                    Assessor Notes &amp; Mitigation Strategy
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#1e293b', marginTop: '4px' }}>
                    {supplier.riskAssessment?.mitigationNotes || 'Standard baseline review performed during onboarding.'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '6px' }}>
                    Last Assessed: {supplier.riskAssessment?.lastAssessedDate} • By: {supplier.riskAssessment?.assessedBy}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Compliance Documents */}
          {activeTab === 'compliance' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                    Compliance Certificates &amp; Legal Audit Dossier
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Business Rule: Any expired document triggers automatic supplier lock and blocks procurement approval.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setSelectedDocForRenew(null);
                    setRenewDocModalOpen(true);
                  }}
                >
                  <Upload size={14} />
                  <span>Upload Certificate</span>
                </button>
              </div>

              <div className="table-wrapper">
                <table className="sap-table">
                  <thead>
                    <tr>
                      <th>Document Type</th>
                      <th>Certificate Number</th>
                      <th>Issue Date</th>
                      <th>Expiry Date</th>
                      <th>Status</th>
                      <th>Authority</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplier.documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{doc.documentType}</div>
                          {doc.documentName && (
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{doc.documentName} ({doc.fileSize})</div>
                          )}
                        </td>
                        <td style={{ fontFamily: 'var(--sap-font-mono)', fontSize: '0.82rem' }}>
                          {doc.documentNumber}
                        </td>
                        <td>{doc.issueDate}</td>
                        <td style={{ fontWeight: doc.status === 'EXPIRED' ? 700 : 500, color: doc.status === 'EXPIRED' ? '#ba1717' : 'inherit' }}>
                          {doc.expiryDate}
                        </td>
                        <td>
                          <ComplianceBadge status={doc.status} />
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>{doc.verificationAuthority}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleOpenViewer(doc)}
                              title="View Certificate Dossier"
                            >
                              <Eye size={14} />
                            </button>

                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleDownloadDoc(doc)}
                              title="Download Verified Dossier"
                            >
                              <Download size={14} />
                            </button>

                            {can('MANAGE_DOCUMENTS') && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  setSelectedDocForRenew(doc);
                                  setRenewDocModalOpen(true);
                                }}
                                title="Renew Certificate"
                              >
                                <FileCheck size={13} />
                                <span>Renew</span>
                              </button>
                            )}

                            {can('DELETE_DOCUMENTS') && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ color: '#ba1717' }}
                                onClick={() => handleDeleteDoc(doc)}
                                title="Delete Certificate"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Performance Scorecard */}
          {activeTab === 'performance' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                    Quality &amp; Delivery SLA Performance
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Formula: Overall Score = (Quality Score + Delivery Score) / 2
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPerfModalOpen(true)}
                >
                  <Edit2 size={14} />
                  <span>Update Performance Audit</span>
                </button>
              </div>

              {/* 3 Main Metric Tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>
                    Quality Score
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0d7f3e', marginTop: '4px' }}>
                    {supplier.performance.qualityScore}%
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                    Defect rate: <strong>{supplier.performance.defectRatePpm} PPM</strong>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>
                    Delivery Score
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#8b5cf6', marginTop: '4px' }}>
                    {supplier.performance.deliveryScore}%
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                    On-time rate: <strong>{supplier.performance.onTimeDeliveryRate}%</strong>
                  </div>
                </div>

                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#1e40af', fontWeight: 600 }}>
                    Overall Score
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0070f2', marginTop: '4px' }}>
                    {supplier.performance.overallScore}%
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <PerformanceBadge status={supplier.performance.status} />
                  </div>
                </div>
              </div>

              {/* Performance Notes */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e293b' }}>
                  Auditor Evaluation Commentary
                </h4>
                <p style={{ fontSize: '0.86rem', color: '#475569', marginTop: '6px' }}>
                  {supplier.performance.notes || 'Supplier consistently fulfills order deadlines with minimal scrap.'}
                </p>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '8px' }}>
                  Evaluation Cycle: {supplier.performance.evaluationCycle} • Evaluated on: {supplier.performance.lastEvaluatedDate}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Purchase Information & Orders */}
          {activeTab === 'purchase' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                    Purchase Commitments &amp; Active Purchase Orders
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Purchase orders are subjected to automatic compliance gating prior to invoice clearance.
                  </p>
                </div>
              </div>

              {supplier.purchaseOrders.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
                  No active purchase orders registered for this supplier.
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="sap-table">
                    <thead>
                      <tr>
                        <th>PO Number</th>
                        <th>Order Date</th>
                        <th>Amount</th>
                        <th>Order Status</th>
                        <th>Compliance Gate</th>
                        <th>Payment Terms</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplier.purchaseOrders.map((po) => (
                        <tr key={po.id}>
                          <td style={{ fontFamily: 'var(--sap-font-mono)', fontWeight: 600 }}>{po.poNumber}</td>
                          <td>{po.orderDate}</td>
                          <td style={{ fontWeight: 700 }}>
                            {po.amount.toLocaleString()} {po.currency}
                          </td>
                          <td>
                            <span
                              className={`sap-badge ${
                                po.status === 'DELIVERED'
                                  ? 'badge-status-approved'
                                  : po.status === 'RELEASED'
                                  ? 'badge-status-under_review'
                                  : 'badge-status-blocked'
                              }`}
                            >
                              {po.status}
                            </span>
                          </td>
                          <td>
                            {po.complianceGatePassed ? (
                              <span style={{ color: '#0d7f3e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={15} /> Passed
                              </span>
                            ) : (
                              <span style={{ color: '#ba1717', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertOctagon size={15} /> Hold Active
                              </span>
                            )}
                          </td>
                          <td>{po.paymentTerms}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Block / Reject / Delete / Approve High-Risk */}
      <ConfirmActionModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        actionType={confirmActionType}
        supplierName={supplier.name}
        supplierId={supplier.id}
        onConfirm={handleConfirmModalAction}
      />

      {/* Reassess Risk Modal */}
      <ReassessRiskModal
        isOpen={reassessModalOpen}
        onClose={() => setReassessModalOpen(false)}
        supplierId={supplier.id}
        supplierName={supplier.name}
        currentAssessment={supplier.riskAssessment}
        onSave={handleSaveRiskReassessment}
      />

      {/* Renew Document Modal */}
      <RenewDocumentModal
        isOpen={renewDocModalOpen}
        onClose={() => {
          setRenewDocModalOpen(false);
          setSelectedDocForRenew(null);
        }}
        supplierId={supplier.id}
        supplierName={supplier.name}
        document={selectedDocForRenew}
        onSave={handleSaveRenewDocument}
      />

      {/* Document Viewer Modal */}
      {selectedDocForView && (
        <DocumentViewerModal
          isOpen={viewerModalOpen}
          onClose={() => {
            setViewerModalOpen(false);
            setSelectedDocForView(null);
          }}
          document={selectedDocForView}
          supplierName={supplier.name}
          onRenew={(doc) => {
            setSelectedDocForRenew(doc);
            setRenewDocModalOpen(true);
          }}
          onDelete={(doc) => handleDeleteDoc(doc)}
        />
      )}


      {/* Performance Edit Modal */}
      {perfModalOpen && (
        <div className="modal-overlay" onClick={() => setPerfModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Award color="#0070f2" size={20} />
                <span>Update Performance SLA Scores</span>
              </div>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSavePerformance} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Quality Score (0-100): {editQuality}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editQuality}
                    onChange={(e) => setEditQuality(Number(e.target.value))}
                    style={{ accentColor: '#0d7f3e' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Delivery Score (0-100): {editDelivery}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editDelivery}
                    onChange={(e) => setEditDelivery(Number(e.target.value))}
                    style={{ accentColor: '#8b5cf6' }}
                  />
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Calculated Overall Score:</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0070f2' }}>
                    {Math.round((editQuality + editDelivery) / 2)}%
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Evaluation Notes</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setPerfModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSavePerformance}>
                Save Performance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
