import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supplierService } from '../services/supplierService';
import { ActivityLogItem, AuditActionType } from '../types/supplier';
import { Pagination } from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';
import {
  History,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  TrendingUp,
  Clock,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export const AuditHistoryPage: React.FC = () => {
  const { success, error } = useToast();
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const data = await supplierService.getActivityLogs();
      setLogs(data);
    } catch (err: any) {
      error('Failed to load audit history', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    const matchesSearch =
      log.description.toLowerCase().includes(q) ||
      log.supplierName.toLowerCase().includes(q) ||
      log.supplierId.toLowerCase().includes(q) ||
      log.actor.toLowerCase().includes(q) ||
      (log.reason && log.reason.toLowerCase().includes(q));

    const matchesAction = actionFilter === 'ALL' || log.type === actionFilter;
    const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter;

    return matchesSearch && matchesAction && matchesSeverity;
  });

  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  const handleExportCsv = () => {
    const headers = [
      'Log ID',
      'Timestamp',
      'Action Type',
      'Supplier ID',
      'Supplier Name',
      'Description',
      'Actor',
      'Actor Role',
      'Severity',
      'Previous Status',
      'New Status',
      'Justification Reason',
      'IP Address',
    ];

    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      l.type,
      l.supplierId,
      l.supplierName,
      l.description,
      l.actor,
      l.actorRole || 'Compliance Officer',
      l.severity,
      l.previousStatus || '',
      l.newStatus || '',
      l.reason || '',
      l.ipAddress || '192.168.1.20',
    ]);

    supplierService.exportToCsv('SAP_Supplier_Compliance_Audit_Trail', headers, rows);
    success('Audit Trail Exported', `Exported ${rows.length} audit records to CSV.`);
  };

  const actionTypes: AuditActionType[] = [
    'APPROVAL',
    'REJECTION',
    'BLOCK',
    'UNBLOCK',
    'RISK_REASSESSMENT',
    'DOC_EXPIRY',
    'DOC_RENEWED',
    'DOC_DELETED',
    'SUPPLIER_CREATED',
    'ROLE_CHANGED',
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>
            <History size={26} color="#0070f2" />
            <span>Enterprise Compliance Audit Trail &amp; Governance History</span>
          </h1>
          <p>
            Immutable event history recording user identity, action type, timestamps, and supplier state transitions.
          </p>
        </div>

        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={handleExportCsv}>
            <Download size={15} />
            <span>Export Audit Trail (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-toolbar">
        <div className="search-input-group">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search audit trail by actor, supplier, action, or justification..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="filter-selects-row">
          <select
            className="sap-select"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Action Types</option>
            {actionTypes.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>

          <select
            className="sap-select"
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Severities</option>
            <option value="SUCCESS">Success Only</option>
            <option value="WARNING">Warnings Only</option>
            <option value="ERROR">Errors / Blocks Only</option>
            <option value="INFO">Informational Only</option>
          </select>

          {(search || actionFilter !== 'ALL' || severityFilter !== 'ALL') && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearch('');
                setActionFilter('ALL');
                setSeverityFilter('ALL');
                setPage(1);
              }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="table-wrapper">
        <table className="sap-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action Type</th>
              <th>Supplier</th>
              <th>Description &amp; Reason</th>
              <th>Status Transition</th>
              <th>Authorized Actor</th>
              <th>Terminal</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  Loading enterprise audit trail...
                </td>
              </tr>
            ) : paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No audit history records match your search criteria.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => {
                const icon = {
                  SUCCESS: <CheckCircle2 size={15} color="#0d7f3e" />,
                  WARNING: <AlertTriangle size={15} color="#c25900" />,
                  ERROR: <AlertOctagon size={15} color="#ba1717" />,
                  INFO: <TrendingUp size={15} color="#0070f2" />,
                }[log.severity];

                return (
                  <tr key={log.id}>
                    {/* Timestamp */}
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#475569' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} color="#64748b" />
                        <span>{log.timestamp}</span>
                      </div>
                    </td>

                    {/* Action Type */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {icon}
                        <span
                          className={`sap-badge ${
                            log.severity === 'SUCCESS'
                              ? 'badge-status-approved'
                              : log.severity === 'ERROR'
                              ? 'badge-status-blocked'
                              : log.severity === 'WARNING'
                              ? 'badge-status-under_review'
                              : 'badge-status-rejected'
                          }`}
                        >
                          {log.type}
                        </span>
                      </div>
                    </td>

                    {/* Supplier */}
                    <td>
                      {log.supplierId !== 'SYSTEM' ? (
                        <div>
                          <Link to={`/suppliers/${log.supplierId}`} className="table-id-link">
                            {log.supplierName}
                          </Link>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{log.supplierId}</div>
                        </div>
                      ) : (
                        <span style={{ fontWeight: 600, color: '#64748b' }}>System Policy</span>
                      )}
                    </td>

                    {/* Description & Justification */}
                    <td style={{ maxWidth: '340px' }}>
                      <div style={{ fontSize: '0.84rem', color: '#1e293b', lineHeight: 1.35 }}>
                        {log.description}
                      </div>
                      {log.reason && (
                        <div style={{ fontSize: '0.74rem', color: '#92400e', background: '#fffbeb', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>
                          Reason: {log.reason}
                        </div>
                      )}
                    </td>

                    {/* Status Transition */}
                    <td>
                      {log.previousStatus && log.newStatus ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                          <span style={{ color: '#64748b', textDecoration: 'line-through' }}>
                            {log.previousStatus}
                          </span>
                          <ArrowRight size={12} color="#0070f2" />
                          <strong style={{ color: '#1e293b' }}>{log.newStatus}</strong>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>—</span>
                      )}
                    </td>

                    {/* Authorized Actor */}
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b' }}>
                        {log.actor}
                      </div>
                      {log.actorRole && (
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{log.actorRole}</div>
                      )}
                    </td>

                    {/* Terminal / IP */}
                    <td style={{ fontSize: '0.76rem', color: '#64748b', fontFamily: 'var(--sap-font-mono)' }}>
                      {log.ipAddress || '192.168.1.20'}
                    </td>
                  </tr>
                );
              })
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
    </div>
  );
};
