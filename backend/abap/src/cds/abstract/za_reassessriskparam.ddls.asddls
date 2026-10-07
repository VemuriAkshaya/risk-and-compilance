@EndUserText.label : 'Parameters for Reassessing Supplier Risk'
define abstract entity ZA_ReassessRiskParam {
  @EndUserText.label : 'New Risk Score (0-100)'
  RiskScore   : abap.dec(5,2);
  
  @EndUserText.label : 'Identified Risk Factors'
  RiskFactors : abap.char(255);
  
  @EndUserText.label : 'Assessment Comments / Notes'
  Comments    : abap.char(255);
}
