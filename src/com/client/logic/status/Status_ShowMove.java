package com.client.logic.status;

import com.customwarsTactics.service.StatusController;
import com.customwarsTactics.logic.states.Status_Interface;
import com.system.input.Controls;
import com.client.menu.GUI.MapDraw;
import com.client.menu.logic.Menu;
import com.customwarsTactics.logic.mapController.Move;
import com.client.model.object.Game;
import com.customwarsTactics.model.mapObjects.Tile;

/**
 * Move class.
 * 
 * @author tapsi
 * @version 8.1.2010, #1
 */
public class Status_ShowMove implements Status_Interface {

	public void update(int timePassed, MapDraw map) {
		
		// VARIABLES
    	int x = map.getCursorX();
    	int y = map.getCursorY();
    	Tile tile = Game.getMap().getTile(x, y);
    	if( tile == null ) return;
    	
    	// ADD THE CURRENT TILE TO WAY
		Move.toMoveWay(tile);
		
		if( Controls.isActionClicked() ){
			
			// IF NOT A CORRECT TARGET FOR MOVE, RETURN
			if( Move.getTiles().get(tile) == null || !Move.getTiles().get(tile).isMoveable() ) return;
			
			Move.completeWay();
			Menu.createUnitMenu( Move.getUnit() , Move.getTargetTile() );
			StatusController.setStatus( StatusController.Mode.MENU );
		}
		else if(Controls.isCancelClicked()) StatusController.setStatus( StatusController.Mode.WAIT );
	}
}

