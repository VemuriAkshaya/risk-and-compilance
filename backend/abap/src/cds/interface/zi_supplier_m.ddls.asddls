@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label : 'Supplier Root Interface View'
define root view entity ZI_Supplier_M
  as select from zsup_supplier
  composition [0..*] of ZI_ComplianceDoc_M   as _ComplianceDocuments
  composition [0..*] of ZI_RiskAssessment_M  as _RiskAssessments
  composition [0..*] of ZI_SupplierPerf_M    as _Performance
  composition [0..*] of ZI_AuditHistory_M    as _AuditHistory
{
  key supplier_id           as SupplierID,
      supplier_name         as SupplierName,
      country               as Country,
      address               as Address,
      city                  as City,
      state                 as State,
      postal_code           as PostalCode,
      contact_person        as ContactPerson,
      email                 as Email,
      phone                 as Phone,
      category              as Category,
      tax_number            as TaxNumber,
      status                as Status,
      
      -- Administrative Fields
      @Semantics.user.createdBy: true
      created_by            as CreatedBy,
      @Semantics.systemDateTime.createdAt: true
      created_at            as CreatedAt,
      @Semantics.user.lastChangedBy: true
      last_changed_by       as LastChangedBy,
      @Semantics.systemDateTime.lastChangedAt: true
      last_changed_at       as LastChangedAt,
      @Semantics.systemDateTime.localInstanceLastChangedAt: true
      local_last_changed_at as LocalLastChangedAt,
      
      -- Compositions
      _ComplianceDocuments,
      _RiskAssessments,
      _Performance,
      _AuditHistory
}
