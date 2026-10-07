import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supplierService } from '../services/supplierService';
import { ComplianceDocument, DocumentStatus } from '../types/supplier';
import { ComplianceBadge } from '../components/common/Badge';
import { ComplianceStatusBar } from '../components/charts/ComplianceStatusBar';
import { RenewDocumentModal } from '../components/dialogs/RenewDocumentModal';
import { DocumentViewerModal } from '../components/dialogs/DocumentViewerModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  FileCheck,
  Search,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Upload,
  ShieldAlert,
  RotateCcw,
  Eye,
  Download,
  Trash2,
} from 'lucide-react';

interface ExtendedDocument extends ComplianceDocument {
  supplierName: string;
  supplierCountry: string;
}

export const CompliancePage: React.FC = () => {
  const { can } = useAuth();
  const { success, error, warning } = useToast();
  const [documents, setDocuments] = useState<ExtendedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [selectedDocForRenew, setSelectedDocForRenew] = useState<ExtendedDocument | null>(null);

  const [viewerModalOpen, setViewerModalOpen] = useState(false);
  const [selectedDocForView, setSelectedDocForView] = useState<ExtendedDocument | null>(null);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await supplierService.getAllComplianceDocuments();
      setDocuments(docs as ExtendedDocument[]);
    } catch (err: any) {
      error('Failed to load documents', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.documentType.toLowerCase().includes(search.toLowerCase()) ||
      doc.documentNumber.toLowerCase().includes(search.toLowerCase()) ||
      doc.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      doc.supplierId.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || doc.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || doc.documentType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const validCount = documents.filter((d) => d.status === 'VALID').length;
  const expiringSoonCount = documents.filter((d) => d.status === 'EXPIRING_SOON').length;
  const expiredCount = documents.filter((d) => d.status === 'EXPIRED').length;

  const handleOpenViewer = (doc: ExtendedDocument) => {
    setSelectedDocForView(doc);
    setViewerModalOpen(true);
  };

  const handleOpenRenew = (doc: ExtendedDocument) => {
    setSelectedDocForRenew(doc);
    setRenewModalOpen(true);
  };

  const handleDownload = (doc: ExtendedDocument) => {
    supplierService.downloadDocumentDossier(doc, doc.supplierName);
    success('Certificate Dossier Downloaded', `Generated verified audit document for ${doc.documentType}.`);
  };

  const handleDeleteDocument = async (doc: ComplianceDocument) => {
    if (!can('DELETE_DOCUMENTS')) {
      error('Unauthorized', 'Your role does not permit deleting verified compliance certificates.');
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete certificate [${doc.documentType} #${doc.documentNumber}]?`)) {
      try {
        await supplierService.deleteComplianceDocument(doc.supplierId, doc.id);
        warning('Document Deleted', `Certificate ${doc.documentNumber} removed. Compliance re-evaluated.`);
        loadDocuments();
      } catch (err: any) {
        error('Deletion Failed', err.message);
      }
    }
  };

  const handleSaveRenewal = async (data: any) => {
    if (!selectedDocForRenew) return;
    try {
      await supplierService.renewComplianceDocument(selectedDocForRenew.supplierId, selectedDocForRenew.id, data);
      success(
        'Compliance Renewed',
        `Document [${selectedDocForRenew.documentType}] for ${selectedDocForRenew.supplierName} successfully renewed. New expiry: ${data.expiryDate}.`
      );
      loadDocuments();
    } catch (err: any) {
      error('Renewal Failed', err.message);
      throw err;
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Supplier ID',
      'Supplier Name',
      'Country',
      'Document Type',
      'Certificate #',
      'Issue Date',
      'Expiry Date',
      'Status',
      'Authority',
      'Digital Signature SHA-256',
    ];

    const rows = filteredDocuments.map((d) => [
      d.supplierId,
      d.supplierName,
      d.supplierCountry,
      d.documentType,
      d.documentNumber,
      d.issueDate,
      d.expiryDate,
      d.status,
      d.verificationAuthority,
      d.digitalSignatureHash || 'SHA256-VERIFIED',
    ]);

    supplierService.exportToCsv('SAP_Enterprise_Compliance_Registry', headers, rows);
    success('Export Complete', `Exported ${rows.length} compliance documents to CSV.`);
  };

  const getDaysRemaining = (expiryDate: string) => {
    const exp = new Date(expiryDate).getTime();
    const now = new Date().getTime();
    return Math.ceil((exp - now) / (1000 * 3600 * 24));
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>
            <FileCheck size={26} color="#0070f2" />
            <span>Compliance Documents &amp; Audit Governance Cockpit</span>
          </h1>
          <p>
            Enterprise repository of supplier certificates, ISO accreditations, anti-corruption declarations, and ESG audits.
          </p>
        </div>

        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={handleExportCsv}>
            <Download size={15} />
            <span>Export Registry (CSV)</span>
          </button>
        </div>
      </div>

      {/* Critical Rule Alert Banner */}
      {expiredCount > 0 && (
        <div className="sap-alert-banner alert-danger">
          <AlertOctagon size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Compliance Policy Violation Alert: {expiredCount} Expired Certificate(s)</strong>
            <div>
              Suppliers with expired certificates are locked in <strong>BLOCKED</strong> status automatically. Click &quot;Renew&quot; to register updated audit documentation and restore eligibility.
            </div>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card" onClick={() => setStatusFilter('ALL')} style={{ cursor: 'pointer' }}>
          <div className="kpi-card-header">
            <span className="kpi-title">Total Certificates</span>
            <div className="kpi-icon-box" style={{ background: '#eff6ff', color: '#0070f2' }}>
              <FileCheck size={20} />
            </div>
          </div>
          <div className="kpi-value">{documents.length}</div>
          <div className="kpi-footer">Active in SAP registry</div>
        </div>

        <div className="kpi-card" onClick={() => setStatusFilter('VALID')} style={{ cursor: 'pointer' }}>
          <div className="kpi-card-header">
            <span className="kpi-title">Valid</span>
            <div className="kpi-icon-box" style={{ background: '#ecfdf5', color: '#0d7f3e' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#0d7f3e' }}>{validCount}</div>
          <div className="kpi-footer">Fully verified &amp; cleared</div>
        </div>

        <div className="kpi-card" onClick={() => setStatusFilter('EXPIRING_SOON')} style={{ cursor: 'pointer' }}>
          <div className="kpi-card-header">
            <span className="kpi-title">Expiring Soon</span>
            <div className="kpi-icon-box" style={{ background: '#fff7ed', color: '#c25900' }}>
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#c25900' }}>{expiringSoonCount}</div>
          <div className="kpi-footer">&le; 45 Days to expiration</div>
        </div>

        <div className="kpi-card" onClick={() => setStatusFilter('EXPIRED')} style={{ cursor: 'pointer', borderColor: expiredCount > 0 ? '#fca5a5' : undefined }}>
          <div className="kpi-card-header">
            <span className="kpi-title">Expired</span>
            <div className="kpi-icon-box" style={{ background: '#fee2e2', color: '#ba1717' }}>
              <ShieldAlert size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#ba1717' }}>{expiredCount}</div>
          <div className="kpi-footer" style={{ color: '#ba1717', fontWeight: 600 }}>Supplier lock enforced</div>
        </div>
      </div>

      {/* Progress Bar Panel */}
      <div className="sap-card" style={{ padding: '18px 24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1e293b' }}>
            Overall Document Portfolio Health
          </span>
          <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
            {documents.length > 0 ? Math.round((validCount / documents.length) * 100) : 100}% Compliance Rating
          </span>
        </div>
        <ComplianceStatusBar
          valid={validCount}
          expiringSoon={expiringSoonCount}
          expired={expiredCount}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-toolbar">
        <div className="search-input-group">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by document type, cert #, supplier name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-selects-row">
          <select
            className="sap-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | 'ALL')}
          >
            <option value="ALL">All Document Statuses</option>
            <option value="VALID">VALID</option>
            <option value="EXPIRING_SOON">EXPIRING SOON</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>

          {(search || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setTypeFilter('ALL');
              }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Documents Table */}
      <div className="table-wrapper">
        <table className="sap-table">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Document Type</th>
              <th>Certificate #</th>
              <th>Issue Date</th>
              <th>Expiry Date</th>
              <th>Days Left</th>
              <th>Status</th>
              <th>Authority</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  Loading compliance registry...
                </td>
              </tr>
            ) : filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No matching compliance certificates found.
                </td>
              </tr>
            ) : (
              filteredDocuments.map((doc) => {
                const daysLeft = getDaysRemaining(doc.expiryDate);

                return (
                  <tr key={`${doc.supplierId}-${doc.id}`}>
                    <td>
                      <Link to={`/suppliers/${doc.supplierId}`} className="table-id-link">
                        {doc.supplierName}
                      </Link>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{doc.supplierId} • {doc.supplierCountry}</div>
                    </td>

                    <td>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{doc.documentType}</span>
                      {doc.documentName && (
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{doc.documentName}</div>
                      )}
                    </td>

                    <td style={{ fontFamily: 'var(--sap-font-mono)', fontSize: '0.8rem' }}>
                      {doc.documentNumber}
                    </td>

                    <td>{doc.issueDate}</td>

                    <td style={{ fontWeight: doc.status === 'EXPIRED' ? 700 : 500, color: doc.status === 'EXPIRED' ? '#ba1717' : 'inherit' }}>
                      {doc.expiryDate}
                    </td>

                    <td>
                      {daysLeft < 0 ? (
                        <span style={{ color: '#ba1717', fontWeight: 700 }}>
                          Expired {Math.abs(daysLeft)}d ago
                        </span>
                      ) : daysLeft <= 45 ? (
                        <span style={{ color: '#c25900', fontWeight: 600 }}>
                          {daysLeft}d remaining
                        </span>
                      ) : (
                        <span style={{ color: '#64748b' }}>{daysLeft}d</span>
                      )}
                    </td>

                    <td>
                      <ComplianceBadge status={doc.status} />
                    </td>

                    <td style={{ fontSize: '0.82rem' }}>{doc.verificationAuthority}</td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {/* View Action */}
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleOpenViewer(doc)}
                          title="View Certificate Dossier"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Download Action */}
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDownload(doc)}
                          title="Download Verified Dossier"
                        >
                          <Download size={14} />
                        </button>

                        {/* Renew Action */}
                        {can('MANAGE_DOCUMENTS') && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenRenew(doc)}
                            title="Renew Certificate"
                          >
                            <FileCheck size={13} />
                            <span>Renew</span>
                          </button>
                        )}

                        {/* Delete Action */}
                        {can('DELETE_DOCUMENTS') && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ color: '#ba1717' }}
                            onClick={() => handleDeleteDocument(doc)}
                            title="Delete Certificate"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Document Viewer Modal */}
      {selectedDocForView && (
        <DocumentViewerModal
          isOpen={viewerModalOpen}
          onClose={() => {
            setViewerModalOpen(false);
            setSelectedDocForView(null);
          }}
          document={selectedDocForView}
          supplierName={selectedDocForView.supplierName}
          onRenew={(doc) => handleOpenRenew(doc as ExtendedDocument)}
          onDelete={(doc) => handleDeleteDocument(doc)}
        />
      )}

      {/* Renew Document Modal */}
      {selectedDocForRenew && (
        <RenewDocumentModal
          isOpen={renewModalOpen}
          onClose={() => {
            setRenewModalOpen(false);
            setSelectedDocForRenew(null);
          }}
          supplierId={selectedDocForRenew.supplierId}
          supplierName={selectedDocForRenew.supplierName}
          document={selectedDocForRenew}
          onSave={handleSaveRenewal}
        />
      )}
    </div>
  );
};
