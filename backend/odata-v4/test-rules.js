/**
 * Automated Verification Suite for SAP ABAP Cloud RAP Backend
 * Tests all 6 core business rules, RAP operations, and RAP actions.
 */

const BASE_URL = 'http://localhost:4004/sap/opu/odata4/sap/zsb_supplier_manage_v4/srvd/sap/zui_supplier_manage_o4/0001';

async function runTests() {
  console.log('--- STARTING RAP BACKEND & BUSINESS RULE VERIFICATION ---');

  try {
    // 0. Reset to initial clean state
    await fetch('http://localhost:4004/api/reset', { method: 'POST' });
    console.log('✓ Reset DB to clean initial state');

    // 1. Test Metadata Document
    const metaRes = await fetch(`${BASE_URL}/$metadata`);
    const metaXml = await metaRes.text();
    if (!metaXml.includes('EntityType Name="SupplierType"')) {
      throw new Error('Metadata missing SupplierType');
    }
    console.log('✓ Test 1: $metadata OData V4 EDMX CSDL served correctly');

    // 2. Test Get Suppliers with $expand
    const supRes = await fetch(`${BASE_URL}/Supplier?$expand=_ComplianceDocuments,_RiskAssessments,_Performance,_AuditHistory`);
    const supData = await supRes.json();
    if (!supData.value || supData.value.length < 4) {
      throw new Error('Failed to retrieve seeded suppliers with composition expansion');
    }
    console.log(`✓ Test 2: Retrieved ${supData.value.length} Suppliers with full composition hierarchy`);

    // 3. Test Business Rule 1: Expired compliance -> supplier cannot be approved!
    // SUP-1003 has expired document DOC-301
    const approveBlockedRes = await fetch(`${BASE_URL}/Supplier('SUP-1003')/approveSupplier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (approveBlockedRes.status !== 400) {
      throw new Error(`Expected HTTP 400 when approving supplier with expired compliance, got ${approveBlockedRes.status}`);
    }
    const errObj = await approveBlockedRes.json();
    if (!errObj.error?.code?.includes('ZSUP_MSG/001')) {
      throw new Error(`Expected ZSUP_MSG/001 error code, got ${JSON.stringify(errObj)}`);
    }
    console.log('✓ Test 3 [BUSINESS RULE 1]: Successfully blocked approval for supplier with expired compliance');

    // 4. Test Approve Supplier on compliant supplier SUP-1004 (NEW -> APPROVED)
    const approveRes = await fetch(`${BASE_URL}/Supplier('SUP-1004')/approveSupplier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Comments: 'Formal audit clearance passed' })
    });
    if (approveRes.status !== 200) {
      const err = await approveRes.text();
      throw new Error(`Failed to approve compliant supplier: ${err}`);
    }
    const approvedSupplier = await approveRes.json();
    if (approvedSupplier.Status !== 'APPROVED') {
      throw new Error(`Expected Status APPROVED, got ${approvedSupplier.Status}`);
    }
    console.log('✓ Test 4 [RAP ACTION]: Approved compliant supplier SUP-1004 successfully');

    // 5. Test Business Rule 3 & 4: Reassess Risk & HIGH risk -> UNDER REVIEW
    // Test reassess on SUP-1004 with score 78.5 (HIGH)
    const riskRes = await fetch(`${BASE_URL}/Supplier('SUP-1004')/reassessRisk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        RiskScore: 78.5,
        RiskFactors: 'Supply chain disruption in APAC region',
        Comments: 'Urgent risk reassessment by VP Procurement'
      })
    });
    const reassessedSupplier = await riskRes.json();
    if (reassessedSupplier.Status !== 'UNDER REVIEW') {
      throw new Error(`Expected HIGH risk supplier to shift to UNDER REVIEW, got ${reassessedSupplier.Status}`);
    }
    console.log('✓ Test 5 [BUSINESS RULES 3 & 4]: HIGH risk score (78.5) derived level HIGH and moved supplier to UNDER REVIEW');

    // 6. Test Business Rule 5: Overall Performance = (Quality + Delivery) / 2
    const perfRes = await fetch(`${BASE_URL}/SupplierPerformance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        SupplierID: 'SUP-1004',
        QualityScore: 90,
        DeliveryScore: 80
      })
    });
    const perfData = await perfRes.json();
    if (perfData.OverallScore !== 85 || perfData.PerformanceStatus !== 'EXEMPLARY') {
      throw new Error(`Expected OverallScore 85 and status EXEMPLARY, got ${perfData.OverallScore} & ${perfData.PerformanceStatus}`);
    }
    console.log('✓ Test 6 [BUSINESS RULE 5]: Overall performance (90+80)/2 = 85 calculated accurately');

    // 7. Test Business Rule 2: Expired compliance -> supplier becomes BLOCKED
    const addExpiredDocRes = await fetch(`${BASE_URL}/ComplianceDocument`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        SupplierID: 'SUP-1001',
        DocumentType: 'Expired Environmental License',
        DocumentNumber: 'EXP-ENV-99',
        IssueDate: '2020-01-01',
        ExpiryDate: '2023-01-01' // Past date -> EXPIRED
      })
    });
    const expDoc = await addExpiredDocRes.json();
    if (expDoc.Status !== 'EXPIRED') {
      throw new Error(`Expected document status EXPIRED, got ${expDoc.Status}`);
    }
    // Check if SUP-1001 status became BLOCKED
    const supp1001Res = await fetch(`${BASE_URL}/Supplier('SUP-1001')`);
    const supp1001 = await supp1001Res.json();
    if (supp1001.Status !== 'BLOCKED') {
      throw new Error(`Expected SUP-1001 to become BLOCKED due to expired document, got ${supp1001.Status}`);
    }
    console.log('✓ Test 7 [BUSINESS RULE 2]: Expired compliance document immediately caused supplier to become BLOCKED');

    // 8. Test Business Rule 6: Audit History Trail
    const auditRes = await fetch(`${BASE_URL}/AuditHistory`);
    const auditData = await auditRes.json();
    if (!auditData.value || auditData.value.length < 5) {
      throw new Error('Audit trail did not record all expected action events');
    }
    console.log(`✓ Test 8 [BUSINESS RULE 6]: Audit History trail logged ${auditData.value.length} historical action events`);

    // 9. Test Block & Unblock Actions
    const blockRes = await fetch(`${BASE_URL}/Supplier('SUP-1002')/blockSupplier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Comments: 'Legal dispute pending' })
    });
    const blockedSup = await blockRes.json();
    if (blockedSup.Status !== 'BLOCKED') {
      throw new Error('Failed to block supplier');
    }

    const unblockRes = await fetch(`${BASE_URL}/Supplier('SUP-1002')/unblockSupplier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const unblockedSup = await unblockRes.json();
    if (unblockedSup.Status !== 'UNDER REVIEW') {
      throw new Error('Failed to unblock supplier to UNDER REVIEW');
    }
    console.log('✓ Test 9 [RAP ACTIONS]: blockSupplier and unblockSupplier actions executed cleanly');

    console.log('\n============================================================');
    console.log(' ALL 9 AUTOMATED RAP TESTS & BUSINESS RULES PASSED (100%)');
    console.log('============================================================\n');

  } catch (err) {
    console.error('❌ Test failed with error:', err.message);
    process.exit(1);
  }
}

runTests();
