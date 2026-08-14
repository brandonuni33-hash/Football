// Répartit les buts déjà présents dans le résultat canonique sur la chronologie du match.
// Les événements live marqués `playerGoal` sont prioritaires : un but joué garde
// donc sa vraie minute et son vrai geste dans le rapport final.
export function canonicalPlayerGoalEvents(result={},player={}){
 const total=Math.max(0,Math.floor(Number(result.goals)||0));if(!result.matchId||!total)return[];
 const scorer=[player.firstname,player.lastname].filter(Boolean).join(' ')||player.name||'Ton joueur';
 const live=(result.events||[]).filter(e=>e?.playerGoal===true&&Number.isFinite(Number(e.minute)));
 const otherMinutes=(result.events||[]).filter(e=>e?.playerGoal!==true&&Number.isFinite(Number(e.minute))).map(e=>Number(e.minute));
 const fallback=[18,34,52,67,79,88];
 return Array.from({length:total},(_,i)=>{
  const event=live[i];
  if(event)return{kind:'goal',matchId:result.matchId,minute:Number(event.minute),scorer,gesture:event.gesture||null,opportunityId:event.opportunityId||null,outcome:event.outcome||'player_goal'};
  const minute=[...otherMinutes,...fallback].sort((a,b)=>a-b)[i]||Math.min(89,20+i*15);
  return{kind:'goal',matchId:result.matchId,minute,scorer,gesture:(result.events||[]).find(e=>e.gesture)?.gesture||null};
 });
}
export default canonicalPlayerGoalEvents;
