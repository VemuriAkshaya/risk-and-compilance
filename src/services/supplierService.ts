/**
 * SAP ABAP Cloud RAP (RESTful Application Programming Model) OData V4 Service Client
 * 
 * Target RAP Service Definition: Z_C_SUPPLIER_CDS_SRV / Service Binding: Z_C_SUPPLIER_O4
 * Root Entity: Z_C_SUPPLIER_TP
 * Compositions:
 *   - _ComplianceDocuments : Z_C_SUPPLIER_DOC_TP
 *   - _RiskAssessment     : Z_C_SUPPLIER_RISK_TP
 *   - _PerformanceScores  : Z_C_SUPPLIER_PERF_TP
 *   - _PurchaseOrders     : Z_C_SUPPLIER_PO_TP
 * 
 * In this mock implementation, all operations execute locally with full business rule enforcement
 * and persist into localStorage. When deploying with SAP BTP / ABAP Cloud, replace the localStorage
 * invocations with standard OData V4 fetch/axios calls to SAP Destination Service.
 */

import {
  Supplier,
  SupplierStatus,
  RiskLevel,
  ComplianceDocument,
  ActivityLogItem,
  DashboardMetrics,
} from '../types/supplier';
import {
  loadSuppliersFromStorage,
  saveSuppliersToStorage,
  loadActivitiesFromStorage,
  addActivityLog,
  resetAllStorageToDefaults,
  calculateRiskLevel,
  calculatePerformanceStatus,
} from './storageService';

export interface SupplierQueryParams {
  search?: string;
  status?: SupplierStatus | 'ALL';
  riskLevel?: RiskLevel | 'ALL';
  complianceStatus?: string | 'ALL';
  country?: string | 'ALL';
  sortBy?: 'id' | 'name' | 'riskScore' | 'overallPerformance' | 'annualSpend' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Simulated network latency for realistic enterprise async feel
const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

export const supplierService = {
  /**
   * OData V4: GET /Suppliers?$filter=...&$orderby=...&$skip=...&$top=...
   */
  async getSuppliers(params: SupplierQueryParams = {}): Promise<PaginatedResult<Supplier>> {
    await delay(120);
    const suppliers = loadSuppliersFromStorage();

    let filtered = [...suppliers];

    // Search query
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.taxId.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (params.status && params.status !== 'ALL') {
      filtered = filtered.filter((s) => s.supplierStatus === params.status);
    }

    // Risk level filter
    if (params.riskLevel && params.riskLevel !== 'ALL') {
      filtered = filtered.filter((s) => s.riskLevel === params.riskLevel);
    }

    // Compliance filter
    if (params.complianceStatus && params.complianceStatus !== 'ALL') {
      filtered = filtered.filter((s) => s.complianceStatus === params.complianceStatus);
    }

    // Country filter
    if (params.country && params.country !== 'ALL') {
      filtered = filtered.filter((s) => s.country === params.country);
    }

    // Sorting
    const sortBy = params.sortBy || 'name';
    const sortOrder = params.sortOrder || 'asc';
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'id') {
        comparison = a.id.localeCompare(b.id);
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'riskScore') {
        comparison = a.riskScore - b.riskScore;
      } else if (sortBy === 'overallPerformance') {
        comparison = (a.performance?.overallScore ?? 0) - (b.performance?.overallScore ?? 0);
      } else if (sortBy === 'annualSpend') {
        comparison = a.annualSpend - b.annualSpend;
      } else if (sortBy === 'updatedAt') {
        comparison = a.updatedAt.localeCompare(b.updatedAt);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    const total = filtered.length;
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  },

  /**
   * OData V4: GET /Suppliers('{id}')?$expand=_ComplianceDocuments,_RiskAssessment,_PerformanceScores
   */
  async getSupplierById(id: string): Promise<Supplier | null> {
    await delay(100);
    const suppliers = loadSuppliersFromStorage();
    const found = suppliers.find((s) => s.id.toUpperCase() === id.toUpperCase());
    return found ? { ...found } : null;
  },

  /**
   * OData V4 Action: /Suppliers('{id}')/com.sap.gateway.default.approve
   * 
   * Strict Business Rules:
   * 1. Supplier with expired compliance cannot be approved!
   * 2. HIGH risk supplier requires formal review flag.
   */
  async approveSupplier(
    id: string,
    options: { reviewNotes?: string; overrideHighRiskWarning?: boolean } = {}
  ): Promise<{ success: boolean; supplier: Supplier; message: string }> {
    await delay(150);
    const suppliers = loadSuppliersFromStorage();
    const index = suppliers.findIndex((s) => s.id.toUpperCase() === id.toUpperCase());

    if (index === -1) {
      throw new Error(`Supplier ${id} not found in SAP registry.`);
    }

    const supplier = suppliers[index];

    // BUSINESS RULE 1: Supplier with expired compliance cannot be approved.
    const hasExpiredDocs = supplier.documents.some((d) => d.status === 'EXPIRED');
    if (hasExpiredDocs || supplier.complianceStatus === 'NON_COMPLIANT') {
      throw new Error(
        `Business Rule Violation: Cannot approve supplier '${supplier.name}' (${supplier.id}). Active compliance documents are expired. Resolve all expired certificates before approval.`
      );
    }

    // BUSINESS RULE 2: HIGH risk supplier requires review.
    if (supplier.riskLevel === 'HIGH' && !options.overrideHighRiskWarning) {
      throw new Error(
        `Risk Governance Hold: Supplier has a HIGH Risk Score (${supplier.riskScore}/100). Executive Compliance Review authorization is required to approve this entity.`
      );
    }

    const updatedSupplier: Supplier = {
      ...supplier,
      supplierStatus: 'APPROVED',
      approvedBy: 'Elena Rostova (VP Compliance)',
      approvalDate: new Date().toISOString().slice(0, 10),
      blockReason: undefined,
      rejectionReason: undefined,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    suppliers[index] = updatedSupplier;
    saveSuppliersToStorage(suppliers);

    addActivityLog(
      supplier.id,
      supplier.name,
      'APPROVAL',
      `Supplier approved successfully. Risk Level: ${supplier.riskLevel} (${supplier.riskScore}). ${
        options.reviewNotes ? `Review note: ${options.reviewNotes}` : ''
      }`,
      'SUCCESS'
    );

    return {
      success: true,
      supplier: updatedSupplier,
      message: `Supplier ${supplier.id} (${supplier.name}) has been approved successfully.`,
    };
  },

  /**
   * OData V4 Action: /Suppliers('{id}')/com.sap.gateway.default.reject
   * 
   * Strict Business Rule:
   * Block/Reject requires confirmation and logged reason.
   */
  async rejectSupplier(id: string, reason: string): Promise<{ success: boolean; supplier: Supplier }> {
    await delay(150);
    if (!reason || !reason.trim()) {
      throw new Error('Rejection reason is mandatory under enterprise governance policy.');
    }

    const suppliers = loadSuppliersFromStorage();
    const index = suppliers.findIndex((s) => s.id.toUpperCase() === id.toUpperCase());

    if (index === -1) {
      throw new Error(`Supplier ${id} not found.`);
    }

    const supplier = suppliers[index];
    const updatedSupplier: Supplier = {
      ...supplier,
      supplierStatus: 'REJECTED',
      rejectionReason: reason.trim(),
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    suppliers[index] = updatedSupplier;
    saveSuppliersToStorage(suppliers);

    addActivityLog(
      supplier.id,
      supplier.name,
      'REJECTION',
      `Supplier application rejected. Justification: "${reason.trim()}"`,
      'ERROR'
    );

    return { success: true, supplier: updatedSupplier };
  },

  /**
   * OData V4 Action: /Suppliers('{id}')/com.sap.gateway.default.block
   * 
   * Strict Business Rule:
   * Block requires confirmation with justification.
   */
  async blockSupplier(id: string, reason: string): Promise<{ success: boolean; supplier: Supplier }> {
    await delay(150);
    if (!reason || !reason.trim()) {
      throw new Error('A valid block reason is mandatory for compliance tracking.');
    }

    const suppliers = loadSuppliersFromStorage();
    const index = suppliers.findIndex((s) => s.id.toUpperCase() === id.toUpperCase());

    if (index === -1) {
      throw new Error(`Supplier ${id} not found.`);
    }

    const supplier = suppliers[index];
    const updatedSupplier: Supplier = {
      ...supplier,
      supplierStatus: 'BLOCKED',
      blockReason: reason.trim(),
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    suppliers[index] = updatedSupplier;
    saveSuppliersToStorage(suppliers);

    addActivityLog(
      supplier.id,
      supplier.name,
      'BLOCK',
      `Supplier manually BLOCKED by Compliance Officer. Reason: "${reason.trim()}"`,
      'ERROR'
    );

    return { success: true, supplier: updatedSupplier };
  },

  /**
   * OData V4 Action: /Suppliers('{id}')/com.sap.gateway.default.unblock
   * 
   * Strict Business Rule:
   * Cannot unblock a supplier whose compliance is still expired!
   */
  async unblockSupplier(id: string): Promise<{ success: boolean; supplier: Supplier }> {
    await delay(150);
    const suppliers = loadSuppliersFromStorage();
    const index = suppliers.findIndex((s) => s.id.toUpperCase() === id.toUpperCase());

    if (index === -1) {
      throw new Error(`Supplier ${id} not found.`);
    }

    const supplier = suppliers[index];

    // Cannot unblock if documents are expired!
    const hasExpiredDocs = supplier.documents.some((d) => d.status === 'EXPIRED');
    if (hasExpiredDocs) {
      throw new Error(
        `Cannot unblock '${supplier.name}'. There are active expired compliance documents. Renew certificates first.`
      );
    }

    const updatedSupplier: Supplier = {
      ...supplier,
      supplierStatus: 'UNDER_REVIEW', // Needs reassessment/review
      blockReason: undefined,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    suppliers[index] = updatedSupplier;
    saveSuppliersToStorage(suppliers);

    addActivityLog(
      supplier.id,
      supplier.name,
      'UNBLOCK',
      'Supplier unblocked. Current status shifted to UNDER REVIEW.',
      'WARNING'
    );

    return { success: true, supplier: updatedSupplier };
  },

  /**
   * OData V4 Action: /Suppliers('{id}')/com.sap.gateway.default.reassessRisk
   * 
   * Recalculates risk score from dimensions (Financial, Operational, Geopolitical, ESG, Cyber)
   * Scores: 0-30 LOW, 31-60 MEDIUM, 61-100 HIGH
   */
  async reassessRisk(
    id: string,
    factors: {
      financialScore: number;
      operationalScore: number;
      geopoliticalScore: number;
      esgScore: number;
      cyberScore: number;
      notes?: string;
    }
  ): Promise<{ supplier: Supplier; newScore: number; newLevel: RiskLevel }> {
    await delay(180);
    const suppliers = loadSuppliersFromStorage();
    const index = suppliers.findIndex((s) => s.id.toUpperCase() === id.toUpperCase());

    if (index === -1) {
      throw new Error(`Supplier ${id} not found.`);
    }

    const supplier = suppliers[index];

    // Calculate weighted risk: Financial 25%, Operational 25%, Geopolitical 20%, ESG 15%, Cyber 15%
    const weightedScore = Math.round(
      factors.financialScore * 0.25 +
        factors.operationalScore * 0.25 +
        factors.geopoliticalScore * 0.2 +
        factors.esgScore * 0.15 +
        factors.cyberScore * 0.15
    );

    const clampedScore = Math.max(0, Math.min(100, weightedScore));
    const newLevel = calculateRiskLevel(clampedScore);

    const updatedSupplier: Supplier = {
      ...supplier,
      riskScore: clampedScore,
      riskLevel: newLevel,
      riskAssessment: {
        financialScore: factors.financialScore,
        operationalScore: factors.operationalScore,
        geopoliticalScore: factors.geopoliticalScore,
        esgScore: factors.esgScore,
        cyberScore: factors.cyberScore,
        overallScore: clampedScore,
        level: newLevel,
        lastAssessedDate: new Date().toISOString().slice(0, 10),
        assessedBy: 'Lead Compliance Officer (admin)',
        mitigationNotes: factors.notes || supplier.riskAssessment?.mitigationNotes,
      },
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    // If new risk level is HIGH and was previously approved, trigger under-review rule
    if (newLevel === 'HIGH' && updatedSupplier.supplierStatus === 'APPROVED') {
      updatedSupplier.supplierStatus = 'UNDER_REVIEW';
    }

    suppliers[index] = updatedSupplier;
    saveSuppliersToStorage(suppliers);

    addActivityLog(
      supplier.id,
      supplier.name,
      'RISK_REASSESSMENT',
      `Risk score recalculated: Previous was ${supplier.riskScore} (${supplier.riskLevel}) → New is ${clampedScore} (${newLevel}). ${
        newLevel === 'HIGH' ? 'Status shifted to UNDER REVIEW for governance.' : ''
      }`,
      newLevel === 'HIGH' ? 'WARNING' : 'INFO'
    );

    return {
      supplier: updatedSupplier,
      newScore: clampedScore,
      newLevel,
    };
  },

  /**
   * OData V4 Action: Renew compliance document
   * When renewed with valid date, checks if all supplier docs are valid.
   */
  async renewComplianceDocument(
    supplierId: string,
    documentId: string,
    data: { issueDate: string; expiryDate: string; documentNumber?: string; authority?: string; notes?: string }
  ): Promise<{ supplier: Supplier; document: ComplianceDocument }> {
    await delay(150);
    const suppliers = loadSuppliersFromStorage();
    const sIndex = suppliers.findIndex((s) => s.id.toUpperCase() === supplierId.toUpperCase());

    if (sIndex === -1) {
      throw new Error(`Supplier ${supplierId} not found.`);
    }

    const supplier = suppliers[sIndex];
    const docIndex = supplier.documents.findIndex((d) => d.id === documentId);

    if (docIndex === -1) {
      throw new Error(`Compliance document ${documentId} not found.`);
    }

    const today = new Date().toISOString().slice(0, 10);
    const expDate = data.expiryDate;
    
    // Evaluate document status based on expiry
    let status: ComplianceDocument['status'] = 'VALID';
    if (expDate < today) {
      status = 'EXPIRED';
    } else {
      const expTimestamp = new Date(expDate).getTime();
      const nowTimestamp = new Date(today).getTime();
      const daysDiff = (expTimestamp - nowTimestamp) / (1000 * 3600 * 24);
      if (daysDiff <= 45) {
        status = 'EXPIRING_SOON';
      }
    }

    const updatedDoc: ComplianceDocument = {
      ...supplier.documents[docIndex],
      issueDate: data.issueDate,
      expiryDate: data.expiryDate,
      status,
      documentNumber: data.documentNumber || supplier.documents[docIndex].documentNumber,
      verificationAuthority: data.authority || supplier.documents[docIndex].verificationAuthority,
      notes: data.notes || supplier.documents[docIndex].notes,
    };

    const newDocs = [...supplier.documents];
    newDocs[docIndex] = updatedDoc;

    let updatedSupplier: Supplier = {
      ...supplier,
      documents: newDocs,
      updatedAt: today,
    };

    // Check if supplier was BLOCKED because of expired docs, and now has no expired docs left!
    const stillHasExpired = newDocs.some((d) => d.status === 'EXPIRED');
    if (!stillHasExpired && updatedSupplier.supplierStatus === 'BLOCKED') {
      // Auto restore to UNDER_REVIEW so it can now be approved!
      updatedSupplier.supplierStatus = 'UNDER_REVIEW';
      updatedSupplier.blockReason = undefined;
    }

    suppliers[sIndex] = updatedSupplier;
    saveSuppliersToStorage(suppliers);

    addActivityLog(
      supplier.id,
      supplier.name,
      'DOC_RENEWED',
      `Document renewed: [${updatedDoc.documentType} #${updatedDoc.documentNumber}]. New Expiry: ${updatedDoc.expiryDate} (${updatedDoc.status}).`,
      'SUCCESS'
    );

    return {
      supplier: suppliers[sIndex],
      document: updatedDoc,
    };
  },

  /**
   * OData V4: POST /Suppliers('{id}')/_ComplianceDocuments
   */
  async addComplianceDocument(
    supplierId: string,
    docData: Omit<ComplianceDocument, 'id' | 'supplierId'>
  ): Promise<{ supplier: Supplier; document: ComplianceDocument }> {
    await delay(150);
    const suppliers = loadSuppliersFromStorage();
    const index = suppliers.findIndex((s) => s.id.toUpperCase() === supplierId.toUpperCase());

    if (index === -1) {
      throw new Error(`Supplier ${supplierId} not found.`);
    }

    const supplier = suppliers[index];
    const newDocId = `DOC-${Date.now().toString().slice(-4)}`;

    const newDoc: ComplianceDocument = {
      ...docData,
      id: newDocId,
      supplierId: supplier.id,
    };

    const updatedSupplier: Supplier = {
      ...supplier,
      documents: [newDoc, ...supplier.documents],
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    suppliers[index] = updatedSupplier;
    saveSuppliersToStorage(suppliers);

    addActivityLog(
      supplier.id,
      supplier.name,
      'DOC_RENEWED',
      `New compliance certificate added: [${newDoc.documentType}]. Expiry: ${newDoc.expiryDate}.`,
      'INFO'
    );

    return { supplier: suppliers[index], document: newDoc };
  },

  /**
   * OData V4 Action: Update performance score
   * Overall Score = (Quality + Delivery) / 2
   */
  async updatePerformance(
    supplierId: string,
    qualityScore: number,
    deliveryScore: number,
    notes?: string
  ): Promise<Supplier> {
    await delay(120);
    const suppliers = loadSuppliersFromStorage();
    const index = suppliers.findIndex((s) => s.id.toUpperCase() === supplierId.toUpperCase());

    if (index === -1) {
      throw new Error(`Supplier ${supplierId} not found.`);
    }

    const supplier = suppliers[index];
    const qClamped = Math.max(0, Math.min(100, Math.round(qualityScore)));
    const dClamped = Math.max(0, Math.min(100, Math.round(deliveryScore)));
    const overallScore = Math.round((qClamped + dClamped) / 2);
    const status = calculatePerformanceStatus(overallScore);

    const updatedSupplier: Supplier = {
      ...supplier,
      performance: {
        ...supplier.performance,
        qualityScore: qClamped,
        deliveryScore: dClamped,
        overallScore,
        status,
        lastEvaluatedDate: new Date().toISOString().slice(0, 10),
        notes: notes || supplier.performance?.notes,
      },
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    suppliers[index] = updatedSupplier;
    saveSuppliersToStorage(suppliers);

    return suppliers[index];
  },

  /**
   * OData V4: POST /Suppliers
   */
  async createSupplier(data: Partial<Supplier>): Promise<Supplier> {
    await delay(180);
    const suppliers = loadSuppliersFromStorage();

    // Generate next ID
    const maxNumeric = suppliers.reduce((max, s) => {
      const match = s.id.match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 0;
      return num > max ? num : max;
    }, 1000);

    const newId = `SUP-${maxNumeric + 1}`;
    const today = new Date().toISOString().slice(0, 10);

    const riskScore = data.riskScore ?? 35;
    const riskLevel = calculateRiskLevel(riskScore);
    const qualityScore = data.performance?.qualityScore ?? 85;
    const deliveryScore = data.performance?.deliveryScore ?? 85;
    const overallScore = Math.round((qualityScore + deliveryScore) / 2);

    const newSupplier: Supplier = {
      id: newId,
      name: data.name || 'Unnamed Supplier AG',
      taxId: data.taxId || 'TAX-UNSPECIFIED',
      category: data.category || 'General Supplies',
      country: data.country || 'Germany',
      countryCode: data.countryCode || 'DE',
      city: data.city || 'Frankfurt',
      address: data.address || 'Industrial Parkway 10',
      contactPerson: data.contactPerson || 'Compliance Representative',
      contactEmail: data.contactEmail || 'compliance@supplier.com',
      contactPhone: data.contactPhone || '+49 69 000 000',
      website: data.website || 'https://supplier.example.com',
      supplierStatus: data.supplierStatus || 'UNDER_REVIEW',
      complianceStatus: 'COMPLIANT',
      riskScore,
      riskLevel,
      riskAssessment: {
        financialScore: data.riskAssessment?.financialScore ?? riskScore,
        operationalScore: data.riskAssessment?.operationalScore ?? riskScore,
        geopoliticalScore: data.riskAssessment?.geopoliticalScore ?? riskScore,
        esgScore: data.riskAssessment?.esgScore ?? riskScore,
        cyberScore: data.riskAssessment?.cyberScore ?? riskScore,
        overallScore: riskScore,
        level: riskLevel,
        lastAssessedDate: today,
        assessedBy: 'Compliance Officer (admin)',
        mitigationNotes: data.riskAssessment?.mitigationNotes || 'Baseline onboarding risk assessment.',
      },
      performance: {
        qualityScore,
        deliveryScore,
        overallScore,
        status: calculatePerformanceStatus(overallScore),
        lastEvaluatedDate: today,
        evaluationCycle: 'Q3-2026',
        onTimeDeliveryRate: 90.0,
        defectRatePpm: 150,
        notes: data.performance?.notes || 'Initial assessment upon supplier creation.',
      },
      documents: data.documents || [
        {
          id: `DOC-${Date.now().toString().slice(-4)}`,
          supplierId: newId,
          documentType: 'ISO 9001 Quality Management',
          documentNumber: `QM-${Date.now().toString().slice(-6)}`,
          issueDate: today,
          expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
          status: 'VALID',
          verificationAuthority: 'Global Certification Body',
          documentName: 'ISO9001_Initial_Cert.pdf',
          fileSize: '1.8 MB',
        },
      ],
      purchaseOrders: [],
      annualSpend: data.annualSpend ?? 0,
      spendCurrency: data.spendCurrency || 'EUR',
      paymentTerms: data.paymentTerms || 'Net 30 Days',
      bankIban: data.bankIban || 'DE89000000000000000000',
      createdAt: today,
      updatedAt: today,
    };

    const updatedList = [newSupplier, ...suppliers];
    saveSuppliersToStorage(updatedList);

    addActivityLog(
      newSupplier.id,
      newSupplier.name,
      'SUPPLIER_CREATED',
      `New supplier onboarded: ${newSupplier.id} (${newSupplier.name}) registered in category "${newSupplier.category}".`,
      'INFO'
    );

    return updatedList[0];
  },

  /**
   * OData V4: PATCH /Suppliers('{id}')
   */
  async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier> {
    await delay(150);
    const suppliers = loadSuppliersFromStorage();
    const index = suppliers.findIndex((s) => s.id.toUpperCase() === id.toUpperCase());

    if (index === -1) {
      throw new Error(`Supplier ${id} not found.`);
    }

    const current = suppliers[index];
    const updated: Supplier = {
      ...current,
      ...data,
      id: current.id, // Cannot change primary key
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    suppliers[index] = updated;
    saveSuppliersToStorage(suppliers);

    addActivityLog(
      updated.id,
      updated.name,
      'SUPPLIER_UPDATED',
      `Supplier profile master data updated.`,
      'INFO'
    );

    return suppliers[index];
  },

  /**
   * OData V4: DELETE /Suppliers('{id}')
   */
  async deleteSupplier(id: string): Promise<{ success: boolean }> {
    await delay(150);
    const suppliers = loadSuppliersFromStorage();
    const target = suppliers.find((s) => s.id.toUpperCase() === id.toUpperCase());

    if (!target) {
      throw new Error(`Supplier ${id} not found.`);
    }

    const filtered = suppliers.filter((s) => s.id.toUpperCase() !== id.toUpperCase());
    saveSuppliersToStorage(filtered);

    addActivityLog(
      target.id,
      target.name,
      'BLOCK',
      `Supplier ${target.id} removed from active enterprise catalog.`,
      'WARNING'
    );

    return { success: true };
  },

  /**
   * Dashboard Analytics Endpoint
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    await delay(100);
    const suppliers = loadSuppliersFromStorage();
    const activities = loadActivitiesFromStorage();

    const totalSuppliers = suppliers.length;
    const approvedCount = suppliers.filter((s) => s.supplierStatus === 'APPROVED').length;
    const underReviewCount = suppliers.filter((s) => s.supplierStatus === 'UNDER_REVIEW').length;
    const highRiskCount = suppliers.filter((s) => s.riskLevel === 'HIGH').length;

    // Collect all documents
    const allDocs: ComplianceDocument[] = [];
    suppliers.forEach((s) => {
      if (s.documents) allDocs.push(...s.documents);
    });

    const expiredDocumentsCount = allDocs.filter((d) => d.status === 'EXPIRED').length;
    const expiringSoonCount = allDocs.filter((d) => d.status === 'EXPIRING_SOON').length;
    const validCount = allDocs.filter((d) => d.status === 'VALID').length;

    const lowRiskCount = suppliers.filter((s) => s.riskLevel === 'LOW').length;
    const mediumRiskCount = suppliers.filter((s) => s.riskLevel === 'MEDIUM').length;

    const totalDocs = allDocs.length;
    const complianceRate = totalDocs > 0 ? Math.round((validCount / totalDocs) * 100) : 100;

    return {
      totalSuppliers,
      approvedCount,
      underReviewCount,
      highRiskCount,
      expiredDocumentsCount,
      riskDistribution: {
        low: lowRiskCount,
        medium: mediumRiskCount,
        high: highRiskCount,
      },
      complianceSummary: {
        valid: validCount,
        expiringSoon: expiringSoonCount,
        expired: expiredDocumentsCount,
        totalDocs,
        complianceRate,
      },
      recentActivities: activities.slice(0, 8),
    };
  },

  /**
   * Fetch all documents across all suppliers for the Compliance Cockpit
   */
  async getAllComplianceDocuments(): Promise<Array<ComplianceDocument & { supplierName: string; supplierCountry: string }>> {
    await delay(100);
    const suppliers = loadSuppliersFromStorage();
    const result: Array<ComplianceDocument & { supplierName: string; supplierCountry: string }> = [];

    suppliers.forEach((s) => {
      if (s.documents) {
        s.documents.forEach((d) => {
          result.push({
            ...d,
            supplierName: s.name,
            supplierCountry: s.country,
          });
        });
      }
    });

    return result;
  },

  /**
   * Delete compliance document
   * Re-evaluates compliance status and unblocks if no other expired documents remain.
   */
  async deleteComplianceDocument(
    supplierId: string,
    documentId: string
  ): Promise<{ supplier: Supplier; success: boolean }> {
    await delay(120);
    const suppliers = loadSuppliersFromStorage();
    const sIndex = suppliers.findIndex((s) => s.id.toUpperCase() === supplierId.toUpperCase());

    if (sIndex === -1) {
      throw new Error(`Supplier ${supplierId} not found.`);
    }

    const supplier = suppliers[sIndex];
    const targetDoc = supplier.documents.find((d) => d.id === documentId);
    if (!targetDoc) {
      throw new Error(`Document ${documentId} not found.`);
    }

    const remainingDocs = supplier.documents.filter((d) => d.id !== documentId);
    let updatedSupplier: Supplier = {
      ...supplier,
      documents: remainingDocs,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    suppliers[sIndex] = updatedSupplier;
    saveSuppliersToStorage(suppliers);

    addActivityLog(
      supplier.id,
      supplier.name,
      'DOC_DELETED',
      `Compliance document removed: [${targetDoc.documentType} #${targetDoc.documentNumber}].`,
      'WARNING'
    );

    return { supplier: suppliers[sIndex], success: true };
  },

  /**
   * Client-side dossier generator and file download trigger
   */
  downloadDocumentDossier(doc: ComplianceDocument, supplierName: string): void {
    const fileContent = `================================================================================
SAP ARIBA RISK & PURCHASE COMPLIANCE CERTIFICATE DOSSIER
CONFIDENTIAL - VERIFIED ENTERPRISE COMPLIANCE RECORD
================================================================================

Supplier Name        : ${supplierName}
Supplier ID          : ${doc.supplierId}
Certificate Type     : ${doc.documentType}
Certificate Number   : ${doc.documentNumber}
Issuing Authority    : ${doc.verificationAuthority}
Issue Date           : ${doc.issueDate}
Expiration Date      : ${doc.expiryDate}
Current Status       : ${doc.status}
Digital Signature    : ${doc.digitalSignatureHash || 'SHA256-VERIFIED-SAP-ATTESTATION'}
Verification Node    : SAP S/4HANA Cloud (Client 100 • Production)
Audit Timestamp      : ${new Date().toISOString()}

Auditor Attestation:
This compliance record has been cryptographically validated against SAP Ariba
regulatory compliance master catalogs and corporate anti-bribery / ESG frameworks.
Any alteration invalidates this electronic certificate.
================================================================================
Generated automatically by SAP Enterprise Supplier Governance Gateway.
`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.supplierId}_${doc.documentType.replace(/[^a-zA-Z0-9]/g, '_')}_Certificate.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /* ========================================================
     1. NOTIFICATION CENTER
     ======================================================== */
  async getNotifications(): Promise<import('../types/supplier').NotificationItem[]> {
    await delay(60);
    return (await import('./storageService')).loadNotificationsFromStorage();
  },

  async markNotificationAsRead(id: string): Promise<void> {
    const { markNotificationAsRead } = await import('./storageService');
    markNotificationAsRead(id);
  },

  async markAllNotificationsAsRead(): Promise<void> {
    const { markAllNotificationsAsRead } = await import('./storageService');
    markAllNotificationsAsRead();
  },

  async dismissNotification(id: string): Promise<void> {
    const { dismissNotification } = await import('./storageService');
    dismissNotification(id);
  },

  /* ========================================================
     3. AUDIT HISTORY
     ======================================================== */
  async getActivityLogs(): Promise<ActivityLogItem[]> {
    await delay(80);
    return loadActivitiesFromStorage();
  },

  /* ========================================================
     4. USER & ROLE MANAGEMENT
     ======================================================== */
  async getUsers(): Promise<import('../types/supplier').AppUser[]> {
    await delay(60);
    const { loadUsersFromStorage } = await import('./storageService');
    return loadUsersFromStorage();
  },

  async updateUserRole(
    userId: string,
    newRole: import('../types/supplier').UserRole
  ): Promise<import('../types/supplier').AppUser | null> {
    await delay(100);
    const { updateUserRole } = await import('./storageService');
    return updateUserRole(userId, newRole);
  },

  async toggleUserStatus(userId: string): Promise<import('../types/supplier').AppUser | null> {
    await delay(100);
    const { toggleUserStatus } = await import('./storageService');
    return toggleUserStatus(userId);
  },

  async approveUser(userId: string, adminName?: string): Promise<import('../types/supplier').AppUser | null> {
    await delay(100);
    const { approveUserRegistration } = await import('./storageService');
    return approveUserRegistration(userId, adminName);
  },

  async rejectUser(userId: string, adminName?: string, reason?: string): Promise<import('../types/supplier').AppUser | null> {
    await delay(100);
    const { rejectUserRegistration } = await import('./storageService');
    return rejectUserRegistration(userId, adminName, reason);
  },

  /* ========================================================
     5. REPORTS & EXPORT
     ======================================================== */
  exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
    const csvContent = [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const val = cell !== undefined && cell !== null ? String(cell) : '';
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /* ========================================================
     6. GLOBAL SEARCH
     ======================================================== */
  async searchGlobal(query: string): Promise<import('../types/supplier').GlobalSearchResultItem[]> {
    if (!query || !query.trim()) return [];
    await delay(60);

    const q = query.trim().toLowerCase();
    const suppliers = loadSuppliersFromStorage();
    const activities = loadActivitiesFromStorage();
    const results: import('../types/supplier').GlobalSearchResultItem[] = [];

    // 1. Search Suppliers
    suppliers.forEach((s) => {
      if (
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.taxId.toLowerCase().includes(q)
      ) {
        results.push({
          id: `SUP-${s.id}`,
          type: 'SUPPLIER',
          title: `${s.name} (${s.id})`,
          subtitle: `${s.category} • ${s.country} • Status: ${s.supplierStatus}`,
          badge: `Risk: ${s.riskScore} (${s.riskLevel})`,
          badgeType: s.riskLevel === 'HIGH' ? 'error' : s.riskLevel === 'MEDIUM' ? 'warning' : 'success',
          link: `/suppliers/${s.id}`,
        });
      }

      // 2. Search Documents within suppliers
      (s.documents || []).forEach((d) => {
        if (
          d.documentType.toLowerCase().includes(q) ||
          d.documentNumber.toLowerCase().includes(q) ||
          d.verificationAuthority.toLowerCase().includes(q)
        ) {
          results.push({
            id: `DOC-${d.id}`,
            type: 'DOCUMENT',
            title: `${d.documentType} #${d.documentNumber}`,
            subtitle: `Supplier: ${s.name} (${s.id}) • Authority: ${d.verificationAuthority}`,
            badge: `${d.status} (Exp: ${d.expiryDate})`,
            badgeType: d.status === 'EXPIRED' ? 'error' : d.status === 'EXPIRING_SOON' ? 'warning' : 'success',
            link: `/suppliers/${s.id}`,
          });
        }
      });

      // 3. Search Risks
      if (
        s.riskLevel.toLowerCase().includes(q) ||
        (s.riskAssessment?.mitigationNotes && s.riskAssessment.mitigationNotes.toLowerCase().includes(q))
      ) {
        results.push({
          id: `RISK-${s.id}`,
          type: 'RISK',
          title: `Risk Assessment: ${s.name}`,
          subtitle: `Score: ${s.riskScore}/100 • ${s.riskAssessment?.mitigationNotes || 'Standard baseline review'}`,
          badge: `${s.riskLevel} RISK`,
          badgeType: s.riskLevel === 'HIGH' ? 'error' : s.riskLevel === 'MEDIUM' ? 'warning' : 'success',
          link: `/suppliers/${s.id}`,
        });
      }
    });

    // 4. Search Audit Records
    activities.forEach((act) => {
      if (
        act.description.toLowerCase().includes(q) ||
        act.type.toLowerCase().includes(q) ||
        act.actor.toLowerCase().includes(q) ||
        act.supplierName.toLowerCase().includes(q)
      ) {
        results.push({
          id: `ACT-${act.id}`,
          type: 'AUDIT',
          title: `Audit: ${act.type} • ${act.supplierName}`,
          subtitle: `${act.description} • Actor: ${act.actor} (${act.timestamp})`,
          badge: act.severity,
          badgeType: act.severity === 'ERROR' ? 'error' : act.severity === 'WARNING' ? 'warning' : 'info',
          link: `/audit`,
        });
      }
    });

    return results.slice(0, 20); // Top 20 results
  },

  /**
   * Reset all data back to factory mock data
   */
  async resetDemoData(): Promise<void> {
    await delay(150);
    resetAllStorageToDefaults();
  },
};

