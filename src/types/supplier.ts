export type SupplierStatus = 'APPROVED' | 'UNDER_REVIEW' | 'BLOCKED' | 'REJECTED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type DocumentStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';

export type ComplianceSummaryStatus = 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';

export type PerformanceStatus = 'EXEMPLARY' | 'SATISFACTORY' | 'NEEDS_IMPROVEMENT' | 'CRITICAL';

export interface ComplianceDocument {
  id: string;
  supplierId: string;
  documentType: string; // e.g. ISO 9001, Anti-Bribery, GDPR Compliance, ESG Certificate, Tax Clearance, Cyber Security Audit
  documentNumber: string;
  issueDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  status: DocumentStatus;
  verificationAuthority: string;
  documentName?: string;
  fileSize?: string;
  notes?: string;
  digitalSignatureHash?: string;
  downloadUrl?: string;
}

export interface RiskAssessment {
  financialScore: number; // 0 - 100
  operationalScore: number; // 0 - 100
  geopoliticalScore: number; // 0 - 100
  esgScore: number; // 0 - 100
  cyberScore: number; // 0 - 100
  overallScore: number; // 0 - 100
  level: RiskLevel;
  lastAssessedDate: string;
  assessedBy: string;
  mitigationNotes?: string;
}

export interface PerformanceScorecard {
  qualityScore: number; // 0 - 100
  deliveryScore: number; // 0 - 100
  overallScore: number; // (Quality + Delivery) / 2
  status: PerformanceStatus;
  lastEvaluatedDate: string;
  evaluationCycle: string;
  onTimeDeliveryRate: number; // e.g. 98.4%
  defectRatePpm: number; // e.g. 120 PPM
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  orderDate: string;
  amount: number;
  currency: string;
  status: 'PENDING_APPROVAL' | 'RELEASED' | 'DELIVERED' | 'ON_HOLD';
  itemsCount: number;
  complianceGatePassed: boolean;
  paymentTerms: string;
}

export interface Supplier {
  id: string; // e.g. "SUP-1001"
  name: string;
  taxId: string;
  category: string; // e.g. Raw Materials, Precision Machining, IT & Cloud Services, Logistics
  country: string;
  countryCode: string; // e.g. DE, US, JP, IN, FR, CH
  city: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  
  // Statuses
  supplierStatus: SupplierStatus;
  complianceStatus: ComplianceSummaryStatus; // Derived from documents
  
  // Risk
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel; // Derived: 0-30 LOW, 31-60 MEDIUM, 61-100 HIGH
  riskAssessment: RiskAssessment;
  
  // Performance
  performance: PerformanceScorecard;
  
  // Compliance Documents
  documents: ComplianceDocument[];
  
  // Purchase Information
  purchaseOrders: PurchaseOrder[];
  annualSpend: number;
  spendCurrency: string;
  paymentTerms: string;
  bankIban: string;
  
  // Audit metadata
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvalDate?: string;
  blockReason?: string;
  rejectionReason?: string;
}

export type AuditActionType =
  | 'APPROVAL'
  | 'REJECTION'
  | 'BLOCK'
  | 'UNBLOCK'
  | 'RISK_REASSESSMENT'
  | 'DOC_EXPIRY'
  | 'DOC_RENEWED'
  | 'DOC_UPLOADED'
  | 'DOC_DELETED'
  | 'SUPPLIER_CREATED'
  | 'SUPPLIER_UPDATED'
  | 'SUPPLIER_DELETED'
  | 'ROLE_CHANGED'
  | 'USER_STATUS_CHANGED';

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  supplierId: string;
  supplierName: string;
  type: AuditActionType;
  description: string;
  actor: string;
  actorRole?: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  previousStatus?: string;
  newStatus?: string;
  reason?: string;
  ipAddress?: string;
  clientTenant?: string;
}

export interface DashboardMetrics {
  totalSuppliers: number;
  approvedCount: number;
  underReviewCount: number;
  highRiskCount: number;
  expiredDocumentsCount: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  complianceSummary: {
    valid: number;
    expiringSoon: number;
    expired: number;
    totalDocs: number;
    complianceRate: number;
  };
  recentActivities: ActivityLogItem[];
}

/* ========================================================
   NEW ENHANCED TYPES (NOTIFICATIONS, USERS, ROLES, SEARCH)
   ======================================================== */

export type NotificationCategory = 'EXPIRY' | 'HIGH_RISK' | 'APPROVAL' | 'SYSTEM';

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
  targetUrl?: string;
  supplierId?: string;
  supplierName?: string;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'USER' | 'AUDITOR' | 'PROCUREMENT_MANAGER' | 'PROCUREMENT_USER';

export type UserStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'INACTIVE' | 'REJECTED';

export interface AppUser {
  id: string;
  username: string;
  name: string;
  email: string;
  employeeId?: string;
  role: UserRole;
  department: string;
  status: UserStatus;
  password?: string;
  lastLogin: string;
  avatarColor?: string;
  createdAt?: string;
  approvedBy?: string;
  approvalDate?: string;
  rejectionReason?: string;
}

export interface RolePermissionConfig {
  canApproveSupplier: boolean;
  canRejectSupplier: boolean;
  canBlockSupplier: boolean;
  canUnblockSupplier: boolean;
  canReassessRisk: boolean;
  canCreateSupplier: boolean;
  canEditSupplier: boolean;
  canDeleteSupplier: boolean;
  canManageDocuments: boolean;
  canAuditPerformance: boolean;
  canManageUsers: boolean;
  canExportReports: boolean;
}

export interface GlobalSearchResultItem {
  id: string;
  type: 'SUPPLIER' | 'DOCUMENT' | 'RISK' | 'AUDIT';
  title: string;
  subtitle: string;
  badge?: string;
  badgeType?: 'success' | 'warning' | 'error' | 'info';
  link: string;
}
