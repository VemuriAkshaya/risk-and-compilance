@EndUserText.label : 'Supplier Risk Assessment Table'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #A
@AbapCatalog.dataMaintenance : #RESTRICTED
define table zsup_risk {
  key client            : abap.clnt not null;
  key risk_id           : abap.char(10) not null;
  supplier_id           : abap.char(10) not null;
  risk_score            : abap.dec(5,2);
  risk_level            : abap.char(10); -- LOW (0-30), MEDIUM (31-60), HIGH (61-100)
  risk_factors          : abap.char(255);
  comments              : abap.char(255);
  assessment_date       : abap.dats;
  
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
