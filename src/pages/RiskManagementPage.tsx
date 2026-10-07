import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supplierService } from '../services/supplierService';
import { Supplier, RiskLevel } from '../types/supplier';
import { RiskBadge, StatusBadge } from '../components/common/Badge';
import { RiskDonutChart } from '../components/charts/RiskDonutChart';
import { ReassessRiskModal } from '../components/dialogs/ReassessRiskModal';
import { SapCard } from '../components/common/Card';
import { useToast } from '../context/ToastContext';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  Search,
  Filter,
  Eye,
  Building2,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';

export const RiskManagementPage: React.FC = () => {
  const { success, error } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedRiskTier, setSelectedRiskTier] = useState<RiskLevel | 'ALL'>('ALL');

  // Modal
  const [reassessModalOpen, setReassessModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await supplierService.getSuppliers({ pageSize: 100 });
      setSuppliers(res.items);
    } catch (err: any) {
      error('Failed to load risk registry', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const lowRiskList = suppliers.filter((s) => s.riskLevel === 'LOW');
  const mediumRiskList = suppliers.filter((s) => s.riskLevel === 'MEDIUM');
  const highRiskList = suppliers.filter((s) => s.riskLevel === 'HIGH');

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.country.toLowerCase().includes(search.toLowerCase());

    const matchesTier = selectedRiskTier === 'ALL' || s.riskLevel === selectedRiskTier;

    return matchesSearch && matchesTier;
  });

  const handleOpenReassess = (s: Supplier) => {
    setSelectedSupplier(s);
    setReassessModalOpen(true);
  };

  const handleSaveReassessment = async (factors: any) => {
    if (!selectedSupplier) return;
    try {
      const res = await supplierService.reassessRisk(selectedSupplier.id, factors);
      success(
        'Risk Recalculated',
        `${selectedSupplier.name}: New Score is ${res.newScore} (${res.newLevel}).`
      );
      loadData();
    } catch (err: any) {
      error('Reassessment Failed', err.message);
      throw err;
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>
            <ShieldAlert size={26} color="#0070f2" />
            <span>Supplier Risk Management &amp; Due Diligence Cockpit</span>
          </h1>
          <p>
            Continuous quantitative risk scoring across Financial, Operational, Geopolitical, ESG, and Cyber dimensions.
          </p>
        </div>
      </div>

      {/* Mandatory Risk Classification Legend Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* 0-30 LOW */}
        <div
          onClick={() => setSelectedRiskTier('LOW')}
          style={{
            backgroundColor: '#ecfdf5',
            border: `2px solid ${selectedRiskTier === 'LOW' ? '#059669' : '#a7f3d0'}`,
            borderRadius: '8px',
            padding: '16px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#065f46', textTransform: 'uppercase' }}>
              0 – 30 LOW RISK
            </span>
            <ShieldCheck size={20} color="#059669" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#065f46', marginTop: '6px' }}>
            {lowRiskList.length} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Suppliers</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#047857', marginTop: '4px', lineHeight: 1.4 }}>
            Minimal default probability. Fast-track approval cleared for standard purchase order volumes.
          </p>
        </div>

        {/* 31-60 MEDIUM */}
        <div
          onClick={() => setSelectedRiskTier('MEDIUM')}
          style={{
            backgroundColor: '#fffbeb',
            border: `2px solid ${selectedRiskTier === 'MEDIUM' ? '#d97706' : '#fde68a'}`,
            borderRadius: '8px',
            padding: '16px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>
              31 – 60 MEDIUM RISK
            </span>
            <AlertTriangle size={20} color="#d97706" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#92400e', marginTop: '6px' }}>
            {mediumRiskList.length} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Suppliers</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '4px', lineHeight: 1.4 }}>
            Moderate risk indicators noted. Subjected to quarterly compliance verification and audit triggers.
          </p>
        </div>

        {/* 61-100 HIGH */}
        <div
          onClick={() => setSelectedRiskTier('HIGH')}
          style={{
            backgroundColor: '#fef2f2',
            border: `2px solid ${selectedRiskTier === 'HIGH' ? '#dc2626' : '#fecaca'}`,
            borderRadius: '8px',
            padding: '16px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>
              61 – 100 HIGH RISK
            </span>
            <ShieldAlert size={20} color="#dc2626" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#991b1b', marginTop: '6px' }}>
            {highRiskList.length} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Suppliers</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: '4px', lineHeight: 1.4 }}>
            Mandatory governance review required. Direct approvals blocked without executive compliance sign-off.
          </p>
        </div>
      </div>

      {/* Middle Visuals: Chart & Methodology */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <SapCard
          title="Risk Tier Distribution"
          subtitle="Proportional visual mapping across active enterprise supplier network"
        >
          <RiskDonutChart
            low={lowRiskList.length}
            medium={mediumRiskList.length}
            high={highRiskList.length}
          />
        </SapCard>

        <SapCard
          title="Weighted Scoring Methodology"
          subtitle="Enterprise parameters configured in SAP Cloud RAP Governance Engine"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
              <span>Financial Stability &amp; Credit Solvency</span>
              <strong style={{ color: '#0070f2' }}>25% Weight</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
              <span>Operational Continuity &amp; Facility Redundancy</span>
              <strong style={{ color: '#0070f2' }}>25% Weight</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
              <span>Geopolitical Exposure &amp; Sanctions Screening</span>
              <strong style={{ color: '#0070f2' }}>20% Weight</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
              <span>ESG, Environmental &amp; Labor Standards</span>
              <strong style={{ color: '#0070f2' }}>15% Weight</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
              <span>Cyber Security &amp; Data Protection (ISO 27001)</span>
              <strong style={{ color: '#0070f2' }}>15% Weight</strong>
            </div>
          </div>
        </SapCard>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-toolbar">
        <div className="search-input-group">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search suppliers by name, category, or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-selects-row">
          <select
            className="sap-select"
            value={selectedRiskTier}
            onChange={(e) => setSelectedRiskTier(e.target.value as RiskLevel | 'ALL')}
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="LOW">0–30 LOW</option>
            <option value="MEDIUM">31–60 MEDIUM</option>
            <option value="HIGH">61–100 HIGH</option>
          </select>

          {(search || selectedRiskTier !== 'ALL') && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearch('');
                setSelectedRiskTier('ALL');
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Suppliers Risk Table */}
      <div className="table-wrapper">
        <table className="sap-table">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Category</th>
              <th>Country</th>
              <th>Risk Score</th>
              <th>Risk Level</th>
              <th>Supplier Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  Loading risk profile data...
                </td>
              </tr>
            ) : filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  No suppliers found matching the selected risk criteria.
                </td>
              </tr>
            ) : (
              filteredSuppliers.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link to={`/suppliers/${s.id}`} className="table-id-link">
                      {s.name}
                    </Link>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{s.id}</div>
                  </td>

                  <td>{s.category}</td>
                  <td>{s.country}</td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="tabular-nums" style={{ fontWeight: 800, fontSize: '1rem' }}>
                        {s.riskScore}
                      </span>
                      <div
                        style={{
                          height: '6px',
                          width: '54px',
                          backgroundColor: '#e2e8f0',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${s.riskScore}%`,
                            backgroundColor: s.riskScore > 60 ? '#ba1717' : s.riskScore > 30 ? '#c25900' : '#0d7f3e',
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  <td>
                    <RiskBadge level={s.riskLevel} />
                  </td>

                  <td>
                    <StatusBadge status={s.supplierStatus} />
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenReassess(s)}
                      >
                        <Sliders size={13} />
                        <span>Reassess</span>
                      </button>

                      <Link to={`/suppliers/${s.id}`} className="btn btn-ghost btn-sm" title="View Dossier">
                        <Eye size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reassess Risk Modal */}
      {selectedSupplier && (
        <ReassessRiskModal
          isOpen={reassessModalOpen}
          onClose={() => {
            setReassessModalOpen(false);
            setSelectedSupplier(null);
          }}
          supplierId={selectedSupplier.id}
          supplierName={selectedSupplier.name}
          currentAssessment={selectedSupplier.riskAssessment}
          onSave={handleSaveReassessment}
        />
      )}
    </div>
  );
};
