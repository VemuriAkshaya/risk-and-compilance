CLASS zcl_supplier_data_generator DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC .

  PUBLIC SECTION.
    INTERFACES if_oo_adt_classrun .
  PROTECTED SECTION.
  PRIVATE SECTION.
ENDCLASS.

CLASS zcl_supplier_data_generator IMPLEMENTATION.

  METHOD if_oo_adt_classrun~main.
    out->write( |============================================================| ).
    out->write( | SAP ABAP Cloud: Supplier Risk & Compliance Data Generator  | ).
    out->write( |============================================================| ).

    " 1. Clear existing database records
    DELETE FROM zsup_supplier.
    DELETE FROM zsup_doc.
    DELETE FROM zsup_risk.
    DELETE FROM zsup_perf.
    DELETE FROM zsup_audit.

    out->write( |[1/4] Cleared old master tables...| ).

    DATA(lv_now)   = cl_abap_context_info=>get_system_time( ).
    DATA(lv_today) = cl_abap_context_info=>get_system_date( ).
    DATA(lv_user)  = cl_abap_context_info=>get_user_technical_name( ).

    " 2. Seed Suppliers
    DATA: lt_suppliers TYPE TABLE OF zsup_supplier.
    lt_suppliers = VALUE #(
      ( client = sy-mandt supplier_id = 'SUP-1001' supplier_name = 'Apex Industrial Components GmbH'
        country = 'DEU' address = 'Industriestrasse 42' city = 'Stuttgart' state = 'Baden-Wuerttemberg'
        postal_code = '70173' contact_person = 'Klaus Schneider' email = 'k.schneider@apex-components.de'
        phone = '+49 711 849200' category = 'Raw Materials' tax_number = 'DE814920194' status = 'APPROVED'
        created_by = lv_user created_at = lv_now last_changed_by = lv_user last_changed_at = lv_now local_last_changed_at = lv_now )

      ( client = sy-mandt supplier_id = 'SUP-1002' supplier_name = 'Vanguard Semiconductor Corp'
        country = 'USA' address = '100 Silicon Way' city = 'San Jose' state = 'California'
        postal_code = '95134' contact_person = 'Sarah Jenkins' email = 'sjenkins@vanguardsemi.com'
        phone = '+1 408 555 0192' category = 'IT Services' tax_number = 'US-94-3019284' status = 'UNDER REVIEW'
        created_by = lv_user created_at = lv_now last_changed_by = lv_user last_changed_at = lv_now local_last_changed_at = lv_now )

      ( client = sy-mandt supplier_id = 'SUP-1003' supplier_name = 'Nordic Green Logistics AB'
        country = 'SWE' address = 'Hamngatan 14' city = 'Gothenburg' state = 'Vastra Gotaland'
        postal_code = '41114' contact_person = 'Astrid Lindqvist' email = 'astrid.l@nordicgreen.se'
        phone = '+46 31 710 4400' category = 'Logistics' tax_number = 'SE556123456701' status = 'BLOCKED'
        created_by = lv_user created_at = lv_now last_changed_by = lv_user last_changed_at = lv_now local_last_changed_at = lv_now )

      ( client = sy-mandt supplier_id = 'SUP-1004' supplier_name = 'Kyoto Precision Dynamics KK'
        country = 'JPN' address = '88 Karasuma-dori' city = 'Kyoto' state = 'Kansai'
        postal_code = '600-8009' contact_person = 'Kenji Takahashi' email = 'takahashi.k@kyotoprecision.jp'
        phone = '+81 75 341 9000' category = 'Manufacturing' tax_number = 'JP9010001029384' status = 'NEW'
        created_by = lv_user created_at = lv_now last_changed_by = lv_user last_changed_at = lv_now local_last_changed_at = lv_now )
    ).
    INSERT zsup_supplier FROM TABLE @lt_suppliers.
    out->write( |[2/4] Inserted { lines( lt_suppliers ) } Suppliers.| ).

    " 3. Seed Compliance Documents
    DATA: lt_docs TYPE TABLE OF zsup_doc.
    lt_docs = VALUE #(
      " SUP-1001 (Valid ISO 9001 and ESG)
      ( client = sy-mandt document_id = 'DOC-101' supplier_id = 'SUP-1001' document_type = 'ISO 9001 Quality Management'
        document_number = 'ISO-9001-DE-2024-88' issue_date = '20240115' expiry_date = '20270114' status = 'VALID'
        created_by = lv_user created_at = lv_now last_changed_at = lv_now local_last_changed_at = lv_now )
      ( client = sy-mandt document_id = 'DOC-102' supplier_id = 'SUP-1001' document_type = 'Anti-Bribery & Corruption (ABC)'
        document_number = 'ABC-ATTEST-2025' issue_date = '20250201' expiry_date = '20270201' status = 'VALID'
        created_by = lv_user created_at = lv_now last_changed_at = lv_now local_last_changed_at = lv_now )

      " SUP-1002 (Expiring Soon)
      ( client = sy-mandt document_id = 'DOC-201' supplier_id = 'SUP-1002' document_type = 'SOC 2 Type II Security'
        document_number = 'SOC2-US-9912' issue_date = '20240410' expiry_date = '20261130' status = 'VALID'
        created_by = lv_user created_at = lv_now last_changed_at = lv_now local_last_changed_at = lv_now )

      " SUP-1003 (EXPIRED -> Explains why status is BLOCKED!)
      ( client = sy-mandt document_id = 'DOC-301' supplier_id = 'SUP-1003' document_type = 'EU Emissions Compliance Certificate'
        document_number = 'EU-EMISS-2023-01' issue_date = '20230101' expiry_date = '20251231' status = 'EXPIRED'
        created_by = lv_user created_at = lv_now last_changed_at = lv_now local_last_changed_at = lv_now )

      " SUP-1004 (New, Pending)
      ( client = sy-mandt document_id = 'DOC-401' supplier_id = 'SUP-1004' document_type = 'ISO 14001 Environmental'
        document_number = 'ISO-14001-JP-55' issue_date = '20250601' expiry_date = '20280531' status = 'VALID'
        created_by = lv_user created_at = lv_now last_changed_at = lv_now local_last_changed_at = lv_now )
    ).
    INSERT zsup_doc FROM TABLE @lt_docs.
    out->write( |[3/4] Inserted { lines( lt_docs ) } Compliance Documents.| ).

    " 4. Seed Risk Assessments (Rule: 0-30 LOW, 31-60 MEDIUM, 61-100 HIGH)
    DATA: lt_risks TYPE TABLE OF zsup_risk.
    lt_risks = VALUE #(
      ( client = sy-mandt risk_id = 'RSK-101' supplier_id = 'SUP-1001' risk_score = '18.50' risk_level = 'LOW'
        risk_factors = 'Stable Tier-1 supply chain, dual sourcing ready' comments = 'Excellent credit rating AAA'
        assessment_date = '20260215' created_by = lv_user created_at = lv_now last_changed_at = lv_now local_last_changed_at = lv_now )

      ( client = sy-mandt risk_id = 'RSK-201' supplier_id = 'SUP-1002' risk_score = '74.00' risk_level = 'HIGH'
        risk_factors = 'Geopolitical export restrictions, fab capacity bottleneck' comments = 'High risk score triggers UNDER REVIEW'
        assessment_date = '20260301' created_by = lv_user created_at = lv_now last_changed_at = lv_now local_last_changed_at = lv_now )

      ( client = sy-mandt risk_id = 'RSK-301' supplier_id = 'SUP-1003' risk_score = '52.00' risk_level = 'MEDIUM'
        risk_factors = 'Rising fuel surcharges, regulatory fines' comments = 'Under ongoing monitoring'
        assessment_date = '20260120' created_by = lv_user created_at = lv_now last_changed_at = lv_now local_last_changed_at = lv_now )

      ( client = sy-mandt risk_id = 'RSK-401' supplier_id = 'SUP-1004' risk_score = '24.00' risk_level = 'LOW'
        risk_factors = 'Currency volatility JPY/EUR' comments = 'Baseline evaluation complete'
        assessment_date = '20260310' created_by = lv_user created_at = lv_now last_changed_at = lv_now local_last_changed_at = lv_now )
    ).
    INSERT zsup_risk FROM TABLE @lt_risks.

    " 5. Seed Performance (Rule: Overall = (Quality + Delivery) / 2)
    DATA: lt_perf TYPE TABLE OF zsup_perf.
    lt_perf = VALUE #(
      ( client = sy-mandt performance_id = 'PRF-101' supplier_id = 'SUP-1001' quality_score = '96.00' delivery_score = '94.00'
        overall_score = '95.00' performance_status = 'EXEMPLARY' review_date = '20260315'
        created_by = lv_user created_at = lv_now last_changed_at = lv_now local_last_changed_at = lv_now )

      ( client = sy-mandt performance_id = 'PRF-201' supplier_id = 'SUP-1002' quality_score = '88.00' delivery_score = '72.00'
        overall_score = '80.00' performance_status = 'SATISFACTORY' review_date = '20260301'
        created_by = lv_user created_at = lv_now last_changed_at = lv_now local_last_changed_at = lv_now )

      ( client = sy-mandt performance_id = 'PRF-301' supplier_id = 'SUP-1003' quality_score = '60.00' delivery_score = '44.00'
        overall_score = '52.00' performance_status = 'NEEDS_IMPROVEMENT' review_date = '20260228'
        created_by = lv_user created_at = lv_now last_changed_at = lv_now local_last_changed_at = lv_now )

      ( client = sy-mandt performance_id = 'PRF-401' supplier_id = 'SUP-1004' quality_score = '92.00' delivery_score = '90.00'
        overall_score = '91.00' performance_status = 'EXEMPLARY' review_date = '20260310'
        created_by = lv_user created_at = lv_now last_changed_at = lv_now local_last_changed_at = lv_now )
    ).
    INSERT zsup_perf FROM TABLE @lt_perf.

    " 6. Seed Audit History
    DATA: lt_audit TYPE TABLE OF zsup_audit.
    lt_audit = VALUE #(
      ( client = sy-mandt audit_id = 'AUD-001' supplier_id = 'SUP-1001' user_id = lv_user action = 'CREATED'
        old_status = '' new_status = 'NEW' changed_at = lv_now comments = 'Supplier onboarded via Ariba portal'
        created_by = lv_user created_at = lv_now last_changed_at = lv_now local_last_changed_at = lv_now )

      ( client = sy-mandt audit_id = 'AUD-002' supplier_id = 'SUP-1001' user_id = lv_user action = 'APPROVED'
        old_status = 'NEW' new_status = 'APPROVED' changed_at = lv_now comments = 'All compliance certificates verified'
        created_by = lv_user created_at = lv_now last_changed_at = lv_now local_last_changed_at = lv_now )

      ( client = sy-mandt audit_id = 'AUD-003' supplier_id = 'SUP-1003' user_id = 'SYSTEM' action = 'BLOCKED'
        old_status = 'APPROVED' new_status = 'BLOCKED' changed_at = lv_now comments = 'System automated rule: Expired compliance certificate DOC-301'
        created_by = lv_user created_at = lv_now last_changed_at = lv_now local_last_changed_at = lv_now )

      ( client = sy-mandt audit_id = 'AUD-004' supplier_id = 'SUP-1002' user_id = lv_user action = 'RISK_REASSESSED'
        old_status = 'APPROVED' new_status = 'UNDER REVIEW' changed_at = lv_now comments = 'Risk score 74.00 (HIGH) triggered UNDER REVIEW status'
        created_by = lv_user created_at = lv_now last_changed_at = lv_now local_last_changed_at = lv_now )
    ).
    INSERT zsup_audit FROM TABLE @lt_audit.

    out->write( |[4/4] Seed data successfully generated in SAP HANA Cloud!| ).
    out->write( |============================================================| ).
    out->write( | RAP Business Objects & OData V4 ready for consumption:      | ).
    out->write( | Service: /sap/opu/odata4/sap/zsb_supplier_manage_v4/srvd/sap/zui_supplier_manage_o4/0001/ | ).
  ENDMETHOD.

ENDCLASS.
