util.singleLazyCall=function(e){var t=!1;return function(){t&&util.raiseError("this function cannot be called twice"),e.apply(null,arguments)}};