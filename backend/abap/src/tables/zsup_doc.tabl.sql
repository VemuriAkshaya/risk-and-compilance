@EndUserText.label : 'Supplier Compliance Document Table'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #A
@AbapCatalog.dataMaintenance : #RESTRICTED
define table zsup_doc {
  key client            : abap.clnt not null;
  key document_id       : abap.char(10) not null;
  supplier_id           : abap.char(10) not null;
  document_type         : abap.char(40);
  document_number       : abap.char(50);
  issue_date            : abap.dats;
  expiry_date           : abap.dats;
  status                : abap.char(20); -- VALID, EXPIRED, EXPIRING_SOON, PENDING_REVIEW
  
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
