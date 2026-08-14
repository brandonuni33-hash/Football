// Street to Pro — présentation d'un but adverse déjà présent dans le score canonique.
// Cette couche ne marque jamais : elle ne fait qu'exposer un changement de score
// produit par le moteur afin qu'aucun but adverse n'arrive silencieusement.

import { buildGoalPresentation } from './goalPresentation.js';

const n=value=>Number.isFinite(Number(value))?Number(value):0;
function opponentKey(session={}){return session.home?'away':'home';}
export function opponentScore(session={}){return n(session.score?.[opponentKey(session)]);}
function playerScore(session={}){return n(session.score?.[session.home?'home':'away']);}
function tier(session={}){
 const age=n(session.playerAge??session.match?.playerAge??session.match?.age);
 const text=[session.competition,session.match?.competitionName,session.match?.ageCategory,session.match?.category,session.match?.level].filter(Boolean).join(' ').toLowerCase();
 if((age&&age<=15)||/u ?15/.test(text))return'u15';
 if((age&&age<=20)||/youth|u ?1[6789]|u ?20|formation|academy|académie|jeune/.test(text))return'youth';
 if(/amateur|semi|régional|regional|national 2|national 3|district/.test(text))return'semi';
 return'pro';
}
function minuteFor(session={}){
 const stepMinute=n(session.step?.minute);
 if(stepMinute>0)return stepMinute;
 const index=Math.max(0,n(session.currentMoment)-1);
 const moment=n(session.moments?.[index]);
 return moment>0?moment:45;
}
function reaction(session={}){
 const level=tier(session);
 if(level==='u15')return session.home
  ?'Autour du terrain, les encouragements adverses montent pendant que ton équipe reprend déjà sa place.'
  :'Près de la ligne, les proches de l’autre équipe réagissent. Ton groupe revient vers le centre.';
 if(level==='youth')return session.home
  ?'Le banc adverse se lève. Autour du terrain, les réactions retombent seulement quand le ballon revient au centre.'
  :'Le banc d’en face explose pendant que ton équipe se replace sans attendre.';
 if(level==='semi')return session.home
  ?'La petite tribune se coupe un instant, couverte par les voix du banc adverse.'
  :'Les habitués adverses font monter le bruit pendant que ton équipe se rassemble.';
 return session.home
  ?'Le stade se coupe une fraction de seconde. Dans le secteur adverse, les bras se lèvent d’un seul coup.'
  :'Le stade explose autour de toi. Tes coéquipiers se regroupent déjà pour remettre le ballon en jeu.';
}
function narrative(session={}){
 const level=tier(session);
 if(level==='u15')return'L’action adverse va jusqu’au bout. Une passe traverse la zone, la frappe part avant le retour du dernier défenseur et le ballon finit au fond.';
 if(level==='youth')return'L’adversaire trouve une fenêtre dans ton bloc. Le ballon arrive dans la surface et la finition ne laisse pas le temps de revenir.';
 return'L’adversaire accélère au bon moment, trouve l’espace entre deux lignes et termine l’action avant que ton bloc puisse se refermer.';
}
function scoreAt(session={},opponentGoals){
 const own=playerScore(session);
 return session.home?{home:own,away:opponentGoals}:{home:opponentGoals,away:own};
}
function goalStep(session,presentation,index=0){
 return{
  id:`${session.id}:opponent-goal:${presentation.minute}:${index}`,
  phase:'opponent_goal',kind:'goal',label:'⚽ BUT ADVERSE',
  progress:Math.min(92,Math.max(15,Math.round((n(presentation.minute)/90)*100))),
  minute:presentation.minute,title:'But adverse',
  text:`${presentation.celebration} ${presentation.stadiumReaction}`.trim(),
  team:session.team,opponent:session.opponent,competition:session.competition,home:session.home,
  score:{...presentation.score},choices:[],items:[],timedDecision:null,
  actionLabel:'Reprendre le match',goal:presentation
 };
}

export function buildOpponentGoalPresentations(session={},beforeOpponentScore=0){
 const after=opponentScore(session),before=Math.max(0,n(beforeOpponentScore)),delta=Math.max(0,after-before);
 if(!delta||!session.id)return[];
 const minute=minuteFor(session),items=[];
 for(let i=0;i<delta;i++){
  const goals=before+i+1;
  const built=buildGoalPresentation({
   matchId:session.id,scorer:'L’adversaire',minute:Math.min(90,minute+i),score:scoreAt(session,goals),
   celebration:narrative(session),stadiumReaction:reaction(session)
  });
  if(built)items.push({...built,opponentGoal:true});
 }
 return items;
}

export function exposeOpponentScoreChange(session={},result={},beforeOpponentScore=0){
 if(!session||result?.finished)return result;
 const presentations=buildOpponentGoalPresentations(session,beforeOpponentScore);
 if(!presentations.length)return result;
 session.goalPresentationQueue=Array.isArray(session.goalPresentationQueue)?session.goalPresentationQueue:[];
 if(session.step?.kind==='goal'){
  session.goalPresentationQueue.push(...presentations);
  return{...result,session};
 }
 const [first,...rest]=presentations;
 session.runtimeResumeStep||=session.step||result.step||null;
 session.goalPresentationQueue.push(...rest);
 session.step=goalStep(session,first,0);
 return{...result,finished:false,session,step:session.step,decision:null};
}

export const OpponentGoalPresentationSystem=Object.freeze({opponentScore,buildOpponentGoalPresentations,exposeOpponentScoreChange});
export default OpponentGoalPresentationSystem;
