// # Mod Loading Module
//
// Loading strategy:
// 
// 1. Check local storage
// 2. Load new mod if 1. resolves to null
// 3. Load modification into the engine
//
controller.modification_load = util.singleLazyCall( function( err, baton ){
  if( constants.DEBUG ) util.log( "loading modification" );
  
  function addModPart( file, key, baton ){
    baton.take();
    util.grabRemoteFile({
      path: clientConstants.DEFAULT_MOD + file,
      json: true,
      
      error: function( msg ){
        baton.drop({ 
          message:msg, 
          stack:null 
        });
      },
      
      success: function( resp ){
        mod[key] = resp; 
        baton.pass();
      }
    });
  }
  
  function loadLanguage(p,b){ 
    
    // try to grab browser specific language
    var lang = window.navigator.language;
    if( lang && lang !== "en" ){
      b.take();
      util.grabRemoteFile({
        path: clientConstants.DEFAULT_MOD + (clientConstants.MOD_FILE_LANGUAGE.replace("$lang$","_"+lang)),
        json: true,
        
        error: function( msg ){
          util.grabRemoteFile({
            path: clientConstants.DEFAULT_MOD + clientConstants.MOD_FILE_LANGUAGE.replace("$lang$",""),
            json: true,
            
            error: function( msg ){
              baton.drop({ 
                message:msg, 
                stack:null 
              });
            },
            
            success: function( resp ){
              mod[clientConstants.MOD_KEY_LANGUAGE] = resp;
              b.pass();
            }
          });
        },
        
        success: function( resp ){
          mod[clientConstants.MOD_KEY_LANGUAGE] = resp;
          b.pass();
        }
      });
    }
    else addModPart( clientConstants.MOD_FILE_LANGUAGE.replace("$lang$",""), clientConstants.MOD_KEY_LANGUAGE, b ); 
  }
  
  // lock 
  baton.take();
  
  var mod;
  
  // create the loading workflow here
  jWorkflow.order()
  
  // **1.** check stored data
  .andThen(function( p,b ){
    b.take();
    controller.storage.get( clientConstants.MOD_KEY,function( obj ){
      if( obj === null ){
        mod = {};
        b.pass(true);
      }
      else{
        mod = obj.value;
        b.pass(false);
      }
    })
  })	
  
  // **2.** exists then skip loading
  .andThen(function( p,subBaton ){
    if( p ){
      if( constants.DEBUG ) util.log( "grab new modification" );
      
      subBaton.take();
      
      // load single components
      jWorkflow.order()
      .andThen(function(p,b){ addModPart( clientConstants.MOD_FILE_HEADER, 	clientConstants.MOD_KEY_HEADER, 		b ); })
      .andThen(function(p,b){ addModPart( clientConstants.MOD_FILE_CO, 			clientConstants.MOD_KEY_CO, 				b ); })
      .andThen(function(p,b){ addModPart( clientConstants.MOD_FILE_CREDITS,  clientConstants.MOD_KEY_CREDITS, 	b ); })
      .andThen(function(p,b){ addModPart( clientConstants.MOD_FILE_FRACTION, clientConstants.MOD_KEY_FRACTION, 	b ); })
      .andThen(function(p,b){ addModPart( clientConstants.MOD_FILE_GAMEMODE, clientConstants.MOD_KEY_GAMEMODE, 	b ); })
      .andThen(function(p,b){ addModPart( clientConstants.MOD_FILE_MAPS, 			clientConstants.MOD_KEY_MAPS, 			b ); })
      .andThen(function(p,b){ addModPart( clientConstants.MOD_FILE_MOVETYPES,	clientConstants.MOD_KEY_MOVETYPES, 	b ); })
      .andThen(function(p,b){ addModPart( clientConstants.MOD_FILE_RULES, 		clientConstants.MOD_KEY_RULES, 			b ); })
      .andThen(function(p,b){ addModPart( clientConstants.MOD_FILE_SOUNDS, 		clientConstants.MOD_KEY_SOUNDS, 		b ); })
      .andThen(function(p,b){ addModPart( clientConstants.MOD_FILE_TILES, 		clientConstants.MOD_KEY_TILES, 			b ); })
      .andThen(function(p,b){ addModPart( clientConstants.MOD_FILE_UNITS, 		clientConstants.MOD_KEY_UNITS, 			b ); })
        .andThen(function(p,b){ addModPart( clientConstants.MOD_FILE_WEATHER, 	clientConstants.MOD_KEY_WEATHER, 		b ); })
        .andThen(function(p,b){ addModPart( clientConstants.MOD_FILE_ASSETS, 	clientConstants.MOD_KEY_ASSETS, 		b ); })
      .andThen(function(p,b){ addModPart( clientConstants.MOD_FILE_GFX, 	   clientConstants.MOD_KEY_GFX, 		   b ); })
      .andThen( loadLanguage )
      .start(function(p){
        if( p ){
          if( constants.DEBUG ) util.log( "failed to grab modification" );
          subBaton.drop(p);
        }
        else {
          if( constants.DEBUG ) util.log( "finished grabbing modification" );
          subBaton.pass();
        }
      });
    }
  })
  
  // **3.** place mod
  .andThen(function(){
    model.modification_load( mod );
  })
  
  // **4.** end flow callback
  .start(function( p ){
    if( p ) baton.drop({ where:"modLoader", error:p });
    else 		baton.pass();
  });
} );