controller.defineGameConfig("turnTimeLimit",0,60,0),controller.defineGameConfig("gameTimeLimit",0,99999,0),util.scoped(function(){var e=0,t=0;model.gametimeElapsed=0,model.turntimeElapsed=0,controller.persistenceHandler(function(e){model.setupTimer(),util.expectNumber(e,"gmTm",!0,!0)&&(model.gametimeElapsed=e.gmTm),util.expectNumber(e,"tnTm",!0,!0)&&(model.turntimeElapsed=e.tnTm)},function(e){e.gmTm=model.gametimeElapsed,e.tnTm=model.turntimeElapsed}),model.resetTurnTimer=function(){model.turntimeElapsed=0},model.updateTimer=function(o){model.turntimeElapsed+=o,model.gametimeElapsed+=o,e&&model.turntimeElapsed>=e&&model.nextTurn.callAsCommand(),t&&model.gametimeElapsed>=t&&controller.endGameRound()},model.setupTimer=function(){model.turntimeElapsed=0,model.gametimeElapsed=0,e=6e4*controller.configValue("turnTimeLimit"),t=6e4*controller.configValue("gameTimeLimit")}});