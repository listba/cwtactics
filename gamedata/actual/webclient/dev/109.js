controller.loadModification=util.singleLazyCall(function(e,t){function o(e,t,o){o.take(),util.grabRemoteFile({path:clientConstants.DEFAULT_MOD+e,json:!0,error:function(e){o.drop({message:e,stack:null})},success:function(e){r[t]=e,o.pass()}})}function n(e,n){var i=window.navigator.language;i&&"en"!==i?(n.take(),util.grabRemoteFile({path:clientConstants.DEFAULT_MOD+clientConstants.MOD_FILE_LANGUAGE.replace("$lang$","_"+i),json:!0,error:function(){util.grabRemoteFile({path:clientConstants.DEFAULT_MOD+clientConstants.MOD_FILE_LANGUAGE.replace("$lang$",""),json:!0,error:function(e){t.drop({message:e,stack:null})},success:function(e){r[clientConstants.MOD_KEY_LANGUAGE]=e,n.pass()}})},success:function(e){r[clientConstants.MOD_KEY_LANGUAGE]=e,n.pass()}})):o(clientConstants.MOD_FILE_LANGUAGE.replace("$lang$",""),clientConstants.MOD_KEY_LANGUAGE,n)}constants.DEBUG&&util.log("loading modification"),t.take();var r;jWorkflow.order().andThen(function(e,t){t.take(),controller.storage.get(clientConstants.MOD_KEY,function(e){null===e?(r={},t.pass(!0)):(r=e.value,t.pass(!1))})}).andThen(function(e,t){e&&(constants.DEBUG&&util.log("grab new modification"),t.take(),jWorkflow.order().andThen(function(e,t){o(clientConstants.MOD_FILE_HEADER,clientConstants.MOD_KEY_HEADER,t)}).andThen(function(e,t){o(clientConstants.MOD_FILE_CO,clientConstants.MOD_KEY_CO,t)}).andThen(function(e,t){o(clientConstants.MOD_FILE_CREDITS,clientConstants.MOD_KEY_CREDITS,t)}).andThen(function(e,t){o(clientConstants.MOD_FILE_FRACTION,clientConstants.MOD_KEY_FRACTION,t)}).andThen(function(e,t){o(clientConstants.MOD_FILE_GAMEMODE,clientConstants.MOD_KEY_GAMEMODE,t)}).andThen(function(e,t){o(clientConstants.MOD_FILE_MAPS,clientConstants.MOD_KEY_MAPS,t)}).andThen(function(e,t){o(clientConstants.MOD_FILE_MOVETYPES,clientConstants.MOD_KEY_MOVETYPES,t)}).andThen(function(e,t){o(clientConstants.MOD_FILE_RULES,clientConstants.MOD_KEY_RULES,t)}).andThen(function(e,t){o(clientConstants.MOD_FILE_SOUNDS,clientConstants.MOD_KEY_SOUNDS,t)}).andThen(function(e,t){o(clientConstants.MOD_FILE_TILES,clientConstants.MOD_KEY_TILES,t)}).andThen(function(e,t){o(clientConstants.MOD_FILE_UNITS,clientConstants.MOD_KEY_UNITS,t)}).andThen(function(e,t){o(clientConstants.MOD_FILE_WEATHER,clientConstants.MOD_KEY_WEATHER,t)}).andThen(function(e,t){o(clientConstants.MOD_FILE_GFX,clientConstants.MOD_KEY_GFX,t)}).andThen(n).start(function(e){e?(constants.DEBUG&&util.log("failed to grab modification"),t.drop(e)):(constants.DEBUG&&util.log("finished grabbing modification"),t.pass())}))}).andThen(function(){model.loadModification(r)}).start(function(e){e?t.drop({where:"modLoader",error:e}):t.pass()})});