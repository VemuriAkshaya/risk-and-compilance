*"* use this source file for the full ABAP Cloud RAP behavior implementation
*"* Supplier Risk & Purchase Compliance Management System

CLASS lhc_Supplier DEFINITION INHERITING FROM cl_abap_behavior_handler.
  PRIVATE SECTION.
    METHODS get_instance_authorizations FOR INSTANCE AUTHORIZATION
      IMPORTING keys REQUEST requested_authorizations FOR Supplier RESULT result.

    METHODS get_global_authorizations FOR GLOBAL AUTHORIZATION
      IMPORTING REQUEST requested_authorizations FOR Supplier RESULT result.

    METHODS get_instance_features FOR INSTANCE FEATURES
      IMPORTING keys REQUEST requested_features FOR Supplier RESULT result.

    METHODS approveSupplier FOR MODIFY
      IMPORTING keys FOR ACTION Supplier~approveSupplier RESULT result.

    METHODS rejectSupplier FOR MODIFY
      IMPORTING keys FOR ACTION Supplier~rejectSupplier RESULT result.

    METHODS blockSupplier FOR MODIFY
      IMPORTING keys FOR ACTION Supplier~blockSupplier RESULT result.

    METHODS unblockSupplier FOR MODIFY
      IMPORTING keys FOR ACTION Supplier~unblockSupplier RESULT result.

    METHODS reassessRisk FOR MODIFY
      IMPORTING keys FOR ACTION Supplier~reassessRisk RESULT result.

    METHODS determineInitialStatus FOR DETERMINE ON MODIFY
      IMPORTING keys FOR Supplier~determineInitialStatus.

    METHODS determineComplianceExpiry FOR DETERMINE ON SAVE
      IMPORTING keys FOR Supplier~determineComplianceExpiry.

    METHODS validateSupplierStatus FOR VALIDATE ON SAVE
      IMPORTING keys FOR Supplier~validateSupplierStatus.

    METHODS validateEmail FOR VALIDATE ON SAVE
      IMPORTING keys FOR Supplier~validateEmail.

    METHODS validateTaxNumber FOR VALIDATE ON SAVE
      IMPORTING keys FOR Supplier~validateTaxNumber.

    METHODS record_audit_entry
      IMPORTING
        iv_supplier_id TYPE zsup_supplier-supplier_id
        iv_action      TYPE zsup_audit-action
        iv_old_status  TYPE zsup_audit-old_status
        iv_new_status  TYPE zsup_audit-new_status
        iv_comments    TYPE zsup_audit-comments.
ENDCLASS.

CLASS lhc_Supplier IMPLEMENTATION.

  METHOD get_global_authorizations.
    " Authorization-ready design for ABAP Cloud
    result-%create = if_abap_behv=>auth-allowed.
    result-%update = if_abap_behv=>auth-allowed.
    result-%delete = if_abap_behv=>auth-allowed.
  ENDMETHOD.

  METHOD get_instance_authorizations.
    LOOP AT keys ASSIGNING FIELD-SYMBOL(<key>).
      APPEND VALUE #(
        supplierid = <key>-SupplierID
        %update    = if_abap_behv=>auth-allowed
        %delete    = if_abap_behv=>auth-allowed
        %action-approveSupplier = if_abap_behv=>auth-allowed
        %action-rejectSupplier  = if_abap_behv=>auth-allowed
        %action-blockSupplier   = if_abap_behv=>auth-allowed
        %action-unblockSupplier = if_abap_behv=>auth-allowed
        %action-reassessRisk    = if_abap_behv=>auth-allowed
      ) TO result.
    ENDLOOP.
  ENDMETHOD.

  METHOD get_instance_features.
    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY Supplier
        FIELDS ( Status )
        WITH CORRESPONDING #( keys )
      RESULT DATA(suppliers).

    LOOP AT suppliers ASSIGNING FIELD-SYMBOL(<supplier>).
      DATA(lv_is_approved) = COND #( WHEN <supplier>-Status = 'APPROVED'
                                     THEN if_abap_behv=>fc-o-disabled
                                     ELSE if_abap_behv=>fc-o-enabled ).

      DATA(lv_is_blocked) = COND #( WHEN <supplier>-Status = 'BLOCKED'
                                    THEN if_abap_behv=>fc-o-disabled
                                    ELSE if_abap_behv=>fc-o-enabled ).

      DATA(lv_can_unblock) = COND #( WHEN <supplier>-Status = 'BLOCKED'
                                     THEN if_abap_behv=>fc-o-enabled
                                     ELSE if_abap_behv=>fc-o-disabled ).

      APPEND VALUE #(
        supplierid              = <supplier>-SupplierID
        %action-approveSupplier = lv_is_approved
        %action-blockSupplier   = lv_is_blocked
        %action-unblockSupplier = lv_can_unblock
      ) TO result.
    ENDLOOP.
  ENDMETHOD.

  METHOD approveSupplier.
    " Read Supplier status
    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY Supplier
        ALL FIELDS WITH CORRESPONDING #( keys )
      RESULT DATA(suppliers).

    " Read associated Compliance Documents via EML
    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY Supplier BY \_ComplianceDocuments
        ALL FIELDS WITH CORRESPONDING #( keys )
      RESULT DATA(compliance_docs).

    DATA(lv_today) = cl_abap_context_info=>get_system_date( ).

    LOOP AT suppliers ASSIGNING FIELD-SYMBOL(<supplier>).
      DATA(lv_has_expired_doc) = abap_false.

      " Business Rule: Expired compliance -> supplier cannot be approved
      LOOP AT compliance_docs ASSIGNING FIELD-SYMBOL(<doc>)
        WHERE SupplierID = <supplier>-SupplierID.
        IF <doc>-ExpiryDate < lv_today OR <doc>-Status = 'EXPIRED'.
          lv_has_expired_doc = abap_true.
          EXIT.
        ENDIF.
      ENDLOOP.

      IF lv_has_expired_doc = abap_true.
        " Report failure in RAP reported structure
        APPEND VALUE #( %tky = <supplier>-%tky ) TO failed-supplier.
        APPEND VALUE #(
          %tky = <supplier>-%tky
          %msg = NEW zcm_supplier_msg(
            severity = if_abap_behv_message=>severity-error
            textid   = zcm_supplier_msg=>expired_compliance
            attr1    = CONV #( <supplier>-SupplierID )
            attr2    = 'Active expired compliance documents detected'
          )
        ) TO reported-supplier.
        CONTINUE.
      ENDIF.

      " Approve Supplier
      DATA(lv_old_status) = <supplier>-Status.
      MODIFY ENTITIES OF zi_supplier_m IN LOCAL MODE
        ENTITY Supplier
          UPDATE FIELDS ( Status )
          WITH VALUE #( ( %tky   = <supplier>-%tky
                          Status = 'APPROVED' ) ).

      " Business Rule: Record action change in Audit History via EML
      record_audit_entry(
        iv_supplier_id = <supplier>-SupplierID
        iv_action      = 'APPROVED'
        iv_old_status  = lv_old_status
        iv_new_status  = 'APPROVED'
        iv_comments    = 'Supplier compliance review passed. Status moved to APPROVED.'
      ).
    ENDLOOP.

    " Return updated instances
    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY Supplier
        ALL FIELDS WITH CORRESPONDING #( keys )
      RESULT DATA(updated_suppliers).

    result = VALUE #( FOR s IN updated_suppliers ( %tky = s-%tky %param = s ) ).
  ENDMETHOD.

  METHOD rejectSupplier.
    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY Supplier
        ALL FIELDS WITH CORRESPONDING #( keys )
      RESULT DATA(suppliers).

    LOOP AT suppliers ASSIGNING FIELD-SYMBOL(<supplier>).
      DATA(lv_old_status) = <supplier>-Status.

      MODIFY ENTITIES OF zi_supplier_m IN LOCAL MODE
        ENTITY Supplier
          UPDATE FIELDS ( Status )
          WITH VALUE #( ( %tky   = <supplier>-%tky
                          Status = 'REJECTED' ) ).

      " Record in Audit History
      record_audit_entry(
        iv_supplier_id = <supplier>-SupplierID
        iv_action      = 'REJECTED'
        iv_old_status  = lv_old_status
        iv_new_status  = 'REJECTED'
        iv_comments    = 'Supplier onboarding rejected by procurement committee.'
      ).
    ENDLOOP.

    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY Supplier
        ALL FIELDS WITH CORRESPONDING #( keys )
      RESULT DATA(updated_suppliers).

    result = VALUE #( FOR s IN updated_suppliers ( %tky = s-%tky %param = s ) ).
  ENDMETHOD.

  METHOD blockSupplier.
    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY Supplier
        ALL FIELDS WITH CORRESPONDING #( keys )
      RESULT DATA(suppliers).

    LOOP AT suppliers ASSIGNING FIELD-SYMBOL(<supplier>).
      DATA(lv_old_status) = <supplier>-Status.

      MODIFY ENTITIES OF zi_supplier_m IN LOCAL MODE
        ENTITY Supplier
          UPDATE FIELDS ( Status )
          WITH VALUE #( ( %tky   = <supplier>-%tky
                          Status = 'BLOCKED' ) ).

      " Record in Audit History
      record_audit_entry(
        iv_supplier_id = <supplier>-SupplierID
        iv_action      = 'BLOCKED'
        iv_old_status  = lv_old_status
        iv_new_status  = 'BLOCKED'
        iv_comments    = 'Supplier blocked due to compliance violation or risk escalation.'
      ).
    ENDLOOP.

    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY Supplier
        ALL FIELDS WITH CORRESPONDING #( keys )
      RESULT DATA(updated_suppliers).

    result = VALUE #( FOR s IN updated_suppliers ( %tky = s-%tky %param = s ) ).
  ENDMETHOD.

  METHOD unblockSupplier.
    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY Supplier
        ALL FIELDS WITH CORRESPONDING #( keys )
      RESULT DATA(suppliers).

    LOOP AT suppliers ASSIGNING FIELD-SYMBOL(<supplier>).
      DATA(lv_old_status) = <supplier>-Status.

      MODIFY ENTITIES OF zi_supplier_m IN LOCAL MODE
        ENTITY Supplier
          UPDATE FIELDS ( Status )
          WITH VALUE #( ( %tky   = <supplier>-%tky
                          Status = 'UNDER REVIEW' ) ).

      " Record in Audit History
      record_audit_entry(
        iv_supplier_id = <supplier>-SupplierID
        iv_action      = 'UNBLOCKED'
        iv_old_status  = lv_old_status
        iv_new_status  = 'UNDER REVIEW'
        iv_comments    = 'Supplier unblocked. Transferred to UNDER REVIEW for verification.'
      ).
    ENDLOOP.

    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY Supplier
        ALL FIELDS WITH CORRESPONDING #( keys )
      RESULT DATA(updated_suppliers).

    result = VALUE #( FOR s IN updated_suppliers ( %tky = s-%tky %param = s ) ).
  ENDMETHOD.

  METHOD reassessRisk.
    DATA: lt_risk_create TYPE TABLE FOR CREATE zi_supplier_m\_RiskAssessments.

    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY Supplier
        ALL FIELDS WITH CORRESPONDING #( keys )
      RESULT DATA(suppliers).

    DATA(lv_today) = cl_abap_context_info=>get_system_date( ).

    LOOP AT keys ASSIGNING FIELD-SYMBOL(<key>).
      READ TABLE suppliers ASSIGNING FIELD-SYMBOL(<supplier>)
        WITH KEY SupplierID = <key>-SupplierID.
      IF sy-subrc <> 0.
        CONTINUE.
      ENDIF.

      DATA(lv_score)   = <key>-%param-RiskScore.
      DATA(lv_factors) = <key>-%param-RiskFactors.
      DATA(lv_comm)    = <key>-%param-Comments.

      " Calculate Risk Level: 0-30 LOW, 31-60 MEDIUM, 61-100 HIGH
      DATA(lv_risk_level) = COND #(
        WHEN lv_score <= 30 THEN 'LOW'
        WHEN lv_score <= 60 THEN 'MEDIUM'
        ELSE 'HIGH'
      ).

      " Create new risk assessment record via EML association
      DATA(lv_new_risk_id) = |RSK-{ cl_abap_context_info=>get_system_time( ) }|.
      APPEND VALUE #(
        %tky = <supplier>-%tky
        %target = VALUE #( (
          RiskID         = lv_new_risk_id
          SupplierID     = <supplier>-SupplierID
          RiskScore      = lv_score
          RiskLevel      = lv_risk_level
          RiskFactors    = lv_factors
          Comments       = lv_comm
          AssessmentDate = lv_today
        ) )
      ) TO lt_risk_create.

      " Business Rule: HIGH risk supplier -> UNDER REVIEW
      DATA(lv_old_status) = <supplier>-Status.
      IF lv_risk_level = 'HIGH' AND <supplier>-Status <> 'BLOCKED'.
        MODIFY ENTITIES OF zi_supplier_m IN LOCAL MODE
          ENTITY Supplier
            UPDATE FIELDS ( Status )
            WITH VALUE #( ( %tky   = <supplier>-%tky
                            Status = 'UNDER REVIEW' ) ).

        record_audit_entry(
          iv_supplier_id = <supplier>-SupplierID
          iv_action      = 'RISK_REASSESSED'
          iv_old_status  = lv_old_status
          iv_new_status  = 'UNDER REVIEW'
          iv_comments    = |High Risk detected ({ lv_score }/100). Status changed to UNDER REVIEW.|
        ).
      ELSE.
        record_audit_entry(
          iv_supplier_id = <supplier>-SupplierID
          iv_action      = 'RISK_REASSESSED'
          iv_old_status  = lv_old_status
          iv_new_status  = lv_old_status
          iv_comments    = |Risk reassessed: Score { lv_score }/100 ({ lv_risk_level }).|
        ).
      ENDIF.
    ENDLOOP.

    IF lt_risk_create IS NOT INITIAL.
      MODIFY ENTITIES OF zi_supplier_m IN LOCAL MODE
        ENTITY Supplier
        CREATE BY \_RiskAssessments
        FROM lt_risk_create.
    ENDIF.

    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY Supplier
        ALL FIELDS WITH CORRESPONDING #( keys )
      RESULT DATA(updated_suppliers).

    result = VALUE #( FOR s IN updated_suppliers ( %tky = s-%tky %param = s ) ).
  ENDMETHOD.

  METHOD determineInitialStatus.
    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY Supplier
        FIELDS ( Status )
        WITH CORRESPONDING #( keys )
      RESULT DATA(suppliers).

    LOOP AT suppliers ASSIGNING FIELD-SYMBOL(<supplier>) WHERE Status IS INITIAL.
      MODIFY ENTITIES OF zi_supplier_m IN LOCAL MODE
        ENTITY Supplier
          UPDATE FIELDS ( Status )
          WITH VALUE #( ( %tky   = <supplier>-%tky
                          Status = 'NEW' ) ).

      record_audit_entry(
        iv_supplier_id = <supplier>-SupplierID
        iv_action      = 'CREATED'
        iv_old_status  = ''
        iv_new_status  = 'NEW'
        iv_comments    = 'Supplier initial record registered.'
      ).
    ENDLOOP.
  ENDMETHOD.

  METHOD determineComplianceExpiry.
    " Business Rule: Expired compliance -> supplier becomes BLOCKED
    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY Supplier
        ALL FIELDS WITH CORRESPONDING #( keys )
      RESULT DATA(suppliers).

    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY Supplier BY \_ComplianceDocuments
        ALL FIELDS WITH CORRESPONDING #( keys )
      RESULT DATA(docs).

    DATA(lv_today) = cl_abap_context_info=>get_system_date( ).

    LOOP AT suppliers ASSIGNING FIELD-SYMBOL(<supplier>).
      DATA(lv_expired) = abap_false.

      LOOP AT docs ASSIGNING FIELD-SYMBOL(<doc>) WHERE SupplierID = <supplier>-SupplierID.
        IF <doc>-ExpiryDate < lv_today OR <doc>-Status = 'EXPIRED'.
          lv_expired = abap_true.
          EXIT.
        ENDIF.
      ENDLOOP.

      IF lv_expired = abap_true AND <supplier>-Status <> 'BLOCKED'.
        DATA(lv_old_status) = <supplier>-Status.

        MODIFY ENTITIES OF zi_supplier_m IN LOCAL MODE
          ENTITY Supplier
            UPDATE FIELDS ( Status )
            WITH VALUE #( ( %tky   = <supplier>-%tky
                            Status = 'BLOCKED' ) ).

        record_audit_entry(
          iv_supplier_id = <supplier>-SupplierID
          iv_action      = 'BLOCKED'
          iv_old_status  = lv_old_status
          iv_new_status  = 'BLOCKED'
          iv_comments    = 'Automated compliance rule: Expired compliance document caused supplier to be BLOCKED.'
        ).
      ENDIF.
    ENDLOOP.
  ENDMETHOD.

  METHOD validateSupplierStatus.
    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY Supplier
        FIELDS ( Status )
        WITH CORRESPONDING #( keys )
      RESULT DATA(suppliers).

    LOOP AT suppliers ASSIGNING FIELD-SYMBOL(<supplier>).
      IF <supplier>-Status IS NOT INITIAL AND
         <supplier>-Status <> 'NEW' AND
         <supplier>-Status <> 'APPROVED' AND
         <supplier>-Status <> 'UNDER REVIEW' AND
         <supplier>-Status <> 'BLOCKED' AND
         <supplier>-Status <> 'REJECTED'.

        APPEND VALUE #( %tky = <supplier>-%tky ) TO failed-supplier.
        APPEND VALUE #(
          %tky = <supplier>-%tky
          %msg = NEW zcm_supplier_msg(
            severity = if_abap_behv_message=>severity-error
            textid   = zcm_supplier_msg=>supplier_action_success
            attr1    = 'Invalid Status value'
          )
        ) TO reported-supplier.
      ENDIF.
    ENDLOOP.
  ENDMETHOD.

  METHOD validateEmail.
    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY Supplier
        FIELDS ( Email )
        WITH CORRESPONDING #( keys )
      RESULT DATA(suppliers).

    LOOP AT suppliers ASSIGNING FIELD-SYMBOL(<supplier>).
      IF <supplier>-Email IS NOT INITIAL AND NOT <supplier>-Email CS '@'.
        APPEND VALUE #( %tky = <supplier>-%tky ) TO failed-supplier.
        APPEND VALUE #(
          %tky = <supplier>-%tky
          %msg = NEW zcm_supplier_msg(
            severity = if_abap_behv_message=>severity-error
            textid   = zcm_supplier_msg=>invalid_email
            attr1    = CONV #( <supplier>-Email )
          )
        ) TO reported-supplier.
      ENDIF.
    ENDLOOP.
  ENDMETHOD.

  METHOD validateTaxNumber.
    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY Supplier
        FIELDS ( TaxNumber )
        WITH CORRESPONDING #( keys )
      RESULT DATA(suppliers).

    LOOP AT suppliers ASSIGNING FIELD-SYMBOL(<supplier>).
      IF <supplier>-TaxNumber IS INITIAL.
        APPEND VALUE #( %tky = <supplier>-%tky ) TO failed-supplier.
        APPEND VALUE #(
          %tky = <supplier>-%tky
          %msg = NEW zcm_supplier_msg(
            severity = if_abap_behv_message=>severity-error
            textid   = zcm_supplier_msg=>supplier_action_success
            attr1    = 'Tax Number is mandatory'
          )
        ) TO reported-supplier.
      ENDIF.
    ENDLOOP.
  ENDMETHOD.

  METHOD record_audit_entry.
    DATA: lt_audit_create TYPE TABLE FOR CREATE zi_supplier_m\_AuditHistory.
    DATA: lv_audit_id TYPE zsup_audit-audit_id.

    lv_audit_id = |AUD-{ cl_abap_context_info=>get_system_time( ) }|.
    DATA(lv_user) = cl_abap_context_info=>get_user_technical_name( ).
    DATA(lv_now) = cl_abap_context_info=>get_system_date( ).

    APPEND VALUE #(
      SupplierID = iv_supplier_id
      %target = VALUE #( (
        AuditID    = lv_audit_id
        SupplierID = iv_supplier_id
        UserID     = lv_user
        Action     = iv_action
        OldStatus  = iv_old_status
        NewStatus  = iv_new_status
        Comments   = iv_comments
      ) )
    ) TO lt_audit_create.

    MODIFY ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY Supplier
      CREATE BY \_AuditHistory
      FROM lt_audit_create.
  ENDMETHOD.

ENDCLASS.

/* ========================================================
   COMPLIANCE DOCUMENT LOCAL HANDLER
   ======================================================== */
CLASS lhc_ComplianceDocument DEFINITION INHERITING FROM cl_abap_behavior_handler.
  PRIVATE SECTION.
    METHODS determineDocStatus FOR DETERMINE ON MODIFY
      IMPORTING keys FOR ComplianceDocument~determineDocStatus.

    METHODS validateComplianceDates FOR VALIDATE ON SAVE
      IMPORTING keys FOR ComplianceDocument~validateComplianceDates.
ENDCLASS.

CLASS lhc_ComplianceDocument IMPLEMENTATION.

  METHOD determineDocStatus.
    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY ComplianceDocument
        FIELDS ( ExpiryDate Status )
        WITH CORRESPONDING #( keys )
      RESULT DATA(docs).

    DATA(lv_today) = cl_abap_context_info=>get_system_date( ).

    LOOP AT docs ASSIGNING FIELD-SYMBOL(<doc>).
      DATA(lv_status) = COND #(
        WHEN <doc>-ExpiryDate < lv_today THEN 'EXPIRED'
        ELSE 'VALID'
      ).

      IF <doc>-Status <> lv_status.
        MODIFY ENTITIES OF zi_supplier_m IN LOCAL MODE
          ENTITY ComplianceDocument
            UPDATE FIELDS ( Status )
            WITH VALUE #( ( %tky   = <doc>-%tky
                            Status = lv_status ) ).
      ENDIF.
    ENDLOOP.
  ENDMETHOD.

  METHOD validateComplianceDates.
    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY ComplianceDocument
        FIELDS ( IssueDate ExpiryDate )
        WITH CORRESPONDING #( keys )
      RESULT DATA(docs).

    LOOP AT docs ASSIGNING FIELD-SYMBOL(<doc>).
      IF <doc>-ExpiryDate IS NOT INITIAL AND
         <doc>-IssueDate IS NOT INITIAL AND
         <doc>-ExpiryDate < <doc>-IssueDate.

        APPEND VALUE #( %tky = <doc>-%tky ) TO failed-compliancedocument.
        APPEND VALUE #(
          %tky = <doc>-%tky
          %msg = NEW zcm_supplier_msg(
            severity = if_abap_behv_message=>severity-error
            textid   = zcm_supplier_msg=>invalid_expiry_date
          )
        ) TO reported-compliancedocument.
      ENDIF.
    ENDLOOP.
  ENDMETHOD.

ENDCLASS.

/* ========================================================
   RISK ASSESSMENT LOCAL HANDLER
   ======================================================== */
CLASS lhc_RiskAssessment DEFINITION INHERITING FROM cl_abap_behavior_handler.
  PRIVATE SECTION.
    METHODS determineRiskLevel FOR DETERMINE ON MODIFY
      IMPORTING keys FOR RiskAssessment~determineRiskLevel.

    METHODS determineRiskImpact FOR DETERMINE ON SAVE
      IMPORTING keys FOR RiskAssessment~determineRiskImpact.

    METHODS validateRiskScore FOR VALIDATE ON SAVE
      IMPORTING keys FOR RiskAssessment~validateRiskScore.
ENDCLASS.

CLASS lhc_RiskAssessment IMPLEMENTATION.

  METHOD determineRiskLevel.
    " Business Rule: Risk Score 0-30 = LOW, 31-60 = MEDIUM, 61-100 = HIGH
    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY RiskAssessment
        FIELDS ( RiskScore )
        WITH CORRESPONDING #( keys )
      RESULT DATA(risks).

    LOOP AT risks ASSIGNING FIELD-SYMBOL(<risk>).
      DATA(lv_level) = COND #(
        WHEN <risk>-RiskScore <= 30 THEN 'LOW'
        WHEN <risk>-RiskScore <= 60 THEN 'MEDIUM'
        ELSE 'HIGH'
      ).

      MODIFY ENTITIES OF zi_supplier_m IN LOCAL MODE
        ENTITY RiskAssessment
          UPDATE FIELDS ( RiskLevel )
          WITH VALUE #( ( %tky      = <risk>-%tky
                          RiskLevel = lv_level ) ).
    ENDLOOP.
  ENDMETHOD.

  METHOD determineRiskImpact.
    " Business Rule: HIGH risk supplier -> UNDER REVIEW
    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY RiskAssessment
        FIELDS ( RiskScore RiskLevel SupplierID )
        WITH CORRESPONDING #( keys )
      RESULT DATA(risks).

    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY RiskAssessment BY \_Supplier
        FIELDS ( Status )
        WITH CORRESPONDING #( keys )
      RESULT DATA(suppliers).

    LOOP AT risks ASSIGNING FIELD-SYMBOL(<risk>) WHERE RiskLevel = 'HIGH'.
      READ TABLE suppliers ASSIGNING FIELD-SYMBOL(<supplier>)
        WITH KEY SupplierID = <risk>-SupplierID.
      IF sy-subrc = 0 AND <supplier>-Status <> 'BLOCKED' AND <supplier>-Status <> 'UNDER REVIEW'.
        DATA(lv_old) = <supplier>-Status.

        MODIFY ENTITIES OF zi_supplier_m IN LOCAL MODE
          ENTITY Supplier
            UPDATE FIELDS ( Status )
            WITH VALUE #( ( SupplierID = <supplier>-SupplierID
                            Status     = 'UNDER REVIEW' ) ).

        " Audit entry
        DATA: lt_audit TYPE TABLE FOR CREATE zi_supplier_m\_AuditHistory.
        APPEND VALUE #(
          SupplierID = <supplier>-SupplierID
          %target = VALUE #( (
            AuditID    = |AUD-{ cl_abap_context_info=>get_system_time( ) }|
            SupplierID = <supplier>-SupplierID
            UserID     = cl_abap_context_info=>get_user_technical_name( )
            Action     = 'RISK_REASSESSED'
            OldStatus  = lv_old
            NewStatus  = 'UNDER REVIEW'
            Comments   = 'Automated trigger: HIGH Risk Assessment moved supplier to UNDER REVIEW.'
          ) )
        ) TO lt_audit.

        MODIFY ENTITIES OF zi_supplier_m IN LOCAL MODE
          ENTITY Supplier
          CREATE BY \_AuditHistory
          FROM lt_audit.
      ENDIF.
    ENDLOOP.
  ENDMETHOD.

  METHOD validateRiskScore.
    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY RiskAssessment
        FIELDS ( RiskScore )
        WITH CORRESPONDING #( keys )
      RESULT DATA(risks).

    LOOP AT risks ASSIGNING FIELD-SYMBOL(<risk>).
      IF <risk>-RiskScore < 0 OR <risk>-RiskScore > 100.
        APPEND VALUE #( %tky = <risk>-%tky ) TO failed-riskassessment.
        APPEND VALUE #(
          %tky = <risk>-%tky
          %msg = NEW zcm_supplier_msg(
            severity = if_abap_behv_message=>severity-error
            textid   = zcm_supplier_msg=>invalid_risk_score
          )
        ) TO reported-riskassessment.
      ENDIF.
    ENDLOOP.
  ENDMETHOD.

ENDCLASS.

/* ========================================================
   SUPPLIER PERFORMANCE LOCAL HANDLER
   ======================================================== */
CLASS lhc_Performance DEFINITION INHERITING FROM cl_abap_behavior_handler.
  PRIVATE SECTION.
    METHODS determineOverallScore FOR DETERMINE ON MODIFY
      IMPORTING keys FOR Performance~determineOverallScore.

    METHODS validatePerformanceScores FOR VALIDATE ON SAVE
      IMPORTING keys FOR Performance~validatePerformanceScores.
ENDCLASS.

CLASS lhc_Performance IMPLEMENTATION.

  METHOD determineOverallScore.
    " Business Rule: Overall Performance = (Quality + Delivery) / 2
    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY Performance
        FIELDS ( QualityScore DeliveryScore )
        WITH CORRESPONDING #( keys )
      RESULT DATA(perfs).

    LOOP AT perfs ASSIGNING FIELD-SYMBOL(<perf>).
      DATA(lv_overall) = ( <perf>-QualityScore + <perf>-DeliveryScore ) / 2.

      DATA(lv_perf_status) = COND #(
        WHEN lv_overall >= 85 THEN 'EXEMPLARY'
        WHEN lv_overall >= 70 THEN 'SATISFACTORY'
        WHEN lv_overall >= 50 THEN 'NEEDS_IMPROVEMENT'
        ELSE 'CRITICAL'
      ).

      MODIFY ENTITIES OF zi_supplier_m IN LOCAL MODE
        ENTITY Performance
          UPDATE FIELDS ( OverallScore PerformanceStatus )
          WITH VALUE #( ( %tky              = <perf>-%tky
                          OverallScore       = lv_overall
                          PerformanceStatus  = lv_perf_status ) ).
    ENDLOOP.
  ENDMETHOD.

  METHOD validatePerformanceScores.
    READ ENTITIES OF zi_supplier_m IN LOCAL MODE
      ENTITY Performance
        FIELDS ( QualityScore DeliveryScore )
        WITH CORRESPONDING #( keys )
      RESULT DATA(perfs).

    LOOP AT perfs ASSIGNING FIELD-SYMBOL(<perf>).
      IF <perf>-QualityScore < 0 OR <perf>-QualityScore > 100 OR
         <perf>-DeliveryScore < 0 OR <perf>-DeliveryScore > 100.

        APPEND VALUE #( %tky = <perf>-%tky ) TO failed-performance.
        APPEND VALUE #(
          %tky = <perf>-%tky
          %msg = NEW zcm_supplier_msg(
            severity = if_abap_behv_message=>severity-error
            textid   = zcm_supplier_msg=>invalid_performance_score
          )
        ) TO reported-performance.
      ENDIF.
    ENDLOOP.
  ENDMETHOD.

ENDCLASS.
