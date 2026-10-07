@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label : 'Compliance Document Interface View'
define view entity ZI_ComplianceDoc_M
  as select from zsup_doc
  association to parent ZI_Supplier_M as _Supplier on $projection.SupplierID = _Supplier.SupplierID
{
  key document_id           as DocumentID,
      supplier_id           as SupplierID,
      document_type         as DocumentType,
      document_number       as DocumentNumber,
      issue_date            as IssueDate,
      expiry_date           as ExpiryDate,
      status                as Status,
      
      -- Administrative Fields
      @Semantics.user.createdBy: true
      created_by            as CreatedBy,
      @Semantics.systemDateTime.createdAt: true
      created_at            as CreatedAt,
      @Semantics.systemDateTime.lastChangedAt: true
      last_changed_at       as LastChangedAt,
      @Semantics.systemDateTime.localInstanceLastChangedAt: true
      local_last_changed_at as LocalLastChangedAt,
      
      -- Compositions & Associations
      _Supplier
}
