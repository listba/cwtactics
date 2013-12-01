controller.registerInvokableCommand("damageUnit"),controller.registerInvokableCommand("healUnit"),controller.registerInvokableCommand("hideUnit"),controller.registerInvokableCommand("joinUnits"),controller.registerInvokableCommand("unhideUnit"),controller.registerInvokableCommand("drainFuel"),controller.registerInvokableCommand("createUnit"),controller.registerInvokableCommand("destroyUnit"),controller.defineEvent("damageUnit"),controller.defineEvent("healUnit"),controller.defineEvent("hideUnit"),controller.defineEvent("joinUnits"),controller.defineEvent("unhideUnit"),controller.defineEvent("drainFuel"),controller.defineEvent("createUnit"),controller.defineEvent("destroyUnit"),controller.defineGameScriptable("fuelDrain",1,1),controller.defineGameConfig("noUnitsLeftLoose",0,1,0),controller.defineGameConfig("unitLimit",0,constants.MAX_UNITS_PER_PLAYER,0),model.unitTypeParser.addHandler(function(e){var t=constants.MAX_SELECTION_RANGE;return util.expectString(e,"movetype",!0)?util.isIn(e.movetype,model.moveTypes)?util.expectNumber(e,"range",!0,!0,0,t)?util.expectNumber(e,"fuel",!0,!0,0,99)?util.expectBoolean(e,"stealth",!1)?void 0:!1:!1:!1:!1:!1}),model.units=util.list(constants.MAX_PLAYER*constants.MAX_UNITS_PER_PLAYER,function(){return{hp:99,x:0,y:0,ammo:0,fuel:0,loadedIn:-1,type:null,hidden:!1,owner:constants.INACTIVE_ID}}),model.unitPosMap=util.matrix(constants.MAX_MAP_WIDTH,constants.MAX_MAP_HEIGHT,null),controller.persistenceHandler(function(e){for(var t,o=0,n=model.units.length;n>o;o++)model.units[o].owner=constants.INACTIVE_ID;if(e.units)for(var o=0,n=e.units.length;n>o;o++){t=e.units[o];var r=t[0],l=model.units[r];l.type=model.unitTypes[t[1]],l.x=t[2],l.y=t[3],l.hp=t[4],l.ammo=t[5],l.fuel=t[6],l.loadedIn=t[7],l.owner=t[8],model.unitPosMap[t[2]][t[3]]=l}},function(e){var t;e.units=[];for(var o=0,n=model.units.length;n>o;o++)t=model.units[o],t.owner!==constants.INACTIVE_ID&&e.units.push([model.extractUnitId(t),t.type.ID,t.x,t.y,t.hp,t.ammo,t.fuel,t.loadedIn,t.owner])}),model.getFirstUnitSlotId=function(e){return constants.MAX_UNITS_PER_PLAYER*e},model.getLastUnitSlotId=function(e){return constants.MAX_UNITS_PER_PLAYER*(e+1)-1},model.getUnitByPos=function(e,t){return model.unitPosMap[e][t]},model.extractUnitId=function(e){e||model.criticalError(constants.error.ILLEGAL_PARAMETERS,constants.error.PARAMETERS_MISSING);var t=model.units.indexOf(e);return-1===t&&model.criticalError(constants.error.ILLEGAL_PARAMETERS,constants.error.UNIT_NOT_FOUND),t},model.hasFreeUnitSlots=function(e){var t=controller.configValue("unitLimit");t||(t=9999999);for(var o=model.getFirstUnitSlotId(e),n=model.getLastUnitSlotId(e),r=0,l=!1;n>o;o++)if(model.units[o].owner===constants.INACTIVE_ID)l=!0;else if(r++,r>=t)return!1;return l},model.isTileOccupiedByUnit=function(e,t){var o=model.unitPosMap[e][t];return null===o?-1:model.extractUnitId(o)},model.countUnits=function(e){for(var t=0,o=model.getFirstUnitSlotId(e),n=model.getLastUnitSlotId(e);n>o;o++)model.units[o].owner!==constants.INACTIVE_ID&&t++;return t},model.unitHpPt=function(e){return parseInt(e.hp/10)+1},model.unitHpPtRest=function(e){var t=parseInt(e.hp/10)+1;return e.hp-t},model.ptToHp=function(e){return 10*e},model.damageUnit=function(e,t,o){var n=model.units[e];n||model.criticalError(constants.error.ILLEGAL_PARAMETERS,constants.error.UNIT_NOT_FOUND),n.hp-=t,o&&o>=n.hp?n.hp=o:0>=n.hp&&model.destroyUnit(e),controller.events.damageUnit(e,t,o)},model.healUnit=function(e,t,o){var n=model.units[e];if(n||model.criticalError(constants.error.ILLEGAL_PARAMETERS,constants.error.UNIT_NOT_FOUND),n.hp+=t,n.hp>99){if(o===!0){var r=n.hp-99;model.players[n.owner].gold+=parseInt(n.type.cost*r/100,10)}n.hp=99}controller.events.healUnit(e,t)},model.hideUnit=function(e){model.units[e].hidden=!0,controller.events.hideUnit(e)},model.unhideUnit=function(e){model.units[e].hidden=!1,controller.events.unhideUnit(e)},model.canJoin=function(e,t){var o=model.units[e],n=model.units[t];return model.hasLoadedIds(e)||model.hasLoadedIds(t)?!1:o.type===n.type&&90>n.hp},model.joinUnits=function(e,t){var o=model.units[e],n=model.units[t];n.type!==o.type&&model.criticalError(constants.error.ILLEGAL_PARAMETERS,constants.error.JOIN_TYPE_MISSMATCH),model.healUnit(t,model.ptToHp(model.unitHpPt(o)),!0),n.ammo+=o.ammo,n.ammo>n.type.ammo&&(n.ammo=n.type.ammo),n.fuel+=o.fuel,n.fuel>n.type.fuel&&(n.fuel=n.type.fuel),o.owner=constants.INACTIVE_ID,controller.events.joinUnits(e,t)},model.drainFuel=function(e){var t=model.units[e],o=t.type.dailyFuelDrain;"number"==typeof o&&(t.hidden&&t.type.dailyFuelDrainHidden&&(o=t.type.dailyFuelDrainHidden),t.fuel-=o,controller.events.drainFuel(e,o),0>=t.fuel&&model.destroyUnit(e))},model.createUnit=function(e,t,o,n){for(var r=model.getFirstUnitSlotId(e),l=model.getLastUnitSlotId(e);l>r;r++)if(model.units[r].owner===constants.INACTIVE_ID){var i=model.unitTypes[n],a=model.units[r];return a.hp=99,a.owner=e,a.type=i,a.ammo=i.ammo,a.fuel=i.fuel,a.loadedIn=-1,model.setUnitPosition(r,t,o),controller.events.createUnit(e,t,o,n,r),r}model.criticalError(constants.error.ILLEGAL_DATA,constants.error.NO_SLOT_FREE)},model.unitDistance=function(e,t){var o,n;return o=model.units[e],n=model.units[t],-1===n.x||-1===o.x?-1:Math.abs(o.x-n.x)+Math.abs(o.y-n.y)},model.destroyUnitSilent=function(e){model.clearUnitPosition(e);var t=model.units[e];t.owner=constants.INACTIVE_ID,1===controller.configValue("noUnitsLeftLoose")&&0===model.countUnits(t.owner)&&controller.endGameRound(),controller.events.destroyUnit(e)},model.destroyUnit=function(e){model.destroyUnitSilent(e)};