export function createInputController({joystick,stick,shoot,protect,powerFill}){
  const keys=new Set(),joy={x:0,y:0,pointer:null};let shootStart=null,queuedShot=null,protectHeld=false,lastPush=null,pushArmed=true,queuedBurst=null;
  const power=()=>shootStart===null?0:Math.min(1,(performance.now()-shootStart)/900);
  const release=()=>{if(shootStart===null)return;queuedShot=power();shootStart=null;powerFill.style.height="0%"};
  window.addEventListener("keydown",e=>{const k=e.key.toLowerCase();keys.add(k);if(k===" "&&shootStart===null){e.preventDefault();shootStart=performance.now()}});
  window.addEventListener("keyup",e=>{const k=e.key.toLowerCase();keys.delete(k);if(k===" "){e.preventDefault();release()}});
  function registerPush(x,y,m){if(m<=.35){pushArmed=true;return}if(m<.82||!pushArmed)return;pushArmed=false;const now=performance.now(),l=Math.hypot(x,y)||1,dx=x/l,dy=y/l;if(lastPush&&now-lastPush.time<=360&&dx*lastPush.x+dy*lastPush.y>=.92){queuedBurst={x:dx,y:dy};lastPush=null}else lastPush={time:now,x:dx,y:dy}}
  function setJoy(event){const samples=typeof event.getCoalescedEvents==="function"?event.getCoalescedEvents():null,e=samples?.length?samples[samples.length-1]:event,r=joystick.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/(r.width*.35),y=(e.clientY-r.top-r.height/2)/(r.height*.35),l=Math.hypot(x,y);if(l>1){x/=l;y/=l;l=1}if(l<.04){x=0;y=0;l=0}joy.x=x;joy.y=y;registerPush(x,y,l);stick.style.transform=`translate(calc(-50% + ${x*28}px),calc(-50% + ${y*28}px))`}
  joystick.addEventListener("pointerdown",e=>{joy.pointer=e.pointerId;joystick.setPointerCapture(e.pointerId);setJoy(e)});
  const moveEvent="onpointerrawupdate" in window?"pointerrawupdate":"pointermove";joystick.addEventListener(moveEvent,e=>{if(e.pointerId===joy.pointer)setJoy(e)});
  function clearJoy(e){if(e.pointerId!==joy.pointer)return;joy.x=0;joy.y=0;joy.pointer=null;pushArmed=true;stick.style.transform="translate(-50%,-50%)"}
  joystick.addEventListener("pointerup",clearJoy);joystick.addEventListener("pointercancel",clearJoy);
  shoot.addEventListener("pointerdown",e=>{e.preventDefault();if(shootStart===null)shootStart=performance.now()});shoot.addEventListener("pointerup",e=>{e.preventDefault();release()});shoot.addEventListener("pointercancel",release);
  if(protect){const on=e=>{e.preventDefault();protectHeld=true;protect.setPointerCapture?.(e.pointerId)},off=e=>{e.preventDefault();protectHeld=false};protect.addEventListener("pointerdown",on);protect.addEventListener("pointerup",off);protect.addEventListener("pointercancel",off)}
  return{read(){let x=joy.x,y=joy.y;if(Math.hypot(x,y)<.04){if(keys.has("arrowleft")||keys.has("a")||keys.has("q"))x--;if(keys.has("arrowright")||keys.has("d"))x++;if(keys.has("arrowup")||keys.has("w")||keys.has("z"))y--;if(keys.has("arrowdown")||keys.has("s"))y++}const shot=queuedShot,burst=queuedBurst;queuedShot=null;queuedBurst=null;const p=power();powerFill.style.height=`${Math.round(p*100)}%`;return{moveX:x,moveY:y,protecting:protectHeld||keys.has("shift"),burstTriggered:!!burst,burstX:burst?.x??0,burstY:burst?.y??0,shootReleased:shot!==null,shootPower:shot??0,charge:p}}}
}
