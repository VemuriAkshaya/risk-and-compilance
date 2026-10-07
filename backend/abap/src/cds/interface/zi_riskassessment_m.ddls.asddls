@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label : 'Risk Assessment Interface View'
define view entity ZI_RiskAssessment_M
  as select from zsup_risk
  association to parent ZI_Supplier_M as _Supplier on $projection.SupplierID = _Supplier.SupplierID
{
  key risk_id               as RiskID,
      supplier_id           as SupplierID,
      @Semantics.quantity.unitOfMeasure: ''
      risk_score            as RiskScore,
      risk_level            as RiskLevel,
      risk_factors          as RiskFactors,
      comments              as Comments,
      assessment_date       as AssessmentDate,
      
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
