export function matchEventFact(matchId,event={}){if(!matchId)return null;return{matchId,type:event.type||'match.event',minute:Number.isFinite(Number(event.minute))?Number(event.minute):null,title:event.title||null,text:event.text||null,gesture:event.gesture||null,choice:event.choice||null,timedOut:Boolean(event.timedOut)};}
export default matchEventFact;
