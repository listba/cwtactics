controller.unitStatusMap=util.list(constants.MAX_UNITS_PER_PLAYER*constants.MAX_PLAYER,function(){return{HP_PIC:null,LOW_AMMO:!1,LOW_FUEL:!1,HAS_LOADS:!1,CAPTURES:!1,VISIBLE:!1}}),controller.getUnitStatusForUnit=function(e){var t=model.extractUnitId(e);return controller.unitStatusMap[t]},util.scoped(function(){function e(e,t,o,n){if(model.isValidPosition(e,t)){var r=model.unitPosMap[e][t];r&&(model.players[r.owner].team!==o&&(n.VISIBLE=!0),r.hidden&&(controller.unitStatusMap[model.extractUnitId(r)].VISIBLE=!0))}}function t(t,o){if(o||(o=controller.unitStatusMap[model.extractUnitId(t)]),o.VISIBLE=!0,t.hidden){o.VISIBLE=!1;var n=t.x,r=t.y,i=model.players[t.owner].team;e(n-1,r,i,o),e(n,r-1,i,o),e(n,r+1,i,o),e(n+1,r,i,o)}}controller.updateUnitStatus=function(e){var o=model.units[e];o.x,o.y;var n=controller.unitStatusMap[e],r=o.type,i=o.ammo,l=r.ammo;n.LOW_AMMO=parseInt(.25*l,10)>=i?!0:!1,0===l&&(n.LOW_AMMO=!1);var a=o.fuel,s=r.fuel;n.LOW_FUEL=parseInt(.25*s,10)>a?!0:!1;var c=-1;switch(90>=o.hp&&(c=parseInt(o.hp/10,10)+1),c){case 1:n.HP_PIC=view.getInfoImageForType("HP_1");break;case 2:n.HP_PIC=view.getInfoImageForType("HP_2");break;case 3:n.HP_PIC=view.getInfoImageForType("HP_3");break;case 4:n.HP_PIC=view.getInfoImageForType("HP_4");break;case 5:n.HP_PIC=view.getInfoImageForType("HP_5");break;case 6:n.HP_PIC=view.getInfoImageForType("HP_6");break;case 7:n.HP_PIC=view.getInfoImageForType("HP_7");break;case 8:n.HP_PIC=view.getInfoImageForType("HP_8");break;case 9:n.HP_PIC=view.getInfoImageForType("HP_9");break;default:n.HP_PIC=null}if(n.HAS_LOADS=-1>o.loadedIn?!0:!1,o.x>=0){var d=model.propertyPosMap[o.x][o.y];n.CAPTURES=null!==d&&20>d.capturePoints?!0:!1}t(o,n)}});