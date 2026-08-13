import{FIELD,DEFAULT_FEEL_TUNING,createFootball2DState,stepFootball2D}from"./football2dModel.js";
import{createOpponentState,stepOpponentAI}from"./opponentAI.js";
import{stepGoalkeeper}from"./goalkeeperAI.js";

const TURN_RATE=5.5;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
function wrapAngle(a){while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a}
function steerInput(state,input,dt){const x=input.moveX??0,y=input.moveY??0,m=Math.hypot(x,y),current=state.steerAngle??Math.atan2(state.player.facingY,state.player.facingX);if(m<.05)return{input:{...input,moveX:0,moveY:0},angle:current};const desired=Math.atan2(y,x),delta=wrapAngle(desired-current),next=current+clamp(delta,-TURN_RATE*dt,TURN_RATE*dt);return{input:{...input,moveX:Math.cos(next),moveY:Math.sin(next)},angle:next}}

export function createScenarioState(){return{...createFootball2DState(),...createOpponentState(FIELD),steerAngle:0}}
export function stepScenario(s,i={},dt=1/60,tuning=DEFAULT_FEEL_TUNING){const total=Math.min(Math.max(dt,0),.05),count=Math.max(1,Math.ceil(total/(1/90))),slice=total/count;let n={...s};for(let x=0;x<count;x++){const before={...n.ball},steer=steerInput(n,x?{...i,shootReleased:false}:i,slice);n={...stepFootball2D(n,steer.input,slice,tuning),steerAngle:steer.angle};if(n.status==="goal")break;const d=stepOpponentAI({defender:n.defender,keeper:n.keeper,player:n.player,ball:n.ball,possession:n.possession},FIELD,slice);n={...n,defender:d.defender,keeper:d.keeper,ball:d.ball,possession:d.possession,lastEvent:d.event??n.lastEvent};const k=stepGoalkeeper(n.keeper,before,n.ball,FIELD,slice);n={...n,keeper:k.keeper,ball:k.ball,possession:k.event?false:n.possession,lastEvent:k.event??n.lastEvent}}return n}
