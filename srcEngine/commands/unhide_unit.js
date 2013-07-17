controller.unitAction({
  
  key:"unhideUnit",
  
  condition: function( data ){
    var mode = data.thereIsUnitRelationShip( data.source, data.target );
    if( mode !== model.relationModes.NONE && mode !== model.relationModes.SAME_OBJECT ) return false;
    
    return data.source.unit.hidden;
  },
  
  invoke: function( data ){
    controller.sharedInvokement("unhideUnit",[ data.source.unitId ]);
  }
  
});