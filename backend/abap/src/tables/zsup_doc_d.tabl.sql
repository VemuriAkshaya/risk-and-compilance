@EndUserText.label : 'Draft Table for Compliance Document'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #L
@AbapCatalog.dataMaintenance : #RESTRICTED
define table zsup_doc_d {
  key mandt             : abap.clnt not null;
  key document_id       : abap.char(10) not null;
  supplier_id           : abap.char(10);
  document_type         : abap.char(40);
  document_number       : abap.char(50);
  issue_date            : abap.dats;
  expiry_date           : abap.dats;
  status                : abap.char(20);
  
  -- Administrative Fields
  created_by            : abap.char(12);
  created_at            : abap.utclong;
  last_changed_at       : abap.utclong;
  local_last_changed_at : abap.utclong;
  
  -- RAP Draft Administrative Fields
  "%admin"              : include sych_bdl_draft_admin_inc;
}
