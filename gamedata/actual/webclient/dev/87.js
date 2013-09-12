util.scoped(function(){
  
  var activeHock = null;
  var hasHocks = false;
  var savedDelta = 0;
  
  function tryToPopNextHook(){
    
    // CHECK HOOKS
    if( !view.hooksBuffer.isEmpty() ){
      hasHocks = true;
      var data = view.hooksBuffer.pop();
      var key = data[data.length-1];
      activeHock = view.animationHooks[ key ];
      activeHock.prepare.apply( activeHock, data );
    }
    else hasHocks = false;
  }
  
  /**
   * 
   */
  controller.prepareGameLoop = function(){
    savedDelta = 0;
  }
  
  /**
   * 
   * @param {type} delta
   * @returns {undefined}
   */
  controller.gameLoop = function( delta ){
    savedDelta += delta; // SAVE DELTAS FOR UPDATE LOGIC ( --> TURN TIMER AND SO ON )
    
    controller.updateInputCoolDown( delta );
    
    var inMove = (controller.moveScreenX !== 0 || controller.moveScreenY !== 0);
    
    // update mouse move
    if( controller.mapTargetCursorX !== -1 ){
      
      var mpx = controller.mapCursorX;
      var mpy = controller.mapCursorY;
      
      view.markForRedrawWithNeighboursRing( mpx, mpy );
      
      var dis = 0;
      
      if( mpx !== controller.mapTargetCursorX ){
        dis = mpx - controller.mapTargetCursorX;
        if( dis < 0 ) dis = -dis;
        
        if( dis > 25 )        dis = 5;
        else if( dis > 15 )   dis = 3;
        else if( dis > 5 )    dis = 2;
        else                  dis = 1;
        
        if( mpx < controller.mapTargetCursorX ) mpx += dis;
        else mpx -= dis;
      }
      
      if( mpy !== controller.mapTargetCursorY ){
        dis = mpy - controller.mapTargetCursorY;
        if( dis < 0 ) dis = -dis;
        
        if( dis > 25 )        dis = 5;
        else if( dis > 15 )   dis = 3;
        else if( dis > 5 )    dis = 2;
        else                  dis = 1;
        
        if( mpy < controller.mapTargetCursorY ) mpy += dis;
        else mpy -= dis;
      }
      
      controller.setCursorPosition(mpx,mpy);
      
      if( mpx === controller.mapTargetCursorX && 
          mpy === controller.mapTargetCursorY ){
        controller.eraseWantedCursorPosition();
      }
    }
    
    // IF SCREEN IS IN MOVEMENT THEN UPDATE THE MAP SHIFT
    if( inMove ) controller.solveMapShift();
    // ELSE UPDATE THE LOGIC
    else{
      
      // IF MESSAGE PANEL IS VISIBLE THEN BREAK PROCESS UNTIL
      // IT CAN BE HIDDEN
      if( view.hasInfoMessage() ){
        view.updateMessagePanelTime(delta);
      }
      else{
        
        // IF NO HOCKS ARE IN THE BUFFER THEN UPDATE THE LOGIC
        if( !hasHocks ){
          
          // UPDATE LOGIC
          controller.updateState( savedDelta );
          savedDelta = 0;
          
          // CHECK HOOKS
          tryToPopNextHook();
        }
        // ELSE EVALUATE ACTIVE HOCK
        else{
          activeHock.update(delta);
          if( activeHock.isDone() ) tryToPopNextHook();
        }
      }
      
      // UPDATE SPRITE ANIMATION
      view.updateSpriteAnimations( delta );
    }
    
    // RENDER SCREEN
    if( view.drawScreenChanges > 0 ) view.renderMap( controller.screenScale );
    
    // RENDER ACTIVE HOCK AND POP NEXT ONE WHEN DONE
    if( hasHocks ){
      activeHock.render();
    }
    else{
      
      // UPDATE SELECTION CURSOR
      if( controller.stateMachine.state === "ACTION_SELECT_TILE" ){
        
        var r = view.selectionRange;
        var x = controller.mapCursorX;
        var y = controller.mapCursorY;
        var lX;
        var hX;
        var lY = y-r;
        var hY = y+r;
        if( lY < 0 ) lY = 0;
        if( hY >= model.mapHeight ) hY = model.mapHeight-1;
        for( ; lY<=hY; lY++ ){
          
          var disY = Math.abs( lY-y );
          lX = x-r+disY;
          hX = x+r-disY;
          if( lX < 0 ) lX = 0;
          if( hX >= model.mapWidth ) hX = model.mapWidth-1;
          for( ; lX<=hX; lX++ ){
            
            view.markForRedraw(lX,lY);
          }
        }
      }
    }
    
  };
  
  controller.inAnimationHookPhase = function(){
    return hasHocks;
  };
  
});