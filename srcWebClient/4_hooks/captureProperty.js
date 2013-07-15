view.registerAnimationHook({

  key: "captureProperty",

  prepare: function( cid, prid, px,py, points ){
    var property = model.properties[ prid ];
    controller.updateUnitStatus( cid );

    if( property.capturePoints === 20 ){
      view.showInfoMessage( model.localized("propertyCaptured") );
    }
    else view.showInfoMessage( model.localized("propertyPointsLeft")+" "+property.capturePoints );
  },

  render: function(){},
  update: function(){},

  isDone: function(){
    return !view.hasInfoMessage();
  }

});