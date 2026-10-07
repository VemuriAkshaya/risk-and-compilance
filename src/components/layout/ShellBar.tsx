import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supplierService } from '../../services/supplierService';
import { UserRole } from '../../types/supplier';
import { NotificationDrawer } from '../common/NotificationDrawer';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import {
  Menu,
  RotateCcw,
  LogOut,
  Bell,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface ShellBarProps {
  onToggleSidebar: () => void;
  onRefreshData?: () => void;
}

export const ShellBar: React.FC<ShellBarProps> = ({ onToggleSidebar, onRefreshData }) => {
  const { user, userRole, switchRole, logout } = useAuth();
  const { success, info } = useToast();
  const navigate = useNavigate();
  const [isResetting, setIsResetting] = useState(false);

  // Notifications state
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Global search modal state
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const notifs = await supplierService.getNotifications();
        setUnreadCount(notifs.filter((n) => !n.isRead).length);
      } catch {
        // Ignore
      }
    };
    fetchUnread();
    const timer = setInterval(fetchUnread, 5000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut Ctrl+K or / for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResetData = async () => {
    if (window.confirm('Reset all suppliers, compliance documents, and logs back to initial factory demo state?')) {
      setIsResetting(true);
      try {
        await supplierService.resetDemoData();
        success('Demo Data Reset', 'Enterprise supplier and compliance records restored to baseline.');
        if (onRefreshData) onRefreshData();
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleLogout = () => {
    logout();
    info('Logged Out', 'You have securely signed out of SAP Enterprise Session.');
    navigate('/login');
  };

  const handleRoleSelect = (newRole: UserRole) => {
    switchRole(newRole);
    success('Session Role Updated', `Active role switched to ${newRole}. Permissions updated.`);
  };

  return (
    <>
      <header className="shell-header">
        <div className="shell-left">
          <button
            type="button"
            className="shell-toggle-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation"
            title="Toggle Navigation Menu"
          >
            <Menu size={20} />
          </button>

          <Link to="/dashboard" className="shell-brand">
            <div className="sap-logo-badge">SAP</div>
            <div className="brand-text-col">
              <span className="brand-title">Ariba Risk &amp; Compliance</span>
              <span className="brand-subtitle">Enterprise Governance</span>
            </div>
          </Link>
        </div>

        {/* Global Search Bar (Trigger) */}
        <div className="shell-center" style={{ flex: 1, maxWidth: '480px', margin: '0 20px' }}>
          <div
            onClick={() => setSearchModalOpen(true)}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '6px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              color: '#cbd5e1',
              fontSize: '0.82rem',
              transition: 'all 0.15s ease',
            }}
            title="Global Search across suppliers, certificates, risk tiers, audit logs (Ctrl+K)"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={15} color="#94a3b8" />
              <span>Search suppliers, certificates, risks, audit...</span>
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                padding: '2px 6px',
                borderRadius: '4px',
                color: '#94a3b8',
                fontFamily: 'var(--sap-font-mono)',
              }}
            >
              Ctrl+K
            </span>
          </div>
        </div>

        <div className="shell-right">
          {/* Active Role Selector (Switch Role On The Fly) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.14)',
            }}
            title="Switch active role to test role-based permissions"
          >
            <ShieldCheck size={14} color="#38bdf8" />
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
              Role:
            </span>
            <select
              value={userRole}
              onChange={(e) => handleRoleSelect(e.target.value as UserRole)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ADMIN" style={{ color: '#000' }}>Admin</option>
              <option value="PROCUREMENT_MANAGER" style={{ color: '#000' }}>Procurement Manager</option>
              <option value="PROCUREMENT_USER" style={{ color: '#000' }}>Procurement User</option>
              <option value="AUDITOR" style={{ color: '#000' }}>Auditor</option>
            </select>
          </div>

          {/* Notification Center Trigger */}
          <button
            type="button"
            className="shell-toggle-btn"
            onClick={() => setNotificationOpen(true)}
            style={{ position: 'relative' }}
            title={`Notification Center (${unreadCount} unread)`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 2px var(--sap-shell-bg)',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Reset Demo Data Button */}
          <button
            type="button"
            className="reset-data-btn"
            onClick={handleResetData}
            disabled={isResetting}
            title="Restore original demo data"
          >
            <RotateCcw size={13} className={isResetting ? 'animate-spin' : ''} />
            <span>Reset Demo</span>
          </button>

          {/* User Profile Avatar */}
          {user && (
            <div className="user-profile-widget" title={`Signed in as ${user.name} (${userRole})`}>
              <div className="user-avatar">
                {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="user-meta">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
            </div>
          )}

          {/* Sign out */}
          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
            title="Sign out of SAP Session"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Notification Center Drawer Flyout */}
      <NotificationDrawer
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        onCountUpdate={setUnreadCount}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
};
