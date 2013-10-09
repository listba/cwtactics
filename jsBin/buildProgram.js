var builder = require( "./buildLibrary.js" );

function cleanFileList( path ){
  var entries = builder.getFileList( path );
    
  // search for a build file
  entries.forEach(function(el){
      if( el.match( /cwt.build$/ ) ){
        console.log("found build file for directory "+path);
        
        var newList = [];
        var content = builder.readAndConcatFiles([el]);
        var order = content.split("\n");
        
        order.forEach(function( sel ){
          newList.push( path+"/"+sel );
        });

        entries = newList;
      }
  });
  
  return entries;
}

var profs;
if( process.argv.length > 2 ){
  profs = [ process.argv[2] ];
}
else{
  profs = [ "normal", "min" ];
}

console.log("building profile(s) "+profs);
  
profs.forEach( function( folder ){
  
  console.log("doing build profile "+folder);
    
  var folderComplete = "dist/nightly/" + folder;
  var minimize = ( folder.match( /min$/ ) );
  var dirs, dir, i, e;
  var fileList = [ ];
  var fileListEng = [ ];

  // WIPE OUT DIRECTORY CONTENT
  builder.deleteFolderRecursive( folderComplete );
  builder.createFolder( folderComplete );

  [ "srcEngine", "srcWebClient" ].forEach( function( masterDir ){

		var engineDir = (masterDir === "srcEngine");
    console.log("check parent module "+masterDir);
    
    // READ ENGINE FILES
    dirs = cleanFileList( masterDir );
        
    for( i = 0, e = dirs.length; i < e; i++ ) {
      dir = dirs[i];
      
      if( dir.match( /.DS_Store$/ ) ) continue;
      
      console.log("processing module "+dir);

      // DO NOT BUILD HTML/CSS
      var mode = 0;
      if( dir.match( /css$/ ) ) mode = 1;
      if( dir.match( /html$/ ) ) mode = 2;

      var ext;
      switch(mode) {

        // JS
        case 0:
          ext = ".js";
          cleanFileList( dir ).forEach( function( el ){
            if( builder.getExtension( el ) !== ext ) return;

            var code;
            if( !minimize ) code = builder.readAndConcatFiles( [ el ] );
            else code = builder.uglifyCode( el );
            
            builder.writeToFile( code, folderComplete + "/" + fileList.length + ext );
            fileList.push( fileList.length + ext );
						if( engineDir ) fileListEng.push( fileList.length + ext );
          } );
          break;

          // CSS
        case 1:
          ext = ".css";
          cleanFileList( dir ).forEach( function( el ){
            if( builder.getExtension( el ) !== ext ) return;
            
            var code = builder.readAndConcatFiles( [ el ] );
            
            builder.writeToFile( code, folderComplete + "/" + fileList.length + ext );
            fileList.push( fileList.length + ext );
          } );
          break;

          // HTML
        case 2:
          ext = ".html";
          
          var htmlcode = [];
          cleanFileList( dir ).forEach( function( el ){
            
            if( el.match( /__files__$/ ) ){
              fileList.forEach( function( hel ){
                if( hel.match( /css$/ ) ) htmlcode.push("<link rel=\"stylesheet\" href=\""+hel+"\" />\n");
                else if( hel.match( /js/ ) ) htmlcode.push("<script src=\""+hel+"\"></script>\n");
                else throw Error();
              });
            }
            else{
              if( builder.getExtension( el ) !== ext ) return;
              htmlcode.push(builder.readAndConcatFiles([el]));
            }
          });
          
          builder.writeToFile( htmlcode.join("\n"), folderComplete + "/cwt.html" );
          fileList.push( "cwt.html" );
          break;
      }
    }

		// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // MANIFEST FILE

    // HEAD
    var manifestCode = [ "CACHE MANIFEST", "", "# VERSION " + new Date(), "" ];

    // CACHE
    fileList.forEach( function( el ){
      manifestCode.push( el );
    } );

    // END
    manifestCode.push( "", "NETWORK:", "*" );

    // WRITE FILE
    builder.writeToFile( manifestCode.join( "\n" ), folderComplete + "/cache.manifest" );
		
		// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // TEST FILE
		var testFileCode = [];
		var testsCode = [];
		
		testFileCode.push(builder.readAndConcatFiles( [ "testEngine/html/testStart.html" ] ));
		
    fileListEng.forEach( function( el ){
      testFileCode.push( "<script src=\"../"+el+"\"></script>\n" );
    } );
		
		cleanFileList( "testEngine/tests" ).forEach( function( el ){
			testsCode.push( builder.readAndConcatFiles([el]) );
    } );
		
		testFileCode.push( "<script src=\"tests.js\"></script>\n" );
		
		testFileCode.push(builder.readAndConcatFiles( [ "testEngine/html/testEnd.html" ] ));
		
    // WRITE FILE
		builder.deleteFolderRecursive( folderComplete+"/test" );
		builder.createFolder( folderComplete+"/test" );
    builder.writeToFile( testFileCode.join( "\n" ), folderComplete + "/test/testEngine.html" );
    builder.writeToFile( testsCode.join( "\n" ), folderComplete + "/test/tests.js" );
  } );
} );