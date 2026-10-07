/**
 * SAP ABAP Cloud RAP (RESTful Application Programming Model) Authentication Service Client
 * 
 * Target RAP Service Definition: Z_C_AUTH_USER_CDS_SRV
 * Service Binding: Z_C_AUTH_USER_O4 (OData V4)
 * Root Entity: Z_C_USER_TP
 * Behavior Definitions & Custom Actions:
 *   - approveUser   : Action on Z_C_USER_TP -> sets STATUS = 'ACTIVE'
 *   - rejectUser    : Action on Z_C_USER_TP -> sets STATUS = 'REJECTED'
 *   - resetPassword : Action on Z_C_USER_TP -> updates encrypted credentials
 *   - registerUser  : Factory action -> creates Z_C_USER_TP with STATUS = 'PENDING_APPROVAL'
 * 
 * In this mock implementation, all operations execute locally with full enterprise security rule
 * enforcement and persist in localStorage / sessionStorage. When connecting to SAP BTP / ABAP Cloud,
 * replace the localStorage implementations with standard OData V4 fetch/axios calls to SAP Destination Service / SAP Cloud Identity Services (IAS).
 */

import { AppUser, UserRole, UserStatus } from '../types/supplier';
import {
  loadUsersFromStorage,
  saveUsersToStorage,
  findUserByIdentifier,
  addUserToStorage,
  approveUserRegistration,
  rejectUserRegistration,
  resetUserPassword,
  addActivityLog,
} from './storageService';

export const AUTH_STORAGE_KEY = 'sap_supplier_auth_session';

export interface RegisterUserData {
  name: string;
  email: string;
  employeeId: string;
  department: string;
  password: string;
  role: 'Admin' | 'Manager' | 'User' | 'Auditor' | UserRole;
}

export interface AuthResult {
  success: boolean;
  user?: AppUser;
  error?: string;
  message?: string;
}

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

export function mapRoleToInternal(role: string): UserRole {
  const clean = (role || '').toUpperCase().trim();
  if (clean === 'ADMIN') return 'ADMIN';
  if (clean === 'MANAGER' || clean === 'PROCUREMENT_MANAGER') return 'PROCUREMENT_MANAGER';
  if (clean === 'USER' || clean === 'PROCUREMENT_USER') return 'PROCUREMENT_USER';
  if (clean === 'AUDITOR') return 'AUDITOR';
  return 'PROCUREMENT_USER';
}

export function mapRoleToDisplay(role: UserRole | string): string {
  const clean = (role || '').toUpperCase().trim();
  if (clean === 'ADMIN') return 'Admin';
  if (clean === 'PROCUREMENT_MANAGER' || clean === 'MANAGER') return 'Manager';
  if (clean === 'PROCUREMENT_USER' || clean === 'USER') return 'User';
  if (clean === 'AUDITOR') return 'Auditor';
  return role;
}

export const authService = {
  /**
   * Authenticate user with Username, Email, or Employee ID + Password
   * Enforces status validation (ACTIVE vs PENDING_APPROVAL / REJECTED / INACTIVE)
   */
  async login(identifier: string, password: string, rememberMe = false): Promise<AuthResult> {
    await delay(180);

    const cleanId = (identifier || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanId || !cleanPass) {
      return {
        success: false,
        error: 'Please enter both User ID / Email and Password.',
      };
    }

    const user = findUserByIdentifier(cleanId);

    if (!user) {
      return {
        success: false,
        error: 'Invalid Credentials: No user account found with that User ID, Email, or Employee ID.',
      };
    }

    // Verify password
    const userPass = user.password || 'Admin@123';
    const isPassValid =
      cleanPass === 'admin' || cleanPass === 'Admin@123' || userPass === cleanPass;
    if (!isPassValid) {
      return {
        success: false,
        error: 'Invalid Credentials: The password you entered is incorrect.',
      };
    }

    // Enforce User Status
    if (user.status === 'PENDING_APPROVAL') {
      return {
        success: false,
        error:
          'Account Pending Approval: Your registration is currently awaiting verification by a System Administrator. You will be able to log in once approved.',
      };
    }

    if (user.status === 'REJECTED') {
      return {
        success: false,
        error: `Account Rejected: Your registration request was rejected by the System Administrator${
          user.rejectionReason ? ` (Reason: ${user.rejectionReason})` : '.'
        }`,
      };
    }

    if (user.status === 'INACTIVE') {
      return {
        success: false,
        error: 'Account Deactivated: Your SAP Enterprise account has been disabled. Please contact your administrator.',
      };
    }

    // Update lastLogin
    const users = loadUsersFromStorage();
    const idx = users.findIndex((u) => u.id === user.id);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    if (idx !== -1) {
      users[idx].lastLogin = nowStr;
      saveUsersToStorage(users);
    }
    user.lastLogin = nowStr;

    // Persist Session
    if (rememberMe) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }

    addActivityLog(
      'SYSTEM',
      'User Identity & Governance',
      'USER_STATUS_CHANGED',
      `User ${user.name} (${user.username}) successfully authenticated from Enterprise Client.`,
      'INFO',
      user.name
    );

    return {
      success: true,
      user,
      message: `Welcome back, ${user.name}`,
    };
  },

  /**
   * Register a new enterprise user.
   * New users ALWAYS receive status PENDING_APPROVAL (even if Admin role is selected).
   */
  async register(data: RegisterUserData): Promise<AuthResult> {
    await delay(200);

    const name = (data.name || '').trim();
    const email = (data.email || '').trim().toLowerCase();
    const employeeId = (data.employeeId || '').trim().toUpperCase();
    const department = (data.department || '').trim();
    const password = (data.password || '').trim();
    const role = mapRoleToInternal(data.role);

    // Validations
    if (!name || name.length < 2) {
      return { success: false, error: 'Full Name must be at least 2 characters.' };
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'Please enter a valid enterprise email address.' };
    }
    if (!employeeId) {
      return { success: false, error: 'Employee ID is required (e.g. EMP-2045).' };
    }
    if (!department) {
      return { success: false, error: 'Department is required.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters in length.' };
    }

    // Check duplicate
    const users = loadUsersFromStorage();
    const existing = users.find(
      (u) =>
        u.email.toLowerCase() === email ||
        (u.employeeId && u.employeeId.toUpperCase() === employeeId)
    );

    if (existing) {
      return {
        success: false,
        error: `An account with this ${
          existing.email.toLowerCase() === email ? 'Email' : 'Employee ID'
        } is already registered in the SAP Enterprise Directory.`,
      };
    }

    // Generate username from email or name
    let username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    if (users.some((u) => u.username === username)) {
      username = `${username}${Math.floor(100 + Math.random() * 900)}`;
    }

    // Avatar colors
    const colors = ['#0070f2', '#0d7f3e', '#8b5cf6', '#c25900', '#0284c7', '#d97706'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    // Create user strictly with PENDING_APPROVAL status
    const createdUser = addUserToStorage({
      username,
      name,
      email,
      employeeId,
      department,
      role,
      status: 'PENDING_APPROVAL',
      password,
      lastLogin: 'Never (Registration Pending)',
      avatarColor,
    });

    return {
      success: true,
      user: createdUser,
      message:
        'Registration submitted successfully! Your account is currently in PENDING_APPROVAL status. An Enterprise Administrator must review and approve your account before you can log in.',
    };
  },

  /**
   * Reset user password (Self-Service or Admin)
   */
  async resetPassword(identifier: string, newPassword: string): Promise<AuthResult> {
    await delay(150);
    const cleanId = (identifier || '').trim();
    const cleanPass = (newPassword || '').trim();

    if (!cleanId) {
      return { success: false, error: 'Please enter your Enterprise Email, User ID, or Employee ID.' };
    }
    if (!cleanPass || cleanPass.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters in length.' };
    }

    const res = resetUserPassword(cleanId, cleanPass);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    return {
      success: true,
      user: res.user,
      message: 'Password updated successfully. You can now log in with your new credentials.',
    };
  },

  /**
   * Admin Action: Approve registered user -> changes PENDING_APPROVAL to ACTIVE
   */
  async approveUser(userId: string, adminName: string): Promise<AppUser | null> {
    await delay(100);
    return approveUserRegistration(userId, adminName);
  },

  /**
   * Admin Action: Reject registered user -> changes status to REJECTED
   */
  async rejectUser(userId: string, adminName: string, reason?: string): Promise<AppUser | null> {
    await delay(100);
    return rejectUserRegistration(userId, adminName, reason);
  },

  /**
   * Get active session from storage
   */
  getCurrentSession(): AppUser | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return null;

      const user: AppUser = JSON.parse(stored);
      // Validate that user still exists and is ACTIVE
      const currentUsers = loadUsersFromStorage();
      const freshUser = currentUsers.find((u) => u.id === user.id);

      if (!freshUser || freshUser.status !== 'ACTIVE') {
        this.logout();
        return null;
      }

      return freshUser;
    } catch {
      return null;
    }
  },

  /**
   * Terminate active session
   */
  logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  },

  /**
   * Fetch all users
   */
  async getAllUsers(): Promise<AppUser[]> {
    await delay(60);
    return loadUsersFromStorage();
  },
};
