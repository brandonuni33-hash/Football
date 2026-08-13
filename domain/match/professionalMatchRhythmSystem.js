// Street to Pro — rythme de décision réservé aux vrais matchs seniors/pro.
// Les catégories jeunes conservent le rythme de base ; chez les pros, le match
// dispose de davantage de moments jouables pour laisser vivre tactique et mémoire.

import { isProfessionalMatch } from './proMatchExperienceSystem.js';

const n=value=>Number.isFinite(Number(value))?Number(value):0;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function hash(seed=''){let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function deterministicCount(session={}){
 const selection=session.match?.playerSelection||{},minutes=Math.max(1,n(session.match?.minutes??selection.minutes??90));
 if(selection.started===false)return clamp(Math.round(minutes/14),2,4);
 const seed=session.match?.id||session.id||'pro-match';
 if(session.type==='final'||session.type==='rival'||session.importance==='exceptional')return 5+(hash(`${seed}:count-big`)%2);
 if(session.importance==='important')return 4+(hash(`${seed}:count-important`)%2);
 return 3+(hash(`${seed}:count-normal`)%2);
}
function spreadMoments(session={},count=3){
 const selection=session.match?.playerSelection||{},minutes=Math.max(1,n(session.match?.minutes??selection.minutes??90));
 const start=selection.started===false?Math.max(48,90-minutes+3):10,end=selection.started===false?88:86,span=Math.max(1,end-start),seed=session.match?.id||session.id||'pro-match';
 const moments=[];
 for(let i=0;i<count;i++){
  const base=start+span*((i+1)/(count+1));
  const jitter=(hash(`${seed}:moment:${i}`)%7)-3;
  const previous=moments[i-1]??start-8;
  moments.push(clamp(Math.round(base+jitter),previous+7,end));
 }
 return moments;
}

export function professionalDecisionMoments(state={},session={}){
 if(!isProfessionalMatch(state,session))return null;
 return spreadMoments(session,deterministicCount(session));
}

export function applyProfessionalMatchRhythm(state={},session={}){
 const moments=professionalDecisionMoments(state,session);
 if(!moments)return session;
 session.moments=moments;
 session.professionalRhythm=true;
 return session;
}

export const ProfessionalMatchRhythmSystem=Object.freeze({professionalDecisionMoments,applyProfessionalMatchRhythm});
export default ProfessionalMatchRhythmSystem;
