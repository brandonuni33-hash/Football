// Street to Pro — sélection des décisions de jeu propres au poste.
// Cette couche remplace les décisions génériques par du vrai métier de poste,
// sans supprimer les occasions de but canoniques.

import {
  isExclusiveMidfieldPosition,
  selectMidfieldPlayOpportunity,
  buildMidfieldPlayDecision
} from './midfieldPlayOpportunityLibrary.js';
import {
  selectWingerPlayOpportunity,
  buildWingerPlayDecision
} from './wingerPlayOpportunityLibrary.js';
import { youthMatchTier } from './youthMatchExperienceSystem.js';

const n=value=>Number.isFinite(Number(value))?Number(value):0;
function hash(seed=''){let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function normalizedPosition(position=''){const p=String(position||'').toUpperCase();if(['LW'].includes(p))return'AG';if(['RW'].includes(p))return'AD';if(['CM'].includes(p))return'MC';if(['CAM'].includes(p))return'MOC';return p;}
function isWinger(position=''){return ['AG','AD'].includes(normalizedPosition(position));}
function ownScore(session={}){return n(session.score?.[session.home?'home':'away']);}
function oppScore(session={}){return n(session.score?.[session.home?'away':'home']);}
function fatigue(state={},session={}){return Math.max(n(state.player?.fatigue),n(session.playerFatigue),n(session.match?.playerFatigue),n(session.modifiers?.fatigue)*11);}
function previousEvent(session={}){const events=Array.isArray(session.events)?session.events:[];return events.length?events[events.length-1]:null;}
function previousMistake(session={}){const e=previousEvent(session);if(!e)return false;return Boolean(e.timedOut)||/referme|lit ton geste|hésitation|disparaît|ne passe pas|récupère/i.test(`${e.title||''} ${e.text||''}`);}
function playmakingMomentum(session={}){const e=previousEvent(session);if(!e||previousMistake(session))return false;return /ligne est cassée|ouvre la suite|met en retard|duel tourne pour toi|face au jeu|gagne immédiatement/i.test(`${e.title||''} ${e.text||''}`);}
function canonicalBool(session={},key){return session?.match?.[key]===true||session?.[key]===true;}
function protectedSetPiece(decision={}){return ['OCC-014','OCC-040'].includes(String(decision.opportunityId||''))||decision.isPenalty===true||decision.shootout===true;}

// La profondeur tactique apparaît avec la carrière : aucune bibliothèque avancée
// en U15 ; en formation plus âgée, elle n'apparaît que ponctuellement.
function youthAllowsAdvancedPositionPlay(state={},session={}){
  const tier=youthMatchTier(state,session);
  if(tier==='u15')return false;
  if(tier!=='youth')return true;
  return hash(`${session.match?.id||session.id}:${session.currentMoment||0}:youth-tactical-depth`)%100<35;
}
function shouldReplace(currentDecision={},session={},position=''){
  if(protectedSetPiece(currentDecision))return false;
  if(!currentDecision?.isGoalOpportunity)return true;
  const roll=hash(`${session.match?.id||session.id}:${session.currentMoment||0}:${position}:position-play`)%100;
  if(isExclusiveMidfieldPosition(position))return roll<45;
  if(isWinger(position))return roll<38;
  return false;
}

function baseContext(state={},session={},position=''){
  return {
    seed:session.match?.id||session.id,
    index:n(session.currentMoment),
    minute:n(session.decision?.minute??session.step?.minute),
    position,
    scoreFor:ownScore(session),
    scoreAgainst:oppScore(session),
    fatigue:fatigue(state,session),
    extraTime:n(session.decision?.minute??session.step?.minute)>90,
    coachSignal:Boolean(session.proExperience?.coachInstruction)||canonicalBool(session,'coachSignal'),
    previousMistake:previousMistake(session),
    playmakingMomentum:playmakingMomentum(session),
    directOpponent:session.directOpponent||null,
    rivalry:session.type==='rival'||canonicalBool(session,'rivalry'),
    opponentYellow:canonicalBool(session,'opponentYellow')||session.directOpponent?.yellowCard===true,
    sideSwitch:canonicalBool(session,'sideSwitch'),
    lowInvolvement:canonicalBool(session,'lowInvolvement')
  };
}

export function buildPositionPlayDecision(state={},session={},currentDecision=null){
  const current=currentDecision||session.decision;
  if(!current)return null;
  const position=normalizedPosition(state.player?.position||state.player?.positionId||session.playerPosition);
  if(!isExclusiveMidfieldPosition(position)&&!isWinger(position))return null;
  if(!youthAllowsAdvancedPositionPlay(state,session))return null;
  if(!shouldReplace(current,session,position))return null;
  const context=baseContext(state,session,position);
  let built=null;
  if(isExclusiveMidfieldPosition(position)){
    const item=selectMidfieldPlayOpportunity(context);
    built=buildMidfieldPlayDecision(item,{minute:context.minute});
  }else if(isWinger(position)){
    const item=selectWingerPlayOpportunity(context);
    built=buildWingerPlayDecision(item,{minute:context.minute});
  }
  if(!built)return null;
  return {
    ...current,
    ...built,
    id:current.id,
    minute:current.minute??context.minute,
    phase:current.phase,
    timedDecision:current.timedDecision||null,
    isGoalOpportunity:false,
    isMidfieldPlayOpportunity:Boolean(built.isMidfieldPlayOpportunity||String(built.opportunityId||'').startsWith('MID-')),
    isWingerPlayOpportunity:Boolean(built.isWingerPlayOpportunity||String(built.opportunityId||'').startsWith('WNG-'))
  };
}

export function enrichPositionPlayDecision(state={},session={},result={}){
  const s=result.session||session;
  const step=result.step||s?.step;
  if(!s||!step||step.kind!=='decision'||step.phase==='penalty_shootout')return result;
  const current=s.decision||result.decision;
  const replacement=buildPositionPlayDecision(state,s,current);
  if(!replacement)return result;
  s.decision=replacement;
  const total=Math.max(1,Array.isArray(s.moments)?s.moments.length:1);
  const index=Math.min(total-1,Math.max(0,n(s.currentMoment)));
  const nextStep={...step,label:`MOMENT ${index+1}/${total}`,title:replacement.title,text:replacement.description,description:replacement.description,choices:replacement.choices,innerVoice:null};
  s.step=nextStep;
  return {...result,session:s,step:nextStep,decision:replacement};
}

export const PositionPlayDecisionSystem=Object.freeze({buildPositionPlayDecision,enrichPositionPlayDecision});
export default PositionPlayDecisionSystem;
