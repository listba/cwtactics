view.registerAnimationHook({key:"trapWait",prepare:function(e){var t=model.units[e];this.time=0,this.xp=t.x+1,this.yp=t.y,this.x=(t.x+1)*TILE_LENGTH,this.y=t.y*TILE_LENGTH},render:function(){var e=view.getInfoImageForType("TRAPPED");view.canvasCtx.drawImage(e,this.x,this.y)},update:function(e){this.time+=e},isDone:function(){var e=this.time>1e3;if(e)for(var t=view.getInfoImageForType("TRAPPED"),o=this.yp,n=this.xp,r=n+parseInt(t.width/TILE_LENGTH,10);r>=n;n++)view.markForRedraw(n,o);return e}});