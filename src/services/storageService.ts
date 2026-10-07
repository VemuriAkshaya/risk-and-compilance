import {
  Supplier,
  ActivityLogItem,
  RiskLevel,
  ComplianceSummaryStatus,
  PerformanceStatus,
  ComplianceDocument,
  NotificationItem,
  NotificationCategory,
  AppUser,
  UserRole,
} from '../types/supplier';
import { INITIAL_SUPPLIERS, INITIAL_ACTIVITIES, INITIAL_NOTIFICATIONS, INITIAL_USERS } from './mockData';

const SUPPLIERS_STORAGE_KEY = 'sap_risk_mgmt_suppliers_v1';
const ACTIVITIES_STORAGE_KEY = 'sap_risk_mgmt_activities_v1';
const NOTIFICATIONS_STORAGE_KEY = 'sap_risk_mgmt_notifications_v1';
const USERS_STORAGE_KEY = 'sap_risk_mgmt_users_v1';

export function calculateRiskLevel(score: number): RiskLevel {
  if (score <= 30) return 'LOW';
  if (score <= 60) return 'MEDIUM';
  return 'HIGH';
}

export function calculatePerformanceStatus(score: number): PerformanceStatus {
  if (score >= 85) return 'EXEMPLARY';
  if (score >= 70) return 'SATISFACTORY';
  if (score >= 50) return 'NEEDS_IMPROVEMENT';
  return 'CRITICAL';
}

export function evaluateSupplierCompliance(documents: ComplianceDocument[]): ComplianceSummaryStatus {
  if (!documents || documents.length === 0) return 'COMPLIANT';
  
  const hasExpired = documents.some((doc) => doc.status === 'EXPIRED');
  if (hasExpired) return 'NON_COMPLIANT';
  
  const hasExpiringSoon = documents.some((doc) => doc.status === 'EXPIRING_SOON');
  if (hasExpiringSoon) return 'WARNING';
  
  return 'COMPLIANT';
}

/**
 * Enforces enterprise business rules across a supplier record:
 * - Expired compliance -> supplier automatically becomes BLOCKED
 * - Performance Overall Score = (Quality + Delivery) / 2
 * - Risk level corresponds to 0-30 LOW, 31-60 MEDIUM, 61-100 HIGH
 */
export function normalizeSupplier(s: Supplier): Supplier {
  const complianceStatus = evaluateSupplierCompliance(s.documents || []);
  let supplierStatus = s.supplierStatus;
  let blockReason = s.blockReason;

  // Business Rule: Expired compliance -> supplier becomes BLOCKED
  if (complianceStatus === 'NON_COMPLIANT' && supplierStatus !== 'REJECTED') {
    if (supplierStatus !== 'BLOCKED') {
      supplierStatus = 'BLOCKED';
      blockReason = blockReason || 'Automated policy enforcement: Active compliance documents expired.';
    }
  }

  const riskScore = Math.max(0, Math.min(100, Math.round(s.riskScore ?? s.riskAssessment?.overallScore ?? 30)));
  const riskLevel = calculateRiskLevel(riskScore);

  const qualityScore = s.performance?.qualityScore ?? 80;
  const deliveryScore = s.performance?.deliveryScore ?? 80;
  const overallScore = Math.round((qualityScore + deliveryScore) / 2);
  const perfStatus = calculatePerformanceStatus(overallScore);

  // Guarantee digital signature hashes for certificates
  const documentsWithMeta = (s.documents || []).map((doc) => ({
    ...doc,
    digitalSignatureHash:
      doc.digitalSignatureHash ||
      `SHA256-${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`.toUpperCase(),
  }));

  return {
    ...s,
    complianceStatus,
    supplierStatus,
    blockReason,
    riskScore,
    riskLevel,
    riskAssessment: {
      ...s.riskAssessment,
      overallScore: riskScore,
      level: riskLevel,
    },
    performance: {
      ...s.performance,
      qualityScore,
      deliveryScore,
      overallScore,
      status: perfStatus,
    },
    documents: documentsWithMeta,
  };
}

export function loadSuppliersFromStorage(): Supplier[] {
  try {
    const raw = localStorage.getItem(SUPPLIERS_STORAGE_KEY);
    if (!raw) {
      saveSuppliersToStorage(INITIAL_SUPPLIERS);
      return INITIAL_SUPPLIERS.map(normalizeSupplier);
    }
    const parsed: Supplier[] = JSON.parse(raw);
    return parsed.map(normalizeSupplier);
  } catch (err) {
    console.error('Error loading suppliers from storage:', err);
    return INITIAL_SUPPLIERS.map(normalizeSupplier);
  }
}

export function saveSuppliersToStorage(suppliers: Supplier[]): void {
  try {
    const normalized = suppliers.map(normalizeSupplier);
    localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(normalized));
  } catch (err) {
    console.error('Error saving suppliers to storage:', err);
  }
}

/* ========================================================
   AUDIT TRAIL / ACTIVITY LOGS STORAGE
   ======================================================== */

export function loadActivitiesFromStorage(): ActivityLogItem[] {
  try {
    const raw = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
    if (!raw) {
      saveActivitiesToStorage(INITIAL_ACTIVITIES);
      return INITIAL_ACTIVITIES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading activities from storage:', err);
    return INITIAL_ACTIVITIES;
  }
}

export function saveActivitiesToStorage(activities: ActivityLogItem[]): void {
  try {
    localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(activities));
  } catch (err) {
    console.error('Error saving activities to storage:', err);
  }
}

export function addActivityLog(
  supplierId: string,
  supplierName: string,
  type: ActivityLogItem['type'],
  description: string,
  severity: ActivityLogItem['severity'] = 'INFO',
  actor = 'Elena Rostova (Chief Compliance Officer)',
  options: {
    actorRole?: string;
    previousStatus?: string;
    newStatus?: string;
    reason?: string;
  } = {}
): void {
  const activities = loadActivitiesFromStorage();
  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').slice(0, 19);

  const newLog: ActivityLogItem = {
    id: `ACT-${Date.now()}`,
    timestamp: dateStr,
    supplierId,
    supplierName,
    type,
    description,
    actor,
    actorRole: options.actorRole || 'Admin',
    severity,
    previousStatus: options.previousStatus,
    newStatus: options.newStatus,
    reason: options.reason,
    ipAddress: '192.168.1.20',
    clientTenant: 'Client 100',
  };

  const updated = [newLog, ...activities.slice(0, 149)]; // keep latest 150
  saveActivitiesToStorage(updated);
}

/* ========================================================
   NOTIFICATION CENTER STORAGE
   ======================================================== */

export function loadNotificationsFromStorage(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      saveNotificationsToStorage(INITIAL_NOTIFICATIONS);
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading notifications:', err);
    return INITIAL_NOTIFICATIONS;
  }
}

export function saveNotificationsToStorage(notifications: NotificationItem[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (err) {
    console.error('Error saving notifications:', err);
  }
}

export function addNotification(
  category: NotificationCategory,
  title: string,
  message: string,
  severity: NotificationItem['severity'] = 'INFO',
  targetUrl?: string,
  supplierId?: string,
  supplierName?: string
): void {
  const notifications = loadNotificationsFromStorage();
  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').slice(0, 19);

  const newNotif: NotificationItem = {
    id: `NOTIF-${Date.now()}`,
    category,
    title,
    message,
    timestamp: dateStr,
    isRead: false,
    severity,
    targetUrl,
    supplierId,
    supplierName,
  };

  saveNotificationsToStorage([newNotif, ...notifications.slice(0, 49)]);
}

export function markNotificationAsRead(id: string): void {
  const notifs = loadNotificationsFromStorage();
  const updated = notifs.map((n) => (n.id === id ? { ...n, isRead: true } : n));
  saveNotificationsToStorage(updated);
}

export function markAllNotificationsAsRead(): void {
  const notifs = loadNotificationsFromStorage();
  const updated = notifs.map((n) => ({ ...n, isRead: true }));
  saveNotificationsToStorage(updated);
}

export function dismissNotification(id: string): void {
  const notifs = loadNotificationsFromStorage();
  const filtered = notifs.filter((n) => n.id !== id);
  saveNotificationsToStorage(filtered);
}

/* ========================================================
   USER & ROLE MANAGEMENT STORAGE
   ======================================================== */

export function loadUsersFromStorage(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      saveUsersToStorage(INITIAL_USERS);
      return INITIAL_USERS;
    }
    const parsed: AppUser[] = JSON.parse(raw);
    let hasChanges = false;
    const initialMap = new Map(INITIAL_USERS.map((u) => [u.id, u]));

    const merged = parsed.map((u) => {
      const init = initialMap.get(u.id);
      const updated = { ...u };
      if (!updated.status) {
        updated.status = 'ACTIVE';
        hasChanges = true;
      }
      if (!updated.password) {
        updated.password = init?.password || 'Password@123';
        hasChanges = true;
      }
      if (!updated.employeeId && init?.employeeId) {
        updated.employeeId = init.employeeId;
        hasChanges = true;
      }
      return updated;
    });

    INITIAL_USERS.forEach((initUser) => {
      if (!merged.some((m) => m.id === initUser.id || m.username === initUser.username)) {
        merged.push(initUser);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      saveUsersToStorage(merged);
    }
    return merged;
  } catch (err) {
    console.error('Error loading users:', err);
    return INITIAL_USERS;
  }
}

export function saveUsersToStorage(users: AppUser[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error saving users:', err);
  }
}

export function findUserByIdentifier(identifier: string): AppUser | undefined {
  if (!identifier) return undefined;
  const users = loadUsersFromStorage();
  const clean = identifier.trim().toLowerCase();
  return users.find(
    (u) =>
      u.username.toLowerCase() === clean ||
      u.email.toLowerCase() === clean ||
      (u.employeeId && u.employeeId.toLowerCase() === clean)
  );
}

export function addUserToStorage(userData: Omit<AppUser, 'id'>): AppUser {
  const users = loadUsersFromStorage();
  const newId = `USR-${String(users.length + 1).padStart(3, '0')}`;
  const newUser: AppUser = {
    ...userData,
    id: newId,
    status: 'PENDING_APPROVAL', // strictly enforced
    createdAt: userData.createdAt || new Date().toISOString().replace('T', ' ').slice(0, 19),
  };

  users.push(newUser);
  saveUsersToStorage(users);

  addActivityLog(
    'SYSTEM',
    'User Identity & Governance',
    'USER_STATUS_CHANGED',
    `New user registration submitted for ${newUser.name} (${newUser.email}), Employee ID: ${newUser.employeeId || 'N/A'}. Status: PENDING_APPROVAL.`,
    'INFO',
    newUser.name,
    { previousStatus: 'UNREGISTERED', newStatus: 'PENDING_APPROVAL' }
  );

  addNotification(
    'SYSTEM',
    'New User Registration Awaiting Approval',
    `${newUser.name} (${newUser.email}) registered with requested role ${newUser.role}. Review & approve in User Management.`,
    'WARNING',
    '/users'
  );

  return newUser;
}

export function approveUserRegistration(userId: string, adminName = 'Elena Rostova (Admin)'): AppUser | null {
  const users = loadUsersFromStorage();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const user = users[index];
  const prevStatus = user.status;
  user.status = 'ACTIVE';
  user.approvedBy = adminName;
  user.approvalDate = new Date().toISOString().replace('T', ' ').slice(0, 19);

  saveUsersToStorage(users);

  addActivityLog(
    'SYSTEM',
    'User Identity & Governance',
    'USER_STATUS_CHANGED',
    `Registration APPROVED for ${user.name} (${user.username}) by ${adminName}. Status changed from ${prevStatus} to ACTIVE.`,
    'SUCCESS',
    adminName,
    { previousStatus: prevStatus, newStatus: 'ACTIVE' }
  );

  addNotification(
    'SYSTEM',
    'User Registration Approved',
    `User ${user.name} has been activated as ${user.role}.`,
    'SUCCESS',
    '/users'
  );

  return user;
}

export function rejectUserRegistration(
  userId: string,
  adminName = 'Elena Rostova (Admin)',
  reason?: string
): AppUser | null {
  const users = loadUsersFromStorage();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const user = users[index];
  const prevStatus = user.status;
  user.status = 'REJECTED';
  user.rejectionReason = reason || 'Registration application was rejected during compliance verification.';

  saveUsersToStorage(users);

  addActivityLog(
    'SYSTEM',
    'User Identity & Governance',
    'USER_STATUS_CHANGED',
    `Registration REJECTED for ${user.name} (${user.username}) by ${adminName}. Reason: ${user.rejectionReason}`,
    'WARNING',
    adminName,
    { previousStatus: prevStatus, newStatus: 'REJECTED', reason: user.rejectionReason }
  );

  return user;
}

export function resetUserPassword(
  identifier: string,
  newPassword: string
): { success: boolean; error?: string; user?: AppUser } {
  const users = loadUsersFromStorage();
  const clean = identifier.trim().toLowerCase();
  const index = users.findIndex(
    (u) =>
      u.username.toLowerCase() === clean ||
      u.email.toLowerCase() === clean ||
      (u.employeeId && u.employeeId.toLowerCase() === clean)
  );

  if (index === -1) {
    return { success: false, error: 'No enterprise account matches the provided User ID, Email, or Employee ID.' };
  }

  users[index].password = newPassword;
  saveUsersToStorage(users);

  addActivityLog(
    'SYSTEM',
    'User Identity & Governance',
    'USER_STATUS_CHANGED',
    `Password reset successfully for ${users[index].name} (${users[index].username}).`,
    'INFO',
    users[index].name
  );

  return { success: true, user: users[index] };
}

export function updateUserRole(userId: string, newRole: UserRole): AppUser | null {
  const users = loadUsersFromStorage();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const prevRole = users[index].role;
  users[index].role = newRole;
  saveUsersToStorage(users);

  addActivityLog(
    'SYSTEM',
    'User Management Module',
    'ROLE_CHANGED',
    `User ${users[index].name} (${users[index].username}) role changed from ${prevRole} to ${newRole}.`,
    'WARNING',
    'Elena Rostova (Admin)',
    { previousStatus: prevRole, newStatus: newRole }
  );

  return users[index];
}

export function toggleUserStatus(userId: string): AppUser | null {
  const users = loadUsersFromStorage();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const prev = users[index].status;
  const newStatus = prev === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  users[index].status = newStatus;
  saveUsersToStorage(users);

  addActivityLog(
    'SYSTEM',
    'User Management Module',
    'USER_STATUS_CHANGED',
    `User ${users[index].name} (${users[index].username}) status toggled to ${newStatus}.`,
    newStatus === 'ACTIVE' ? 'INFO' : 'WARNING',
    'Elena Rostova (Admin)',
    { previousStatus: prev, newStatus }
  );

  return users[index];
}

/* ========================================================
   RESET ALL STORAGE
   ======================================================== */

export function resetAllStorageToDefaults(): void {
  localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(INITIAL_SUPPLIERS));
  localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(INITIAL_ACTIVITIES));
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
}
