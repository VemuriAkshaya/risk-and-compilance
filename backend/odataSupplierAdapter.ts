/**
 * React Frontend -> SAP ABAP Cloud RAP OData V4 Integration Adapter
 * 
 * Drop this file into `frontend/src/services/odataSupplierAdapter.ts` or import it
 * to connect your React frontend directly to the SAP ABAP Cloud RAP backend!
 * 
 * Supports both:
 * 1. Local RAP Simulation Server (http://localhost:4004)
 * 2. SAP BTP ABAP Environment / S/4HANA Cloud Destination (/sap/opu/odata4/...)
 */

import {
  Supplier,
  SupplierStatus,
  RiskLevel,
  ComplianceDocument,
  ActivityLogItem,
  PaginatedResult,
  SupplierQueryParams
} from '../types/supplier';

const ODATA_BASE_URL =
  import.meta.env.VITE_ODATA_BASE_URL ||
  'http://localhost:4004/sap/opu/odata4/sap/zsb_supplier_manage_v4/srvd/sap/zui_supplier_manage_o4/0001';

/**
 * Maps SAP ABAP Cloud RAP OData V4 entity structure to React Frontend Supplier model
 */
function mapODataToSupplier(rap: any): Supplier {
  const docs: ComplianceDocument[] = (rap._ComplianceDocuments || []).map((d: any) => ({
    id: d.DocumentID,
    supplierId: d.SupplierID,
    documentType: d.DocumentType,
    documentNumber: d.DocumentNumber,
    issueDate: d.IssueDate,
    expiryDate: d.ExpiryDate,
    status: d.Status,
    verificationAuthority: d.DocumentNumber?.includes('ISO') ? 'TÜV Rheinland' : 'Global Compliance Registrar'
  }));

  const latestRisk = (rap._RiskAssessments || [])[0] || {};
  const latestPerf = (rap._Performance || [])[0] || {};

  // Check compliance status
  const hasExpired = docs.some((d) => d.status === 'EXPIRED');
  const complianceStatus = hasExpired ? 'NON_COMPLIANT' : 'COMPLIANT';

  return {
    id: rap.SupplierID,
    name: rap.SupplierName,
    taxId: rap.TaxNumber,
    category: rap.Category,
    country: rap.Country,
    countryCode: rap.Country?.slice(0, 2) || 'DE',
    city: rap.City || '',
    address: rap.Address || '',
    contactPerson: rap.ContactPerson || '',
    contactEmail: rap.Email || '',
    contactPhone: rap.Phone || '',
    website: `https://www.${rap.SupplierID.toLowerCase()}.com`,
    supplierStatus: (rap.Status?.replace(' ', '_') as SupplierStatus) || 'UNDER_REVIEW',
    complianceStatus,
    riskScore: latestRisk.RiskScore ? Number(latestRisk.RiskScore) : 25,
    riskLevel: (latestRisk.RiskLevel as RiskLevel) || 'LOW',
    riskAssessment: {
      financialScore: latestRisk.RiskScore || 20,
      operationalScore: latestRisk.RiskScore || 25,
      geopoliticalScore: 20,
      esgScore: 15,
      cyberScore: 15,
      overallScore: latestRisk.RiskScore || 25,
      level: (latestRisk.RiskLevel as RiskLevel) || 'LOW',
      lastAssessedDate: latestRisk.AssessmentDate || new Date().toISOString().slice(0, 10),
      assessedBy: latestRisk.CreatedBy || 'SAP System',
      mitigationNotes: latestRisk.Comments
    },
    performance: {
      qualityScore: latestPerf.QualityScore ? Number(latestPerf.QualityScore) : 85,
      deliveryScore: latestPerf.DeliveryScore ? Number(latestPerf.DeliveryScore) : 85,
      overallScore: latestPerf.OverallScore ? Number(latestPerf.OverallScore) : 85,
      status: latestPerf.PerformanceStatus || 'SATISFACTORY',
      lastEvaluatedDate: latestPerf.ReviewDate || new Date().toISOString().slice(0, 10),
      evaluationCycle: 'Q1 2026',
      onTimeDeliveryRate: 98.2,
      defectRatePpm: 140
    },
    documents: docs,
    purchaseOrders: [],
    annualSpend: 450000,
    spendCurrency: 'EUR',
    paymentTerms: 'Net 30 Days',
    bankIban: 'DE89370400440532013000',
    createdAt: rap.CreatedAt ? rap.CreatedAt.slice(0, 10) : '',
    updatedAt: rap.LastChangedAt ? rap.LastChangedAt.slice(0, 10) : ''
  };
}

export const odataSupplierService = {
  /**
   * GET /Supplier with OData V4 query options
   */
  async getSuppliers(params: SupplierQueryParams = {}): Promise<PaginatedResult<Supplier>> {
    const queryParts = [
      '$expand=_ComplianceDocuments,_RiskAssessments,_Performance,_AuditHistory',
      '$count=true'
    ];

    if (params.pageSize) {
      queryParts.push(`$top=${params.pageSize}`);
      if (params.page && params.page > 1) {
        queryParts.push(`$skip=${(params.page - 1) * params.pageSize}`);
      }
    }

    if (params.status && params.status !== 'ALL') {
      const odataStatus = params.status.replace('_', ' ');
      queryParts.push(`$filter=Status eq '${odataStatus}'`);
    }

    const url = `${ODATA_BASE_URL}/Supplier?${queryParts.join('&')}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OData request failed: ${res.statusText}`);

    const data = await res.json();
    const items = (data.value || []).map(mapODataToSupplier);
    const total = data['@odata.count'] || items.length;
    const pageSize = params.pageSize || 10;
    const page = params.page || 1;

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1
    };
  },

  /**
   * GET /Supplier('{id}')
   */
  async getSupplierById(id: string): Promise<Supplier | null> {
    const url = `${ODATA_BASE_URL}/Supplier('${id}')?$expand=_ComplianceDocuments,_RiskAssessments,_Performance,_AuditHistory`;
    const res = await fetch(url);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to load supplier: ${res.statusText}`);

    const data = await res.json();
    return mapODataToSupplier(data);
  },

  /**
   * POST /Supplier('{id}')/approveSupplier
   */
  async approveSupplier(id: string, options: { reviewNotes?: string } = {}) {
    const url = `${ODATA_BASE_URL}/Supplier('${id}')/approveSupplier`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Comments: options.reviewNotes || 'Approved via React Governance Portal' })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Approval failed (${res.status})`);
    }

    const updated = await res.json();
    return {
      success: true,
      supplier: mapODataToSupplier(updated),
      message: `Supplier ${id} has been approved.`
    };
  },

  /**
   * POST /Supplier('{id}')/rejectSupplier
   */
  async rejectSupplier(id: string, reason: string) {
    const url = `${ODATA_BASE_URL}/Supplier('${id}')/rejectSupplier`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Comments: reason })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Rejection failed (${res.status})`);
    }

    const updated = await res.json();
    return { success: true, supplier: mapODataToSupplier(updated) };
  },

  /**
   * POST /Supplier('{id}')/blockSupplier
   */
  async blockSupplier(id: string, reason: string) {
    const url = `${ODATA_BASE_URL}/Supplier('${id}')/blockSupplier`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Comments: reason })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Block failed (${res.status})`);
    }

    const updated = await res.json();
    return { success: true, supplier: mapODataToSupplier(updated) };
  },

  /**
   * POST /Supplier('{id}')/unblockSupplier
   */
  async unblockSupplier(id: string) {
    const url = `${ODATA_BASE_URL}/Supplier('${id}')/unblockSupplier`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Unblock failed (${res.status})`);
    }

    const updated = await res.json();
    return { success: true, supplier: mapODataToSupplier(updated) };
  },

  /**
   * POST /Supplier('{id}')/reassessRisk
   */
  async reassessRisk(id: string, factors: { financialScore: number; operationalScore: number; geopoliticalScore: number; esgScore: number; cyberScore: number; notes?: string }) {
    const weightedScore = Math.round(
      factors.financialScore * 0.25 +
      factors.operationalScore * 0.25 +
      factors.geopoliticalScore * 0.2 +
      factors.esgScore * 0.15 +
      factors.cyberScore * 0.15
    );

    const url = `${ODATA_BASE_URL}/Supplier('${id}')/reassessRisk`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        RiskScore: weightedScore,
        RiskFactors: 'Multi-dimensional Risk Evaluation',
        Comments: factors.notes || 'Reassessed by Procurement Officer'
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Risk reassessment failed (${res.status})`);
    }

    const updated = await res.json();
    const mapped = mapODataToSupplier(updated);

    return {
      supplier: mapped,
      newScore: mapped.riskScore,
      newLevel: mapped.riskLevel
    };
  },

  /**
   * GET /AuditHistory
   */
  async getActivityLogs(): Promise<ActivityLogItem[]> {
    const url = `${ODATA_BASE_URL}/AuditHistory`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    return (data.value || []).map((a: any) => ({
      id: a.AuditID,
      timestamp: a.ChangedAt || new Date().toISOString(),
      supplierId: a.SupplierID,
      supplierName: `Supplier (${a.SupplierID})`,
      type: a.Action,
      description: a.Comments || `Action ${a.Action} executed`,
      actor: a.UserID || 'SAP Officer',
      severity: a.Action === 'BLOCKED' || a.Action === 'REJECTED' ? 'ERROR' : a.Action === 'APPROVED' ? 'SUCCESS' : 'INFO',
      previousStatus: a.OldStatus,
      newStatus: a.NewStatus
    }));
  }
};
