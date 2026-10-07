@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label : 'Supplier Audit History Interface View'
define view entity ZI_AuditHistory_M
  as select from zsup_audit
  association to parent ZI_Supplier_M as _Supplier on $projection.SupplierID = _Supplier.SupplierID
{
  key audit_id              as AuditID,
      supplier_id           as SupplierID,
      user_id               as UserID,
      action                as Action,
      old_status            as OldStatus,
      new_status            as NewStatus,
      changed_at            as ChangedAt,
      comments              as Comments,
      
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
