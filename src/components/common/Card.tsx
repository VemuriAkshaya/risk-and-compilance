import React from 'react';

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  subtitle?: string;
  trendText?: string;
  isAlert?: boolean;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon,
  iconBg = 'rgba(0, 112, 242, 0.1)',
  iconColor = '#0070f2',
  subtitle,
  trendText,
  isAlert = false,
  onClick,
}) => {
  return (
    <div
      className={`kpi-card ${isAlert ? 'kpi-card-alert' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="kpi-card-header">
        <span className="kpi-title">{title}</span>
        <div className="kpi-icon-box" style={{ backgroundColor: iconBg, color: iconColor }}>
          {icon}
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      {(subtitle || trendText) && (
        <div className="kpi-footer">
          {trendText && <span style={{ fontWeight: 600, color: isAlert ? '#b91c1c' : '#047857' }}>{trendText}</span>}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

interface SapCardProps {
  title: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SapCard: React.FC<SapCardProps> = ({ title, subtitle, actions, children, className = '' }) => {
  return (
    <div className={`sap-card ${className}`}>
      <div className="sap-card-header">
        <div>
          <h2 className="sap-card-title">{title}</h2>
          {subtitle && <p className="sap-card-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="sap-card-actions">{actions}</div>}
      </div>
      <div className="sap-card-body">{children}</div>
    </div>
  );
};
