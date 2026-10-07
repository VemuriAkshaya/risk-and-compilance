/**
 * SAP ABAP Cloud RAP OData V4 Service Engine
 * 
 * Simulates the published SAP BTP / S/4HANA Cloud RAP Service:
 * Service Binding: ZSB_SUPPLIER_MANAGE_V4 (ODATA_V4_UI)
 * Service Definition: ZUI_SUPPLIER_MANAGE_O4
 * 
 * URL Path: /sap/opu/odata4/sap/zsb_supplier_manage_v4/srvd/sap/zui_supplier_manage_o4/0001/
 * Alias:    /odata/v4/
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load initial data
const initialDataPath = path.join(__dirname, 'initialData.json');
const metadataPath = path.join(__dirname, 'metadata.xml');

let db = JSON.parse(fs.readFileSync(initialDataPath, 'utf8'));
const metadataXml = fs.readFileSync(metadataPath, 'utf8');

const PORT = process.env.PORT || 4004;

function resetDatabase() {
  db = JSON.parse(fs.readFileSync(initialDataPath, 'utf8'));
}

// Helper: Record Audit History
function recordAudit(supplierId, action, oldStatus, newStatus, comments, userId = 'CB9980000001') {
  const auditId = `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
  const entry = {
    AuditID: auditId,
    SupplierID: supplierId,
    UserID: userId,
    Action: action,
    OldStatus: oldStatus || '',
    NewStatus: newStatus || '',
    ChangedAt: new Date().toISOString(),
    Comments: comments || '',
    CreatedBy: userId,
    CreatedAt: new Date().toISOString(),
    LastChangedAt: new Date().toISOString(),
    LocalLastChangedAt: new Date().toISOString()
  };
  db.auditHistories.unshift(entry);
  return entry;
}

// Helper: Check Expired Documents
function hasExpiredCompliance(supplierId) {
  const today = new Date().toISOString().slice(0, 10);
  const docs = db.complianceDocuments.filter(d => d.SupplierID === supplierId);
  return docs.some(d => d.Status === 'EXPIRED' || d.ExpiryDate < today);
}

// Helper: Calculate Risk Level (Rule: 0-30 LOW, 31-60 MEDIUM, 61-100 HIGH)
function calculateRiskLevel(score) {
  if (score <= 30) return 'LOW';
  if (score <= 60) return 'MEDIUM';
  return 'HIGH';
}

// Helper: Calculate Performance Status & Overall (Rule: Overall = (Quality + Delivery) / 2)
function calculatePerformance(qualityScore, deliveryScore) {
  const overall = Math.round(((qualityScore + deliveryScore) / 2) * 100) / 100;
  let status = 'CRITICAL';
  if (overall >= 85) status = 'EXEMPLARY';
  else if (overall >= 70) status = 'SATISFACTORY';
  else if (overall >= 50) status = 'NEEDS_IMPROVEMENT';
  return { overall, status };
}

// Helper: Expand Supplier Compositions
function expandSupplier(supplier) {
  return {
    ...supplier,
    _ComplianceDocuments: db.complianceDocuments.filter(d => d.SupplierID === supplier.SupplierID),
    _RiskAssessments: db.riskAssessments.filter(r => r.SupplierID === supplier.SupplierID),
    _Performance: db.supplierPerformances.filter(p => p.SupplierID === supplier.SupplierID),
    _AuditHistory: db.auditHistories.filter(a => a.SupplierID === supplier.SupplierID)
  };
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json;odata.metadata=minimal;charset=utf-8',
    'OData-Version': '4.0',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, If-Match, Accept, OData-Version'
  });
  res.end(JSON.stringify(data, null, 2));
}

function sendError(res, statusCode, code, message) {
  sendJson(res, statusCode, {
    error: {
      code,
      message,
      target: '',
      details: []
    }
  });
}

// Request Dispatcher
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, If-Match, Accept, OData-Version'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = parsedUrl.pathname;

  // Normalize ABAP RAP standard OData V4 prefix to simplified path
  const rapPrefix = '/sap/opu/odata4/sap/zsb_supplier_manage_v4/srvd/sap/zui_supplier_manage_o4/0001';
  if (pathname.startsWith(rapPrefix)) {
    pathname = pathname.slice(rapPrefix.length);
  } else if (pathname.startsWith('/odata/v4')) {
    pathname = pathname.slice('/odata/v4'.length);
  }

  if (pathname === '' || pathname === '/') {
    // Service Document
    return sendJson(res, 200, {
      '@odata.context': '$metadata',
      value: [
        { name: 'Supplier', url: 'Supplier' },
        { name: 'ComplianceDocument', url: 'ComplianceDocument' },
        { name: 'RiskAssessment', url: 'RiskAssessment' },
        { name: 'SupplierPerformance', url: 'SupplierPerformance' },
        { name: 'AuditHistory', url: 'AuditHistory' }
      ]
    });
  }

  // Metadata request
  if (pathname === '/$metadata') {
    res.writeHead(200, {
      'Content-Type': 'application/xml;charset=utf-8',
      'OData-Version': '4.0',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(metadataXml);
  }

  // Reset database endpoint
  if (pathname === '/api/reset' && req.method === 'POST') {
    resetDatabase();
    return sendJson(res, 200, { message: 'Database reset to initial SAP ABAP Cloud seed state' });
  }

  // ----------------------------------------------------
  // ENTITY: Supplier
  // Handles: /Supplier('SUP-1001'), /Supplier(SupplierID='SUP-1001'), /Suppliers('SUP-1001'), /Supplier('SUP-1001')/approveSupplier, etc.
  // ----------------------------------------------------
  const supplierIdMatch = pathname.match(/^\/(?:Supplier|Suppliers)(?:\((?:SupplierID=)?['"]?([^'")]+)['"]?\))(?:\/(.*))?$/i);
  
  if (supplierIdMatch) {
    const supplierId = supplierIdMatch[1];
    const subActionOrPath = supplierIdMatch[2];

    const supplierIndex = db.suppliers.findIndex(s => s.SupplierID.toUpperCase() === supplierId.toUpperCase());

    if (supplierIndex === -1) {
      return sendError(res, 404, 'NOT_FOUND', `Supplier '${supplierId}' not found.`);
    }

    const supplier = db.suppliers[supplierIndex];

    // RAP ACTIONS on Supplier
    if (req.method === 'POST') {
      const payload = await parseJsonBody(req).catch(() => ({}));

      // Action: approveSupplier
      if (subActionOrPath === 'approveSupplier' || subActionOrPath === 'com.sap.gateway.default.approve') {
        // Business Rule 1: Expired compliance -> supplier cannot be approved
        if (hasExpiredCompliance(supplier.SupplierID)) {
          return sendError(
            res,
            400,
            'ZSUP_MSG/001',
            `Cannot approve supplier '${supplier.SupplierName}' (${supplier.SupplierID}). Active compliance documents are expired. Expired compliance documents must be renewed first.`
          );
        }

        const oldStatus = supplier.Status;
        supplier.Status = 'APPROVED';
        supplier.LastChangedAt = new Date().toISOString();
        supplier.LocalLastChangedAt = supplier.LastChangedAt;

        recordAudit(
          supplier.SupplierID,
          'APPROVED',
          oldStatus,
          'APPROVED',
          payload.Comments || 'Supplier approved via RAP approveSupplier action.'
        );

        return sendJson(res, 200, expandSupplier(supplier));
      }

      // Action: rejectSupplier
      if (subActionOrPath === 'rejectSupplier' || subActionOrPath === 'com.sap.gateway.default.reject') {
        const oldStatus = supplier.Status;
        supplier.Status = 'REJECTED';
        supplier.LastChangedAt = new Date().toISOString();
        supplier.LocalLastChangedAt = supplier.LastChangedAt;

        recordAudit(
          supplier.SupplierID,
          'REJECTED',
          oldStatus,
          'REJECTED',
          payload.Comments || 'Supplier rejected by governance committee.'
        );

        return sendJson(res, 200, expandSupplier(supplier));
      }

      // Action: blockSupplier
      if (subActionOrPath === 'blockSupplier' || subActionOrPath === 'com.sap.gateway.default.block') {
        const oldStatus = supplier.Status;
        supplier.Status = 'BLOCKED';
        supplier.LastChangedAt = new Date().toISOString();
        supplier.LocalLastChangedAt = supplier.LastChangedAt;

        recordAudit(
          supplier.SupplierID,
          'BLOCKED',
          oldStatus,
          'BLOCKED',
          payload.Comments || 'Supplier blocked via RAP blockSupplier action.'
        );

        return sendJson(res, 200, expandSupplier(supplier));
      }

      // Action: unblockSupplier
      if (subActionOrPath === 'unblockSupplier' || subActionOrPath === 'com.sap.gateway.default.unblock') {
        // Business Rule: Cannot unblock if still expired!
        if (hasExpiredCompliance(supplier.SupplierID)) {
          return sendError(
            res,
            400,
            'ZSUP_MSG/001',
            `Cannot unblock '${supplier.SupplierName}'. Active compliance documents remain expired. Renew compliance first.`
          );
        }

        const oldStatus = supplier.Status;
        supplier.Status = 'UNDER REVIEW';
        supplier.LastChangedAt = new Date().toISOString();
        supplier.LocalLastChangedAt = supplier.LastChangedAt;

        recordAudit(
          supplier.SupplierID,
          'UNBLOCKED',
          oldStatus,
          'UNDER REVIEW',
          'Supplier unblocked. Shifted to UNDER REVIEW for verification.'
        );

        return sendJson(res, 200, expandSupplier(supplier));
      }

      // Action: reassessRisk
      if (subActionOrPath === 'reassessRisk' || subActionOrPath === 'com.sap.gateway.default.reassessRisk') {
        const score = typeof payload.RiskScore === 'number' ? payload.RiskScore : 50;
        const level = calculateRiskLevel(score);

        const newRiskId = `RSK-${Date.now().toString().slice(-4)}`;
        const riskEntry = {
          RiskID: newRiskId,
          SupplierID: supplier.SupplierID,
          RiskScore: score,
          RiskLevel: level,
          RiskFactors: payload.RiskFactors || 'Standard reassessment review',
          Comments: payload.Comments || 'Risk re-evaluated by compliance team',
          AssessmentDate: new Date().toISOString().slice(0, 10),
          CreatedBy: 'CB9980000001',
          CreatedAt: new Date().toISOString(),
          LastChangedAt: new Date().toISOString(),
          LocalLastChangedAt: new Date().toISOString()
        };
        db.riskAssessments.unshift(riskEntry);

        // Business Rule: HIGH risk supplier -> UNDER REVIEW
        const oldStatus = supplier.Status;
        if (level === 'HIGH' && supplier.Status !== 'BLOCKED') {
          supplier.Status = 'UNDER REVIEW';
          recordAudit(
            supplier.SupplierID,
            'RISK_REASSESSED',
            oldStatus,
            'UNDER REVIEW',
            `Reassessed Risk Score: ${score}/100 (${level}). High risk triggered UNDER REVIEW status.`
          );
        } else {
          recordAudit(
            supplier.SupplierID,
            'RISK_REASSESSED',
            oldStatus,
            oldStatus,
            `Reassessed Risk Score: ${score}/100 (${level}).`
          );
        }

        supplier.LastChangedAt = new Date().toISOString();
        supplier.LocalLastChangedAt = supplier.LastChangedAt;

        return sendJson(res, 200, expandSupplier(supplier));
      }
    }

    // GET single Supplier
    if (req.method === 'GET' && !subActionOrPath) {
      const expand = parsedUrl.searchParams.get('$expand');
      if (expand) {
        return sendJson(res, 200, expandSupplier(supplier));
      }
      return sendJson(res, 200, supplier);
    }

    // PATCH / UPDATE Supplier
    if (req.method === 'PATCH' || req.method === 'PUT') {
      const payload = await parseJsonBody(req).catch(() => ({}));
      Object.assign(supplier, payload);
      supplier.LastChangedAt = new Date().toISOString();
      supplier.LocalLastChangedAt = supplier.LastChangedAt;

      // Determination check: If expired compliance -> supplier becomes BLOCKED
      if (hasExpiredCompliance(supplier.SupplierID) && supplier.Status !== 'BLOCKED') {
        const oldStatus = supplier.Status;
        supplier.Status = 'BLOCKED';
        recordAudit(
          supplier.SupplierID,
          'BLOCKED',
          oldStatus,
          'BLOCKED',
          'Automated rule: Expired compliance document caused supplier to be BLOCKED.'
        );
      }

      return sendJson(res, 200, expandSupplier(supplier));
    }

    // DELETE Supplier
    if (req.method === 'DELETE') {
      db.suppliers.splice(supplierIndex, 1);
      db.complianceDocuments = db.complianceDocuments.filter(d => d.SupplierID !== supplier.SupplierID);
      db.riskAssessments = db.riskAssessments.filter(r => r.SupplierID !== supplier.SupplierID);
      db.supplierPerformances = db.supplierPerformances.filter(p => p.SupplierID !== supplier.SupplierID);
      db.auditHistories = db.auditHistories.filter(a => a.SupplierID !== supplier.SupplierID);
      res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
      return res.end();
    }
  }

  // ----------------------------------------------------
  // COLLECTION: /Supplier or /Suppliers
  // ----------------------------------------------------
  if (pathname === '/Supplier' || pathname === '/Suppliers') {
    if (req.method === 'GET') {
      let list = [...db.suppliers];

      // $filter basic evaluation
      const filter = parsedUrl.searchParams.get('$filter');
      if (filter) {
        if (filter.includes("Status eq 'APPROVED'")) list = list.filter(s => s.Status === 'APPROVED');
        if (filter.includes("Status eq 'UNDER REVIEW'")) list = list.filter(s => s.Status === 'UNDER REVIEW');
        if (filter.includes("Status eq 'BLOCKED'")) list = list.filter(s => s.Status === 'BLOCKED');
        if (filter.includes("Status eq 'REJECTED'")) list = list.filter(s => s.Status === 'REJECTED');
      }

      // $expand
      const expand = parsedUrl.searchParams.get('$expand');
      if (expand) {
        list = list.map(s => expandSupplier(s));
      }

      // Paging: $top, $skip
      const top = parseInt(parsedUrl.searchParams.get('$top') || '100', 10);
      const skip = parseInt(parsedUrl.searchParams.get('$skip') || '0', 10);
      const paged = list.slice(skip, skip + top);

      return sendJson(res, 200, {
        '@odata.context': '$metadata#Supplier',
        '@odata.count': list.length,
        value: paged
      });
    }

    if (req.method === 'POST') {
      const payload = await parseJsonBody(req).catch(() => ({}));
      const newId = payload.SupplierID || `SUP-${Date.now().toString().slice(-4)}`;
      const now = new Date().toISOString();

      const newSupplier = {
        SupplierID: newId,
        SupplierName: payload.SupplierName || 'New Supplier Entity',
        Country: payload.Country || 'USA',
        Address: payload.Address || '',
        City: payload.City || '',
        State: payload.State || '',
        PostalCode: payload.PostalCode || '',
        ContactPerson: payload.ContactPerson || '',
        Email: payload.Email || '',
        Phone: payload.Phone || '',
        Category: payload.Category || 'Raw Materials',
        TaxNumber: payload.TaxNumber || 'TAX-NEW-001',
        Status: payload.Status || 'NEW', // Initial Status determination
        CreatedBy: 'CB9980000001',
        CreatedAt: now,
        LastChangedBy: 'CB9980000001',
        LastChangedAt: now,
        LocalLastChangedAt: now
      };

      db.suppliers.push(newSupplier);

      recordAudit(newSupplier.SupplierID, 'CREATED', '', newSupplier.Status, 'Initial supplier onboarding creation via RAP.');

      return sendJson(res, 201, expandSupplier(newSupplier));
    }
  }

  // ----------------------------------------------------
  // COLLECTION: /ComplianceDocument
  // ----------------------------------------------------
  if (pathname === '/ComplianceDocument' || pathname === '/ComplianceDocuments') {
    if (req.method === 'GET') {
      return sendJson(res, 200, {
        '@odata.context': '$metadata#ComplianceDocument',
        '@odata.count': db.complianceDocuments.length,
        value: db.complianceDocuments
      });
    }

    if (req.method === 'POST') {
      const payload = await parseJsonBody(req).catch(() => ({}));
      const newDocId = payload.DocumentID || `DOC-${Date.now().toString().slice(-4)}`;
      const today = new Date().toISOString().slice(0, 10);

      // Determination: determineDocStatus
      let status = 'VALID';
      if (payload.ExpiryDate && payload.ExpiryDate < today) {
        status = 'EXPIRED';
      }

      const newDoc = {
        DocumentID: newDocId,
        SupplierID: payload.SupplierID,
        DocumentType: payload.DocumentType || 'Compliance Attestation',
        DocumentNumber: payload.DocumentNumber || `CERT-${Date.now()}`,
        IssueDate: payload.IssueDate || today,
        ExpiryDate: payload.ExpiryDate || '2028-12-31',
        Status: status,
        CreatedBy: 'CB9980000001',
        CreatedAt: new Date().toISOString(),
        LastChangedAt: new Date().toISOString(),
        LocalLastChangedAt: new Date().toISOString()
      };

      db.complianceDocuments.push(newDoc);

      // Business Rule: Expired compliance -> supplier becomes BLOCKED
      if (status === 'EXPIRED') {
        const supp = db.suppliers.find(s => s.SupplierID === newDoc.SupplierID);
        if (supp && supp.Status !== 'BLOCKED') {
          const old = supp.Status;
          supp.Status = 'BLOCKED';
          recordAudit(supp.SupplierID, 'BLOCKED', old, 'BLOCKED', `Document ${newDoc.DocumentType} expired. Supplier auto-blocked.`);
        }
      }

      return sendJson(res, 201, newDoc);
    }
  }

  // ----------------------------------------------------
  // COLLECTION: /RiskAssessment
  // ----------------------------------------------------
  if (pathname === '/RiskAssessment' || pathname === '/RiskAssessments') {
    if (req.method === 'GET') {
      return sendJson(res, 200, {
        '@odata.context': '$metadata#RiskAssessment',
        '@odata.count': db.riskAssessments.length,
        value: db.riskAssessments
      });
    }

    if (req.method === 'POST') {
      const payload = await parseJsonBody(req).catch(() => ({}));
      const score = typeof payload.RiskScore === 'number' ? payload.RiskScore : 25;
      const level = calculateRiskLevel(score);

      const newRisk = {
        RiskID: payload.RiskID || `RSK-${Date.now().toString().slice(-4)}`,
        SupplierID: payload.SupplierID,
        RiskScore: score,
        RiskLevel: level,
        RiskFactors: payload.RiskFactors || 'General Risk Assessment',
        Comments: payload.Comments || '',
        AssessmentDate: payload.AssessmentDate || new Date().toISOString().slice(0, 10),
        CreatedBy: 'CB9980000001',
        CreatedAt: new Date().toISOString(),
        LastChangedAt: new Date().toISOString(),
        LocalLastChangedAt: new Date().toISOString()
      };

      db.riskAssessments.push(newRisk);

      // Determination: determineRiskImpact (HIGH risk -> UNDER REVIEW)
      if (level === 'HIGH') {
        const supp = db.suppliers.find(s => s.SupplierID === newRisk.SupplierID);
        if (supp && supp.Status !== 'BLOCKED' && supp.Status !== 'UNDER REVIEW') {
          const old = supp.Status;
          supp.Status = 'UNDER REVIEW';
          recordAudit(supp.SupplierID, 'RISK_REASSESSED', old, 'UNDER REVIEW', `High risk score (${score}/100) triggered status change to UNDER REVIEW.`);
        }
      }

      return sendJson(res, 201, newRisk);
    }
  }

  // ----------------------------------------------------
  // COLLECTION: /SupplierPerformance
  // ----------------------------------------------------
  if (pathname === '/SupplierPerformance' || pathname === '/SupplierPerformances') {
    if (req.method === 'GET') {
      return sendJson(res, 200, {
        '@odata.context': '$metadata#SupplierPerformance',
        '@odata.count': db.supplierPerformances.length,
        value: db.supplierPerformances
      });
    }

    if (req.method === 'POST') {
      const payload = await parseJsonBody(req).catch(() => ({}));
      const quality = typeof payload.QualityScore === 'number' ? payload.QualityScore : 85;
      const delivery = typeof payload.DeliveryScore === 'number' ? payload.DeliveryScore : 85;
      const { overall, status } = calculatePerformance(quality, delivery);

      const newPerf = {
        PerformanceID: payload.PerformanceID || `PRF-${Date.now().toString().slice(-4)}`,
        SupplierID: payload.SupplierID,
        QualityScore: quality,
        DeliveryScore: delivery,
        OverallScore: overall,
        PerformanceStatus: status,
        ReviewDate: payload.ReviewDate || new Date().toISOString().slice(0, 10),
        CreatedBy: 'CB9980000001',
        CreatedAt: new Date().toISOString(),
        LastChangedAt: new Date().toISOString(),
        LocalLastChangedAt: new Date().toISOString()
      };

      db.supplierPerformances.push(newPerf);
      return sendJson(res, 201, newPerf);
    }
  }

  // ----------------------------------------------------
  // COLLECTION: /AuditHistory
  // ----------------------------------------------------
  if (pathname === '/AuditHistory' || pathname === '/AuditHistories') {
    if (req.method === 'GET') {
      return sendJson(res, 200, {
        '@odata.context': '$metadata#AuditHistory',
        '@odata.count': db.auditHistories.length,
        value: db.auditHistories
      });
    }
  }

  // Fallback 404
  return sendError(res, 404, 'NOT_FOUND', `Resource '${pathname}' does not exist.`);
});

server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(` SAP ABAP Cloud RAP OData V4 Service Engine Active`);
  console.log(`================================================================`);
  console.log(` Server Port:     http://localhost:${PORT}`);
  console.log(` Service Root:    http://localhost:${PORT}/sap/opu/odata4/sap/zsb_supplier_manage_v4/srvd/sap/zui_supplier_manage_o4/0001/`);
  console.log(` Metadata (CSDL): http://localhost:${PORT}/sap/opu/odata4/sap/zsb_supplier_manage_v4/srvd/sap/zui_supplier_manage_o4/0001/$metadata`);
  console.log(` Quick Alias:     http://localhost:${PORT}/odata/v4/Supplier`);
  console.log(`================================================================`);
});

export default server;
