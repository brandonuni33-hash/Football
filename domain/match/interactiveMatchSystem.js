// domain/match/interactiveMatchSystem.js
// Propriétaire canonique du cycle interactif d'un match.
// La couche knockout prolonge un nul UNIQUEMENT lorsqu'un vainqueur doit être désigné.

import { InteractiveMatchRuntime } from './interactiveMatchRuntime.js';
import { tieBreakerRules, resolveKnockoutTie } from './knockoutMatchPolicy.js';
import { GOAL_OPPORTUNITY_CHOICES } from './goalOpportunityChoiceLibrary.js';
import { appendSpecialFourthChoice } from './specialFourthChoiceSystem.js';
import { enrichProfessionalStep, enrichProfessionalOutcome, applyProfessionalResultMemory } from './proMatchExperienceSystem.js';

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const score = session => ({ home:n(session?.score?.home), away:n(session?.score?.away) });
const ownScore = session => n(session?.score?.[session.home ? 'home' : 'away']);
const oppScore = session => n(session?.score?.[session.home ? 'away' : 'home']);
function setScore(session, own, opponent) { if (session.home) { session.score.home=own; session.score.away=opponent; } else { session.score.away=own; session.score.home=opponent; } }
function baseStep(session, values={}) { return { id:`${session.id}:${values.phase}`, phase:values.phase, kind:values.kind||'narration', label:values.label||'MATCH', progress:values.progress||94, minute:values.minute??null, title:values.title||'', text:values.text||'', team:session.team, opponent:session.opponent, competition:session.competition, home:session.home, score:score(session), choices:values.choices||[], items:[], attendanceInfo:null, timedDecision:null, actionLabel:values.actionLabel||'Continuer' }; }
function tier(session={}) { const age=n(session.playerAge??session.match?.playerAge), value=`${session.competition||''} ${session.match?.competitionName||''}`.toLowerCase(); if((age&&age<=15)||/u ?15/.test(value))return'u15'; if((age&&age<=20)||/youth|u ?1[6789]|u ?20|formation|academy|académie/.test(value))return'youth'; return'pro'; }
function playerStillOnPitch(session={}) { const minutes=n(session.result?.minutesPlayed??session.match?.minutes??session.match?.playerSelection?.minutes??90); return minutes>=90; }
function extraTimeIntro(session) { const youth=tier(session)!=='pro';return baseStep(session,{phase:'extra_time_intro',label:'PROLONGATION',progress:91,minute:90,title:'Il faut encore jouer',text:youth?'Le temps réglementaire ne suffit pas. Personne ne quitte le terrain : ce match doit avoir un vainqueur. Les jambes sont lourdes, les consignes deviennent courtes. Encore trente minutes.':'Le temps réglementaire ne suffit pas. Le match doit désigner un vainqueur. Après quelques secondes pour reprendre de l’air, trente minutes supplémentaires commencent.',actionLabel:'Jouer la prolongation'}); }
function extraTimeEnd(session, resolution) { const own=resolution.teamGoals,opp=resolution.opponentGoals;return baseStep(session,{phase:'extra_time_end',label:'120 MINUTES',progress:96,minute:120,title:own===opp?'Toujours rien entre vous':`${own} – ${opp} après prolongation`,text:own===opp?'Même trente minutes de plus n’ont pas suffi. Les joueurs reviennent lentement vers le rond central. Cette fois, tout va se décider à onze mètres.':'La prolongation a enfin séparé les deux équipes. Il n’y aura pas de séance de tirs au but.',actionLabel:own===opp?'Aller aux tirs au but':'Attendre le coup de sifflet'}); }
function shootoutDecision(session) { const occ=GOAL_OPPORTUNITY_CHOICES.find(item=>item.id==='OCC-040');const choices=(occ?.choices||[]).map(item=>({...item,text:item.text,opportunityId:'OCC-040',shootout:true}));return baseStep(session,{phase:'penalty_shootout',kind:'decision',label:'TIRS AU BUT',progress:98,minute:120,title:'Ton tour',text:'La séance est lancée. Quand ton nom est appelé, tu avances seul vers le point de penalty. Le gardien ne te quitte pas des yeux.',choices,actionLabel:'Choisir'}); }
function shootoutWatchingStep(session) { return baseStep(session,{phase:'penalty_shootout_watch',label:'TIRS AU BUT',progress:98,minute:120,title:'Depuis le bord du terrain',text:'Tu n’es plus sur la pelouse, donc tu ne peux pas participer à la séance. Tu restes avec le groupe et regardes chaque tireur parcourir seul les derniers mètres jusqu’au point de penalty.',actionLabel:'Suivre la séance'}); }
function shootoutResultStep(session, resolution, playerKick=null) { const pens=resolution.penaltyScore||{team:0,opponent:0}, won=pens.team>pens.opponent;const kickText=playerKick===true?'Ton tir a trouvé le fond. ':playerKick===false?'Ton tir n’est pas entré. ':'';return baseStep(session,{phase:'penalty_result',label:'TIRS AU BUT',progress:99,minute:120,title:`${pens.team} – ${pens.opponent} aux tirs au but`,text:`${kickText}${won?'La dernière tentative adverse ne change plus rien : ton équipe passe.':'La séance s’arrête là. Cette fois, c’est l’adversaire qui passe.'}`,actionLabel:'Voir le coup de sifflet'}); }
function applyResolution(session,resolution) { session.knockoutResolution=resolution;setScore(session,resolution.teamGoals,resolution.opponentGoals);if(session.result){session.result.regulationScore=resolution.regulationScore;session.result.wentToExtraTime=resolution.wentToExtraTime;session.result.wentToPenalties=resolution.wentToPenalties;session.result.penaltyScore=resolution.penaltyScore;session.result.shootoutWinner=resolution.shootoutWinner||null;session.result.teamGoals=resolution.teamGoals;session.result.opponentGoals=resolution.opponentGoals;session.result.score={...session.score};const won=resolution.wentToPenalties?resolution.shootoutWinner==='team':resolution.teamGoals>resolution.opponentGoals;session.result.result=won?'win':'loss';if(playerStillOnPitch(session))session.result.minutesPlayed=Math.max(n(session.result.minutesPlayed),120);} }
function playerKickSuccess(state, choice={}, session={}) { const tech=n(state?.player?.attributes?.tir??state?.player?.attributes?.technique??state?.player?.overall??50),style=String(choice.style||'safe'),base=style==='safe'?.79:style==='technical'?.75:.64;let h=2166136261;for(const c of `${session.id}|${choice.text}|shootout`){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}const roll=(h>>>0)/4294967296;return roll<Math.max(.42,Math.min(.93,base+(tech-50)/240)); }
function maybeEnterKnockout(session,result) { if(!session?.result||session.knockoutRuntimeStage)return result;const rules=tieBreakerRules(session.match||{});if(!rules.eligible||ownScore(session)!==oppScore(session))return result;const resolution=resolveKnockoutTie({match:session.match,teamGoals:ownScore(session),opponentGoals:oppScore(session),seed:session.id,playerEdge:(n(session.result.rating)-6.5)*5});session.knockoutResolution=resolution;session.knockoutResumeStep=session.step;session.knockoutRuntimeStage='extra_time_intro';session.step=extraTimeIntro(session);return {...result,finished:false,session,step:session.step,decision:null,result:session.result}; }
function enrichSpecialDecision(state,session,result){
    const step=result?.step||session?.step;
    if(!step||step.kind!=='decision'||step.phase==='penalty_shootout')return result;
    const canonical=session?.decision?.choices||result?.decision?.choices||step.choices||[];
    const choices=appendSpecialFourthChoice(canonical,state,{id:session?.decision?.opportunityId||step.id||`${session?.id}:${step.minute}`,seed:session?.match?.id||session?.id,title:step.title||session?.decision?.title,description:step.text||session?.decision?.description,minute:step.minute});
    if(choices.length===canonical.length)return result;
    if(session?.decision)session.decision.choices=choices;
    step.choices=choices;
    const decision=result?.decision?{...result.decision,choices}:session?.decision||null;
    return {...result,session,step,decision};
}
function enrichProfessionalExperience(state,session,result){
    const s=result?.session||session;
    if(!s)return result;
    const latest=s.events?.at?.(-1);
    if(latest&&result?.event===latest){
        const enriched=enrichProfessionalOutcome(state,s,latest);
        if(enriched!==latest){s.events[s.events.length-1]=enriched;result={...result,event:enriched};if(result.step?.phase?.startsWith('consequence'))result.step={...result.step,text:enriched.text};}
    }
    const step=enrichProfessionalStep(state,s,result?.step||s.step);
    if(step){s.step=step;result={...result,session:s,step};}
    if(s.result){applyProfessionalResultMemory(state,s,s.result);result={...result,result:s.result};}
    return result;
}

export function startInteractiveMatch(state,scheduledMatch,matchIndex=0){return InteractiveMatchRuntime.startInteractiveMatch(state,scheduledMatch,matchIndex);}
export function advanceInteractiveMatch(state,activeSession,action={}){
    const session=activeSession;
    if(session?.knockoutRuntimeStage==='extra_time_intro'){const resolution=session.knockoutResolution;setScore(session,resolution.teamGoals,resolution.opponentGoals);session.knockoutRuntimeStage='extra_time_end';session.step=extraTimeEnd(session,resolution);return enrichProfessionalExperience(state,session,{finished:false,session,step:session.step,decision:null,result:session.result});}
    if(session?.knockoutRuntimeStage==='extra_time_end'){
        const resolution=session.knockoutResolution;
        if(resolution.wentToPenalties){
            if(playerStillOnPitch(session)){session.knockoutRuntimeStage='penalty_shootout';session.step=shootoutDecision(session);return enrichProfessionalExperience(state,session,{finished:false,session,step:session.step,decision:{choices:session.step.choices,minute:120},result:session.result});}
            session.knockoutRuntimeStage='penalty_shootout_watch';session.step=shootoutWatchingStep(session);return enrichProfessionalExperience(state,session,{finished:false,session,step:session.step,decision:null,result:session.result});
        }
        applyResolution(session,resolution);session.knockoutRuntimeStage='resume';session.step=session.knockoutResumeStep;return enrichProfessionalExperience(state,session,{finished:false,session,step:session.step,decision:null,result:session.result});
    }
    if(session?.knockoutRuntimeStage==='penalty_shootout_watch'){session.knockoutRuntimeStage='penalty_result';session.step=shootoutResultStep(session,session.knockoutResolution,null);return enrichProfessionalExperience(state,session,{finished:false,session,step:session.step,decision:null,result:session.result});}
    if(session?.knockoutRuntimeStage==='penalty_shootout'){
        const index=typeof action==='number'?action:action?.choiceIndex;if(!Number.isInteger(Number(index)))return{finished:false,session,step:session.step,decision:{choices:session.step.choices,minute:120},result:session.result};const choice=session.step.choices[Number(index)];if(!choice)return{finished:false,session,step:session.step,decision:{choices:session.step.choices,minute:120},result:session.result};const success=playerKickSuccess(state,choice,session),resolution={...session.knockoutResolution,penaltyScore:{...session.knockoutResolution.penaltyScore}};if(success&&resolution.shootoutWinner==='team'&&resolution.penaltyScore.team<3)resolution.penaltyScore.team=3;session.playerShootoutKick={choice:choice.text,success};session.knockoutResolution=resolution;session.knockoutRuntimeStage='penalty_result';session.step=shootoutResultStep(session,resolution,success);return enrichProfessionalExperience(state,session,{finished:false,session,step:session.step,decision:null,result:session.result});
    }
    if(session?.knockoutRuntimeStage==='penalty_result'){applyResolution(session,session.knockoutResolution);session.knockoutRuntimeStage='resume';session.step=session.knockoutResumeStep;return enrichProfessionalExperience(state,session,{finished:false,session,step:session.step,decision:null,result:session.result});}
    if(session?.knockoutRuntimeStage==='resume')session.knockoutRuntimeStage='done';
    const runtime=InteractiveMatchRuntime.advanceInteractiveMatch(state,session,action);
    const knockout=maybeEnterKnockout(runtime.session||session,runtime);
    const pro=enrichProfessionalExperience(state,knockout.session||session,knockout);
    return enrichSpecialDecision(state,pro.session||session,pro);
}
export function resolveInteractiveDecision(state,session,choiceIndex){return advanceInteractiveMatch(state,session,{choiceIndex});}
export function commitInteractiveResult(state,result){return InteractiveMatchRuntime.commitInteractiveResult(state,result);}
export const InteractiveMatchSystem=Object.freeze({startInteractiveMatch,advanceInteractiveMatch,resolveInteractiveDecision,commitInteractiveResult});
export default InteractiveMatchSystem;
