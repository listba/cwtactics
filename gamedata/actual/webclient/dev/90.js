view.mapImages=util.matrix(constants.MAX_MAP_WIDTH,constants.MAX_MAP_HEIGHT,null),util.scoped(function(){function e(e,t,o,n,r){if(0>e||0>t||e>=model.mapWidth||t>=model.mapHeight)return n[o]="",void 0;var i=r[model.map[e][t].ID];void 0===i&&(i=""),n[o]=i}function t(e,t,o,n){for(var r=0,i=e.length;i>r;r++){var l=e[r];if(!(""!==l[1]&&l[1]!==t[0]||""!==l[2]&&l[2]!==t[1]||""!==l[3]&&l[3]!==t[2]||""!==l[4]&&l[4]!==t[3])){if(!o){if(""!==l[5]&&l[5]!==t[4])continue;if(""!==l[6]&&l[6]!==t[5])continue;if(""!==l[7]&&l[7]!==t[6])continue;if(""!==l[8]&&l[8]!==t[7])continue}return l[0]}}return n}view.updateMapImages=function(){var o,n,r=model.mapWidth,i=model.mapHeight,l=e,a=t,s=[];for(o=0;r>o;o++)for(n=0;i>n;n++){var c=o,d=n,u=model.map[c][d].ID;if(model.graphics.connected[u]){var m=model.graphics.connectedKeys[u];5===model.graphics.connected[u][0].length?(l(o,n-1,0,s,m),l(o+1,n,1,s,m),l(o,n+1,2,s,m),l(o-1,n,3,s,m),view.mapImages[o][n]=a(model.graphics.connected[u],s,!0,u)):(l(o,n-1,0,s,m),l(o+1,n-1,1,s,m),l(o+1,n,2,s,m),l(o+1,n+1,3,s,m),l(o,n+1,4,s,m),l(o-1,n+1,5,s,m),l(o-1,n,6,s,m),l(o-1,n-1,7,s,m),view.mapImages[o][n]=a(model.graphics.connected[u],s,!1,u))}else view.mapImages[c][d]=u}}});