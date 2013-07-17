controller.unitAction({
  
  key:"attack",
  
  unitAction: true,
  targetSelectionType:"A",
  
  prepareTargets: function( data ){
    model.attackRangeMod_( data.source.unitId, data.target.x, data.target.y, data.selection );
  },
  
  condition: function( data ){
    var mode = data.thereIsUnitRelationShip( data.source, data.target );
    if( mode !== model.relationModes.NONE && mode !== model.relationModes.SAME_OBJECT ) return false;
    
    // CANNOT ATTACK IF PEACE PERIOD IS GIVEN
    if( model.day-1 < controller.configValue("daysOfPeace") ) return false;
    
    // CANNOT ATTACK IF INDIRECT UNIT WILL MOVE
    if( model.isIndirectUnit(data.source.unitId) && data.movePath.data.length > 0 ) return false;
    
    return model.hasTargets( data.source.unitId, data.target.x, data.target.y );
  },
          
  invoke: function( data ){
    controller.sharedInvokement("battleBetween",[
      data.source.unitId, 
      data.targetselection.unitId, 
      Math.round( Math.random()*100 ), 
      Math.round( Math.random()*100 ) 
    ]);
  }
});