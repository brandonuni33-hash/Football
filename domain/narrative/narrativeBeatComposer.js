// Compose les scènes de fin de match à partir des faits déjà validés.
// Une phrase décrivant un match ne peut jamais emprunter les statistiques d'un autre match du bloc.

import { impactLevel } from './narrativeSignificance.js';
import { stableNarrativeId } from './narrativeFactNormalizer.js';

const n=value=>Number.isFinite(Number(value))?Number(value):0;
const finite=value=>Number.isFinite(Number(value))?Number(value):null;
const YOUTH=/\bu\s?(?:15|16|17|18|19|20|21|23)\b|youth|jeune|academy|acad[eé]mie|formation|r[eé]serve|espoirs?/i;
const PRO=/ligue\s?[12]|premier league|championship|la liga|serie a|bundesliga|eredivisie|primeira|champions league|europa league|conference league|coupe de france|fa cup|copa del rey|coppa italia|dfb|professional|professionnel|\bpro\b|first.?team|premi[eè]re.?[eé]quipe|\bsenior\b/i;

function resultView(fact={}){const m=fact.metrics||{},p=fact.payload||{};return{factId:fact.id,fixture:p.fixture||{},matchIndex:m.matchIndex,opponent:p.opponent||'Adversaire',competitionName:p.competitionName||'Match',result:fact.outcome?.result||null,teamGoals:n(m.teamGoals),opponentGoals:n(m.opponentGoals),rating:m.rating===null?null:n(m.rating),goals:n(m.goals),assists:n(m.assists),playerPlayed:m.playerPlayed!==false,started:m.started!==false,minutesPlayed:n(m.minutesPlayed),interactive:Boolean(m.interactive),appearance:p.appearance||(m.started===false?'substitute':'starter')};}
function scoreText(r){return`${n(r?.teamGoals)}-${n(r?.opponentGoals)}`;}
function appearanceLabel(r={}){if(r.playerPlayed===false)return r.appearance==='bench'?'Resté sur le banc':'Hors groupe';if(r.started===false)return`Entré en jeu · ${n(r.minutesPlayed)} min`;if(n(r.minutesPlayed))return`Titulaire · ${n(r.minutesPlayed)} min`;return'Titulaire';}
function impactLabel(level){return{decisive:'Impact décisif',strong:'Impact fort',present:'Présent',difficult:'En difficulté',unused:'Non utilisé'}[level]||'Présent';}
function impactDetail(r={}){if(r.playerPlayed===false)return appearanceLabel(r);const parts=[];if(n(r.goals))parts.push(`${n(r.goals)} but${n(r.goals)>1?'s':''}`);if(n(r.assists))parts.push(`${n(r.assists)} passe${n(r.assists)>1?'s':''} décisive${n(r.assists)>1?'s':''}`);if(n(r.rating)>0)parts.push(`note ${n(r.rating).toFixed(1)}`);return parts.join(' · ');}
function goalLabel(goals){return{2:'un doublé',3:'un triplé',4:'un quadruplé',5:'un quintuplé',6:'un sextuplé'}[goals]||`${goals} buts`;}
function tier(context={},result={}){const p=context.player||{},labels=[result.competitionName,p.careerStage,p.squadStatus,p.contractType,context.career?.stage].filter(Boolean).join(' ');if(YOUTH.test(labels))return'youth';if(PRO.test(labels))return'pro';const age=n(p.age);return age>0&&age<19?'youth':'adult';}
function contribution(goals,assists){if(goals>=2&&assists)return`${goalLabel(goals)} et ${assists} passe${assists>1?'s':''} décisive${assists>1?'s':''}`;if(goals>=2)return goalLabel(goals);if(goals===1&&assists)return`un but et ${assists} passe${assists>1?'s':''} décisive${assists>1?'s':''}`;if(goals===1)return'un but';if(assists)return`${assists} passe${assists>1?'s':''} décisive${assists>1?'s':''}`;return'';}
function performanceText(r,{youth=false}={}){if(!r)return null;if(r.playerPlayed===false)return r.appearance==='bench'?'Tu restes sur le banc.':'Tu ne fais pas partie du groupe.';const goals=n(r.goals),assists=n(r.assists),rating=n(r.rating),line=contribution(goals,assists),minutes=n(r.minutesPlayed);if(r.started===false){if(line)return`Entré pour ${minutes||'quelques'} minutes, tu signes ${line}.`;return minutes?`Tu entres pour ${minutes} minutes.`:'Tu entres en cours de match.';}if(line)return`Tu signes ${line}.`;if(rating>=8.2)return'Tu pèses sans être décisif.';if(rating>0&&rating<5.5)return'Tu passes à côté.';return youth?'Tu tiens ton match.':'Tu tiens ton rôle.';}
function outcomeText(r){if(r?.result==='win')return`Victoire ${scoreText(r)}.`;if(r?.result==='loss')return`Défaite ${scoreText(r)}.`;return`Match nul ${scoreText(r)}.`;}
function statusText(results){if(results.length<=1)return null;const statuses=results.filter(x=>x.playerPlayed!==false).map(x=>x.started!==false?'titulaire':'remplaçant');if(statuses.length<2||statuses[0]===statuses.at(-1))return null;return`Ton statut change : ${statuses[0]} → ${statuses.at(-1)}.`;}
function firstCareerGoalMatch(context,results=[]){const seasonGoals=finite(context?.player?.seasonStats?.goals),previousGoals=finite(context?.career?.completedGoals);if(seasonGoals===null||previousGoals===null||previousGoals!==0)return null;const played=results.filter(r=>r.playerPlayed!==false),blockGoals=played.reduce((sum,r)=>sum+n(r.goals),0);if(blockGoals<=0||seasonGoals!==blockGoals)return null;return played.filter(r=>n(r.goals)>0).sort((a,b)=>n(a.matchIndex)-n(b.matchIndex))[0]?.factId||null;}
function mindsetText(context,r,{firstCareerGoal=false}={}){if(!r)return null;const morale=finite(context?.player?.mindset?.morale),rating=r.rating===null?null:n(r.rating),influence=n(r.goals)+n(r.assists);if(firstCareerGoal)return r.result==='loss'?'Même dans la défaite, ce premier but reste à toi.':'Ce premier but restera à part.';if(r.playerPlayed===false&&morale!==null&&morale<=35)return'Le banc commence à peser. Tu penses déjà à la prochaine occasion.';if(r.started===false&&(influence>0||(rating!==null&&rating>=7.3)))return'Tu avais peu de temps. Tu l’as utilisé.';if(r.result==='loss'&&(influence>0||(rating!==null&&rating>=7.5)))return'Tu as répondu présent, mais la défaite prend le dessus.';if(rating!==null&&rating<5.5)return morale!==null&&morale<=35?'Le match fait mal. La réponse commence à la prochaine séance.':'La réponse devra venir au prochain match.';if(r.result==='win'&&rating>=7.8)return'Tu sens que ce match peut changer le regard du coach.';return null;}
function titleFor(r,count,firstGoal,currentTier){if(currentTier==='youth')return'Match terminé';if(firstGoal)return'Un premier but à part';if(count>1)return'Le point sur la période';if(r?.result==='win')return'Victoire';if(r?.result==='loss')return'Défaite';return'Match nul';}
function toneFor(r){if(r?.result==='win')return n(r.rating)>=7.5?'triumph':'relief';if(r?.result==='loss')return n(r.rating)>=7?'bittersweet':'disappointment';return'reflection';}
function recap(facts,featuredFact,evaluations){return facts.map(fact=>{const r=resultView(fact),level=evaluations.get(fact.id)?.impactLevel||impactLevel(fact);return{matchIndex:r.matchIndex,opponent:r.opponent,competition:r.competitionName,score:scoreText(r),result:r.result,rating:r.playerPlayed===false?null:n(r.rating),goals:n(r.goals),assists:n(r.assists),interactive:r.interactive,playerPlayed:r.playerPlayed,started:r.started,appearance:r.appearance,minutesPlayed:r.minutesPlayed,appearanceLabel:appearanceLabel(r),impactLevel:level,impactLabel:impactLabel(level),impactDetail:impactDetail(r),isNarrativeFocus:fact.id===featuredFact.id,isImpactMatch:fact.id===featuredFact.id};});}

export class NarrativeBeatComposer{
 compose({plan,context,memory}={}){
   if(!plan?.primary?.featuredFact||!context?.player)return{primaryScene:null,callbackCommands:[]};
   const{featuredFact,facts,evaluation,evaluations,arc}=plan.primary;
   const results=facts.map(resultView),featured=resultView(featuredFact),currentTier=tier(context,featured),importance=evaluation?.importance||'normal';
   const firstGoalFactId=firstCareerGoalMatch(context,results),firstCareerGoal=Boolean(firstGoalFactId&&featured.factId===firstGoalFactId),firstCareerGoalNarrated=firstCareerGoal&&currentTier!=='youth';
   const callback=memory?.callbacksByFactId?.[featuredFact.id]||null,continuity=memory?.continuityByFactId?.[featuredFact.id]||null,overview=statusText(results),mind=mindsetText(context,featured,{firstCareerGoal:firstCareerGoalNarrated}),beats=[];
   const add=beat=>{const text=String(beat?.text||'').trim();if(!text||beats.some(x=>String(x.text||'').trim().toLowerCase()===text.toLowerCase()))return;beats.push({...beat,key:`${featuredFact.id}:${beat.kind}`});};
   add({kind:'result',text:outcomeText(featured),delay:500,emphasis:true});
   add({kind:'player',text:performanceText(featured,{youth:currentTier==='youth'}),delay:550});
   if(currentTier!=='youth'){
      if(mind)add({kind:'player-mindset',text:mind,delay:650,intimate:true,emphasis:firstCareerGoalNarrated});
      else if(callback)add({kind:'memory',text:callback.text,delay:650,callback:true});
      else if(continuity)add({kind:'continuity',text:continuity,delay:650});
      else if(overview)add({kind:'block-overview',text:overview,delay:600});
   }
   const scene={id:stableNarrativeId('narrative_match',featuredFact.id),type:'match.end',importance,tone:toneFor(featured),title:titleFor(featured,results.length,firstCareerGoalNarrated,currentTier),subtitle:results.length>1?`Séquence de championnat · ${results.filter(x=>x.playerPlayed!==false).length} apparition${results.filter(x=>x.playerPlayed!==false).length>1?'s':''}`:`${featured.competitionName} · ${featured.opponent}`,matchIndex:featured.matchIndex,impactMatchIndex:featured.matchIndex,interactive:featured.interactive,matches:recap(facts,featuredFact,evaluations),beats,arc,narrativeSeed:context.seed,sourceFactIds:facts.map(f=>f.id),facts:{matchCount:results.length,appearances:results.filter(x=>x.playerPlayed!==false).length,result:featured.result,score:scoreText(featured),rating:featured.playerPlayed?n(featured.rating):0,goals:n(featured.goals),assists:n(featured.assists),firstCareerGoal,firstCareerGoalNarrated,presentationTier:currentTier}};
   const callbackCommands=callback?[{id:stableNarrativeId('callback',{memoryId:callback.memoryId,factId:featuredFact.id}),action:'record',memoryId:callback.memoryId,factId:featuredFact.id,sceneId:scene.id,occurredAt:featuredFact.occurredAt}]:[];
   return{primaryScene:scene,callbackCommands};
 }
}
export default NarrativeBeatComposer;
