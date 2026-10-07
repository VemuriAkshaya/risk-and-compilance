@EndUserText.label : 'Supplier Performance Table'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #A
@AbapCatalog.dataMaintenance : #RESTRICTED
define table zsup_perf {
  key client            : abap.clnt not null;
  key performance_id    : abap.char(10) not null;
  supplier_id           : abap.char(10) not null;
  quality_score         : abap.dec(5,2);
  delivery_score        : abap.dec(5,2);
  overall_score         : abap.dec(5,2); -- (QualityScore + DeliveryScore) / 2
  performance_status    : abap.char(20); -- EXCELLENT, SATISFACTORY, POOR, CRITICAL
  review_date           : abap.dats;
  
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
