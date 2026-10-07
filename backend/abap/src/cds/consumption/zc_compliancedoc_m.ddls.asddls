@EndUserText.label : 'Compliance Document Consumption View'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Metadata.allowExtensions: true
@Search.searchable: true
define view entity ZC_ComplianceDoc_M
  as projection on ZI_ComplianceDoc_M
{
      @UI.facet: [
        {
          id: 'ComplianceDocDetails',
          purpose: #STANDARD,
          type: #IDENTIFICATION_REFERENCE,
          label: 'Compliance Certificate Info',
          position: 10
        }
      ]

      @UI.lineItem: [ { position: 10, label: 'Document ID' } ]
      @UI.identification: [ { position: 10, label: 'Document ID' } ]
  key DocumentID,

      @UI.lineItem: [ { position: 20, label: 'Supplier ID' } ]
      @UI.identification: [ { position: 20, label: 'Supplier ID' } ]
      SupplierID,

      @UI.lineItem: [ { position: 30, label: 'Document Type' } ]
      @UI.identification: [ { position: 30, label: 'Document Type' } ]
      @Search.defaultSearchElement: true
      DocumentType,

      @UI.lineItem: [ { position: 40, label: 'Certificate Number' } ]
      @UI.identification: [ { position: 40, label: 'Certificate Number' } ]
      DocumentNumber,

      @UI.lineItem: [ { position: 50, label: 'Issue Date' } ]
      @UI.identification: [ { position: 50, label: 'Issue Date' } ]
      IssueDate,

      @UI.lineItem: [ { position: 60, label: 'Expiry Date' } ]
      @UI.identification: [ { position: 60, label: 'Expiry Date' } ]
      ExpiryDate,

      @UI.lineItem: [ { position: 70, label: 'Compliance Status', criticality: 'StatusCriticality' } ]
      @UI.identification: [ { position: 70, label: 'Compliance Status' } ]
      Status,

      case Status
        when 'VALID'   then 3 -- Green
        when 'EXPIRING_SOON' then 2 -- Yellow
        when 'EXPIRED' then 1 -- Red
        else 0
      end as StatusCriticality,

      CreatedBy,
      CreatedAt,
      LastChangedAt,
      LocalLastChangedAt,

      /* Associations */
      _Supplier : redirected to parent ZC_Supplier_M
}
