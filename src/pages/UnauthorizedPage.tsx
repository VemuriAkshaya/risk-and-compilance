import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, LogOut, Lock } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const attemptedPath = (location.state as any)?.from?.pathname || location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '75vh',
        padding: '32px 16px',
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid var(--sap-error-border)',
          boxShadow: 'var(--sap-shadow-lg)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--sap-error-bg)',
            borderBottom: '1px solid var(--sap-error-border)',
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={28} color="var(--sap-error)" />
          </div>
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: 'var(--sap-error)',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
              }}
            >
              SAP Security Authorization Error • 403
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: '4px 0 0' }}>
              Access Denied: Insufficient Privileges
            </h1>
          </div>
        </div>

        <div style={{ padding: '28px' }}>
          <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
            Your active session for <strong>{user?.name || 'User'}</strong> with assigned role{' '}
            <span
              style={{
                backgroundColor: '#eff6ff',
                color: '#0070f2',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '0.8rem',
              }}
            >
              {userRole}
            </span>{' '}
            does not hold the SAP authorization object required to access{' '}
            <code
              style={{
                backgroundColor: '#f1f5f9',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.82rem',
                color: '#0f172a',
                fontFamily: 'var(--sap-font-mono)',
              }}
            >
              {attemptedPath}
            </code>
            .
          </p>

          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '14px 16px',
              marginBottom: '24px',
              fontSize: '0.8rem',
              color: '#64748b',
              lineHeight: 1.5,
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}
          >
            <Lock size={16} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#334155' }}>Segregation of Duties (SoD) Policy:</strong> Enterprise compliance
              rules prevent non-authorized personnel from executing restricted procurement or user governance transactions.
              Contact an Enterprise System Administrator if you require elevated privileges.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={15} />
              <span>Sign In with Other User</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={15} />
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
