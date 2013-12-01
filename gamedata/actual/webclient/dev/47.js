controller.registerInvokableCommand("changeWeather"),controller.registerInvokableCommand("calculateNextWeather"),controller.defineEvent("changeWeather"),controller.defineGameScriptable("neutralizeWeather",0,1),controller.defineGameConfig("weatherMinDays",1,5,1),controller.defineGameConfig("weatherRandomDays",0,5,4),model.weatherTypeParser.addHandler(function(e){return util.expectBoolean(e,"defaultWeather",!1)?util.expectNumber(e,"vision",!1,!0,-5,5)?util.expectNumber(e,"att",!1,!0,-100,100)?util.expectNumber(e,"minRange",!1,!0,-5,5)?util.expectNumber(e,"maxRange",!1,!0,-5,5)?void 0:!1:!1:!1:!1:!1}),model.weather=null,controller.persistenceHandler(function(e){e.wth?(util.isIn(e.wth,model.weatherTypes)||model.criticalError(constants.error.ILLEGAL_MAP_FORMAT,constants.error.SAVEDATA_WEATHER_MISSMATCH),model.weather=model.weatherTypes[e.wth]):(model.weather=model.defaultWeatherType,controller.isHost()&&model.calculateNextWeather())},function(e){e.wth=model.weather.ID}),model.calculateNextWeather=function(){var e,t;if(controller.isHost()||model.criticalError(constants.error.HOST_ONLY,constants.error.CALC_NEXT_WEATHER),null!==model.weather&&model.weather===model.defaultWeatherType){var o=model.nonDefaultWeatherType;e=o[parseInt(Math.random()*o.length,10)].ID,t=1}else e=model.defaultWeatherType.ID,t=controller.configValue("weatherMinDays")+parseInt(controller.configValue("weatherRandomDays")*Math.random(),10);controller.sharedInvokement("changeWeather",[e]),model.pushTimedEvent(model.daysToTurns(t),"calculateNextWeather",[])},model.changeWeather=function(e){model.weatherTypes.hasOwnProperty(e)||model.criticalError(constants.error.ILLEGAL_DATA,constants.error.UNKNOWN_WEATHER),model.weather=model.weatherTypes[e],model.recalculateFogMap(),controller.events.changeWeather(e)};