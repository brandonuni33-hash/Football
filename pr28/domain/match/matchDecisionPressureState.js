export function decisionPressureState(decision={}){const timed=Number(decision.timedDecision?.seconds)>0;return{timed,seconds:timed?Number(decision.timedDecision.seconds):null,reason:timed?decision.timedDecision.reason||'moment décisif':null,timeoutOutcome:timed?'opportunity-lost':null};}
export default decisionPressureState;
