import React, { useState, useEffect } from 'react';
import { supplierService } from '../services/supplierService';
import { AppUser, UserRole } from '../types/supplier';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SapCard } from '../components/common/Card';
import {
  Users,
  CheckCircle2,
  XCircle,
  Sparkles,
  Clock,
  Check,
  X,
  Search,
} from 'lucide-react';

export const UsersManagementPage: React.FC = () => {
  const { user, userRole, switchRole } = useAuth();
  const { success, warning, error } = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING_APPROVAL' | 'INACTIVE_OR_REJECTED'>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await supplierService.getUsers();
      setUsers(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const updated = await supplierService.updateUserRole(userId, newRole);
    if (updated) {
      success('Role Assigned', `Updated ${updated.name}'s role to ${newRole}.`);
      loadUsers();
    }
  };

  const handleToggleStatus = async (userId: string) => {
    const updated = await supplierService.toggleUserStatus(userId);
    if (updated) {
      warning('User Status Updated', `${updated.name} account is now ${updated.status}.`);
      loadUsers();
    }
  };

  const handleApprove = async (userId: string, userName: string) => {
    setActionLoadingId(userId);
    try {
      const adminName = user?.name ? `${user.name} (Admin)` : 'Elena Rostova (Admin)';
      const updated = await supplierService.approveUser(userId, adminName);
      if (updated) {
        success(
          'Registration Approved',
          `User ${userName} is now ACTIVE and can sign in to the SAP Enterprise Cockpit.`
        );
        loadUsers();
      }
    } catch (err: any) {
      error('Approval Failed', err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (userId: string, userName: string) => {
    const reason = window.prompt(
      `Enter reason for rejecting ${userName}'s registration request:`,
      'Identity or department authorization could not be validated.'
    );
    if (reason === null) return; // User cancelled prompt

    setActionLoadingId(userId);
    try {
      const adminName = user?.name ? `${user.name} (Admin)` : 'Elena Rostova (Admin)';
      const updated = await supplierService.rejectUser(userId, adminName, reason);
      if (updated) {
        warning('Registration Rejected', `${userName}'s registration request has been set to REJECTED.`);
        loadUsers();
      }
    } catch (err: any) {
      error('Rejection Failed', err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingUsers = users.filter((u) => u.status === 'PENDING_APPROVAL');
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const pendingCount = pendingUsers.length;
  const inactiveCount = users.filter((u) => u.status === 'INACTIVE' || u.status === 'REJECTED').length;

  const filteredUsers = users.filter((u) => {
    if (statusFilter === 'ACTIVE' && u.status !== 'ACTIVE') return false;
    if (statusFilter === 'PENDING_APPROVAL' && u.status !== 'PENDING_APPROVAL') return false;
    if (statusFilter === 'INACTIVE_OR_REJECTED' && u.status !== 'INACTIVE' && u.status !== 'REJECTED') return false;

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
      u.department.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const roleCardConfig: Record<
    string,
    { title: string; desc: string; color: string; bg: string; border: string }
  > = {
    ADMIN: {
      title: 'Admin (Master Governance)',
      desc: 'Unrestricted enterprise control. Final approval of suppliers, high-risk reviews, vendor blocking, cert deletion, and system authorization.',
      color: '#0070f2',
      bg: '#eff6ff',
      border: '#bfdbfe',
    },
    PROCUREMENT_MANAGER: {
      title: 'Procurement Manager',
      desc: 'Operational management. Can onboard suppliers, edit master profiles, reassess risk, manage documents, and enforce standard blocks.',
      color: '#0d7f3e',
      bg: '#ecfdf5',
      border: '#a7f3d0',
    },
    PROCUREMENT_USER: {
      title: 'Procurement User (Buyer)',
      desc: 'Requisition & onboarding. Can initiate supplier registration and export reports. Restricted from final approval, blocks, or cert edits.',
      color: '#8b5cf6',
      bg: '#f5f3ff',
      border: '#ddd6fe',
    },
    AUDITOR: {
      title: 'Internal Compliance Auditor',
      desc: 'Governance oversight. Read-only visibility into risk matrix, compliance dossiers, and audit trails. Can record performance audits.',
      color: '#c25900',
      bg: '#fff7ed',
      border: '#fed7aa',
    },
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="sap-badge badge-status-approved">ACTIVE</span>;
      case 'PENDING_APPROVAL':
        return (
          <span
            className="sap-badge"
            style={{
              backgroundColor: '#fffbeb',
              color: '#b45309',
              border: '1px solid #fde68a',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Clock size={11} />
            <span>PENDING_APPROVAL</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span
            className="sap-badge"
            style={{
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
            }}
          >
            REJECTED
          </span>
        );
      case 'INACTIVE':
      default:
        return <span className="sap-badge badge-status-blocked">INACTIVE</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>
            <Users size={26} color="#0070f2" />
            <span>User Identity &amp; Role-Based Governance</span>
          </h1>
          <p>
            Configure user privileges, SAP authorization groups, approve newly registered users, and enforce strict segregation
            of duties (SoD) across procurement teams.
          </p>
        </div>
      </div>

      {/* PENDING APPROVAL QUEUE (High Priority Alert Card) */}
      {pendingUsers.length > 0 && (
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fcd34d',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#fef3c7',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#92400e', margin: 0 }}>
                  Registration Approval Queue ({pendingUsers.length} Pending)
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#b45309', margin: '2px 0 0' }}>
                  Newly registered accounts cannot log in until an Enterprise Administrator approves their credentials.
                </p>
              </div>
            </div>
            <span
              style={{
                backgroundColor: '#b45309',
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '12px',
              }}
            >
              Action Required
            </span>
          </div>

          <div className="table-wrapper" style={{ backgroundColor: '#ffffff', borderRadius: '6px' }}>
            <table className="sap-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Requested Role</th>
                  <th>Registration Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Admin Decision</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: u.avatarColor || '#f59e0b',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{u.name}</div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {u.username} • {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem', fontFamily: 'var(--sap-font-mono)', fontWeight: 600 }}>
                      {u.employeeId || 'N/A'}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{u.department}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          color: '#0070f2',
                          backgroundColor: '#eff6ff',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #bfdbfe',
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{u.createdAt || 'Recent'}</td>
                    <td>{getStatusBadge(u.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{
                            borderColor: '#fca5a5',
                            color: '#b91c1c',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          onClick={() => handleReject(u.id, u.name)}
                          disabled={actionLoadingId === u.id}
                        >
                          <X size={13} />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{
                            backgroundColor: '#0d7f3e',
                            borderColor: '#0d7f3e',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          onClick={() => handleApprove(u.id, u.name)}
                          disabled={actionLoadingId === u.id}
                        >
                          <Check size={14} />
                          <span>{actionLoadingId === u.id ? 'Approving...' : 'Approve'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Privilege Overview Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {(['ADMIN', 'PROCUREMENT_MANAGER', 'PROCUREMENT_USER', 'AUDITOR'] as UserRole[]).map((r) => {
          const cfg = roleCardConfig[r] || roleCardConfig['PROCUREMENT_USER'];
          const isCurrentActive = userRole === r;

          return (
            <div
              key={r}
              style={{
                backgroundColor: cfg.bg,
                border: `2px solid ${isCurrentActive ? cfg.color : cfg.border}`,
                borderRadius: '8px',
                padding: '16px 18px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: cfg.color, textTransform: 'uppercase' }}>
                  {cfg.title}
                </span>
                {isCurrentActive && (
                  <span
                    style={{
                      background: cfg.color,
                      color: '#ffffff',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '10px',
                    }}
                  >
                    Active Session
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '6px', lineHeight: 1.4 }}>
                {cfg.desc}
              </p>

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '0.74rem',
                    borderColor: cfg.border,
                    color: cfg.color,
                    fontWeight: 600,
                  }}
                  onClick={() => {
                    switchRole(r);
                    success('Session Switched', `Active user switched to ${r} role for live permission testing.`);
                  }}
                  disabled={isCurrentActive}
                >
                  <Sparkles size={12} />
                  <span>{isCurrentActive ? 'Current Role' : `Switch to ${r}`}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions Matrix */}
      <SapCard
        title="Role-Based Permissions Matrix (Segregation of Duties)"
        subtitle="Enforced access rules across SAP Ariba Risk & S/4HANA Cloud procurement transactions"
      >
        <div className="table-wrapper">
          <table className="sap-table">
            <thead>
              <tr>
                <th>Operation / Permission</th>
                <th style={{ textAlign: 'center' }}>Admin</th>
                <th style={{ textAlign: 'center' }}>Manager</th>
                <th style={{ textAlign: 'center' }}>User</th>
                <th style={{ textAlign: 'center' }}>Auditor</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Approve Suppliers (Standard & High Risk)', a: true, m: true, u: false, aud: false },
                { label: 'Reject / Terminate Supplier Applications', a: true, m: true, u: false, aud: false },
                { label: 'Enforce / Release Supplier Blocks', a: true, m: true, u: false, aud: false },
                { label: 'Recalculate Quantitative Risk Scores', a: true, m: true, u: false, aud: false },
                { label: 'Register & Onboard New Suppliers', a: true, m: true, u: true, aud: false },
                { label: 'Edit Supplier Master Profile', a: true, m: true, u: true, aud: false },
                { label: 'Delete Supplier Master Records', a: true, m: false, u: false, aud: false },
                { label: 'Upload & Renew Compliance Certificates', a: true, m: true, u: true, aud: false },
                { label: 'Delete Compliance Certificates', a: true, m: false, u: false, aud: false },
                { label: 'Record Performance SLA Audits', a: true, m: true, u: false, aud: true },
                { label: 'Export Reports (CSV/Excel)', a: true, m: true, u: true, aud: true },
                { label: 'Manage Users, Approvals & Privileges', a: true, m: false, u: false, aud: false },
              ].map((row) => (
                <tr key={row.label}>
                  <td style={{ fontWeight: 600 }}>{row.label}</td>
                  <td style={{ textAlign: 'center' }}>
                    {row.a ? (
                      <CheckCircle2 size={16} color="#0d7f3e" style={{ margin: '0 auto' }} />
                    ) : (
                      <XCircle size={16} color="#cbd5e1" style={{ margin: '0 auto' }} />
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {row.m ? (
                      <CheckCircle2 size={16} color="#0d7f3e" style={{ margin: '0 auto' }} />
                    ) : (
                      <XCircle size={16} color="#cbd5e1" style={{ margin: '0 auto' }} />
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {row.u ? (
                      <CheckCircle2 size={16} color="#0d7f3e" style={{ margin: '0 auto' }} />
                    ) : (
                      <XCircle size={16} color="#cbd5e1" style={{ margin: '0 auto' }} />
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {row.aud ? (
                      <CheckCircle2 size={16} color="#0d7f3e" style={{ margin: '0 auto' }} />
                    ) : (
                      <XCircle size={16} color="#cbd5e1" style={{ margin: '0 auto' }} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SapCard>

      {/* User Accounts Registry */}
      <SapCard
        title="Enterprise Authorized Users"
        subtitle="Manage user role assignments, approve registration applications, and configure access statuses"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Search Box */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <input
                type="text"
                className="form-input"
                style={{ height: '32px', fontSize: '0.78rem', paddingLeft: '32px' }}
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '6px' }}>
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                style={{
                  border: 'none',
                  background: statusFilter === 'ALL' ? '#ffffff' : 'transparent',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: statusFilter === 'ALL' ? '#0070f2' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: statusFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                All ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                style={{
                  border: 'none',
                  background: statusFilter === 'ACTIVE' ? '#ffffff' : 'transparent',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: statusFilter === 'ACTIVE' ? '#0d7f3e' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: statusFilter === 'ACTIVE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PENDING_APPROVAL')}
                style={{
                  border: 'none',
                  background: statusFilter === 'PENDING_APPROVAL' ? '#ffffff' : 'transparent',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: statusFilter === 'PENDING_APPROVAL' ? '#b45309' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: statusFilter === 'PENDING_APPROVAL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('INACTIVE_OR_REJECTED')}
                style={{
                  border: 'none',
                  background: statusFilter === 'INACTIVE_OR_REJECTED' ? '#ffffff' : 'transparent',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: statusFilter === 'INACTIVE_OR_REJECTED' ? '#ba1717' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: statusFilter === 'INACTIVE_OR_REJECTED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                Inactive ({inactiveCount})
              </button>
            </div>
          </div>
        }
      >
        <div className="table-wrapper">
          <table className="sap-table">
            <thead>
              <tr>
                <th>User / Employee</th>
                <th>Employee ID</th>
                <th>Role Assignment</th>
                <th>Department</th>
                <th>Status</th>
                <th>Last Active Session</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                    Loading user registry...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No user accounts match the current filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: u.avatarColor || '#0070f2',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{u.name}</div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {u.username} • {u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ fontSize: '0.8rem', fontFamily: 'var(--sap-font-mono)', fontWeight: 600 }}>
                      {u.employeeId || 'N/A'}
                    </td>

                    <td>
                      <select
                        className="sap-select"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="PROCUREMENT_MANAGER">PROCUREMENT_MANAGER</option>
                        <option value="PROCUREMENT_USER">PROCUREMENT_USER</option>
                        <option value="AUDITOR">AUDITOR</option>
                      </select>
                    </td>

                    <td style={{ fontSize: '0.82rem' }}>{u.department}</td>

                    <td>{getStatusBadge(u.status)}</td>

                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{u.lastLogin}</td>

                    <td style={{ textAlign: 'right' }}>
                      {u.status === 'PENDING_APPROVAL' ? (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#b91c1c', borderColor: '#fca5a5', padding: '3px 8px' }}
                            onClick={() => handleReject(u.id, u.name)}
                            disabled={actionLoadingId === u.id}
                          >
                            <X size={13} />
                            <span>Reject</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ backgroundColor: '#0d7f3e', borderColor: '#0d7f3e', padding: '3px 8px' }}
                            onClick={() => handleApprove(u.id, u.name)}
                            disabled={actionLoadingId === u.id}
                          >
                            <Check size={13} />
                            <span>Approve</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleToggleStatus(u.id)}
                        >
                          {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SapCard>
    </div>
  );
};
