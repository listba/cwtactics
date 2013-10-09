util.scoped(function(){
  
  function saveComplete(){
    if( constants.DEBUG ) util.log("successfully set new mod path");
  }
  
  function wipeComplete(){
    document.location.reload();
  }

  function updateSoundContent(){  
    nodeSfx.innerHTML = Math.round(controller.getSfxVolume()*100);
    nodeMusic.innerHTML = Math.round(controller.getMusicVolume()*100);
  }
  
  var nodeSfx   = document.getElementById("cwt_options_sfxVolume");
  var nodeMusic = document.getElementById("cwt_options_musicVolume");
  
  var btn = controller.generateButtonGroup( 
    document.getElementById("cwt_options_screen"),
    "cwt_panel_header_big cwt_page_button w_400 cwt_panel_button",
    "cwt_panel_header_big cwt_page_button w_400 cwt_panel_button button_active",
    "cwt_panel_header_big cwt_page_button w_400 cwt_panel_button button_inactive"
  );
  
  // ------------------------------------------------------------------------------------------
  
  controller.screenStateMachine.structure.OPTIONS = Object.create(controller.stateParent);
  
	controller.screenStateMachine.structure.OPTIONS.section = "cwt_options_screen";
	
  controller.screenStateMachine.structure.OPTIONS.enterState = function(){  
    updateSoundContent();
    btn.setIndex(1);
  };
  
  controller.screenStateMachine.structure.OPTIONS.UP = function(){
    switch( btn.getActiveKey() ){
        
      case "options.sfx.up":
      case "options.music.up":
      case "options.music.down":
        btn.decreaseIndex();
        btn.decreaseIndex();
        break;

      default: 
        btn.decreaseIndex();
    }

    return this.breakTransition();
  };
  
  controller.screenStateMachine.structure.OPTIONS.DOWN = function(){
    switch( btn.getActiveKey() ){
        
      case "options.sfx.up":
      case "options.sfx.down":
      case "options.music.down":
        btn.increaseIndex();
        btn.increaseIndex();
        break;
                
      default: 
        btn.increaseIndex();
    }

    return this.breakTransition();
  };

  controller.screenStateMachine.structure.OPTIONS.LEFT = function(){
    switch( btn.getActiveKey() ){
      case "options.sfx.up":
      case "options.music.up":
        btn.decreaseIndex();
        break;
    }

    return this.breakTransition();
  };


  controller.screenStateMachine.structure.OPTIONS.RIGHT = function(){
    switch( btn.getActiveKey() ){
      case "options.sfx.down":
      case "options.music.down":
        btn.increaseIndex();
        break;
    }

    return this.breakTransition();
  };
  
  controller.screenStateMachine.structure.OPTIONS.ACTION = function(){
    switch( btn.getActiveKey() ){
        
      case "options.sfx.down":
        controller.setSfxVolume( controller.getSfxVolume()-0.05 );
        updateSoundContent();
        break;
        
      case "options.sfx.up":
        controller.setSfxVolume( controller.getSfxVolume()+0.05 );
        updateSoundContent();
        break;
        
      case "options.music.down":
        controller.setMusicVolume( controller.getMusicVolume()-0.05 );
        updateSoundContent();
        break;
        
      case "options.music.up":
        controller.setMusicVolume( controller.getMusicVolume()+0.05 );
        updateSoundContent();
        break;
        
      case "options.resetData":
        controller.storage.set("resetDataAtStart",{value:true}, wipeComplete );
        break;
        
      case "options.goBack": 
        controller.saveSoundConfigs();
        return "MAIN";
    }
    
    return this.breakTransition();
  };
    
  controller.screenStateMachine.structure.OPTIONS.CANCEL = function(){
    controller.saveSoundConfigs();
    return "MAIN";
  };
  
});