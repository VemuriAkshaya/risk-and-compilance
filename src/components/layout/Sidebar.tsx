import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { supplierService } from '../../services/supplierService';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  FileCheck,
  ShieldAlert,
  Award,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  History,
  BarChart3,
  Users,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { userRole } = useAuth();
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [expiredDocsCount, setExpiredDocsCount] = useState(0);

  useEffect(() => {
    const fetchCounters = async () => {
      try {
        const metrics = await supplierService.getDashboardMetrics();
        setHighRiskCount(metrics.highRiskCount);
        setExpiredDocsCount(metrics.complianceSummary.expired);
      } catch {
        // Ignore background error
      }
    };

    fetchCounters();
    const interval = setInterval(fetchCounters, 5000);
    return () => clearInterval(interval);
  }, []);

  const primaryNavItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={18} className="nav-icon" />,
    },
    {
      to: '/suppliers',
      label: 'Suppliers Directory',
      icon: <Building2 size={18} className="nav-icon" />,
    },
    {
      to: '/compliance',
      label: 'Compliance Cockpit',
      icon: <FileCheck size={18} className="nav-icon" />,
      badge: expiredDocsCount > 0 ? `${expiredDocsCount} Expired` : undefined,
      badgeType: 'danger',
    },
    {
      to: '/risk',
      label: 'Risk Management',
      icon: <ShieldAlert size={18} className="nav-icon" />,
      badge: highRiskCount > 0 ? `${highRiskCount} High` : undefined,
      badgeType: 'warning',
    },
    {
      to: '/performance',
      label: 'Performance Scorecard',
      icon: <Award size={18} className="nav-icon" />,
    },
  ];

  const secondaryNavItems = [
    {
      to: '/audit',
      label: 'Audit History',
      icon: <History size={18} className="nav-icon" />,
    },
    {
      to: '/reports',
      label: 'Reports & Export',
      icon: <BarChart3 size={18} className="nav-icon" />,
    },
    {
      to: '/users',
      label: 'User Management',
      icon: <Users size={18} className="nav-icon" />,
    },
  ];

  return (
    <aside
      className={`app-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
    >
      <nav className="sidebar-nav">
        {primaryNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onCloseMobile}
            className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
            title={isCollapsed ? item.label : undefined}
          >
            {item.icon}
            {!isCollapsed && <span>{item.label}</span>}
            {!isCollapsed && item.badge && (
              <span className={`nav-badge-pill ${item.badgeType}`}>{item.badge}</span>
            )}
          </NavLink>
        ))}

        <div style={{ margin: '12px 0 6px', borderTop: '1px solid #1f334d' }} />

        {/* Secondary Governance Links */}
        {secondaryNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onCloseMobile}
            className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
            title={isCollapsed ? item.label : undefined}
          >
            {item.icon}
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        <div style={{ margin: '12px 0 6px', borderTop: '1px solid #1f334d' }} />

        <NavLink
          to="/suppliers/new"
          onClick={onCloseMobile}
          className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
          title={isCollapsed ? 'Onboard Supplier' : undefined}
          style={{ color: '#38bdf8' }}
        >
          <PlusCircle size={18} className="nav-icon" />
          {!isCollapsed && <span>Onboard Supplier</span>}
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="shell-toggle-btn"
          style={{ width: '100%', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: '8px' }}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!isCollapsed && <span style={{ fontSize: '0.78rem' }}>Collapse Navigation</span>}
        </button>

        {!isCollapsed && (
          <div style={{ marginTop: '8px', opacity: 0.7 }}>
            <span>SAP ABAP RAP V4 Target</span>
            <div>Service: Z_C_SUPPLIER_O4</div>
          </div>
        )}
      </div>
    </aside>
  );
};
