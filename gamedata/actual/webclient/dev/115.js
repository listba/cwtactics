util.scoped(function(){var e=document.getElementById("cwt_game_infoBar"),t=document.getElementById("infoBox_unitRow1"),o=document.getElementById("infoBox_unitRow2"),n=document.getElementById("infoBox_unitRow3"),r=document.getElementById("infoBox_name"),i=document.getElementById("infoBox_hp"),a=document.getElementById("infoBox_fuel"),l=document.getElementById("infoBox_ammo"),s=document.getElementById("infoBox_fuel2"),c=document.getElementById("infoBox_ammo2"),d=document.getElementById("infoBox_attrange"),u=document.getElementById("infoBox_attrange2"),m=document.getElementById("infoBox_hp_d"),p=document.getElementById("infoBox_fuel_d"),f=document.getElementById("infoBox_ammo_d"),E=document.getElementById("infoBox_attrange_d"),h=document.getElementById("infoBox_playerName"),v=document.getElementById("infoBox_playerpower"),I=document.getElementById("infoBox_playergold");document.getElementById("infoBox_tileRow1"),document.getElementById("infoBox_tileRow2");var g=document.getElementById("infoBox_tileRow2d2"),_=document.getElementById("infoBox_tilename"),T=document.getElementById("infoBox_defense_d"),A=document.getElementById("infoBox_defense"),y=document.getElementById("infoBox_capPt_d"),w=document.getElementById("infoBox_capPt"),L=document.getElementById("infoBox_capPt2"),S=!1;controller.sideSimpleTileInformationPanel=-1,controller.moveSimpleTileInformationToLeft=function(){0>controller.sideSimpleTileInformationPanel||(e.style.left="4px",e.style.right="",controller.sideSimpleTileInformationPanel=-1)},controller.moveSimpleTileInformationToRight=function(){controller.sideSimpleTileInformationPanel>0||(e.style.right="4px",e.style.left="",controller.sideSimpleTileInformationPanel=1)},controller.updateSimpleTileInformation=function(){var e,M=controller.mapCursorX,N=controller.mapCursorY,C=model.unitPosMap[M][N],O=model.propertyPosMap[M][N];if(S||(m.getContext("2d").drawImage(view.getInfoImageForType("SYM_HP"),0,0),p.getContext("2d").drawImage(view.getInfoImageForType("SYM_FUEL"),0,0),f.getContext("2d").drawImage(view.getInfoImageForType("SYM_AMMO"),0,0),E.getContext("2d").drawImage(view.getInfoImageForType("SYM_ATT"),0,0),T.getContext("2d").drawImage(view.getInfoImageForType("SYM_DEFENSE"),0,0),y.getContext("2d").drawImage(view.getInfoImageForType("SYM_CAPTURE"),0,0),S=!0),C){e=C.type,r.innerHTML=model.localized(e.ID),i.innerHTML=C.hp,a.innerHTML=C.fuel,s.innerHTML=e.fuel,l.innerHTML=C.ammo,c.innerHTML=e.ammo;var R=e.attack;R?(d.innerHTML=R.minrange||1,u.innerHTML=R.maxrange||1):(d.innerHTML="",u.innerHTML=""),r.style.opacity=1,t.style.opacity=1,o.style.opacity=1,n.style.opacity=1}else r.style.opacity=0,t.style.opacity=0,o.style.opacity=0,n.style.opacity=0;O?(e=O.type,_.innerHTML=model.localized(e.ID),w.innerHTML=O.capturePoints,L.innerHTML=20,A.innerHTML=e.defense,g.style.opacity=1):(e=model.map[M][N],_.innerHTML=model.localized(e.ID),A.innerHTML=e.defense,g.style.opacity=0),e=null;var P=-1;P=C?C.owner:O&&O.owner!==constants.INACTIVE_ID?O.owner:model.turnOwner,P>-1?(e=model.players[P],h.innerHTML=e.name,I.innerHTML=e.gold,v.innerHTML=model.coData[P].power):(h.innerHTML="",I.innerHTML="",v.innerHTML="")}});