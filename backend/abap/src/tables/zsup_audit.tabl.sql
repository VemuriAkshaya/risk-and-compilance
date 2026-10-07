@EndUserText.label : 'Supplier Audit History Ledger'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #A
@AbapCatalog.dataMaintenance : #RESTRICTED
define table zsup_audit {
  key client            : abap.clnt not null;
  key audit_id          : abap.char(10) not null;
  supplier_id           : abap.char(10) not null;
  user_id               : abap.char(12);
  action                : abap.char(40); -- CREATED, APPROVED, REJECTED, BLOCKED, UNBLOCKED, RISK_REASSESSED
  old_status            : abap.char(20);
  new_status            : abap.char(20);
  changed_at            : abap.utclong;
  comments              : abap.char(255);
  
  -- Administrative Fields
  @Semantics.user.createdBy: true
  created_by            : abap.char(12);
  @Semantics.systemDateTime.createdAt: true
  created_at            : abap.utclong;
  @Semantics.systemDateTime.lastChangedAt: true
  last_changed_at       : abap.utclong;
  @Semantics.systemDateTime.localInstanceLastChangedAt: true
  local_last_changed_at : abap.utclong;
}
