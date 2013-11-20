controller.cutImages = util.singleLazyCall(function( err, baton ){
  if( err ){
    if( constants.DEBUG ) util.log("break at cutting images due error from previous inits"); 
    return baton.pass(true);
  }
  
  if( constants.DEBUG ) util.log("cutting images");
  
  baton.take();
  
  try{
    
    var imageData = model.data_graphics;
    
    var BASE_SIZE = imageData.baseSize;
    
    // UNIT
    var UNIT_IMG_H = BASE_SIZE*2;
    var UNIT_IMG_W = BASE_SIZE*2;
    var UNIT_IMG_NUM = 3;
    
    // PROPERTY
    var PROPERTY_IMG_H = BASE_SIZE*2;
    var PROPERTY_IMG_W = BASE_SIZE;
    var PROPERTY_IMG_NUM = 4;
    
    // TILE
    var TILE_IMG_H = BASE_SIZE*2;
    var TILE_IMG_W = BASE_SIZE;
    var TILE_IMG_NUM = 1;
    
    // STATUS IMAGE
    var STAT_IMG_H = BASE_SIZE/4;
    var STAT_IMG_W = BASE_SIZE/4;
    
    
    // BASED ON http://jsfiddle.net/pankajparashar/KwDhX/
    function flipImage(image, flipH, flipV) {
      var scaleH = flipH ? -1 : 1,
          scaleV = flipV ? -1 : 1,
          posX = flipH ? image.width * -1 : 0,
          posY = flipV ? image.height * -1 : 0;
      
      
      var nCanvas = document.createElement('canvas');
      nCanvas.height = image.height;
      nCanvas.width  = image.width;
      var nContext = nCanvas.getContext('2d');
      
      nContext.save();
      nContext.scale(scaleH, scaleV);
      nContext.drawImage(image, posX, posY, image.width, image.height);
      nContext.restore();
      
      return nCanvas;
    }
    
    
    // ----------------------------------------------------------------------
    
    if( constants.DEBUG ){ util.log("cutting unit commands into single types"); }
    
    var unitTypes = imageData.units;
    for( var i=0,e=unitTypes.length; i<e; i++ ){
      
      var nCanvas;
      var nContext;
      var red = .COLOR_RED;
      var tp = unitTypes[i][0];
      
      var img = .getUnitImageForType( tp, .IMAGE_CODE_IDLE, red );
      
      // LEFT
      nCanvas = document.createElement('canvas');
      nCanvas.height = 32;
      nCanvas.width  = 32*3;
      nContext = nCanvas.getContext('2d');
      nContext.drawImage( img, 0, 0, 32*3, 32, 0, 0, 32*3, 32 );
      .setUnitImageForType( nCanvas, tp, .IMAGE_CODE_IDLE, red );
      
      // LEFT INVERTED
      nCanvas = document.createElement('canvas');
      nCanvas.height = 32;
      nCanvas.width  = 32*3;
      nContext = nCanvas.getContext('2d');
      nContext.drawImage( img, 0, 0, 32*3, 32, 0, 0, 32*3, 32 );
      .setUnitImageForType(
        flipImage( nCanvas, true, false), tp,
        .IMAGE_CODE_IDLE_INVERTED, red
      );
      
      // MOVE LEFT
      nCanvas = document.createElement('canvas');
      nCanvas.height = 32;
      nCanvas.width  = 32*3;
      nContext = nCanvas.getContext('2d');
      nContext.drawImage( img, 32*9, 0, 32*3, 32, 0, 0, 32*3, 32 );
      .setUnitImageForType( nCanvas, tp, .IMAGE_CODE_LEFT, red );
      
      // MOVE LEFT INVERTED
      nCanvas = document.createElement('canvas');
      nCanvas.height = 32;
      nCanvas.width  = 32*3;
      nContext = nCanvas.getContext('2d');
      nContext.drawImage( img, 32*9, 0, 32*3, 32, 0, 0, 32*3, 32 );
      .setUnitImageForType(
        flipImage( nCanvas, true, false), tp,
        .IMAGE_CODE_RIGHT, red
      );
      
      // MOVE UP
      nCanvas = document.createElement('canvas');
      nCanvas.height = 32;
      nCanvas.width  = 32*3;
      nContext = nCanvas.getContext('2d');
      nContext.drawImage( img, 32*3, 0, 32*3, 32, 0, 0, 32*3, 32 );
      .setUnitImageForType( nCanvas, tp, .IMAGE_CODE_UP, red );
      
      // MOVE DOWN
      nCanvas = document.createElement('canvas');
      nCanvas.height = 32;
      nCanvas.width  = 32*3;
      nContext = nCanvas.getContext('2d');
      nContext.drawImage( img, 32*6, 0, 32*3, 32, 0, 0, 32*3, 32 );
      .setUnitImageForType( nCanvas, tp, .IMAGE_CODE_DOWN, red );
      
    }
    
    if( constants.DEBUG ){ util.log("cutting unit commands into single types done"); }
    
    // ----------------------------------------------------------------------
    
    if( constants.DEBUG ){ util.log("cutting misc into single types"); }
    
    var misc = imageData.misc;
    for( var i=0,e=misc.length; i<e; i++ ){
      var miscType = misc[i];
      if( miscType.length > 2 ){
        
        // CUT
        var img = .getInfoImageForType( miscType[0] );
        
        nCanvas = document.createElement('canvas');
        nContext = nCanvas.getContext('2d');
        
        if( miscType.length > 6 ){
          if( miscType[6] === true ){
            
            //TODO FIX THAT
            nCanvas.height = 32;
            nCanvas.width  = 32*3;
            
            nCanvas = flipImage( nCanvas, true, false);
            
            nContext = nCanvas.getContext('2d');
          }
          else{
            
            nCanvas.height = 16;
            nCanvas.width  = 16;
            nContext.save();
            nContext.translate(8,8);
            nContext.rotate( miscType[6] * Math.PI/180);
            nContext.translate(-8,-8);
          }
        }
        else{
          nCanvas.height = 16;
          nCanvas.width  = 16;
        }
        
        if( miscType.length > 6 && miscType[6] === true ){
          // TODO FIX THAT
          nContext.drawImage(
            img,
            miscType[2], miscType[3],
            miscType[4], miscType[5],
            0, 0,
            32*3, 32
          );
        }
        else{
          nContext.drawImage(
            img,
            miscType[2], miscType[3],
            miscType[4], miscType[5],
            0, 0,
            16, 16
          );
        }
        
        if( miscType.length > 6 ){
          nContext.restore();
        }
        
        .setInfoImageForType( nCanvas, miscType[0] );
      }
    }
    
    if( constants.DEBUG ){ util.log("cutting misc into single types done"); } 
    
    baton.pass(false);
  }
  catch( e ){
    controller.loadFault(e,baton);
  }
});
