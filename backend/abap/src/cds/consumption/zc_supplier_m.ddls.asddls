@EndUserText.label : 'Supplier Management Consumption View'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Metadata.allowExtensions: true
@Search.searchable: true
@UI: {
  headerInfo: {
    typeName: 'Supplier',
    typeNamePlural: 'Suppliers',
    title: { type: #STANDARD, value: 'SupplierName' },
    description: { value: 'SupplierID' }
  }
}
define root view entity ZC_Supplier_M
  provider contract transactional_query
  as projection on ZI_Supplier_M
{
      @UI.facet: [
        {
          id: 'GeneralInfoFacet',
          purpose: #STANDARD,
          type: #COLLECTION,
          label: 'Supplier Details',
          position: 10
        },
        {
          id: 'SupplierIdentification',
          parentId: 'GeneralInfoFacet',
          type: #IDENTIFICATION_REFERENCE,
          label: 'General Information',
          position: 10
        },
        {
          id: 'ComplianceFacet',
          purpose: #STANDARD,
          type: #LINEITEM_REFERENCE,
          label: 'Compliance Documents',
          position: 20,
          targetElement: '_ComplianceDocuments'
        },
        {
          id: 'RiskFacet',
          purpose: #STANDARD,
          type: #LINEITEM_REFERENCE,
          label: 'Risk Assessments',
          position: 30,
          targetElement: '_RiskAssessments'
        },
        {
          id: 'PerformanceFacet',
          purpose: #STANDARD,
          type: #LINEITEM_REFERENCE,
          label: 'Performance Scorecards',
          position: 40,
          targetElement: '_Performance'
        },
        {
          id: 'AuditFacet',
          purpose: #STANDARD,
          type: #LINEITEM_REFERENCE,
          label: 'Audit History Ledger',
          position: 50,
          targetElement: '_AuditHistory'
        }
      ]

      @UI.lineItem: [
        { position: 10, label: 'Supplier ID' },
        { type: #FOR_ACTION, dataAction: 'approveSupplier', label: 'Approve Supplier', position: 10 },
        { type: #FOR_ACTION, dataAction: 'rejectSupplier',  label: 'Reject Supplier',  position: 20 },
        { type: #FOR_ACTION, dataAction: 'blockSupplier',   label: 'Block Supplier',   position: 30 },
        { type: #FOR_ACTION, dataAction: 'unblockSupplier', label: 'Unblock Supplier', position: 40 },
        { type: #FOR_ACTION, dataAction: 'reassessRisk',    label: 'Reassess Risk',    position: 50 }
      ]
      @UI.identification: [
        { position: 10, label: 'Supplier ID' },
        { type: #FOR_ACTION, dataAction: 'approveSupplier', label: 'Approve Supplier', position: 10 },
        { type: #FOR_ACTION, dataAction: 'rejectSupplier',  label: 'Reject Supplier',  position: 20 },
        { type: #FOR_ACTION, dataAction: 'blockSupplier',   label: 'Block Supplier',   position: 30 },
        { type: #FOR_ACTION, dataAction: 'unblockSupplier', label: 'Unblock Supplier', position: 40 },
        { type: #FOR_ACTION, dataAction: 'reassessRisk',    label: 'Reassess Risk',    position: 50 }
      ]
      @UI.selectionField: [ { position: 10 } ]
      @Search.defaultSearchElement: true
  key SupplierID,

      @UI.lineItem: [ { position: 20, label: 'Supplier Name' } ]
      @UI.identification: [ { position: 20, label: 'Supplier Name' } ]
      @UI.selectionField: [ { position: 20 } ]
      @Search.defaultSearchElement: true
      @Search.fuzzinessThreshold: 0.8
      SupplierName,

      @UI.lineItem: [ { position: 30, label: 'Country' } ]
      @UI.identification: [ { position: 30, label: 'Country' } ]
      @UI.selectionField: [ { position: 30 } ]
      Country,

      @UI.identification: [ { position: 40, label: 'Street Address' } ]
      Address,

      @UI.lineItem: [ { position: 40, label: 'City' } ]
      @UI.identification: [ { position: 50, label: 'City' } ]
      City,

      @UI.identification: [ { position: 60, label: 'State / Region' } ]
      State,

      @UI.identification: [ { position: 70, label: 'Postal Code' } ]
      PostalCode,

      @UI.lineItem: [ { position: 50, label: 'Contact Person' } ]
      @UI.identification: [ { position: 80, label: 'Contact Person' } ]
      ContactPerson,

      @UI.lineItem: [ { position: 60, label: 'Email' } ]
      @UI.identification: [ { position: 90, label: 'Email' } ]
      Email,

      @UI.identification: [ { position: 100, label: 'Phone' } ]
      Phone,

      @UI.lineItem: [ { position: 70, label: 'Category' } ]
      @UI.identification: [ { position: 110, label: 'Category' } ]
      @UI.selectionField: [ { position: 40 } ]
      Category,

      @UI.identification: [ { position: 120, label: 'Tax Identification Number' } ]
      TaxNumber,

      @UI.lineItem: [ { position: 80, label: 'Supplier Status', criticality: 'StatusCriticality' } ]
      @UI.identification: [ { position: 130, label: 'Supplier Status' } ]
      @UI.selectionField: [ { position: 50 } ]
      Status,

      case Status
        when 'APPROVED'     then 3 -- Green
        when 'UNDER REVIEW' then 2 -- Yellow
        when 'BLOCKED'      then 1 -- Red
        when 'REJECTED'     then 1 -- Red
        else 0
      end as StatusCriticality,

      CreatedBy,
      CreatedAt,
      LastChangedBy,
      LastChangedAt,
      LocalLastChangedAt,

      /* Compositions */
      _ComplianceDocuments : redirected to composition child ZC_ComplianceDoc_M,
      _RiskAssessments     : redirected to composition child ZC_RiskAssessment_M,
      _Performance         : redirected to composition child ZC_SupplierPerf_M,
      _AuditHistory        : redirected to composition child ZC_AuditHistory_M
}
