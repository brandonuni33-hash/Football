export function createInputController({joystick,stick,shoot,powerFill}){
  const keys=new Set();
  const joy={x:0,y:0,pointer:null};
  let shootStart=null;
  let queuedShot=null;
  const power=()=>shootStart===null?0:Math.min(1,(performance.now()-shootStart)/900);
  const release=()=>{if(shootStart===null)return;queuedShot=power();shootStart=null;powerFill.style.height="0%";};
  window.addEventListener("keydown",e=>{const k=e.key.toLowerCase();keys.add(k);if(k===" "&&shootStart===null){e.preventDefault();shootStart=performance.now();}});
  window.addEventListener("keyup",e=>{const k=e.key.toLowerCase();keys.delete(k);if(k===" "){e.preventDefault();release();}});
  function setJoy(e){const r=joystick.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/(r.width*.35);let y=(e.clientY-r.top-r.height/2)/(r.height*.35);const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}joy.x=x;joy.y=y;stick.style.transform=`translate(calc(-50% + ${x*28}px),calc(-50% + ${y*28}px))`;}
  joystick.addEventListener("pointerdown",e=>{joy.pointer=e.pointerId;joystick.setPointerCapture(e.pointerId);setJoy(e);});
  joystick.addEventListener("pointermove",e=>{if(e.pointerId===joy.pointer)setJoy(e);});
  function clear(e){if(e.pointerId!==joy.pointer)return;joy.x=0;joy.y=0;joy.pointer=null;stick.style.transform="translate(-50%,-50%)";}
  joystick.addEventListener("pointerup",clear);joystick.addEventListener("pointercancel",clear);
  shoot.addEventListener("pointerdown",e=>{e.preventDefault();if(shootStart===null)shootStart=performance.now();});
  shoot.addEventListener("pointerup",e=>{e.preventDefault();release();});shoot.addEventListener("pointercancel",release);
  return{read(){let x=joy.x,y=joy.y;if(Math.abs(x)<.05&&Math.abs(y)<.05){if(keys.has("arrowleft")||keys.has("a")||keys.has("q"))x--;if(keys.has("arrowright")||keys.has("d"))x++;if(keys.has("arrowup")||keys.has("w")||keys.has("z"))y--;if(keys.has("arrowdown")||keys.has("s"))y++;}const shot=queuedShot;queuedShot=null;const p=power();powerFill.style.height=`${Math.round(p*100)}%`;return{moveX:x,moveY:y,shootReleased:shot!==null,shootPower:shot??0,charge:p};}};
}
