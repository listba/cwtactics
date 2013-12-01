controller.registerInvokableCommand("battleBetween"),controller.defineEvent("battleBetween"),controller.defineEvent("mainAttack"),controller.defineEvent("counterAttack"),controller.defineGameConfig("daysOfPeace",0,50,0),controller.defineGameScriptable("minrange",1,constants.MAX_SELECTION_RANGE-1),controller.defineGameScriptable("maxrange",1,constants.MAX_SELECTION_RANGE),controller.defineGameScriptable("att",50,400),controller.defineGameScriptable("def",50,400),controller.defineGameScriptable("counteratt",50,400),controller.defineGameScriptable("luck",-50,50),controller.defineGameScriptable("firstcounter",0,1),controller.defineGameScriptable("comtowerbonus",1,100),controller.defineGameScriptable("terraindefense",0,12),controller.defineGameScriptable("terraindefensemodifier",10,300),model.unitTypeParser.addHandler(function(e){var t,o,n,r,l,a,i;if(!util.expectNumber(e,"ammo",!0,!0,0,9))return!1;if(util.expectObject(e,"attack",!1)===util.expectMode.DEFINED){if(att=e.attack,!util.expectNumber(att,"minrange",!1,!0,1))return!1;if(!util.expectNumber(att,"maxrange",!1,!0,att.minrange+1))return!1;for(n=0,l=model.wpKeys_.length;a>n;n++)if(expectObject(att,model.wpKeys_[n],!1))for(i=att[model.wpKeys_[n]],t=Object.keys(i),r=0,a=t.length;a>r;r++)if(o=t[r],!util.expectNumber(i,o,!0,!0,1))return!1}}),model.isPeacePhaseActive=function(){return model.day-1<controller.configValue("daysOfPeace")},model.tileTypeParser.addHandler(function(e){return util.expectNumber(e,"defense",!0,!0,0,6)?void 0:!1}),model.unitFiretype={DIRECT:0,INDIRECT:1,BALLISTIC:2,NONE:3},model.wpKeys_=["main_wp","sec_wp"],model.attackRangeMod_=function(e,t,o,n,r){var l=n!==void 0;r||(r=!1);var a=model.units[e],i=model.players[a.owner].team,s=a.type.attack;if(1===arguments.length&&(t=a.x,o=a.y),s===void 0)return!1;if(model.hasMainWeapon(a.type)&&!model.hasSecondaryWeapon(a.type)&&a.type.ammo>0&&0===a.ammo)return!1;var c=1,d=1;a.type.attack.minrange&&(controller.prepareTags(t,o,e),c=controller.scriptedValue(a.owner,"minrange",a.type.attack.minrange),d=controller.scriptedValue(a.owner,"maxrange",a.type.attack.maxrange));var u,m,p=o-d,E=o+d;for(0>p&&(p=0),E>=model.mapHeight&&(E=model.mapHeight-1);E>=p;p++){var f=Math.abs(p-o);for(u=t-d+f,m=t+d-f,0>u&&(u=0),m>=model.mapWidth&&(m=model.mapWidth-1);m>=u;u++)if(r)model.distance(t,o,u,p)>=c&&n.setValueAt(u,p,1);else{if(0===model.fogData[u][p])continue;if(model.distance(t,o,u,p)>=c){var _=model.unitPosMap[u][p];if(null!==_&&model.players[_.owner].team!==i){var h=model.baseDamageAgainst(a,_);if(h>0){if(!l)return!0;n.setValueAt(u,p,h)}}}}}return!1},model.hasMainWeapon=function(e){var t=e.attack;return t!==void 0&&t.main_wp!==void 0},model.hasSecondaryWeapon=function(e){var t=e.attack;return t!==void 0&&t.sec_wp!==void 0},model.getUnitFireType=function(e){if(!model.hasMainWeapon(e)&&!model.hasSecondaryWeapon(e))return model.unitFiretype.NONE;if("number"==typeof e.attack.minrange){var t=e.attack.minrange;return 1===t?model.unitFiretype.BALLISTIC:model.unitFiretype.INDIRECT}return model.unitFiretype.DIRECT},model.isIndirectUnit=function(e){return model.getUnitFireType(model.units[e].type)===model.unitFiretype.INDIRECT},model.isBallisticUnit=function(e){return model.getUnitFireType(model.units[e].type)===model.unitFiretype.BALLISTIC},model.canUseMainWeapon=function(e,t){var o,n=e.type.attack,r=t.type.ID;return e.ammo>0&&void 0!==n.main_wp&&(o=n.main_wp[r],"number"==typeof o)?!0:!1},model.hasTargets=function(e,t,o){return model.attackRangeMod_(e,t,o)},model.baseDamageAgainst=function(e,t,o){var n,r=e.type.attack,l=t.type.ID;return o===void 0&&(o=!0),o&&e.ammo>0&&void 0!==r.main_wp&&(n=r.main_wp[l],"number"==typeof n)?n:void 0!==r.sec_wp&&(n=r.sec_wp[l],"number"==typeof n)?n:-1},model.battleDamageAgainst=function(e,t,o,n,r){var l=model.baseDamageAgainst(e,t,n),a=model.unitHpPt(e),i=model.unitHpPt(t);controller.prepareTags(e.x,e.y);var s=parseInt(o/100*controller.scriptedValue(e.owner,"luck",10),10),c=controller.scriptedValue(e.owner,"att",100);r&&(c+=controller.scriptedValue(t.owner,"counteratt",0)),controller.prepareTags(t.x,t.y);var d=controller.scriptedValue(t.owner,"def",100),u=controller.scriptedValue(t.owner,"terraindefense",model.map[t.x][t.y].defense),m=(l*c/100+s)*(a/10)*((200-(d+u*i))/100);return m=parseInt(m,10),constants.DEBUG&&util.log("attacker:",model.extractUnitId(e),"[",l,"*",c,"/100+",s,"]*(",a,"/10)*[(200-(",d,"+",u,"*",i,"))/100]","=",m),m},util.scoped(function(){function e(e,t){var o=-1,n=-1;model.isValidPosition(e-1,t)&&!model.unitPosMap[e-1][t]&&(o=e-1,n=t),model.isValidPosition(e,t-1)&&!model.unitPosMap[e][t-1]&&(o=e,n=t-1),model.isValidPosition(e,t+1)&&!model.unitPosMap[e][t+1]&&(o=e,n=t+1),model.isValidPosition(e+1,t)&&!model.unitPosMap[e+1][t]&&(o=e+1,n=t),model.isValidPosition(e-1,t-1)&&!model.unitPosMap[e-1][t-1]&&(o=e-1,n=t-1),model.isValidPosition(e-1,t+1)&&!model.unitPosMap[e-1][t+1]&&(o=e-1,n=t+1),model.isValidPosition(e+1,t-1)&&!model.unitPosMap[e+1][t-1]&&(o=e+1,n=t-1),model.isValidPosition(e+1,t+1)&&!model.unitPosMap[e+1][t+1]&&(o=e+1,n=t+1)}model.battleBetween=function(t,o,n,r){var l,a=model.units[t],i=model.units[o],s=a.type,c=i.type,d=a.owner,u=i.owner,m=model.unitHpPt(i),p=model.unitHpPt(a),E=m;if(controller.events.battleBetween(t,o,l),l=model.battleDamageAgainst(a,i,n),model.damageUnit(o,l),controller.events.mainAttack(t,o,l),m-=model.unitHpPt(i),model.canUseMainWeapon(a,i)&&a.ammo--,m=parseInt(.1*m*c.cost,10),model.modifyPowerLevel(d,parseInt(.5*m,10)),model.modifyPowerLevel(u,m),E=100*(model.unitHpPt(i)/E),E=20>E?e(i.x,i.y,a.x,a.y):!1,E&&i.hp>0&&!model.isIndirectUnit(o)){var f=model.canUseMainWeapon(i,a);l=model.battleDamageAgainst(i,a,r,f,!0),model.damageUnit(t,l),controller.events.counterAttack(o,t,l),p-=model.unitHpPt(a),f&&i.ammo--,p=parseInt(.1*p*s.cost,10),model.modifyPowerLevel(u,parseInt(.5*p,10)),model.modifyPowerLevel(d,p)}}});