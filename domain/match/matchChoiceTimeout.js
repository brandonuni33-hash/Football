export function matchChoiceTimeout(decision={}){if(!decision.timedDecision)return null;return{timedOut:true,decisionId:decision.id||null,minute:decision.minute||null,reason:decision.timedDecision.reason||'moment décisif'};}
export default matchChoiceTimeout;
