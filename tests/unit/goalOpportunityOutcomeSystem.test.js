import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveGoalOpportunityOutcome,canonicalLiveContributions } from '../../domain/match/goalOpportunityOutcomeSystem.js';

function makeSession(id='goal-test',choiceText='Frapper placé'){
 return{
  id:`session-${id}`,
  match:{id},
  home:true,
  score:{home:1,away:0},
  currentMoment:0,
  decision:{id:`${id}:decision`,opportunityId:'OCC-001',minute:37,isGoalOpportunity:true},
  events:[{title:'Tu vas au bout de l’occasion',text:'La défense est battue.',minute:37,decisionIndex:0,opportunityId:'OCC-001',isGoalOpportunity:true}],
  decisions:[{minute:37,choice:choiceText,opportunityId:'OCC-001',isGoalOpportunity:true}]
 };
}
const shot={text:'Frapper placé',style:'safe',gesture:'Frappe placée',impacts:{goalChance:.24,technicalRisk:.05}};
const assist={text:'Servir le partenaire seul',style:'collective',gesture:'Passe décisive',impacts:{assistChance:.27,passAccuracy:.1}};
const player={player:{overall:70,attributes:{tir:76,passe:78,technique:72}}};

test('une occasion ratée par le moteur ne peut pas devenir un but canonique',()=>{
 const s=makeSession('failed');
 s.events[0]={...s.events[0],title:'L’occasion se referme',text:'La défense revient et l’occasion disparaît.'};
 const event=resolveGoalOpportunityOutcome(player,s,{choice:shot,minute:37});
 assert.equal(event.teamGoal,false);
 assert.equal(event.playerGoal,false);
 assert.equal(s.score.home,1);
 assert.equal(s.suppressAmbientTeamGoalOnce,true);
});

test('une frappe OCC produit parfois un but et grave immédiatement le score',()=>{
 let scored=null;
 for(let i=0;i<300&&!scored;i++){
  const s=makeSession(`shot-${i}`);
  const event=resolveGoalOpportunityOutcome(player,s,{choice:shot,minute:37});
  if(event.playerGoal)scored={s,event};
 }
 assert.ok(scored,'au moins une graine déterministe doit produire un but');
 assert.equal(scored.event.outcome,'player_goal');
 assert.equal(scored.event.teamGoal,true);
 assert.equal(scored.s.score.home,2);
 assert.equal(scored.s.decisions[0].playerGoal,true);
 assert.deepEqual(scored.event.scoreAfter,{home:2,away:0});
});

test('un choix collectif OCC peut produire une vraie passe décisive',()=>{
 let assisted=null;
 for(let i=0;i<300&&!assisted;i++){
  const s=makeSession(`assist-${i}`,assist.text);
  const event=resolveGoalOpportunityOutcome(player,s,{choice:assist,minute:37});
  if(event.playerAssist)assisted={s,event};
 }
 assert.ok(assisted,'au moins une graine déterministe doit produire une passe décisive');
 assert.equal(assisted.event.outcome,'player_assist_teammate_goal');
 assert.equal(assisted.event.playerGoal,false);
 assert.equal(assisted.event.teamGoal,true);
 assert.equal(assisted.s.score.home,2);
 assert.equal(assisted.s.decisions[0].playerAssist,true);
});

test('les statistiques live viennent uniquement des faits canoniques joués',()=>{
 const result={events:[
  {playerGoal:true,playerAssist:false},
  {playerGoal:false,playerAssist:true},
  {playerGoal:true,playerAssist:false},
  {title:'événement sans statistique'}
 ]};
 assert.deepEqual(canonicalLiveContributions(result),{goals:2,assists:1});
});

test('une décision qui n’est pas une occasion de but reste hors du système',()=>{
 const s=makeSession('mid');s.decision.isGoalOpportunity=false;s.decision.opportunityId='MID-021';
 const event=resolveGoalOpportunityOutcome(player,s,{choice:shot,minute:37});
 assert.equal(event,null);
 assert.equal(s.score.home,1);
 assert.equal(s.events[0].goalOpportunityResolved,undefined);
});
