util.scoped(function(){
  
  var expl_img;
  var rocket_img;
  
  function renderSmoke( x,y, step, distance ){
    step -= (distance-1);
    if( step < 0 || step > 9 ) return;
    
    var tileSize = TILE_LENGTH;
    var scx = 48*step;
    var scy = 0;
    var scw = 48;
    var sch = 48;
    var tcx = (x)*tileSize;
    var tcy = (y)*tileSize;
    var tcw = tileSize;
    var tch = tileSize;
    
    view.canvasCtx.drawImage(
      expl_img,
      scx,scy,
      scw,sch,
      tcx,tcy,
      tcw,tch
    );
    
    view.markForRedraw(x,y);
  }
  
  function checkStatus( x,y ){
    if( model.map_isValidPosition(x,y) ){
      var unit = model.unit_posData[x][y];
      if( unit !== null ){
        controller.updateUnitStatus( model.unit_extractId(unit) );
      }
    }
  }
  
  view.registerAnimationHook({
    key: "bombs_startFireSilo",
    
    prepare: function( x,y, siloId, tx,ty ){
      if( !rocket_img ) rocket_img = view.getInfoImageForType("FLYING_ROCKET");
      
      this.siloX = controller.getCanvasPosX(x);
      this.siloY = controller.getCanvasPosY(y);
      this.targetX = controller.getCanvasPosX(tx);
      this.targetY = controller.getCanvasPosY(ty);
      this.curX = this.siloX;
      this.curY = this.siloY;
      this.phase = 0;
    },
    
    render: function(){
      var tileSize = TILE_LENGTH;
      var scx = 0;
      var scy = 0;
      var scw = 24;
      var sch = 24;
      var tcx = (this.curX)*tileSize -4;
      var tcy = (this.curY)*tileSize -4;
      var tcw = tileSize +8;
      var tch = tileSize +8;
      
      view.canvasCtx.drawImage(
        rocket_img,
        scx,scy,
        scw,sch,
        tcx,tcy,
        tcw,tch
      );
      
      view.markForRedrawWithNeighboursRing( this.curX, this.curY );
    },
    
    update: function( delta ){
      var shift = ( delta/1000 ) * ( tileSize*8);
      
      if( this.phase === 0 ){
        
        // rocket flies up
        this.curY -= shift;
        
        if( this.curY <= 0 ){
          controller.setScreenPosition( this.targetX, this.targetY, true );
          
          this.curX = this.targetX;
          this.curY = 0;
          this.phase = 1;
        }
      }
      else {
        
        // rocket flies down
        this.curY += shift;
        
        if( this.curY >= this.targetX ){
          this.phase = 2;
        }
      }
    },
    
    isDone: function(){
      return (this.phase === 2);
    }
  });
  
  view.registerAnimationHook({
    
    key: "bombs_explosionAt",
    
    prepare: function( tx,ty, range, damage, owner ){
      if( !expl_img ) expl_img = view.getInfoImageForType("EXPLOSION_GROUND");
      controller.audio_playSound("ROCKET_IMPACT");
      
      this.x = tx;
      this.y = ty;   
      this.range = range;
      this.maxStep = 10+range+1;
      this.step = 0;
      this.time = 0;
    },
    
    render: function(){
      model.map_doInRange( this.x, this.y, this.range, renderSmoke, this.step );
    },
    
    update: function( delta ){
      this.time += delta;
      if( this.time > 75 ){
        this.step++;
        this.time = 0;
      }
    },
    
    isDone: function(){
      var done = this.step === this.maxStep;
      
      // RENDER HP LOST
      if( done ) model.map_doInRange( this.x, this.y, this.range, checkStatus );
      
      return done;
    }
    
  });

  view.registerAnimationHook({
    
    key: "bombs_fireCannon",
    
    prepare: function( prid, x,y ){
      var fireAnim = model.property_data[prid].type.assets.fireAnimation;
      assert( fireAnim.length === 5 );
      
      this.pic     = view.getInfoImageForType(fireAnim[0]);
      this.sizeX   = fireAnim[1];
      this.sizeY   = fireAnim[2];
      this.offsetX = fireAnim[3];
      this.offsetY = fireAnim[4];

      var prop = model.property_data[prid];
      this.curX    = prop.x;
      this.curY    = prop.y;

      this.step    = 0;
      this.time    = 0;

      controller.audio_playSound( model.property_data[prid].type.assets.fireSound);
    },
    
    render: function(){
      var tileSize = TILE_LENGTH;
      var scx = this.sizeX*this.step;
      var scy = 0;
      var scw = this.sizeX;
      var sch = this.sizeY;
      var tcx = (this.curX)*tileSize + this.offsetX;
      var tcy = (this.curY)*tileSize + this.offsetY;
      var tcw = this.sizeX;
      var tch = this.sizeY;
      
      view.canvasCtx.drawImage(
        this.pic,
        scx,scy,
        scw,sch,
        tcx,tcy,
        tcw,tch
      );
      
    },
    
    update: function( delta ){
      this.time += delta;
      if( this.time > 100 ){
        this.step++;
        this.time = 0;
      }
    },
    
    isDone: function(){
      return this.step === 6;
    }
    
  });

  view.registerAnimationHook({
    
    key: "bombs_fireLaser",
    
    prepare: function( tx,ty, range, damage, owner ){
      controller.audio_playSound( model.property_data[prid].type.assets.fireSound );
    },
    
    render: function(){
      
    },
    
    update: function( delta ){
      
    },
    
    isDone: function(){
      
    }
    
  });

});