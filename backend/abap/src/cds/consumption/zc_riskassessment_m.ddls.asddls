@EndUserText.label : 'Risk Assessment Consumption View'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Metadata.allowExtensions: true
@Search.searchable: true
define view entity ZC_RiskAssessment_M
  as projection on ZI_RiskAssessment_M
{
      @UI.facet: [
        {
          id: 'RiskDetails',
          purpose: #STANDARD,
          type: #IDENTIFICATION_REFERENCE,
          label: 'Risk Assessment Record',
          position: 10
        }
      ]

      @UI.lineItem: [ { position: 10, label: 'Risk ID' } ]
      @UI.identification: [ { position: 10, label: 'Risk ID' } ]
  key RiskID,

      @UI.lineItem: [ { position: 20, label: 'Supplier ID' } ]
      @UI.identification: [ { position: 20, label: 'Supplier ID' } ]
      SupplierID,

      @UI.lineItem: [ { position: 30, label: 'Risk Score (0-100)' } ]
      @UI.identification: [ { position: 30, label: 'Risk Score (0-100)' } ]
      RiskScore,

      @UI.lineItem: [ { position: 40, label: 'Risk Level', criticality: 'RiskCriticality' } ]
      @UI.identification: [ { position: 40, label: 'Risk Level' } ]
      RiskLevel,

      case RiskLevel
        when 'LOW'    then 3 -- Green
        when 'MEDIUM' then 2 -- Yellow
        when 'HIGH'   then 1 -- Red
        else 0
      end as RiskCriticality,

      @UI.lineItem: [ { position: 50, label: 'Risk Factors' } ]
      @UI.identification: [ { position: 50, label: 'Risk Factors' } ]
      @Search.defaultSearchElement: true
      RiskFactors,

      @UI.lineItem: [ { position: 60, label: 'Comments' } ]
      @UI.identification: [ { position: 60, label: 'Comments' } ]
      Comments,

      @UI.lineItem: [ { position: 70, label: 'Assessment Date' } ]
      @UI.identification: [ { position: 70, label: 'Assessment Date' } ]
      AssessmentDate,

      CreatedBy,
      CreatedAt,
      LastChangedAt,
      LocalLastChangedAt,

      /* Associations */
      _Supplier : redirected to parent ZC_Supplier_M
}
