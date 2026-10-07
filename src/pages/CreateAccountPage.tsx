import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  User,
  Mail,
  BadgeAlert,
  Building,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  IdCard,
} from 'lucide-react';

export const CreateAccountPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<'Admin' | 'Manager' | 'User' | 'Auditor'>('User');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [registeredUser, setRegisteredUser] = useState<any | null>(null);

  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Field validations
    if (!fullName.trim()) {
      setErrorMessage('Please enter your Full Name.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid enterprise email address.');
      return;
    }
    if (!employeeId.trim()) {
      setErrorMessage('Please enter your Employee ID (e.g. EMP-2045).');
      return;
    }
    if (!department.trim()) {
      setErrorMessage('Please enter your Department.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Password and Confirm Password do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await register({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        employeeId: employeeId.trim().toUpperCase(),
        department: department.trim(),
        role,
        password,
      });

      if (result.success && result.user) {
        setRegisteredUser(result.user);
        success(
          'Registration Submitted',
          'Your account is in PENDING_APPROVAL status. An Administrator must verify before you can log in.'
        );
      } else {
        setErrorMessage(result.error || 'Registration failed. Please check form entries.');
        error('Registration Error', result.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'System error during registration.');
      error('System Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper" style={{ padding: '36px 16px' }}>
      <div className="login-card-container" style={{ maxWidth: '540px' }}>
        <div className="login-card-header">
          <div className="login-sap-badge">SAP S/4HANA</div>
          <h1 className="login-title">Create Enterprise Account</h1>
          <p className="login-subtitle">Supplier Risk &amp; Purchase Compliance Registration</p>
        </div>

        <div className="login-card-body">
          {registeredUser ? (
            /* Post-registration Success State */
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Clock size={36} />
              </div>

              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                Registration Submitted
              </h2>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#fffbeb',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  marginBottom: '18px',
                }}
              >
                <span>STATUS: PENDING_APPROVAL</span>
              </div>

              <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
                Your enterprise account has been created and submitted to the System Administrator for verification. In
                compliance with SAP Segregation of Duties policies, newly registered users cannot log in until approved.
              </p>

              {/* Summary Card */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'left',
                  marginBottom: '24px',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', rowGap: '10px' }}>
                  <span style={{ color: '#64748b' }}>Full Name:</span>
                  <strong style={{ color: '#1e293b' }}>{registeredUser.name}</strong>

                  <span style={{ color: '#64748b' }}>Email:</span>
                  <span style={{ color: '#1e293b', wordBreak: 'break-all' }}>{registeredUser.email}</span>

                  <span style={{ color: '#64748b' }}>Employee ID:</span>
                  <span style={{ color: '#1e293b', fontFamily: 'var(--sap-font-mono)' }}>
                    {registeredUser.employeeId || 'N/A'}
                  </span>

                  <span style={{ color: '#64748b' }}>Department:</span>
                  <span style={{ color: '#1e293b' }}>{registeredUser.department}</span>

                  <span style={{ color: '#64748b' }}>Requested Role:</span>
                  <span style={{ color: '#0070f2', fontWeight: 600 }}>{role}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                onClick={() => navigate('/login')}
              >
                <span>Proceed to Sign In</span>
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            /* Registration Form */
            <>
              {/* SAP Enterprise Approval Notice */}
              <div
                style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '6px',
                  padding: '12px 14px',
                  fontSize: '0.8rem',
                  color: '#0369a1',
                  marginBottom: '20px',
                  lineHeight: 1.5,
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                }}
              >
                <BadgeAlert size={18} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Authorization Policy:</strong> Newly registered accounts are provisioned with status{' '}
                  <span style={{ fontWeight: 700, color: '#0c4a6e' }}>PENDING_APPROVAL</span>. An Enterprise
                  Administrator must approve your registration before you can access the system.
                </div>
              </div>

              {errorMessage && (
                <div className="sap-alert-banner alert-danger" style={{ marginBottom: '16px', padding: '10px 14px' }}>
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Full Name */}
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-fullname">
                    Full Name <span style={{ color: '#dc2626' }}>*</span>
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
                      id="reg-fullname"
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '38px' }}
                      placeholder="e.g. Elena Rostova"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-email">
                    Corporate Email <span style={{ color: '#dc2626' }}>*</span>
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
                      <Mail size={16} />
                    </span>
                    <input
                      id="reg-email"
                      type="email"
                      className="form-input"
                      style={{ paddingLeft: '38px' }}
                      placeholder="e.g. e.rostova@sap-enterprise.corp"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Two-column: Employee ID & Department */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Employee ID */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-empid">
                      Employee ID <span style={{ color: '#dc2626' }}>*</span>
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
                        <IdCard size={16} />
                      </span>
                      <input
                        id="reg-empid"
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '38px' }}
                        placeholder="e.g. EMP-2049"
                        value={employeeId}
                        onChange={(e) => {
                          setEmployeeId(e.target.value);
                          if (errorMessage) setErrorMessage('');
                        }}
                        required
                      />
                    </div>
                  </div>

                  {/* Department */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-dept">
                      Department <span style={{ color: '#dc2626' }}>*</span>
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
                        <Building size={16} />
                      </span>
                      <input
                        id="reg-dept"
                        type="text"
                        list="dept-options"
                        className="form-input"
                        style={{ paddingLeft: '38px' }}
                        placeholder="e.g. Procurement"
                        value={department}
                        onChange={(e) => {
                          setDepartment(e.target.value);
                          if (errorMessage) setErrorMessage('');
                        }}
                        required
                      />
                      <datalist id="dept-options">
                        <option value="Global Procurement & Sourcing" />
                        <option value="Supplier Risk & Compliance" />
                        <option value="Internal Quality Audit" />
                        <option value="Supply Chain Operations" />
                        <option value="Finance & Accounts Payable" />
                        <option value="Enterprise IT Governance" />
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* Role Selection */}
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-role">
                    Requested Role <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    id="reg-role"
                    className="sap-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    style={{ width: '100%', height: '38px' }}
                  >
                    <option value="Admin">Admin — System Administrator &amp; Full Access (Requires Approval)</option>
                    <option value="Manager">Manager — Supplier Approval, Risk &amp; Compliance Management</option>
                    <option value="User">User — Supplier &amp; Document Operations</option>
                    <option value="Auditor">Auditor — Audit History &amp; Reports View Access</option>
                  </select>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Note: Selecting Admin does not automatically grant admin privileges; registration remains in
                    PENDING_APPROVAL.
                  </span>
                </div>

                {/* Password & Confirm Password */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-password">
                      Password <span style={{ color: '#dc2626' }}>*</span>
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
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        style={{ paddingLeft: '38px', paddingRight: '36px' }}
                        placeholder="Min 6 chars"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errorMessage) setErrorMessage('');
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-confirm">
                      Confirm Password <span style={{ color: '#dc2626' }}>*</span>
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
                        id="reg-confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="form-input"
                        style={{ paddingLeft: '38px', paddingRight: '36px' }}
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errorMessage) setErrorMessage('');
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: '8px' }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    'Provisioning Account in Directory...'
                  ) : (
                    <>
                      <span>Submit Registration for Approval</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div
                style={{
                  marginTop: '20px',
                  textAlign: 'center',
                  fontSize: '0.84rem',
                  color: '#475569',
                }}
              >
                Already registered in the directory?{' '}
                <Link
                  to="/login"
                  style={{
                    color: '#0070f2',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  Sign In to Enterprise Cockpit
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
            <span>SAP Cloud Identity Provisioning &amp; Role-Based Governance</span>
          </div>
        </div>
      </div>
    </div>
  );
};
