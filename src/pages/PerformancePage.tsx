import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supplierService } from '../services/supplierService';
import { Supplier, PerformanceStatus } from '../types/supplier';
import { PerformanceBadge, StatusBadge } from '../components/common/Badge';
import { PerformanceBarChart } from '../components/charts/PerformanceBarChart';
import { SapCard } from '../components/common/Card';
import { useToast } from '../context/ToastContext';
import {
  Award,
  Search,
  Filter,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Eye,
  Sliders,
} from 'lucide-react';

export const PerformancePage: React.FC = () => {
  const { success, error } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PerformanceStatus | 'ALL'>('ALL');

  // Edit Score Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [editQuality, setEditQuality] = useState(85);
  const [editDelivery, setEditDelivery] = useState(85);
  const [editNotes, setEditNotes] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await supplierService.getSuppliers({ pageSize: 100 });
      setSuppliers(res.items);
    } catch (err: any) {
      error('Failed to load performance scorecard', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const total = suppliers.length || 1;
  const avgOverall = Math.round(
    suppliers.reduce((sum, s) => sum + (s.performance?.overallScore ?? 80), 0) / total
  );
  const avgQuality = Math.round(
    suppliers.reduce((sum, s) => sum + (s.performance?.qualityScore ?? 80), 0) / total
  );
  const avgDelivery = Math.round(
    suppliers.reduce((sum, s) => sum + (s.performance?.deliveryScore ?? 80), 0) / total
  );
  const exemplaryCount = suppliers.filter((s) => s.performance?.status === 'EXEMPLARY').length;

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || s.performance?.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenEdit = (s: Supplier) => {
    setSelectedSupplier(s);
    setEditQuality(s.performance?.qualityScore ?? 80);
    setEditDelivery(s.performance?.deliveryScore ?? 80);
    setEditNotes(s.performance?.notes || '');
    setEditModalOpen(true);
  };

  const handleSavePerformance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    try {
      await supplierService.updatePerformance(selectedSupplier.id, editQuality, editDelivery, editNotes);
      const computedOverall = Math.round((editQuality + editDelivery) / 2);
      success(
        'Performance Scorecard Updated',
        `${selectedSupplier.name}: Quality ${editQuality}%, Delivery ${editDelivery}% → Overall Score: ${computedOverall}%`
      );
      setEditModalOpen(false);
      loadData();
    } catch (err: any) {
      error('Update Failed', err.message);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>
            <Award size={26} color="#0070f2" />
            <span>Supplier Performance SLA Scorecard</span>
          </h1>
          <p>
            Continuous operational delivery and quality evaluation. Overall Score = (Quality Score + Delivery Score) / 2
          </p>
        </div>
      </div>

      {/* KPI Summary Tiles */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Average Overall Score</span>
            <div className="kpi-icon-box" style={{ background: '#eff6ff', color: '#0070f2' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="kpi-value">{avgOverall}%</div>
          <div className="kpi-footer">Across all active suppliers</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Average Quality Score</span>
            <div className="kpi-icon-box" style={{ background: '#ecfdf5', color: '#0d7f3e' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#0d7f3e' }}>{avgQuality}%</div>
          <div className="kpi-footer">Tolerance &amp; defect rate</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Average Delivery Score</span>
            <div className="kpi-icon-box" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
              <Award size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#8b5cf6' }}>{avgDelivery}%</div>
          <div className="kpi-footer">On-time SLA adherence</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Exemplary Tier (&ge;85%)</span>
            <div className="kpi-icon-box" style={{ background: '#ecfdf5', color: '#047857' }}>
              <Award size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#047857' }}>{exemplaryCount}</div>
          <div className="kpi-footer">Top-tier strategic vendors</div>
        </div>
      </div>

      {/* Formula & Policy Guide Box */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #dbe3ed',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>
            Enterprise Evaluation Formula
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0070f2', marginTop: '2px' }}>
            Overall Score = (Quality Score + Delivery Score) / 2
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className="sap-badge badge-perf-exemplary">Exemplary (&ge;85%)</span>
          <span className="sap-badge badge-perf-satisfactory">Satisfactory (70–84%)</span>
          <span className="sap-badge badge-perf-needs_improvement">Needs Improvement (50–69%)</span>
          <span className="sap-badge badge-perf-critical">Critical (&lt;50%)</span>
        </div>
      </div>

      {/* Comparative Chart Panel */}
      <div className="sap-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
          Quality vs Delivery Comparative Benchmark
        </h3>
        <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '16px' }}>
          Multi-metric comparison highlighting variance between physical part quality and logistical delivery timeliness.
        </p>
        <PerformanceBarChart suppliers={suppliers} />
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-toolbar">
        <div className="search-input-group">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by supplier name, ID, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-selects-row">
          <select
            className="sap-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PerformanceStatus | 'ALL')}
          >
            <option value="ALL">All Performance Tiers</option>
            <option value="EXEMPLARY">Exemplary (&ge;85%)</option>
            <option value="SATISFACTORY">Satisfactory (70–84%)</option>
            <option value="NEEDS_IMPROVEMENT">Needs Improvement (50–69%)</option>
            <option value="CRITICAL">Critical Attention (&lt;50%)</option>
          </select>

          {(search || statusFilter !== 'ALL') && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Performance Scorecard Table */}
      <div className="table-wrapper">
        <table className="sap-table">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Category</th>
              <th>Quality Score</th>
              <th>Delivery Score</th>
              <th>Overall Score</th>
              <th>Status</th>
              <th>On-Time Rate</th>
              <th>Defect PPM</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  Loading performance metrics...
                </td>
              </tr>
            ) : filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  No suppliers found matching current filter.
                </td>
              </tr>
            ) : (
              filteredSuppliers.map((s) => {
                const perf = s.performance;
                const overall = Math.round(((perf?.qualityScore ?? 80) + (perf?.deliveryScore ?? 80)) / 2);

                return (
                  <tr key={s.id}>
                    <td>
                      <Link to={`/suppliers/${s.id}`} className="table-id-link">
                        {s.name}
                      </Link>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{s.id} • {s.country}</div>
                    </td>

                    <td>{s.category}</td>

                    <td>
                      <span className="tabular-nums" style={{ fontWeight: 700, color: '#0d7f3e' }}>
                        {perf?.qualityScore}%
                      </span>
                    </td>

                    <td>
                      <span className="tabular-nums" style={{ fontWeight: 700, color: '#8b5cf6' }}>
                        {perf?.deliveryScore}%
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="tabular-nums" style={{ fontWeight: 800, fontSize: '1rem', color: '#0070f2' }}>
                          {overall}%
                        </span>
                      </div>
                    </td>

                    <td>
                      <PerformanceBadge status={perf.status} />
                    </td>

                    <td>
                      <span className="tabular-nums">{perf.onTimeDeliveryRate}%</span>
                    </td>

                    <td>
                      <span className="tabular-nums">{perf.defectRatePpm} PPM</span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(s)}
                          title="Record Updated SLA Score"
                        >
                          <Edit2 size={13} />
                          <span>Audit</span>
                        </button>

                        <Link to={`/suppliers/${s.id}`} className="btn btn-ghost btn-sm" title="View Full Dossier">
                          <Eye size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Performance Modal */}
      {editModalOpen && selectedSupplier && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Award color="#0070f2" size={20} />
                <span>Audit Performance: {selectedSupplier.name}</span>
              </div>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSavePerformance} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '0.84rem', color: '#475569' }}>
                  Adjust SLA calibration metrics for <strong>{selectedSupplier.id}</strong>. Overall score will automatically recompute per enterprise formula.
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600 }}>
                    <span>Quality SLA Score</span>
                    <span style={{ color: '#0d7f3e' }}>{editQuality}%</span>
                  </div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600 }}>
                    <span>Delivery SLA Score</span>
                    <span style={{ color: '#8b5cf6' }}>{editDelivery}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editDelivery}
                    onChange={(e) => setEditDelivery(Number(e.target.value))}
                    style={{ accentColor: '#8b5cf6' }}
                  />
                </div>

                {/* Live Formula Preview */}
                <div
                  style={{
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    padding: '14px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: '#1e40af', textTransform: 'uppercase', fontWeight: 600 }}>
                    Recomputed Overall Score: ({editQuality} + {editDelivery}) / 2 =
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0070f2', marginTop: '2px' }}>
                    {Math.round((editQuality + editDelivery) / 2)}%
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Auditor Commentary &amp; Corrective Action Plan</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Enter audit remarks or corrective milestone notes..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSavePerformance}>
                Save Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
