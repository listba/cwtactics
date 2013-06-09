util.scoped(function(){
  
  // TODO: REMOVE FUNCTION CONSTRUCTION IN EVERY STEP
  
  var context = null; 
  var bufferMap = {};
  var sfxGainNode;
  var musicGainNode;
  var currentMusic;
  
  var sfxStorageParam = "__volume_sfx__";
  var musicStorageParam = "__music_sfx__";
  
  /**
   *
   */
  controller.saveSoundConfigs = function(){
    if( DEBUG ){ 
      util.log("saving volume config in storage");
    }
    
    controller.storage.set( sfxStorageParam, sfxGainNode.gain.value );
    controller.storage.set( musicStorageParam, musicGainNode.gain.value );
  };
  
  /**
   * Returns a web audio context. If no context is initialized then it will be created first.
   */
  controller.audioContext = function(){
    if( !context ){
      
      // LOAD SOUND CONTEXT
      try{
        util.log("init audio context");
        
        if( window.AudioContext ) {
          util.log("using standardized one");
          context = new window.AudioContext();
        } 
        else if ( window.webkitAudioContext ) {
          util.log("using webkit prefixed one");
          context = new window.webkitAudioContext();
        }
        else throw Error("no webaudio contructor found");
        
        // ------------------------------------------------------------------
        
        // SOUND VOLUME
        sfxGainNode = context.createGainNode();
        sfxGainNode.gain.value = 1;
        sfxGainNode.connect(context.destination);   
        
        // MUSIC VOLUME
        musicGainNode = context.createGainNode();
        musicGainNode.gain.value = 0.5;
        musicGainNode.connect(context.destination);  
        
        // ------------------------------------------------------------------
        
        // GET VOLUME FROM CONFIG
        controller.storage.get( sfxStorageParam, function( obj ){
          if( obj !== null ) sfxGainNode.gain.value = obj.value;
        });
        
        controller.storage.get( musicStorageParam, function( obj ){
          if( obj !== null ) musicGainNode.gain.value = obj.value;
        });
        
        util.log("finished init audio context");
      }
      // RETURN ERROR WHEN SOUND CONTEXT IS NOT INITIALIZE ABLE 
      catch(e){
        if( DEBUG ) util.log("could not grab audio context, your environment seems to be out of webAudio API support err:",e);
        context = null;
      }
    }
    
    return context;
  };
  
  /**
   * 
   * @param {type} key
   * @param {type} buffer
   */
  controller.registerSoundFile = function( key, buffer ){
    bufferMap[key] = buffer;
  };
  
  /**
   * 
   */
  controller.getSfxVolume = function( vol ){   
    if( !context ) return 0;
    
    return sfxGainNode.gain.value;
  };
  
  /**
   * 
   */
  controller.getMusicVolume = function( vol ){  
    if( !context ) return 0;
    
    return musicGainNode.gain.value;
  };
  
  /**
   * 
   * @param {Number} vol
   */
  controller.setSfxVolume = function( vol ){    
    if( !context ) return;
    
    if( vol < 0 ) vol = 0;
    else if( vol > 1 ) vol = 1;
    
    sfxGainNode.gain.value = vol;
  };
  
  /**
   * 
   * @param {Number} vol
   */
  controller.setMusicVolume = function( vol ){    
    if( !context ) return;
    
    if( vol < 0 ) vol = 0;
    else if( vol > 1 ) vol = 1;
    
    musicGainNode.gain.value = vol;
  };
  
  
  /*
    // http://www.html5rocks.com/en/tutorials/webaudio/intro/
     
    source.loop = false;
    source.noteOff(0);
    source.noteOn(0); // Play immediately.
   */
  
  /**
   * Plays a sound effect.
   * 
   * @param {String} id
   * @param {Boolean} loop
   * @param {Boolean} isMusic
   */
  controller.playSound = function( id, loop, isMusic ){
    if( context === null ) return;
    
    var gainNode = (isMusic)? musicGainNode : sfxGainNode;
    var source = context.createBufferSource(); 
    
    // LOOP IF LOOP ATTRIBUTE IS TRUE
    if( loop ) source.loop = true;
    
    source.buffer = bufferMap[id];  
    source.connect(gainNode);
    
    //source.start(0);
    source.noteOn(0);
    
    return source;
  };
    
  controller.playEmptyAudio = function(){
    if( context === null ) return;
    
    var buffer = context.createBuffer(1, 1, 22050);
    var source = context.createBufferSource();
    source.buffer = buffer;
    
    // connect to output (your speakers)
    source.connect(context.destination);
    
    // play the file
    source.noteOn(0);
  }
  
  /**
   * Plays a background music.
   * 
   * @param {String} id
   */
  controller.playMusic = function( id ){
    if( context === null ) return;
    
    // STOP EXISTING BACKGROUND SOUND
    if( currentMusic ){
      currentMusic.noteOff(0);
      currentMusic.disconnect(0);
    }
    
    if( bufferMap[id] ) currentMusic = controller.playSound(id, true, true );
  };
  
});