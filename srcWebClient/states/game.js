util.scoped(function(){
    
  function setupAnimationFrame(){
    if( constants.DEBUG ) util.log("setup animation frame");
    
    // PREPARE LOOP
    controller.prepareGameLoop();
    
    var oldTime = new Date().getTime();
    function looper(){
      if( !controller.inGameRound ){
        controller.screenStateMachine.event("gameHasEnded");
        return;
      }
      
      requestAnimationFrame( looper );
      
      var now = new Date().getTime();
      var delta = now - oldTime;
      oldTime = now;
      
      controller.gameLoop( delta );
    }
    
    // ENTER LOOP
    requestAnimationFrame( looper );
  }
  
  // -----------------------------------------------------------------------------------------------
  
  controller.screenStateMachine.structure.GAMEROUND = Object.create(controller.stateParent);
  
	controller.screenStateMachine.structure.GAMEROUND.section = "cwt_game_screen";
	
  controller.screenStateMachine.structure.GAMEROUND.enterState = function(){

    // start
    controller.setCursorPosition(0,0);
    controller.startGameRound();

    // update unit stats
    for( var i=0,e=model.units.length; i<e; i++ ){
      if( model.units[i].owner !== constants.INACTIVE_ID ) controller.updateUnitStatus( i );
    }
    
    // prepare screen and screen data
    view.resizeCanvas();
    view.updateMapImages();
    view.completeRedraw();
    
    // go into max zoom ( TODO: grab it from settings later on )
    controller.setScreenScale(2);
        
    // INIT LOOP
    setupAnimationFrame();
  };
  
  controller.screenStateMachine.structure.GAMEROUND.gameHasEnded = function(){
    return "MAIN";
  };
  
  
  
  // ++++++++++++ INPUT MOVE ++++++++++++
  
  controller.screenStateMachine.structure.GAMEROUND.LEFT = function( ev, distance ){
    controller.hideAttackRangeInfo();
    
    // IN TARGET TILE SELECTION MODE ?
    var state = controller.stateMachine.state;
    if( state === "ACTION_SELECT_TARGET_A" || state === "ACTION_SELECT_TARGET_B" ){
      controller.stateMachine.data.selection.nextValidPosition(
        controller.mapCursorX, controller.mapCursorY,
        0, true, controller.setCursorPosition
      );
      return this.breakTransition();
    }
    
    if( !distance ) distance = 1;
    
    if( distance === 1 ) controller.moveCursor( model.moveCodes.LEFT, distance );
    else controller.shiftScreenPosition( model.moveCodes.LEFT, distance );
    
    return this.breakTransition();
  };
  
  controller.screenStateMachine.structure.GAMEROUND.RIGHT = function( ev, distance ){
    controller.hideAttackRangeInfo();
    
    // IN TARGET TILE SELECTION MODE ?
    var state = controller.stateMachine.state;
    if( state === "ACTION_SELECT_TARGET_A" || state === "ACTION_SELECT_TARGET_B" ){
      controller.stateMachine.data.selection.nextValidPosition(
        controller.mapCursorX, controller.mapCursorY,
        0, false, controller.setCursorPosition
      );
      return this.breakTransition();
    }
    
    if( !distance ) distance = 1;
    
    if( distance === 1 ) controller.moveCursor( model.moveCodes.RIGHT, distance );
    else controller.shiftScreenPosition( model.moveCodes.RIGHT, distance );
    return this.breakTransition();
  };
  
  controller.screenStateMachine.structure.GAMEROUND.UP = function( ev, distance ){
    controller.hideAttackRangeInfo();
    
    var state = controller.stateMachine.state;
    
    // IN TARGET TILE SELECTION MODE ?
    if( state === "ACTION_SELECT_TARGET_A" || state === "ACTION_SELECT_TARGET_B" ){
      controller.stateMachine.data.selection.nextValidPosition(
        controller.mapCursorX, controller.mapCursorY,
        0, true, controller.setCursorPosition
      );
      return this.breakTransition();
    }
    
    var inMenu = ( state === "ACTION_MENU" || state === "ACTION_SUBMENU" );
    
    if( !distance ) distance = 1;
    
    if( !inMenu ){
      if( distance === 1 ) controller.moveCursor( model.moveCodes.UP, distance );
      else controller.shiftScreenPosition( model.moveCodes.UP, distance );
    }
    else controller.decreaseMenuCursor();
    return this.breakTransition();
  };
  
  controller.screenStateMachine.structure.GAMEROUND.DOWN = function( ev, distance ){
    controller.hideAttackRangeInfo();
    
    var state = controller.stateMachine.state;
    
    // IN TARGET TILE SELECTION MODE ?
    if( state === "ACTION_SELECT_TARGET_A" || state === "ACTION_SELECT_TARGET_B" ){
      controller.stateMachine.data.selection.nextValidPosition(
        controller.mapCursorX, controller.mapCursorY,
        0, false, controller.setCursorPosition
      );
      return this.breakTransition();
    }
    
    var inMenu = ( state === "ACTION_MENU" || state === "ACTION_SUBMENU" );
    
    if( !distance ) distance = 1;
    
    if( !inMenu ){ 
      if( distance === 1 ) controller.moveCursor( model.moveCodes.DOWN, distance );
      else controller.shiftScreenPosition( model.moveCodes.DOWN, distance );
    }
    else controller.increaseMenuCursor();
    return this.breakTransition();
  };
  
  
  // ++++++++++++ INPUT ACTIONS ++++++++++++
  
  controller.screenStateMachine.structure.GAMEROUND.ACTION = function( ev,x,y ){
    controller.hideAttackRangeInfo();
    
    if( typeof x === "number" ){
      controller.eraseWantedCursorPosition();
      controller.setCursorPosition(x,y);
    }
    
    controller.cursorActionClick();
    return this.breakTransition();
  };
  
  controller.screenStateMachine.structure.GAMEROUND.HOVER = function( ev,x,y ){
    controller.setWantedCursorPosition(x,y);
    return this.breakTransition();
  };
  
  controller.screenStateMachine.structure.GAMEROUND.CANCEL = function( ev,x,y ){
    controller.hideAttackRangeInfo();
    
    if( typeof x === "number" ){
      controller.eraseWantedCursorPosition();
      controller.setCursorPosition(x,y);
    }
    
    controller.cursorActionCancel();
    return this.breakTransition();
  };
  
  
  
  // ++++++++++++ INPUT SPECIAL ++++++++++++
  
  controller.screenStateMachine.structure.GAMEROUND.SPECIAL_1 = function(){
    return this.breakTransition();
  };
  
  controller.screenStateMachine.structure.GAMEROUND.SPECIAL_2 = function(){
    return this.breakTransition();
  };
  
  controller.screenStateMachine.structure.GAMEROUND.SPECIAL_3 = function(){
    if( !controller.attackRangeVisible ){
      controller.showAttackRangeInfo();
    }
    return this.breakTransition();
  };
  
  controller.screenStateMachine.structure.GAMEROUND.SPECIAL_4 = function(){
    return this.breakTransition();
  };
  
  controller.screenStateMachine.structure.GAMEROUND.SPECIAL_5 = function(){
    controller.setScreenScale( controller.screenScale+1 );
    return this.breakTransition();
  };
  
  controller.screenStateMachine.structure.GAMEROUND.SPECIAL_6 = function(){
    controller.setScreenScale( controller.screenScale-1 );
    return this.breakTransition();
  };
  
});