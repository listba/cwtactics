util.scoped(function(){var t=[];controller.persistenceHandler=function(e,r){t.push(e,r)},controller.saveCompactModel=function(){for(var e={},r=1,n=t.length;n>r;r+=2)t[r].call(model,e);return JSON.stringify(e)},controller.loadCompactModel=function(e){try{for(var r=0,n=t.length;n>r;r+=2)t[r].call(model,e)}catch(n){return n.errorID===void 0&&(n=model.criticalError(constants.error.CLIENT_DATA_ERROR,constants.error.ILLEGAL_MAP_FORMAT,n)),n}}});