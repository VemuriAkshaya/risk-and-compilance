import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { KeyRound, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, User, Lock } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [verifiedName, setVerifiedName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleVerifyIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your Enterprise Email, User ID, or Employee ID.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const user = await authService.getAllUsers().then((users) => {
        const clean = identifier.trim().toLowerCase();
        return users.find(
          (u) =>
            u.username.toLowerCase() === clean ||
            u.email.toLowerCase() === clean ||
            (u.employeeId && u.employeeId.toLowerCase() === clean)
        );
      });

      if (!user) {
        setErrorMessage('No matching enterprise account found in the SAP Identity Directory.');
        error('Account Not Found', 'Please verify your Employee ID or Email address.');
        return;
      }

      setVerifiedName(user.name);
      setStep(2);
      success('Account Verified', `Identity confirmed for ${user.name}. You may now set a new password.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters in length.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await authService.resetPassword(identifier, newPassword);
      if (result.success) {
        setIsSuccess(true);
        success('Password Reset Successful', 'Your master credential has been updated. You may now log in.');
      } else {
        setErrorMessage(result.error || 'Failed to reset password.');
        error('Reset Error', result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card-container">
        <div className="login-card-header">
          <div className="login-sap-badge">SAP S/4HANA</div>
          <h1 className="login-title">Credential Recovery</h1>
          <p className="login-subtitle">Enterprise Identity &amp; Access Governance</p>
        </div>

        <div className="login-card-body">
          {isSuccess ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                Password Updated Successfully
              </h2>
              <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5, marginBottom: '24px' }}>
                Your enterprise security password has been updated in the local directory. Please sign in with your new
                credentials.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                onClick={() => navigate('/login')}
              >
                <span>Return to Sign In</span>
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="sap-alert-banner alert-danger" style={{ marginBottom: '16px', padding: '10px 14px' }}>
                  <span>{errorMessage}</span>
                </div>
              )}

              {step === 1 ? (
                <form onSubmit={handleVerifyIdentity} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                    Enter your registered <strong>Enterprise User ID</strong>, <strong>Corporate Email</strong>, or{' '}
                    <strong>Employee ID</strong> to verify your identity.
                  </p>

                  <div className="form-group">
                    <label className="form-label" htmlFor="forgot-identifier">
                      Enterprise Identifier
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#64748b',
                        }}
                      >
                        <User size={16} />
                      </span>
                      <input
                        id="forgot-identifier"
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '38px' }}
                        placeholder="e.g. e.rostova@sap-enterprise.corp or EMP-1001"
                        value={identifier}
                        onChange={(e) => {
                          setIdentifier(e.target.value);
                          if (errorMessage) setErrorMessage('');
                        }}
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', marginTop: '6px' }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Verifying Account...' : (
                      <>
                        <span>Verify Identity</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div
                    style={{
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      color: '#1e40af',
                    }}
                  >
                    Account confirmed: <strong>{verifiedName}</strong>. Please enter your new password below.
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="new-password">
                      New Enterprise Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#64748b',
                        }}
                      >
                        <Lock size={16} />
                      </span>
                      <input
                        id="new-password"
                        type="password"
                        className="form-input"
                        style={{ paddingLeft: '38px' }}
                        placeholder="Minimum 6 characters"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (errorMessage) setErrorMessage('');
                        }}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="confirm-password">
                      Confirm New Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#64748b',
                        }}
                      >
                        <Lock size={16} />
                      </span>
                      <input
                        id="confirm-password"
                        type="password"
                        className="form-input"
                        style={{ paddingLeft: '38px' }}
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errorMessage) setErrorMessage('');
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', marginTop: '6px' }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating Password...' : (
                      <>
                        <KeyRound size={18} />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                    onClick={() => setStep(1)}
                  >
                    Back to Account Verification
                  </button>
                </form>
              )}

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <Link
                  to="/login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#0070f2',
                    fontSize: '0.84rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </>
          )}

          <div
            style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.74rem',
              color: '#64748b',
            }}
          >
            <ShieldCheck size={14} color="#0d7f3e" />
            <span>SAP Cloud Identity Services (IAS) Recovery Protocol</span>
          </div>
        </div>
      </div>
    </div>
  );
};
