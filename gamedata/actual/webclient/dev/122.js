view.registerAnimationHook({key:"captureProperty",prepare:function(e,t){var o=model.properties[t];controller.updateUnitStatus(e),20===o.capturePoints?view.showInfoMessage(model.localized("propertyCaptured")):view.showInfoMessage(model.localized("propertyPointsLeft")+" "+o.capturePoints)},render:function(){},update:function(){},isDone:function(){return!view.hasInfoMessage()}});