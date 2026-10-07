@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label : 'Supplier Performance Interface View'
define view entity ZI_SupplierPerf_M
  as select from zsup_perf
  association to parent ZI_Supplier_M as _Supplier on $projection.SupplierID = _Supplier.SupplierID
{
  key performance_id        as PerformanceID,
      supplier_id           as SupplierID,
      quality_score         as QualityScore,
      delivery_score        as DeliveryScore,
      overall_score         as OverallScore,
      performance_status    as PerformanceStatus,
      review_date           as ReviewDate,
      
      -- Administrative Fields
      @Semantics.user.createdBy: true
      created_by            as CreatedBy,
      @Semantics.systemDateTime.createdAt: true
      created_at            as CreatedAt,
      @Semantics.systemDateTime.lastChangedAt: true
      last_changed_at       as LastChangedAt,
      @Semantics.systemDateTime.localInstanceLastChangedAt: true
      local_last_changed_at as LocalLastChangedAt,
      
      -- Associations
      _Supplier
}
