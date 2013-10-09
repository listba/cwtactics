controller.screenStateMachine.structure.MOBILE = Object.create(controller.stateParent);

controller.screenStateMachine.structure.MOBILE.section = "cwt_mobileSound_screen";

controller.screenStateMachine.structure.MOBILE.enterState = function(){
  // SET BACKGROUND
  controller.storage.get("MAIN_BG", controller.imgToBg);    
};

controller.screenStateMachine.structure.MOBILE.ACTION = function(){ 
  controller.stateMachine.event("start");
  return "MAIN"; 
};