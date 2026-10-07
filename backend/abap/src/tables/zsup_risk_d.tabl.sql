@EndUserText.label : 'Draft Table for Risk Assessment'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #L
@AbapCatalog.dataMaintenance : #RESTRICTED
define table zsup_risk_d {
  key mandt             : abap.clnt not null;
  key risk_id           : abap.char(10) not null;
  supplier_id           : abap.char(10);
  risk_score            : abap.dec(5,2);
  risk_level            : abap.char(10);
  risk_factors          : abap.char(255);
  comments              : abap.char(255);
  assessment_date       : abap.dats;
  
  -- Administrative Fields
  created_by            : abap.char(12);
  created_at            : abap.utclong;
  last_changed_at       : abap.utclong;
  local_last_changed_at : abap.utclong;
  
  -- RAP Draft Administrative Fields
  "%admin"              : include sych_bdl_draft_admin_inc;
}
