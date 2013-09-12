controller.TaggedPosition = {
	
	clean: function(){
		
		// POSITION DATA
		this.x = -1;
		this.y = -1;
		this.unit = null;
		this.unitId = -1;
		this.property = null;
		this.propertyId = -1;
	},
	
	set: function( x,y ){
		this.x = x;
		this.y = y;
		
		var refObj;
		var isValid = (x !== -1 && y !== -1);
		var inFog = isValid ? (model.fogData[x][y] === 0) : false;
		
		// ----- UNIT -----
		refObj = isValid ? model.getUnitByPos(x,y): null;
		if( isValid && !inFog && refObj !== null && ( !refObj.hidden || refObj.owner === model.turnOwner || 
																								 model.players[ refObj.owner ].team === model.players[ model.turnOwner ].team ) ){
			
			this.unit = refObj;
			this.unitId = model.extractUnitId(refObj);
		}
		else {
			this.unit = null;
			this.unitId = -1;
		}
		
		// ----- PROPERTY -----
		refObj = isValid ? model.getPropertyByPos(x,y) : null;
		if( isValid /* && !inFog */ && refObj !== null ){
			
			this.property = refObj;
			this.propertyId = model.extractPropertyId(refObj);
		}
		else {
			this.property = null;
			this.propertyId = -1;
		}
	}
};

// ---

// The central finite state machine of the game engine.
//
controller.stateMachine = util.stateMachine({
	
	// ---
	
	NONE:{
		start:function(){
			if( constants.DEBUG ) util.log("Initializing game state machine");
			return "IDLE";
		}
	},
	
	IDLE: {
		onenter: function(){
			this.data.menu.clean();
			this.data.movePath.clean();
			
			this.data.action.selectedEntry = null;
			this.data.action.selectedSubEntry = null;
			this.data.action.object = null;
			
			this.clearHistory();
			
			this.data.inMultiStep = false;
			this.data.makeMultistep = true;
			
			this.data.source.clean();
			this.data.target.clean();
			this.data.targetselection.clean();
		},
		
		action: function(ev, x, y){
			this.data.source.set(x,y);
			
			if ( this.data.source.unitId !== constants.INACTIVE_ID && 
					this.data.source.unit.owner === model.turnOwner && 
					model.canAct( this.data.source.unitId ) ){
				
				this.data.target.set(x,y);
				this.data.movePath.clean();
				this.data.movePath.fillMoveMap();
        
        // cannot move atm
        if( this.data.selection.getValueAt(x-1,y) < 0 &&
            this.data.selection.getValueAt(x+1,y) < 0 &&
            this.data.selection.getValueAt(x,y-1) < 0 &&
            this.data.selection.getValueAt(x,y+1) < 0 ){
          
          this.data.target.set( x,y );
          return "ACTION_MENU";
        }
        else return "MOVEPATH_SELECTION";
			} 
			else{
				this.data.target.set( x,y );
				return "ACTION_MENU";
			}
		},
		
		cancel: function ( ev,x,y ) {
			return this.breakTransition();
		}
	},
	
	MOVEPATH_SELECTION: {
		
		onenter: function( ev, x,y ){
			//this.data.target.clean();
		},
		
		action: function( ev,x,y ){
			if( this.data.selection.getValueAt(x,y) < 0){
				if( DEBUG ) util.log("break event because selection is not in the selection map");
				return this.breakTransition();
			}
			
			var ox = this.data.target.x;
			var oy = this.data.target.y;
			var dis = model.distance( ox,oy, x,y );
			
			this.data.target.set( x,y );
			
			if( dis === 0 ){
				return "ACTION_MENU";
			}
			else if( dis === 1 ){
				
				// ADD TILE TO PATH
				var code = model.moveCodeFromAtoB( ox,oy, x,y );
				controller.stateMachine.data.movePath.addCodeToPath( x,y, code );
				return this.BREAK_TRANSITION;
			}
				else{
					
					// GENERATE PATH
					controller.stateMachine.data.movePath.setPathByRecalculation( x,y );
					return this.BREAK_TRANSITION;
				}
		},
		
		cancel: function(){
			this.data.target.clean();
			return this.backToLastState();
		}
		
	},
	
	// ---
	
	ACTION_MENU:{
		onenter: function(){
			this.data.menu.clean();
			this.data.menu.generate();
			if( this.data.menu.size === 0 ){        
				this.data.target.clean();
				return this.breakTransition();
			}
		},
		
		action:function( ev, index ){
			var action = this.data.menu.data[ index ];
			var actObj = controller.actionObjects[action];
			
			this.data.action.selectedEntry = action;
			this.data.action.object = actObj;
			
			if( actObj.prepareMenu !== null ) return "ACTION_SUBMENU";
			else if( actObj.isTargetValid !== null ) return "ACTION_SELECT_TILE";
				else if( actObj.prepareTargets !== null && actObj.targetSelectionType === "A" ) return this.data.selection.prepare();
				else return "FLUSH_ACTION";
		},
		
		cancel:function(){
			this.data.target.clean();
			return this.backToLastState();
		}
	},
	
	// ---
	
	ACTION_SUBMENU:{
		onenter: function(){
			if( !this.data.inMultiStep ){
				this.data.menu.clean();
				this.data.action.object.prepareMenu( this.data );
				if( this.data.menu.size === 0 ){        
					util.raiseError("sub menu cannot be empty");
				}
			}
		},
		
		action: function( ev, index ){
			var action = this.data.menu.data[ index ];
			
			if( action === "done" ){
				return "IDLE";
			}
			
			this.data.action.selectedSubEntry = action;
			
			if( this.data.action.object.prepareTargets !== null && 
				 this.data.action.object.targetSelectionType === "B" ){
				
				return this.data.selection.prepare();
			}
			else return "FLUSH_ACTION";
		},
		
		
		cancel: function(){
			if( this.data.inMultiStep ) return this.backToLastState();
			
			this.data.menu.clean();
			this.data.menu.generate();
			
			return this.backToLastState();
		}
	},
	
	// ---
	
	
	
	// ---
	
	ACTION_SELECT_TARGET_A: {
		
		onenter: function(){
			this.data.targetselection.clean();
		},
		
		action: function( ev,x,y ){
			if( this.data.selection.getValueAt(x,y) < 0){
				if( DEBUG ) util.log("break event because selection is not in the map");
				return this.breakTransition();
			}
			
			this.data.targetselection.set(x,y);
			
			return "FLUSH_ACTION";
		},
		
		cancel: function(){
			return this.backToLastState();
		}
		
	},
	
	// ---
	
	ACTION_SELECT_TARGET_B: {
		
		onenter: function(){
			this.data.targetselection.clean();
		},
		
		action: function( ev,x,y ){
			if( this.data.selection.getValueAt(x,y) < 0){
				if( DEBUG ) util.log("break event because selection is not in the map");
				return this.breakTransition();
			}
			
			this.data.targetselection.set(x,y);
			
			return "FLUSH_ACTION";
		},
		
		cancel: function(){
			return this.backToLastState();
		}
		
	},
	
	// ---
	
	ACTION_SELECT_TILE: {
		
		onenter: function(){
			this.data.targetselection.clean();
			
			var prepareSelection = this.data.action.object.prepareSelection;
			if( prepareSelection ) prepareSelection( this.data );
			else this.data.selectionRange = 1;
		},
		
		action: function( ev,x,y ){      
			if( this.data.action.object.isTargetValid( this.data, x,y) ){
				this.data.targetselection.set(x,y);
				
				return "FLUSH_ACTION";
			}
			else return this.breakTransition();
		},
		
		cancel: function(){
			this.data.targetselection.clean();
			return this.backToLastState();
		}
		
	},
	
	// ---
	
	FLUSH_ACTION: {
		actionState: function(){
			var trapped = controller.buildAction();
			
			// IF ACTION IS A MULTISTEP ACTION THEN PLACE A SYMBOLIC WAIT COMMAND
			if( !trapped && this.data.action.object.multiStepAction ){
				
				// this.data.inMultiStep = true;
				model.invokeNextStep_.callAsCommand();
				return "MULTISTEP_IDLE";
			}
			else return "IDLE";
		}  
	},
	
	// ---
	
	MULTISTEP_IDLE: {
		nextStep: function(){
			var actObj = this.data.action.object;
			
			this.data.movePath.clean();
			this.data.menu.clean();
			
			actObj.prepareMenu( this.data );
			this.data.menu.addEntry("done");
			
			this.data.inMultiStep = true;
			return ( this.data.menu.size > 1 )? "ACTION_SUBMENU": "IDLE";
			
		}
	}
	
	// ---
	
});