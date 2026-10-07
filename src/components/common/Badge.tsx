import React from 'react';
import { SupplierStatus, RiskLevel, DocumentStatus, ComplianceSummaryStatus, PerformanceStatus } from '../../types/supplier';

export const StatusBadge: React.FC<{ status: SupplierStatus }> = ({ status }) => {
  const labelMap: Record<SupplierStatus, string> = {
    APPROVED: 'Approved',
    UNDER_REVIEW: 'Under Review',
    BLOCKED: 'Blocked',
    REJECTED: 'Rejected',
  };

  const classKey = status.toLowerCase();

  return (
    <span className={`sap-badge badge-status-${classKey}`} title={`Supplier Status: ${labelMap[status]}`}>
      <span className="badge-dot" />
      {labelMap[status]}
    </span>
  );
};

export const RiskBadge: React.FC<{ level: RiskLevel; score?: number }> = ({ level, score }) => {
  const classKey = level.toLowerCase();

  return (
    <span className={`sap-badge badge-risk-${classKey}`} title={`Risk Level: ${level} (Score: ${score ?? 'N/A'})`}>
      <span className="badge-dot" />
      {level} {score !== undefined && <span className="tabular-nums" style={{ opacity: 0.85, marginLeft: 2 }}>({score})</span>}
    </span>
  );
};

export const ComplianceBadge: React.FC<{ status: DocumentStatus | ComplianceSummaryStatus }> = ({ status }) => {
  const labelMap: Record<string, string> = {
    VALID: 'Valid',
    EXPIRING_SOON: 'Expiring Soon',
    EXPIRED: 'Expired',
    COMPLIANT: 'Compliant',
    WARNING: 'Action Required',
    NON_COMPLIANT: 'Critical Non-Compliant',
  };

  const classKey = status.toLowerCase();

  return (
    <span className={`sap-badge badge-compliance-${classKey}`} title={`Compliance: ${labelMap[status] || status}`}>
      <span className="badge-dot" />
      {labelMap[status] || status}
    </span>
  );
};

export const PerformanceBadge: React.FC<{ status: PerformanceStatus; score?: number }> = ({ status, score }) => {
  const labelMap: Record<PerformanceStatus, string> = {
    EXEMPLARY: 'Exemplary',
    SATISFACTORY: 'Satisfactory',
    NEEDS_IMPROVEMENT: 'Needs Improvement',
    CRITICAL: 'Critical Attention',
  };

  const classKey = status.toLowerCase();

  return (
    <span className={`sap-badge badge-perf-${classKey}`} title={`Performance: ${labelMap[status]}`}>
      <span className="badge-dot" />
      {labelMap[status]} {score !== undefined && <span className="tabular-nums" style={{ opacity: 0.85 }}>({score})</span>}
    </span>
  );
};
