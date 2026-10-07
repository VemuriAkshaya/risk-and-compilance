import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supplierService } from '../services/supplierService';
import { DashboardMetrics, Supplier } from '../types/supplier';
import { KpiCard, SapCard } from '../components/common/Card';
import { RiskDonutChart } from '../components/charts/RiskDonutChart';
import { ComplianceStatusBar } from '../components/charts/ComplianceStatusBar';
import { StatusBadge, RiskBadge, ComplianceBadge } from '../components/common/Badge';
import {
  Building2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  AlertOctagon,
  FileWarning,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [highRiskSuppliers, setHighRiskSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const data = await supplierService.getDashboardMetrics();
        setMetrics(data);

        // Fetch high risk suppliers for the immediate action card
        const suppliersResult = await supplierService.getSuppliers({ riskLevel: 'HIGH', pageSize: 4 });
        setHighRiskSuppliers(suppliersResult.items);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (isLoading || !metrics) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '12px' }}>
          <ShieldAlert size={32} color="#0070f2" />
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 600 }}>Loading SAP Compliance Cockpit...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>
            <Building2 size={26} color="#0070f2" />
            <span>Supplier Risk &amp; Purchase Compliance Cockpit</span>
          </h1>
          <p>
            Real-time multi-tier supplier audit, automated compliance gating, and risk monitoring across global vendor networks.
          </p>
        </div>

        <div className="page-actions">
          <Link to="/suppliers/new" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Onboard Supplier</span>
          </Link>
          <Link to="/compliance" className="btn btn-secondary">
            <span>Audit All Documents</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Critical Business Rule Warning Alert Banner */}
      {metrics.expiredDocumentsCount > 0 && (
        <div className="sap-alert-banner alert-danger">
          <AlertOctagon size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '0.92rem' }}>
              Automated Compliance Lockout Triggered ({metrics.expiredDocumentsCount} Expired Document{metrics.expiredDocumentsCount > 1 ? 's' : ''})
            </strong>
            <div style={{ marginTop: '2px', lineHeight: 1.4 }}>
              Per SAP enterprise policy, suppliers with expired compliance certificates cannot be approved and have been placed in <strong>BLOCKED</strong> status. Active purchase commitments remain frozen until renewed.
            </div>
          </div>
          <Link to="/compliance" className="btn btn-danger btn-sm" style={{ whiteSpace: 'nowrap' }}>
            Resolve Documents
          </Link>
        </div>
      )}

      {/* 5 Mandatory KPI Cards */}
      <div className="kpi-grid">
        <KpiCard
          title="Total Suppliers"
          value={metrics.totalSuppliers}
          icon={<Building2 size={20} />}
          iconBg="#eff6ff"
          iconColor="#0070f2"
          subtitle="Registered entities"
          onClick={() => navigate('/suppliers')}
        />

        <KpiCard
          title="Approved"
          value={metrics.approvedCount}
          icon={<CheckCircle2 size={20} />}
          iconBg="#ecfdf5"
          iconColor="#0d7f3e"
          subtitle="Cleared for purchasing"
          onClick={() => navigate('/suppliers?status=APPROVED')}
        />

        <KpiCard
          title="Under Review"
          value={metrics.underReviewCount}
          icon={<Clock size={20} />}
          iconBg="#eff6ff"
          iconColor="#1d4ed8"
          subtitle="Pending evaluation"
          onClick={() => navigate('/suppliers?status=UNDER_REVIEW')}
        />

        <KpiCard
          title="High Risk"
          value={metrics.highRiskCount}
          icon={<ShieldAlert size={20} />}
          iconBg="#fdeeee"
          iconColor="#ba1717"
          subtitle="Score &ge; 61 (Requires review)"
          isAlert={metrics.highRiskCount > 0}
          onClick={() => navigate('/risk')}
        />

        <KpiCard
          title="Expired Documents"
          value={metrics.expiredDocumentsCount}
          icon={<FileWarning size={20} />}
          iconBg="#fee2e2"
          iconColor="#991b1b"
          subtitle="Immediate block triggered"
          isAlert={metrics.expiredDocumentsCount > 0}
          onClick={() => navigate('/compliance')}
        />
      </div>

      {/* Middle Visuals: Risk Distribution & Compliance Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Risk Distribution Card */}
        <SapCard
          title="Supplier Risk Distribution"
          subtitle="Breakdown by enterprise risk classification tiers (0–30 Low, 31–60 Medium, 61–100 High)"
          actions={
            <Link to="/risk" className="btn btn-ghost btn-sm" style={{ color: '#0070f2' }}>
              <span>Risk Cockpit</span>
              <ArrowRight size={14} />
            </Link>
          }
        >
          <div style={{ padding: '10px 0' }}>
            <RiskDonutChart
              low={metrics.riskDistribution.low}
              medium={metrics.riskDistribution.medium}
              high={metrics.riskDistribution.high}
            />
          </div>

          <div
            style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #edf2f7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: '#64748b',
            }}
          >
            <span>Weighted factors: Financial (25%), Operational (25%), Geopolitical (20%), ESG (15%), Cyber (15%)</span>
            <Link to="/risk" style={{ fontWeight: 600, color: '#0070f2' }}>
              Reassess Scores &rarr;
            </Link>
          </div>
        </SapCard>

        {/* Compliance Summary Card */}
        <SapCard
          title="Compliance &amp; Document Health"
          subtitle="Audit certificate validity across ISO 9001, Anti-Bribery, ESG, and Regulatory declarations"
          actions={
            <Link to="/compliance" className="btn btn-ghost btn-sm" style={{ color: '#0070f2' }}>
              <span>View Documents</span>
              <ArrowRight size={14} />
            </Link>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1e293b' }}>
                  {metrics.complianceSummary.complianceRate}%
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '8px' }}>
                  Total Documentation Rate
                </span>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.82rem', color: '#64748b' }}>
                <div>Total Active Documents: <strong>{metrics.complianceSummary.totalDocs}</strong></div>
              </div>
            </div>

            <ComplianceStatusBar
              valid={metrics.complianceSummary.valid}
              expiringSoon={metrics.complianceSummary.expiringSoon}
              expired={metrics.complianceSummary.expired}
            />

            {/* Quick Stat Highlights */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '4px' }}>
              <div style={{ backgroundColor: '#ecfdf5', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0d7f3e' }}>
                  {metrics.complianceSummary.valid}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 600, textTransform: 'uppercase' }}>
                  Valid &amp; Verified
                </div>
              </div>

              <div style={{ backgroundColor: '#fff7ed', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#c25900' }}>
                  {metrics.complianceSummary.expiringSoon}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#9a3412', fontWeight: 600, textTransform: 'uppercase' }}>
                  Expiring &le; 45 Days
                </div>
              </div>

              <div style={{ backgroundColor: '#fee2e2', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ba1717' }}>
                  {metrics.complianceSummary.expired}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Expired (Action Req.)
                </div>
              </div>
            </div>
          </div>
        </SapCard>
      </div>

      {/* Lower Section: High-Priority Watchlist & Recent Activities */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px' }}>
        {/* High Risk Suppliers Watchlist */}
        <SapCard
          title="High Risk Governance Watchlist"
          subtitle="Suppliers with Risk Score 61–100 or Expired Compliance requiring executive attention"
          actions={
            <Link to="/suppliers" className="btn btn-secondary btn-sm">
              All Suppliers
            </Link>
          }
        >
          <div className="table-wrapper">
            <table className="sap-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Country</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {highRiskSuppliers.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link to={`/suppliers/${s.id}`} className="table-id-link">
                        {s.name}
                      </Link>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.id} • {s.category}</div>
                    </td>
                    <td>{s.country}</td>
                    <td>
                      <RiskBadge level={s.riskLevel} score={s.riskScore} />
                    </td>
                    <td>
                      <StatusBadge status={s.supplierStatus} />
                    </td>
                    <td>
                      <Link to={`/suppliers/${s.id}`} className="btn btn-secondary btn-sm">
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SapCard>

        {/* Recent Activities Timeline */}
        <SapCard
          title="Audit Trail &amp; Recent Activities"
          subtitle="Real-time compliance gate executions, risk recalculations, and status transitions"
        >
          <div className="timeline-list">
            {metrics.recentActivities.map((act) => {
              const severityBg = {
                SUCCESS: '#ecfdf5',
                WARNING: '#fffbeb',
                ERROR: '#fef2f2',
                INFO: '#eff6ff',
              }[act.severity];

              const severityColor = {
                SUCCESS: '#0d7f3e',
                WARNING: '#c25900',
                ERROR: '#ba1717',
                INFO: '#0070f2',
              }[act.severity];

              return (
                <div key={act.id} className="timeline-item">
                  <div className="timeline-icon-box" style={{ backgroundColor: severityBg, color: severityColor }}>
                    {act.severity === 'SUCCESS' && <CheckCircle2 size={16} />}
                    {act.severity === 'WARNING' && <AlertTriangle size={16} />}
                    {act.severity === 'ERROR' && <AlertOctagon size={16} />}
                    {act.severity === 'INFO' && <TrendingUp size={16} />}
                  </div>

                  <div className="timeline-content">
                    <div className="timeline-meta">
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>
                        {act.supplierName} ({act.supplierId})
                      </span>
                      <span>{act.timestamp}</span>
                    </div>
                    <div className="timeline-desc">{act.description}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                      Actor: <strong>{act.actor}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SapCard>
      </div>
    </div>
  );
};
