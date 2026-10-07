@EndUserText.label : 'Draft Table for Supplier Performance'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #L
@AbapCatalog.dataMaintenance : #RESTRICTED
define table zsup_perf_d {
  key mandt             : abap.clnt not null;
  key performance_id    : abap.char(10) not null;
  supplier_id           : abap.char(10);
  quality_score         : abap.dec(5,2);
  delivery_score        : abap.dec(5,2);
  overall_score         : abap.dec(5,2);
  performance_status    : abap.char(20);
  review_date           : abap.dats;
  
  -- Administrative Fields
  created_by            : abap.char(12);
  created_at            : abap.utclong;
  last_changed_at       : abap.utclong;
  local_last_changed_at : abap.utclong;
  
  -- RAP Draft Administrative Fields
  "%admin"              : include sych_bdl_draft_admin_inc;
}
