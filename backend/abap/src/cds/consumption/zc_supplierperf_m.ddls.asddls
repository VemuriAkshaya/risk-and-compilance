@EndUserText.label : 'Supplier Performance Consumption View'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Metadata.allowExtensions: true
define view entity ZC_SupplierPerf_M
  as projection on ZI_SupplierPerf_M
{
      @UI.facet: [
        {
          id: 'PerformanceDetails',
          purpose: #STANDARD,
          type: #IDENTIFICATION_REFERENCE,
          label: 'Performance Metric Details',
          position: 10
        }
      ]

      @UI.lineItem: [ { position: 10, label: 'Performance ID' } ]
      @UI.identification: [ { position: 10, label: 'Performance ID' } ]
  key PerformanceID,

      @UI.lineItem: [ { position: 20, label: 'Supplier ID' } ]
      @UI.identification: [ { position: 20, label: 'Supplier ID' } ]
      SupplierID,

      @UI.lineItem: [ { position: 30, label: 'Quality Score' } ]
      @UI.identification: [ { position: 30, label: 'Quality Score' } ]
      QualityScore,

      @UI.lineItem: [ { position: 40, label: 'Delivery Score' } ]
      @UI.identification: [ { position: 40, label: 'Delivery Score' } ]
      DeliveryScore,

      @UI.lineItem: [ { position: 50, label: 'Overall Score (Avg)', criticality: 'PerfCriticality' } ]
      @UI.identification: [ { position: 50, label: 'Overall Score' } ]
      OverallScore,

      @UI.lineItem: [ { position: 60, label: 'Performance Status', criticality: 'PerfCriticality' } ]
      @UI.identification: [ { position: 60, label: 'Performance Status' } ]
      PerformanceStatus,

      case
        when OverallScore >= 85 then 3 -- Exemplary (Green)
        when OverallScore >= 70 then 2 -- Satisfactory (Yellow)
        else 1                         -- Needs improvement/Critical (Red)
      end as PerfCriticality,

      @UI.lineItem: [ { position: 70, label: 'Review Date' } ]
      @UI.identification: [ { position: 70, label: 'Review Date' } ]
      ReviewDate,

      CreatedBy,
      CreatedAt,
      LastChangedAt,
      LocalLastChangedAt,

      /* Associations */
      _Supplier : redirected to parent ZC_Supplier_M
}
