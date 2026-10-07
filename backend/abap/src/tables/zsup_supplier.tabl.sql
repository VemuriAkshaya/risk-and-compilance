@EndUserText.label : 'Supplier Master Table'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #A
@AbapCatalog.dataMaintenance : #RESTRICTED
define table zsup_supplier {
  key client            : abap.clnt not null;
  key supplier_id       : abap.char(10) not null;
  supplier_name         : abap.char(80);
  country               : abap.char(3);
  address               : abap.char(100);
  city                  : abap.char(40);
  state                 : abap.char(40);
  postal_code           : abap.char(10);
  contact_person        : abap.char(80);
  email                 : abap.char(100);
  phone                 : abap.char(30);
  category              : abap.char(30);
  tax_number            : abap.char(30);
  status                : abap.char(20); -- NEW, APPROVED, REJECTED, BLOCKED, UNDER REVIEW
  
  -- Administrative Fields
  @Semantics.user.createdBy: true
  created_by            : abap.char(12);
  @Semantics.systemDateTime.createdAt: true
  created_at            : abap.utclong;
  @Semantics.user.lastChangedBy: true
  last_changed_by       : abap.char(12);
  @Semantics.systemDateTime.lastChangedAt: true
  last_changed_at       : abap.utclong;
  @Semantics.systemDateTime.localInstanceLastChangedAt: true
  local_last_changed_at : abap.utclong;
}
