controller.registerInvokableCommand("doInRange"),model.map=util.matrix(constants.MAX_MAP_WIDTH,constants.MAX_MAP_HEIGHT,null),model.mapHeight=-1,model.mapWidth=-1,controller.persistenceHandler(function(e){model.mapWidth=e.mpw,model.mapHeight=e.mph;for(var t=0,o=model.mapWidth;o>t;t++)for(var r=0,n=model.mapHeight;n>r;r++)model.unitPosMap[t][r]=null,model.propertyPosMap[t][r]=null,model.map[t][r]=model.tileTypes[e.typeMap[e.map[t][r]]]},function(e){e.mpw=model.mapWidth,e.mph=model.mapHeight,e.map=[];for(var t={},o=0,r=0,n=model.mapWidth;n>r;r++){e.map[r]=[];for(var l=0,a=model.mapHeight;a>l;l++){var i=e.map[r][l].ID;t.hasOwnProperty(i)||(t[i]=o,o++),e.map[r][l]=t[i]}}e.typeMap=[];for(var s=Object.keys(t),c=0,d=s.length;d>c;c++)e.typeMap[t[s[c]]]=s[c]}),model.distance=function(e,t,o,r){var n=Math.abs(e-o),l=Math.abs(t-r);return n+l},model.isValidPosition=function(e,t){return e>=0&&t>=0&&model.mapWidth>e&&model.mapHeight>t},model.doInRange=function(e,t,o,r,n){var l,a,i=t-o,s=t+o;for(0>i&&(i=0),s>=model.mapHeight&&(s=model.mapHeight-1);s>=i;i++){var c=Math.abs(i-t);for(l=e-o+c,a=e+o-c,0>l&&(l=0),a>=model.mapWidth&&(a=model.mapWidth-1);a>=l;l++)r(l,i,n,Math.abs(l-e)+c)}};