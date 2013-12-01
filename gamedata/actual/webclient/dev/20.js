controller.TaggedPosition={clean:function(){this.x=-1,this.y=-1,this.unit=null,this.unitId=-1,this.property=null,this.propertyId=-1},set:function(t,e){this.x=t,this.y=e;var r,n=-1!==t&&-1!==e,o=n?0===model.fogData[t][e]:!1;r=n?model.getUnitByPos(t,e):null,!n||o||null===r||r.hidden&&r.owner!==model.turnOwner&&model.players[r.owner].team!==model.players[model.turnOwner].team?(this.unit=null,this.unitId=-1):(this.unit=r,this.unitId=model.extractUnitId(r)),r=n?model.getPropertyByPos(t,e):null,n&&null!==r?(this.property=r,this.propertyId=model.extractPropertyId(r)):(this.property=null,this.propertyId=-1)}},controller.stateMachine=util.stateMachine({NONE:{start:function(){return constants.DEBUG&&util.log("Initializing game state machine"),"IDLE"}},IDLE:{onenter:function(){this.data.menu.clean(),this.data.movePath.clean(),this.data.action.selectedEntry=null,this.data.action.selectedSubEntry=null,this.data.action.object=null,this.clearHistory(),this.data.inMultiStep=!1,this.data.makeMultistep=!0,this.data.source.clean(),this.data.target.clean(),this.data.targetselection.clean()},action:function(t,e,r){return this.data.source.set(e,r),this.data.source.unitId!==constants.INACTIVE_ID&&this.data.source.unit.owner===model.turnOwner&&model.canAct(this.data.source.unitId)?(this.data.target.set(e,r),this.data.movePath.clean(),this.data.movePath.fillMoveMap(),0>this.data.selection.getValueAt(e-1,r)&&0>this.data.selection.getValueAt(e+1,r)&&0>this.data.selection.getValueAt(e,r-1)&&0>this.data.selection.getValueAt(e,r+1)?(this.data.target.set(e,r),"ACTION_MENU"):"MOVEPATH_SELECTION"):(this.data.target.set(e,r),"ACTION_MENU")},cancel:function(){return this.breakTransition()}},MOVEPATH_SELECTION:{onenter:function(){},action:function(t,e,r){if(0>this.data.selection.getValueAt(e,r))return constants.DEBUG&&util.log("break event because selection is not in the selection map"),this.breakTransition();var n=this.data.target.x,o=this.data.target.y,i=model.distance(n,o,e,r);if(this.data.target.set(e,r),0===i)return"ACTION_MENU";if(1===i){var a=model.moveCodeFromAtoB(n,o,e,r);return controller.stateMachine.data.movePath.addCodeToPath(e,r,a),this.breakTransition()}return controller.stateMachine.data.movePath.setPathByRecalculation(e,r),this.breakTransition()},cancel:function(){return this.data.target.clean(),this.backToLastState()}},ACTION_MENU:{onenter:function(){return this.data.menu.clean(),this.data.menu.generate(),0===this.data.menu.size?(this.data.target.clean(),this.breakTransition()):void 0},action:function(t,e){var r=this.data.menu.data[e],n=controller.actionObjects[r];return this.data.action.selectedEntry=r,this.data.action.object=n,null!==n.prepareMenu?"ACTION_SUBMENU":null!==n.isTargetValid?"ACTION_SELECT_TILE":null!==n.prepareTargets&&"A"===n.targetSelectionType?this.data.selection.prepare():"FLUSH_ACTION"},cancel:function(){return this.data.target.clean(),this.backToLastState()}},ACTION_SUBMENU:{onenter:function(){this.data.inMultiStep||(this.data.menu.clean(),this.data.action.object.prepareMenu(this.data),0===this.data.menu.size&&util.raiseError("sub menu cannot be empty"))},action:function(t,e){var r=this.data.menu.data[e];return"done"===r?"IDLE":(this.data.action.selectedSubEntry=r,null!==this.data.action.object.prepareTargets&&"B"===this.data.action.object.targetSelectionType?this.data.selection.prepare():"FLUSH_ACTION")},cancel:function(){return this.data.inMultiStep?this.backToLastState():(this.data.menu.clean(),this.data.menu.generate(),this.backToLastState())}},ACTION_SELECT_TARGET_A:{onenter:function(){this.data.targetselection.clean()},action:function(t,e,r){return 0>this.data.selection.getValueAt(e,r)?(constants.DEBUG&&util.log("break event because selection is not in the map"),this.breakTransition()):(this.data.targetselection.set(e,r),"FLUSH_ACTION")},cancel:function(){return this.backToLastState()}},ACTION_SELECT_TARGET_B:{onenter:function(){this.data.targetselection.clean()},action:function(t,e,r){return 0>this.data.selection.getValueAt(e,r)?(constants.DEBUG&&util.log("break event because selection is not in the map"),this.breakTransition()):(this.data.targetselection.set(e,r),"FLUSH_ACTION")},cancel:function(){return this.backToLastState()}},ACTION_SELECT_TILE:{onenter:function(){this.data.targetselection.clean();var t=this.data.action.object.prepareSelection;t?t(this.data):this.data.selectionRange=1},action:function(t,e,r){return this.data.action.object.isTargetValid(this.data,e,r)?(this.data.targetselection.set(e,r),"FLUSH_ACTION"):this.breakTransition()},cancel:function(){return this.data.targetselection.clean(),this.backToLastState()}},FLUSH_ACTION:{actionState:function(){var t=controller.buildAction();return!t&&this.data.action.object.multiStepAction?(controller.localInvokement("invokeNextStep_",[]),"MULTISTEP_IDLE"):"IDLE"}},MULTISTEP_IDLE:{nextStep:function(){var t=this.data.action.object;return this.data.movePath.clean(),this.data.menu.clean(),t.prepareMenu(this.data),this.data.menu.addEntry("done"),this.data.inMultiStep=!0,this.data.menu.size>1?"ACTION_SUBMENU":"IDLE"}}});