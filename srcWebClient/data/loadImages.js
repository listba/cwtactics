// Load error handler.
//
controller.loadImages_loadFailed_ = function( ){
  if( DEBUG ) util.log("could not load",this.pickey_);
}

// Generic image loader.
//
controller.loadImages_loadSuccessful_ = function(){
  var mode    = this.mode_;
  var baton   = this.baton_;
  var key     = this.pickey_;

  if( this.saveIt_ ){
    controller.storage.set(
      this.src,
      Base64Helper.canvasToBase64(this),
      controller.loadImages_pictureSaved_
    );
  }

  // delete temporary data in the image object... just to be safe :P
  delete this.pickey_;
  delete this.baton_;
  delete this.mode_;
  delete this.saveIt_;

  // check mode and save the image to the correct game image slot.
  switch( mode ){

    case "U": view.setUnitImageForType( this, key, view.IMAGE_CODE_IDLE, view.COLOR_RED ); break;
    case "P": view.setPropertyImageForType( this, key, view.COLOR_RED ); break;
    case "T": view.setTileImageForType( this, key ); break;
    case "M": view.setInfoImageForType( this, key ); break;

    // error!
    default: assert(false);
  }

  // go on with the next image
  baton.pass();
};

// Save success handler.
//
controller.loadImages_pictureSaved_ = function( obj ){
  if( DEBUG ) util.log("saved image type",obj.key);
}

// Image loading process.
//
controller.loadImages_prepareImg_ = function(key,path,mode,baton){

  // append base path to the path
  path = model.data_paths.images + path;

  var img = new Image();

  // insert some meta data
  img.pickey_ = key;
  img.baton_  = baton;
  img.mode_   = mode;
  img.saveIt_ = false;
  img.onerror = controller.loadImages_loadFailed_;
  img.onload  = controller.loadImages_loadSuccessful_;

  controller.storage_assets.get(
    path,
    function(exists){

      if( exists ){
        // load it from cache

        controller.storage.get( key, function( obj ){
          img.src = "data:image/png;base64,"+obj.value;
        });

      } else {
        // load it from remote path

        img.saveIt_ = true;
        img.src     = path;
      }
    }
  );
};

//
//
controller.loadImages_doIt = util.singleLazyCall(
  function( err, baton ){
    if( DEBUG ) util.log("loading modification images");

    baton.take();

    var flow = jWorkflow.order(function(){
      return { i: 0, list: null };
    });

    // loading units
    util.iterateListByFlow(flow,model.data_unitTypes, function(data,baton){
      var obj = model.data_unitSheets[data.list[data.i]];
      controller.loadImages_prepareImg_( data.list[data.i],obj.assets.gfx,"U",baton );
    });

    // loading tiles
    util.iterateListByFlow(flow,model.data_tileTypes, function(data,baton){
      var key = data.list[data.i];
      var obj = model.data_tileSheets[key];
      controller.loadImages_prepareImg_( key,obj.assets.gfx,"T",baton );

      if( obj.assets.gfxOverlay ) view.overlayImages[ key ] = true;
      //view.animatedTiles[ img.pickey_ ] = true;
    });

    // loading properties
    util.iterateListByFlow(flow,model.data_propertyTypes, function(data,baton){
      var obj = model.data_tileSheets[data.list[data.i]];
      controller.loadImages_prepareImg_( data.list[data.i],obj.assets.gfx,"P",baton );
    });

    // loading cannon animations
    util.iterateListByFlow(flow,model.data_propertyTypes, function(data,baton){
      var obj = model.data_tileSheets[data.list[data.i]];
      if( obj.assets.fireAnimation ){
        controller.loadImages_prepareImg_(
          data.list[data.i],
          obj.assets.fireAnimation[0],
          "M",
          baton
        );
      }
    });

    // menu background images
    util.iterateListByFlow(flow,model.data_menu, function(data,baton){
      var obj = model.data_tileSheets[data.list[data.i]];
      controller.loadImages_prepareImg_( data.list[data.i],obj.assets.gfx,"M",baton );
    });

    // start loading
    flow.start(function( e ){
      if( e && DEBUG ) util.list("could not load modification images");
      if(!e && DEBUG ) util.list("loaded all modification images");

      baton.pass();
    })
  }
);