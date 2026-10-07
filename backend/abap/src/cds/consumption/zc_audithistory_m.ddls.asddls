@EndUserText.label : 'Supplier Audit History Consumption View'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Metadata.allowExtensions: true
@Search.searchable: true
define view entity ZC_AuditHistory_M
  as projection on ZI_AuditHistory_M
{
      @UI.facet: [
        {
          id: 'AuditDetails',
          purpose: #STANDARD,
          type: #IDENTIFICATION_REFERENCE,
          label: 'Audit Trail Record',
          position: 10
        }
      ]

      @UI.lineItem: [ { position: 10, label: 'Audit ID' } ]
      @UI.identification: [ { position: 10, label: 'Audit ID' } ]
  key AuditID,

      @UI.lineItem: [ { position: 20, label: 'Supplier ID' } ]
      @UI.identification: [ { position: 20, label: 'Supplier ID' } ]
      SupplierID,

      @UI.lineItem: [ { position: 30, label: 'Action Executed' } ]
      @UI.identification: [ { position: 30, label: 'Action' } ]
      @Search.defaultSearchElement: true
      Action,

      @UI.lineItem: [ { position: 40, label: 'User ID' } ]
      @UI.identification: [ { position: 40, label: 'User ID' } ]
      UserID,

      @UI.lineItem: [ { position: 50, label: 'Old Status' } ]
      @UI.identification: [ { position: 50, label: 'Old Status' } ]
      OldStatus,

      @UI.lineItem: [ { position: 60, label: 'New Status' } ]
      @UI.identification: [ { position: 60, label: 'New Status' } ]
      NewStatus,

      @UI.lineItem: [ { position: 70, label: 'Timestamp' } ]
      @UI.identification: [ { position: 70, label: 'Timestamp' } ]
      ChangedAt,

      @UI.lineItem: [ { position: 80, label: 'Audit Comments' } ]
      @UI.identification: [ { position: 80, label: 'Audit Comments' } ]
      Comments,

      CreatedBy,
      CreatedAt,
      LastChangedAt,
      LocalLastChangedAt,

      /* Associations */
      _Supplier : redirected to parent ZC_Supplier_M
}
