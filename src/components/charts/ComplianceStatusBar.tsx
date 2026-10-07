import React from 'react';

interface ComplianceStatusBarProps {
  valid: number;
  expiringSoon: number;
  expired: number;
  showDetails?: boolean;
}

export const ComplianceStatusBar: React.FC<ComplianceStatusBarProps> = ({
  valid,
  expiringSoon,
  expired,
  showDetails = true,
}) => {
  const total = valid + expiringSoon + expired || 1;
  const validPct = (valid / total) * 100;
  const expiringPct = (expiringSoon / total) * 100;
  const expiredPct = (expired / total) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {/* Progress Bar Container */}
      <div
        style={{
          height: '14px',
          width: '100%',
          backgroundColor: '#edf2f7',
          borderRadius: '7px',
          overflow: 'hidden',
          display: 'flex',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.08)',
        }}
      >
        {validPct > 0 && (
          <div
            style={{
              width: `${validPct}%`,
              backgroundColor: '#0d7f3e',
              transition: 'width 0.4s ease-in-out',
            }}
            title={`Valid: ${valid} documents (${Math.round(validPct)}%)`}
          />
        )}
        {expiringPct > 0 && (
          <div
            style={{
              width: `${expiringPct}%`,
              backgroundColor: '#c25900',
              transition: 'width 0.4s ease-in-out',
            }}
            title={`Expiring Soon: ${expiringSoon} documents (${Math.round(expiringPct)}%)`}
          />
        )}
        {expiredPct > 0 && (
          <div
            style={{
              width: `${expiredPct}%`,
              backgroundColor: '#ba1717',
              transition: 'width 0.4s ease-in-out',
            }}
            title={`Expired: ${expired} documents (${Math.round(expiredPct)}%)`}
          />
        )}
      </div>

      {showDetails && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0d7f3e' }} />
            <span>Valid: <strong>{valid}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#c25900' }} />
            <span>Expiring Soon: <strong>{expiringSoon}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ba1717' }} />
            <span>Expired: <strong>{expired}</strong></span>
          </div>

          <div style={{ fontWeight: 600, color: expired > 0 ? '#ba1717' : '#0d7f3e' }}>
            {Math.round(validPct)}% Compliant
          </div>
        </div>
      )}
    </div>
  );
};
