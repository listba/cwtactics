controller.action_unitAction({

	key:"fireCannon",
	relation:[ "S","T", model.player_RELATION_MODES.SAME_OBJECT],

	condition: function( data ){
		return (
      model.bombs_isCannon( data.target.propertyId ) &&
      model.bombs_markCannonTargets( data.target.propertyId, data.selection )
    );
	},

	targetSelectionType: "A",
	prepareTargets: function( data ){
    	model.bombs_markCannonTargets( data.target.unitId, data.selection );
	},

	invoke: function( data ){
		controller.action_sharedInvoke( "bombs_fireCannon", [
			data.target.unitId,
			data.targetselection.x,
			data.targetselection.y
		]);
	}

});
