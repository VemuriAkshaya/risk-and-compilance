import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserStatus } from '../types/supplier';
import { authService, AUTH_STORAGE_KEY, RegisterUserData, AuthResult } from '../services/authService';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: string;
  userRole: UserRole;
  department?: string;
  employeeId?: string;
  tenant: string;
  email: string;
  status: UserStatus;
}

export type PermissionKey =
  | 'APPROVE_SUPPLIER'
  | 'REJECT_SUPPLIER'
  | 'BLOCK_SUPPLIER'
  | 'UNBLOCK_SUPPLIER'
  | 'REASSESS_RISK'
  | 'CREATE_SUPPLIER'
  | 'EDIT_SUPPLIER'
  | 'DELETE_SUPPLIER'
  | 'MANAGE_DOCUMENTS'
  | 'DELETE_DOCUMENTS'
  | 'AUDIT_PERFORMANCE'
  | 'MANAGE_USERS'
  | 'EXPORT_REPORTS';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  userRole: UserRole;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterUserData) => Promise<AuthResult>;
  resetPassword: (identifier: string, newPassword: string) => Promise<AuthResult>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  can: (permission: PermissionKey) => boolean;
  isAuthorizedForPath: (pathname: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Segregation of Duties (SoD) Permission Matrix based on requirements:
// Admin: Full access
// Manager: Supplier approval, risk and compliance management
// User: Supplier and document operations
// Auditor: Audit history and reports view access
const ROLE_PERMISSIONS: Record<string, Record<PermissionKey, boolean>> = {
  ADMIN: {
    APPROVE_SUPPLIER: true,
    REJECT_SUPPLIER: true,
    BLOCK_SUPPLIER: true,
    UNBLOCK_SUPPLIER: true,
    REASSESS_RISK: true,
    CREATE_SUPPLIER: true,
    EDIT_SUPPLIER: true,
    DELETE_SUPPLIER: true,
    MANAGE_DOCUMENTS: true,
    DELETE_DOCUMENTS: true,
    AUDIT_PERFORMANCE: true,
    MANAGE_USERS: true,
    EXPORT_REPORTS: true,
  },
  PROCUREMENT_MANAGER: {
    APPROVE_SUPPLIER: true,
    REJECT_SUPPLIER: true,
    BLOCK_SUPPLIER: true,
    UNBLOCK_SUPPLIER: true,
    REASSESS_RISK: true,
    CREATE_SUPPLIER: true,
    EDIT_SUPPLIER: true,
    DELETE_SUPPLIER: false,
    MANAGE_DOCUMENTS: true,
    DELETE_DOCUMENTS: false,
    AUDIT_PERFORMANCE: true,
    MANAGE_USERS: false,
    EXPORT_REPORTS: true,
  },
  MANAGER: {
    APPROVE_SUPPLIER: true,
    REJECT_SUPPLIER: true,
    BLOCK_SUPPLIER: true,
    UNBLOCK_SUPPLIER: true,
    REASSESS_RISK: true,
    CREATE_SUPPLIER: true,
    EDIT_SUPPLIER: true,
    DELETE_SUPPLIER: false,
    MANAGE_DOCUMENTS: true,
    DELETE_DOCUMENTS: false,
    AUDIT_PERFORMANCE: true,
    MANAGE_USERS: false,
    EXPORT_REPORTS: true,
  },
  PROCUREMENT_USER: {
    APPROVE_SUPPLIER: false,
    REJECT_SUPPLIER: false,
    BLOCK_SUPPLIER: false,
    UNBLOCK_SUPPLIER: false,
    REASSESS_RISK: false,
    CREATE_SUPPLIER: true,
    EDIT_SUPPLIER: true,
    DELETE_SUPPLIER: false,
    MANAGE_DOCUMENTS: true,
    DELETE_DOCUMENTS: false,
    AUDIT_PERFORMANCE: false,
    MANAGE_USERS: false,
    EXPORT_REPORTS: true,
  },
  USER: {
    APPROVE_SUPPLIER: false,
    REJECT_SUPPLIER: false,
    BLOCK_SUPPLIER: false,
    UNBLOCK_SUPPLIER: false,
    REASSESS_RISK: false,
    CREATE_SUPPLIER: true,
    EDIT_SUPPLIER: true,
    DELETE_SUPPLIER: false,
    MANAGE_DOCUMENTS: true,
    DELETE_DOCUMENTS: false,
    AUDIT_PERFORMANCE: false,
    MANAGE_USERS: false,
    EXPORT_REPORTS: true,
  },
  AUDITOR: {
    APPROVE_SUPPLIER: false,
    REJECT_SUPPLIER: false,
    BLOCK_SUPPLIER: false,
    UNBLOCK_SUPPLIER: false,
    REASSESS_RISK: false,
    CREATE_SUPPLIER: false,
    EDIT_SUPPLIER: false,
    DELETE_SUPPLIER: false,
    MANAGE_DOCUMENTS: false,
    DELETE_DOCUMENTS: false,
    AUDIT_PERFORMANCE: true,
    MANAGE_USERS: false,
    EXPORT_REPORTS: true,
  },
};

function mapRoleToTitle(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return 'Enterprise System Administrator';
    case 'PROCUREMENT_MANAGER':
    case 'MANAGER':
      return 'Supplier & Risk Compliance Manager';
    case 'PROCUREMENT_USER':
    case 'USER':
      return 'Procurement Specialist';
    case 'AUDITOR':
      return 'Lead Internal Compliance Auditor';
    default:
      return 'Enterprise User';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const activeSession = authService.getCurrentSession();
      if (activeSession) {
        return {
          id: activeSession.id,
          username: activeSession.username,
          name: activeSession.name,
          role: mapRoleToTitle(activeSession.role),
          userRole: activeSession.role,
          department: activeSession.department,
          employeeId: activeSession.employeeId,
          tenant: 'SAP S/4HANA Cloud (Client 100)',
          email: activeSession.email,
          status: activeSession.status,
        };
      }
    } catch {
      // Fallback
    }
    return null;
  });

  // Keep session synced with localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_STORAGE_KEY) {
        const session = authService.getCurrentSession();
        if (session) {
          setUser({
            id: session.id,
            username: session.username,
            name: session.name,
            role: mapRoleToTitle(session.role),
            userRole: session.role,
            department: session.department,
            employeeId: session.employeeId,
            tenant: 'SAP S/4HANA Cloud (Client 100)',
            email: session.email,
            status: session.status,
          });
        } else {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (
    identifier: string,
    password: string,
    rememberMe = false
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await authService.login(identifier, password, rememberMe);

    if (result.success && result.user) {
      const authUser: AuthUser = {
        id: result.user.id,
        username: result.user.username,
        name: result.user.name,
        role: mapRoleToTitle(result.user.role),
        userRole: result.user.role,
        department: result.user.department,
        employeeId: result.user.employeeId,
        tenant: 'SAP S/4HANA Cloud (Client 100)',
        email: result.user.email,
        status: result.user.status,
      };

      setUser(authUser);
      return { success: true };
    }

    return {
      success: false,
      error: result.error || 'Authentication failed. Please verify credentials.',
    };
  };

  const register = async (data: RegisterUserData): Promise<AuthResult> => {
    return authService.register(data);
  };

  const resetPassword = async (identifier: string, newPassword: string): Promise<AuthResult> => {
    return authService.resetPassword(identifier, newPassword);
  };

  const logout = () => {
    setUser(null);
    authService.logout();
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;

    const updatedUser: AuthUser = {
      ...user,
      role: mapRoleToTitle(newRole),
      userRole: newRole,
    };

    setUser(updatedUser);

    // Update active storage session
    try {
      const active = authService.getCurrentSession();
      if (active) {
        active.role = newRole;
        if (localStorage.getItem(AUTH_STORAGE_KEY)) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(active));
        } else {
          sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(active));
        }
      }
    } catch {
      // Ignore
    }
  };

  const currentRole: UserRole = user?.userRole || 'ADMIN';

  const can = (permission: PermissionKey): boolean => {
    return ROLE_PERMISSIONS[currentRole]?.[permission] ?? false;
  };

  /**
   * Evaluates if current user's role is authorized to view a given route pathname
   */
  const isAuthorizedForPath = (pathname: string): boolean => {
    if (!user) return false;
    const role = user.userRole;

    // Admin has full access to all paths
    if (role === 'ADMIN') return true;

    // Users Management is strictly restricted to Admin
    if (pathname.startsWith('/users')) return false;

    // Manager role access:
    // Dashboard, Suppliers, Compliance, Risk, Performance, Reports
    if (role === 'MANAGER' || role === 'PROCUREMENT_MANAGER') {
      return true; // Has access to all operational routes except /users
    }

    // User role access:
    // Supplier and document operations: Dashboard, Suppliers, Compliance
    // Restricted from Risk management, Audit history, and Users management
    if (role === 'USER' || role === 'PROCUREMENT_USER') {
      if (pathname.startsWith('/risk')) return false;
      if (pathname.startsWith('/audit')) return false;
      if (pathname.startsWith('/users')) return false;
      return true;
    }

    // Auditor role access:
    // Audit history and reports view access: Dashboard, Audit, Reports, Performance, read-only Suppliers
    // Restricted from Supplier onboarding/edit, Users management
    if (role === 'AUDITOR') {
      if (pathname === '/suppliers/new') return false;
      if (pathname.endsWith('/edit')) return false;
      if (pathname.startsWith('/users')) return false;
      return true;
    }

    return true;
  };

  const isAuthenticated = Boolean(user && user.status === 'ACTIVE');

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        userRole: currentRole,
        login,
        register,
        resetPassword,
        logout,
        switchRole,
        can,
        isAuthorizedForPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
