@EndUserText.label : 'Draft Table for Supplier'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #L
@AbapCatalog.dataMaintenance : #RESTRICTED
define table zsup_supp_d {
  key mandt             : abap.clnt not null;
  key supplier_id       : abap.char(10) not null;
  supplier_name         : abap.char(80);
  country               : abap.char(3);
  address               : abap.char(100);
  city                  : abap.char(40);
  state                 : abap.char(40);
  postal_code           : abap.char(10);
  contact_person        : abap.char(80);
  email                 : abap.char(100);
  phone                 : abap.char(30);
  category              : abap.char(30);
  tax_number            : abap.char(30);
  status                : abap.char(20);
  
  -- Administrative Fields
  created_by            : abap.char(12);
  created_at            : abap.utclong;
  last_changed_by       : abap.char(12);
  last_changed_at       : abap.utclong;
  local_last_changed_at : abap.utclong;
  
  -- RAP Draft Administrative Fields
  "%admin"              : include sych_bdl_draft_admin_inc;
}
