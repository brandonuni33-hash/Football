// Street to Pro — résolution canonique des occasions de but jouées.
// Une décision OCC doit produire un fait de match explicite : but, passe décisive
// ou occasion manquée. Les statistiques finales réutilisent ensuite ces faits.

const n=value=>Number.isFinite(Number(value))?Number(value):0;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function hash(seed=''){let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function roll(seed=''){return hash(seed)/4294967296;}
function ownKey(session={}){return session.home?'home':'away';}
function ownScore(session={}){return n(session.score?.[ownKey(session)]);}
function setOwnScore(session={},value){session.score||={home:0,away:0};session.score[ownKey(session)]=Math.max(0,Math.floor(n(value)));}
function playerAttribute(state={},keys=[]){const p=state.player||{},a=p.attributes||{};for(const key of keys){const value=a[key]??p[key];if(Number.isFinite(Number(value)))return Number(value);}return n(p.overall)||50;}
function latestDecisionEventIndex(session={}){const events=Array.isArray(session.events)?session.events:[];for(let i=events.length-1;i>=0;i--){if(events[i]?.decisionIndex===session.currentMoment)return i;}return events.length?events.length-1:-1;}
function failedOpportunity(event={}){return Boolean(event.timedOut)||/occasion se referme|lit ton geste|hésitation|disparaît|ne sort pas|ne passe pas/i.test(`${event.title||''} ${event.text||''}`);}
function assistIntent(choice={}){const goal=n(choice.impacts?.goalChance),assist=n(choice.impacts?.assistChance),text=String(choice.text||'').toLowerCase(),style=String(choice.style||'').toLowerCase();if(assist<=0)return false;if(style==='collective')return true;if(assist>goal+.025)return true;return /servir|donner|remettre|passe|décaler|dévier|centre|partenaire/.test(text)&&assist>=goal;}
function clearScoringIntent(choice={}){return n(choice.impacts?.goalChance)>0||n(choice.impacts?.assistChance)>0;}
function scoreAfter(session={}){return{home:n(session.score?.home),away:n(session.score?.away)};}
function missText(choice={},event={}){const gesture=choice.gesture||'Ton geste';if(assistIntent(choice))return`${gesture} crée bien la fenêtre, mais la finition derrière ne va pas au bout. L’occasion est réelle, pas la statistique.`;if(/penalty|contact/i.test(`${choice.text||''} ${choice.gesture||''}`)&&n(choice.impacts?.goalChance)<.1)return`Tu cherches le contact, mais l’arbitre laisse jouer. La défense peut ressortir.`;return event.text||`${gesture} ne suffit pas cette fois. Le score ne bouge pas.`;}

export function resolveGoalOpportunityOutcome(state={},session={},context={}){
  const decision=session.decision;
  const choice=context.choice;
  if(!decision?.isGoalOpportunity||!choice||context.timedOut)return null;
  if(!clearScoringIntent(choice))return null;
  const eventIndex=latestDecisionEventIndex(session);if(eventIndex<0)return null;
  const previous=session.events[eventIndex]||{};
  if(previous.goalOpportunityResolved)return previous;
  const minute=n(context.minute??decision.minute??previous.minute);
  const seed=`${session.match?.id||session.id}:${decision.opportunityId||decision.id}:${minute}:${choice.text}`;
  let playerGoal=false,playerAssist=false,teamGoal=false,outcome='miss';
  if(!failedOpportunity(previous)){
    if(assistIntent(choice)){
      const passing=playerAttribute(state,['passe','passing','vision']);
      const chance=clamp(.16+n(choice.impacts?.assistChance)*1.9+n(choice.impacts?.passAccuracy)*.55+(passing-50)/260-n(choice.impacts?.technicalRisk)*.2,.08,.78);
      if(roll(`${seed}:assist`)<chance){playerAssist=true;teamGoal=true;outcome='player_assist_teammate_goal';}
    }else{
      const shooting=playerAttribute(state,['tir','finition','shooting','technique']);
      const chance=clamp(.13+n(choice.impacts?.goalChance)*1.7+(shooting-50)/245-n(choice.impacts?.technicalRisk)*.28,.07,.74);
      if(roll(`${seed}:goal`)<chance){playerGoal=true;teamGoal=true;outcome='player_goal';}
    }
  }
  if(teamGoal)setOwnScore(session,ownScore(session)+1);
  const after=scoreAfter(session),gesture=choice.gesture||previous.gesture||null;
  const text=playerGoal?`${gesture||'Ta finition'} va au bout. Le gardien est battu et le ballon finit au fond.`:playerAssist?`${gesture||'Ta passe'} trouve le partenaire dans le bon tempo. Il termine l’action : ta décision devient une passe décisive.`:missText(choice,previous);
  const enriched={...previous,title:playerGoal?'La finition est au bout':playerAssist?'Tu offres le but':'L’occasion ne donne rien',text,gesture,goalOpportunityResolved:true,outcome,playerGoal,playerAssist,teamGoal,scoreAfter:after,opportunityId:decision.opportunityId||previous.opportunityId||null,isGoalOpportunity:true};
  session.events[eventIndex]=enriched;
  const lastDecision=Array.isArray(session.decisions)?session.decisions[session.decisions.length-1]:null;
  if(lastDecision){Object.assign(lastDecision,{outcome,playerGoal,playerAssist,teamGoal,scoreAfter:after,opportunityId:decision.opportunityId||lastDecision.opportunityId||null,isGoalOpportunity:true});}
  // Le verrou anti-double-but n'est nécessaire que lorsqu'une OCC vient réellement
  // de modifier le score. Une occasion manquée ne doit pas empêcher un but collectif
  // indépendant dans la séquence de jeu suivante.
  session.suppressAmbientTeamGoalOnce=teamGoal;
  return enriched;
}

export function canonicalLiveContributions(result={}){
  const events=Array.isArray(result.events)?result.events:[];
  return{
    goals:events.filter(event=>event?.playerGoal===true).length,
    assists:events.filter(event=>event?.playerAssist===true).length
  };
}

export const GoalOpportunityOutcomeSystem=Object.freeze({resolveGoalOpportunityOutcome,canonicalLiveContributions});
export default GoalOpportunityOutcomeSystem;
