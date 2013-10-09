controller.propertyAction({
  
  key:"transferProperty",
  hasSubMenu: true,
	relationToProp:[ "S","T", model.relationModes.SAME_OBJECT ],
  
  condition: function( data ){
    return model.isPropertyTransferable( data.source.propertyId );
  },
  
  prepareMenu: function( data ){
		model.addTransferTargets( data.source.unit.property, data.menu );
  },
  
  invoke: function( data ){
    controller.sharedInvokement("transferProperty",[ 
			data.source.propertyId, 
			data.action.selectedSubEntry 
		]);
  }
});