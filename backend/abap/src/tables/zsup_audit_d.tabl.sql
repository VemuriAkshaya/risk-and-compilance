@EndUserText.label : 'Draft Table for Supplier Audit History'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #L
@AbapCatalog.dataMaintenance : #RESTRICTED
define table zsup_audit_d {
  key mandt             : abap.clnt not null;
  key audit_id          : abap.char(10) not null;
  supplier_id           : abap.char(10);
  user_id               : abap.char(12);
  action                : abap.char(40);
  old_status            : abap.char(20);
  new_status            : abap.char(20);
  changed_at            : abap.utclong;
  comments              : abap.char(255);
  
  -- Administrative Fields
  created_by            : abap.char(12);
  created_at            : abap.utclong;
  last_changed_at       : abap.utclong;
  local_last_changed_at : abap.utclong;
  
  -- RAP Draft Administrative Fields
  "%admin"              : include sych_bdl_draft_admin_inc;
}
