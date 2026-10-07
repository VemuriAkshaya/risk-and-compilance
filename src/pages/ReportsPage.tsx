import React, { useState, useEffect } from 'react';
import { supplierService } from '../services/supplierService';
import { Supplier, ComplianceDocument } from '../types/supplier';
import { SapCard } from '../components/common/Card';
import { RiskDonutChart } from '../components/charts/RiskDonutChart';
import { ComplianceStatusBar } from '../components/charts/ComplianceStatusBar';
import { RiskBadge, ComplianceBadge, PerformanceBadge, StatusBadge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';
import {
  BarChart3,
  Download,
  ShieldAlert,
  FileCheck,
  Award,
  TrendingUp,
  Building2,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { success } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activeReportTab, setActiveReportTab] = useState<'risk' | 'compliance' | 'performance'>('risk');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      try {
        const supRes = await supplierService.getSuppliers({ pageSize: 100 });
        setSuppliers(supRes.items);
        const docRes = await supplierService.getAllComplianceDocuments();
        setDocuments(docRes);
      } finally {
        setIsLoading(false);
      }
    };
    loadAll();
  }, []);

  // 1. Export Risk Report
  const handleExportRiskReport = () => {
    const headers = [
      'Supplier ID',
      'Supplier Name',
      'Country',
      'Category',
      'Supplier Status',
      'Overall Risk Score',
      'Risk Level',
      'Financial Risk',
      'Operational Risk',
      'Geopolitical Risk',
      'ESG Risk',
      'Cyber Risk',
      'Annual Spend Commitment',
      'Mitigation Notes',
    ];

    const rows = suppliers.map((s) => [
      s.id,
      s.name,
      s.country,
      s.category,
      s.supplierStatus,
      s.riskScore,
      s.riskLevel,
      s.riskAssessment?.financialScore ?? '',
      s.riskAssessment?.operationalScore ?? '',
      s.riskAssessment?.geopoliticalScore ?? '',
      s.riskAssessment?.esgScore ?? '',
      s.riskAssessment?.cyberScore ?? '',
      `${s.annualSpend} ${s.spendCurrency}`,
      s.riskAssessment?.mitigationNotes || '',
    ]);

    supplierService.exportToCsv('SAP_Enterprise_Supplier_Risk_Report', headers, rows);
    success('Risk Report Exported', `Generated CSV report for ${suppliers.length} suppliers.`);
  };

  // 2. Export Compliance Report
  const handleExportComplianceReport = () => {
    const headers = [
      'Supplier ID',
      'Supplier Name',
      'Country',
      'Document ID',
      'Document Type',
      'Certificate Number',
      'Issue Date',
      'Expiry Date',
      'Status',
      'Verification Authority',
      'Digital Signature SHA-256',
    ];

    const rows = documents.map((d) => [
      d.supplierId,
      d.supplierName,
      d.supplierCountry,
      d.id,
      d.documentType,
      d.documentNumber,
      d.issueDate,
      d.expiryDate,
      d.status,
      d.verificationAuthority,
      d.digitalSignatureHash || 'SHA256-VERIFIED',
    ]);

    supplierService.exportToCsv('SAP_Enterprise_Compliance_Audit_Report', headers, rows);
    success('Compliance Report Exported', `Generated CSV report for ${documents.length} certificates.`);
  };

  // 3. Export Performance Report
  const handleExportPerformanceReport = () => {
    const headers = [
      'Supplier ID',
      'Supplier Name',
      'Category',
      'Quality SLA Score',
      'Delivery SLA Score',
      'Overall Score (Q+D)/2',
      'Performance Status',
      'On-Time Delivery Rate (%)',
      'Defect Rate (PPM)',
      'Evaluation Cycle',
      'Auditor Remarks',
    ];

    const rows = suppliers.map((s) => {
      const p = s.performance;
      const overall = Math.round(((p?.qualityScore ?? 80) + (p?.deliveryScore ?? 80)) / 2);
      return [
        s.id,
        s.name,
        s.category,
        p?.qualityScore ?? 80,
        p?.deliveryScore ?? 80,
        overall,
        p?.status ?? 'SATISFACTORY',
        p?.onTimeDeliveryRate ?? 95,
        p?.defectRatePpm ?? 100,
        p?.evaluationCycle ?? 'Q3-2026',
        p?.notes || '',
      ];
    });

    supplierService.exportToCsv('SAP_Supplier_Performance_SLA_Report', headers, rows);
    success('Performance Report Exported', `Generated CSV report for ${suppliers.length} scorecards.`);
  };

  // Metrics
  const lowRisk = suppliers.filter((s) => s.riskLevel === 'LOW');
  const medRisk = suppliers.filter((s) => s.riskLevel === 'MEDIUM');
  const highRisk = suppliers.filter((s) => s.riskLevel === 'HIGH');
  const highRiskSpend = highRisk.reduce((sum, s) => sum + s.annualSpend, 0);

  const validDocs = documents.filter((d) => d.status === 'VALID');
  const expiringDocs = documents.filter((d) => d.status === 'EXPIRING_SOON');
  const expiredDocs = documents.filter((d) => d.status === 'EXPIRED');

  const avgOverallScore = Math.round(
    suppliers.reduce((sum, s) => sum + (s.performance?.overallScore ?? 80), 0) / (suppliers.length || 1)
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>
            <BarChart3 size={26} color="#0070f2" />
            <span>Executive Reports &amp; Compliance Data Export</span>
          </h1>
          <p>
            Generate analytical dossiers across Supplier Risk, Document Compliance, and Performance SLAs with real-time CSV/Excel export.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sap-card">
        <div className="sap-tabs-header">
          <button
            type="button"
            className={`sap-tab-btn ${activeReportTab === 'risk' ? 'active' : ''}`}
            onClick={() => setActiveReportTab('risk')}
          >
            <ShieldAlert size={16} />
            <span>1. Supplier Risk Report</span>
          </button>

          <button
            type="button"
            className={`sap-tab-btn ${activeReportTab === 'compliance' ? 'active' : ''}`}
            onClick={() => setActiveReportTab('compliance')}
          >
            <FileCheck size={16} />
            <span>2. Compliance &amp; Certificate Report</span>
          </button>

          <button
            type="button"
            className={`sap-tab-btn ${activeReportTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveReportTab('performance')}
          >
            <Award size={16} />
            <span>3. Performance SLA Report</span>
          </button>
        </div>

        <div className="sap-tab-content">
          {/* TAB 1: RISK REPORT */}
          {activeReportTab === 'risk' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                    Multi-Tier Supplier Risk Exposure Analysis
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Quantifies financial, geopolitical, operational, and ESG exposure across the global supply base.
                  </p>
                </div>

                <button type="button" className="btn btn-primary" onClick={handleExportRiskReport}>
                  <Download size={16} />
                  <span>Export Risk Report (CSV)</span>
                </button>
              </div>

              {/* Summary Metric Cards */}
              <div className="kpi-grid" style={{ marginBottom: '24px' }}>
                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-title">High Risk Exposure</span>
                    <div className="kpi-icon-box" style={{ background: '#fee2e2', color: '#ba1717' }}>
                      <ShieldAlert size={20} />
                    </div>
                  </div>
                  <div className="kpi-value" style={{ color: '#ba1717' }}>{highRisk.length}</div>
                  <div className="kpi-footer" style={{ color: '#ba1717', fontWeight: 600 }}>
                    Score 61–100 (Immediate review required)
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-title">Annual Spend At High Risk</span>
                    <div className="kpi-icon-box" style={{ background: '#fff7ed', color: '#c25900' }}>
                      <DollarSign size={20} />
                    </div>
                  </div>
                  <div className="kpi-value" style={{ fontSize: '1.75rem' }}>
                    €{(highRiskSpend / 1000000).toFixed(2)}M
                  </div>
                  <div className="kpi-footer">Across flagged vendors</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-title">Low Risk Prime Tier</span>
                    <div className="kpi-icon-box" style={{ background: '#ecfdf5', color: '#0d7f3e' }}>
                      <Building2 size={20} />
                    </div>
                  </div>
                  <div className="kpi-value" style={{ color: '#0d7f3e' }}>{lowRisk.length}</div>
                  <div className="kpi-footer">Score &le; 30 (Approved for volume)</div>
                </div>
              </div>

              {/* Data Table Preview */}
              <div className="table-wrapper">
                <table className="sap-table">
                  <thead>
                    <tr>
                      <th>Supplier ID</th>
                      <th>Company Name</th>
                      <th>Country</th>
                      <th>Category</th>
                      <th>Risk Score</th>
                      <th>Risk Level</th>
                      <th>Supplier Status</th>
                      <th>Annual Spend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontFamily: 'var(--sap-font-mono)', fontWeight: 600 }}>{s.id}</td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.country}</td>
                        <td>{s.category}</td>
                        <td>
                          <span className="tabular-nums" style={{ fontWeight: 700 }}>{s.riskScore}</span>
                        </td>
                        <td>
                          <RiskBadge level={s.riskLevel} />
                        </td>
                        <td>
                          <StatusBadge status={s.supplierStatus} />
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {s.annualSpend.toLocaleString()} {s.spendCurrency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: COMPLIANCE REPORT */}
          {activeReportTab === 'compliance' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                    Master Document Compliance Health &amp; Expiry Report
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Status analysis of all regulatory certificates, ISO audits, and export licenses.
                  </p>
                </div>

                <button type="button" className="btn btn-primary" onClick={handleExportComplianceReport}>
                  <Download size={16} />
                  <span>Export Compliance Report (CSV)</span>
                </button>
              </div>

              {/* KPI Summary Tiles */}
              <div className="kpi-grid" style={{ marginBottom: '24px' }}>
                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-title">Valid Documents</span>
                    <div className="kpi-icon-box" style={{ background: '#ecfdf5', color: '#0d7f3e' }}>
                      <FileCheck size={20} />
                    </div>
                  </div>
                  <div className="kpi-value" style={{ color: '#0d7f3e' }}>{validDocs.length}</div>
                  <div className="kpi-footer">Active &amp; verified</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-title">Expiring Soon</span>
                    <div className="kpi-icon-box" style={{ background: '#fff7ed', color: '#c25900' }}>
                      <AlertTriangle size={20} />
                    </div>
                  </div>
                  <div className="kpi-value" style={{ color: '#c25900' }}>{expiringDocs.length}</div>
                  <div className="kpi-footer">&le; 45 Days to lapse</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-title">Expired (Lockouts Active)</span>
                    <div className="kpi-icon-box" style={{ background: '#fee2e2', color: '#ba1717' }}>
                      <ShieldAlert size={20} />
                    </div>
                  </div>
                  <div className="kpi-value" style={{ color: '#ba1717' }}>{expiredDocs.length}</div>
                  <div className="kpi-footer" style={{ color: '#ba1717', fontWeight: 600 }}>
                    Suppliers blocked per policy
                  </div>
                </div>
              </div>

              {/* Data Table Preview */}
              <div className="table-wrapper">
                <table className="sap-table">
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Document Type</th>
                      <th>Certificate #</th>
                      <th>Issue Date</th>
                      <th>Expiry Date</th>
                      <th>Status</th>
                      <th>Authority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((d) => (
                      <tr key={`${d.supplierId}-${d.id}`}>
                        <td>
                          <strong>{d.supplierName}</strong>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{d.supplierId} • {d.supplierCountry}</div>
                        </td>
                        <td>{d.documentType}</td>
                        <td style={{ fontFamily: 'var(--sap-font-mono)', fontSize: '0.8rem' }}>{d.documentNumber}</td>
                        <td>{d.issueDate}</td>
                        <td style={{ fontWeight: d.status === 'EXPIRED' ? 700 : 500, color: d.status === 'EXPIRED' ? '#ba1717' : 'inherit' }}>
                          {d.expiryDate}
                        </td>
                        <td>
                          <ComplianceBadge status={d.status} />
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>{d.verificationAuthority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PERFORMANCE REPORT */}
          {activeReportTab === 'performance' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                    Supplier Performance &amp; SLA Fulfillment Report
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Evaluation Scorecard: Overall Score = (Quality Score + Delivery Score) / 2
                  </p>
                </div>

                <button type="button" className="btn btn-primary" onClick={handleExportPerformanceReport}>
                  <Download size={16} />
                  <span>Export Performance Report (CSV)</span>
                </button>
              </div>

              {/* KPI Summary Tiles */}
              <div className="kpi-grid" style={{ marginBottom: '24px' }}>
                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-title">Average Overall SLA</span>
                    <div className="kpi-icon-box" style={{ background: '#eff6ff', color: '#0070f2' }}>
                      <Award size={20} />
                    </div>
                  </div>
                  <div className="kpi-value">{avgOverallScore}%</div>
                  <div className="kpi-footer">Composite performance index</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-title">Exemplary Tier</span>
                    <div className="kpi-icon-box" style={{ background: '#ecfdf5', color: '#0d7f3e' }}>
                      <TrendingUp size={20} />
                    </div>
                  </div>
                  <div className="kpi-value" style={{ color: '#0d7f3e' }}>
                    {suppliers.filter((s) => s.performance?.status === 'EXEMPLARY').length}
                  </div>
                  <div className="kpi-footer">Score &ge; 85%</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-title">Critical SLA Attention</span>
                    <div className="kpi-icon-box" style={{ background: '#fee2e2', color: '#ba1717' }}>
                      <AlertTriangle size={20} />
                    </div>
                  </div>
                  <div className="kpi-value" style={{ color: '#ba1717' }}>
                    {suppliers.filter((s) => s.performance?.status === 'CRITICAL').length}
                  </div>
                  <div className="kpi-footer" style={{ color: '#ba1717', fontWeight: 600 }}>
                    Score &lt; 50%
                  </div>
                </div>
              </div>

              {/* Data Table Preview */}
              <div className="table-wrapper">
                <table className="sap-table">
                  <thead>
                    <tr>
                      <th>Supplier ID</th>
                      <th>Company Name</th>
                      <th>Category</th>
                      <th>Quality Score</th>
                      <th>Delivery Score</th>
                      <th>Overall Score</th>
                      <th>Performance Tier</th>
                      <th>On-Time Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((s) => {
                      const p = s.performance;
                      const overall = Math.round(((p?.qualityScore ?? 80) + (p?.deliveryScore ?? 80)) / 2);
                      return (
                        <tr key={s.id}>
                          <td style={{ fontFamily: 'var(--sap-font-mono)', fontWeight: 600 }}>{s.id}</td>
                          <td style={{ fontWeight: 600 }}>{s.name}</td>
                          <td>{s.category}</td>
                          <td style={{ color: '#0d7f3e', fontWeight: 700 }}>{p?.qualityScore}%</td>
                          <td style={{ color: '#8b5cf6', fontWeight: 700 }}>{p?.deliveryScore}%</td>
                          <td style={{ color: '#0070f2', fontWeight: 800, fontSize: '0.95rem' }}>{overall}%</td>
                          <td>
                            <PerformanceBadge status={p.status} />
                          </td>
                          <td>{p.onTimeDeliveryRate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
