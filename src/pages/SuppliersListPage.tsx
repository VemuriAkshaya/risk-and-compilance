import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supplierService, PaginatedResult } from '../services/supplierService';
import { Supplier, SupplierStatus, RiskLevel, ComplianceSummaryStatus } from '../types/supplier';
import { StatusBadge, RiskBadge, ComplianceBadge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { ConfirmActionModal, ActionType } from '../components/dialogs/ConfirmActionModal';
import { useToast } from '../context/ToastContext';
import {
  Building2,
  Search,
  Filter,
  PlusCircle,
  Eye,
  Edit2,
  Trash2,
  ShieldAlert,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export const SuppliersListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error, warning } = useToast();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Query state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | 'ALL'>('ALL');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL');
  const [complianceFilter, setComplianceFilter] = useState<string>('ALL');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'riskScore' | 'overallPerformance' | 'updatedAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalActionType, setModalActionType] = useState<ActionType>('BLOCK');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Read URL query params on initial load
  useEffect(() => {
    const statusParam = searchParams.get('status') as SupplierStatus | null;
    const riskParam = searchParams.get('risk') as RiskLevel | null;

    if (statusParam) setStatusFilter(statusParam);
    if (riskParam) setRiskFilter(riskParam);
  }, [searchParams]);

  const loadSuppliers = async () => {
    setIsLoading(true);
    try {
      const res = await supplierService.getSuppliers({
        search,
        status: statusFilter,
        riskLevel: riskFilter,
        complianceStatus: complianceFilter,
        country: countryFilter,
        sortBy,
        sortOrder,
        page,
        pageSize,
      });

      setSuppliers(res.items);
      setTotalItems(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      error('Failed to load suppliers', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [search, statusFilter, riskFilter, complianceFilter, countryFilter, sortBy, sortOrder, page, pageSize]);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleOpenActionModal = (action: ActionType, supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setModalActionType(action);
    setModalOpen(true);
  };

  const handleConfirmModalAction = async (reason: string) => {
    if (!selectedSupplier) return;

    try {
      if (modalActionType === 'BLOCK') {
        await supplierService.blockSupplier(selectedSupplier.id, reason);
        warning('Supplier Blocked', `${selectedSupplier.name} (${selectedSupplier.id}) status set to BLOCKED.`);
      } else if (modalActionType === 'DELETE') {
        await supplierService.deleteSupplier(selectedSupplier.id);
        success('Supplier Deleted', `Supplier record ${selectedSupplier.id} removed.`);
      }
      loadSuppliers();
    } catch (err: any) {
      error('Action Failed', err.message);
      throw err;
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setRiskFilter('ALL');
    setComplianceFilter('ALL');
    setCountryFilter('ALL');
    setPage(1);
    setSearchParams({});
  };

  const countriesList = useMemo(() => {
    return ['Germany', 'United States', 'Japan', 'South Korea', 'India', 'France', 'Switzerland', 'Taiwan', 'Sweden', 'Singapore'];
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>
            <Building2 size={26} color="#0070f2" />
            <span>Enterprise Suppliers Directory</span>
          </h1>
          <p>
            Master registry of certified vendors, risk ratings, and purchasing compliance governance status.
          </p>
        </div>

        <div className="page-actions">
          <Link to="/suppliers/new" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Onboard New Supplier</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-toolbar">
        <div className="search-input-group">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by ID, supplier name, category, tax ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="filter-selects-row">
          {/* Status Filter */}
          <select
            className="sap-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as SupplierStatus | 'ALL');
              setPage(1);
            }}
          >
            <option value="ALL">All Supplier Statuses</option>
            <option value="APPROVED">Approved Only</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="BLOCKED">Blocked</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Risk Level Filter */}
          <select
            className="sap-select"
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value as RiskLevel | 'ALL');
              setPage(1);
            }}
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk (0–30)</option>
            <option value="MEDIUM">Medium Risk (31–60)</option>
            <option value="HIGH">High Risk (61–100)</option>
          </select>

          {/* Compliance Status Filter */}
          <select
            className="sap-select"
            value={complianceFilter}
            onChange={(e) => {
              setComplianceFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Compliance</option>
            <option value="COMPLIANT">Fully Compliant</option>
            <option value="WARNING">Action Required</option>
            <option value="NON_COMPLIANT">Critical Non-Compliant</option>
          </select>

          {/* Country Filter */}
          <select
            className="sap-select"
            value={countryFilter}
            onChange={(e) => {
              setCountryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Countries</option>
            {countriesList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {(search || statusFilter !== 'ALL' || riskFilter !== 'ALL' || complianceFilter !== 'ALL' || countryFilter !== 'ALL') && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleClearFilters}
              title="Reset all filters"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="table-wrapper">
        <table className="sap-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('id')}>
                <div className="th-sort-wrapper">
                  <span>Supplier ID</span>
                  {sortBy === 'id' && (sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                  {sortBy !== 'id' && <ArrowUpDown size={13} opacity={0.4} />}
                </div>
              </th>

              <th className="sortable" onClick={() => handleSort('name')}>
                <div className="th-sort-wrapper">
                  <span>Name &amp; Category</span>
                  {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                  {sortBy !== 'name' && <ArrowUpDown size={13} opacity={0.4} />}
                </div>
              </th>

              <th>Country</th>

              <th className="sortable" onClick={() => handleSort('riskScore')}>
                <div className="th-sort-wrapper">
                  <span>Risk Score</span>
                  {sortBy === 'riskScore' && (sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                  {sortBy !== 'riskScore' && <ArrowUpDown size={13} opacity={0.4} />}
                </div>
              </th>

              <th>Risk Level</th>
              <th>Compliance Status</th>
              <th>Supplier Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  Loading supplier registry...
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                  <Building2 size={36} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>No Suppliers Found</div>
                  <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>
                    Try modifying your search keywords or filter criteria.
                  </div>
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id}>
                  {/* Supplier ID */}
                  <td>
                    <Link to={`/suppliers/${s.id}`} className="table-id-link">
                      {s.id}
                    </Link>
                  </td>

                  {/* Name & Category */}
                  <td>
                    <Link to={`/suppliers/${s.id}`} style={{ fontWeight: 600, color: '#1e293b' }}>
                      {s.name}
                    </Link>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                      {s.category} • Tax ID: {s.taxId}
                    </div>
                  </td>

                  {/* Country */}
                  <td>
                    <span style={{ fontWeight: 500 }}>{s.country}</span>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', marginLeft: '4px' }}>({s.countryCode})</span>
                  </td>

                  {/* Risk Score */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="tabular-nums" style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {s.riskScore}
                      </span>
                      <div
                        style={{
                          height: '6px',
                          width: '50px',
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

                  {/* Risk Level */}
                  <td>
                    <RiskBadge level={s.riskLevel} />
                  </td>

                  {/* Compliance Status */}
                  <td>
                    <ComplianceBadge status={s.complianceStatus} />
                  </td>

                  {/* Supplier Status */}
                  <td>
                    <StatusBadge status={s.supplierStatus} />
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Link
                        to={`/suppliers/${s.id}`}
                        className="btn btn-ghost btn-sm"
                        title="View Detailed Dossier"
                      >
                        <Eye size={15} />
                      </Link>

                      <Link
                        to={`/suppliers/${s.id}/edit`}
                        className="btn btn-ghost btn-sm"
                        title="Edit Master Data"
                      >
                        <Edit2 size={15} />
                      </Link>

                      {s.supplierStatus !== 'BLOCKED' && s.supplierStatus !== 'REJECTED' && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#ba1717' }}
                          title="Block Supplier"
                          onClick={() => handleOpenActionModal('BLOCK', s)}
                        >
                          <ShieldAlert size={15} />
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#94a3b8' }}
                        title="Delete Supplier Record"
                        onClick={() => handleOpenActionModal('DELETE', s)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      </div>

      {/* Confirmation Modal */}
      {selectedSupplier && (
        <ConfirmActionModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          actionType={modalActionType}
          supplierName={selectedSupplier.name}
          supplierId={selectedSupplier.id}
          onConfirm={handleConfirmModalAction}
        />
      )}
    </div>
  );
};
