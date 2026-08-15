export function traceDecision(matchId,decision={},event={}){if(!matchId)return null;return{matchId,decisionId:decision.id||null,minute:Number(decision.minute)||null,choice:event.choice||null,gesture:event.gesture||null,timedOut:Boolean(event.timedOut),immediate:event.text||null};}
export default traceDecision;
