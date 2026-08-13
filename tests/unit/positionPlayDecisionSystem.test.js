import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPositionPlayDecision,enrichPositionPlayDecision } from '../../domain/match/positionPlayDecisionSystem.js';

function state(position){return{player:{position,fatigue:18}};}
function session(position='MC',id='fixture-1'){
 return{
  id:`session-${id}`,
  match:{id},
  playerPosition:position,
  currentMoment:0,
  home:true,
  score:{home:1,away:1},
  modifiers:{fatigue:0},
  events:[],
  directOpponent:{playerDuelsWon:0,opponentDuelsWon:0},
  decision:{id:`${id}:decision:1`,minute:34,phase:'Première période',title:'Décision générique',description:'Ancienne scène générique',choices:[{text:'A'},{text:'B'},{text:'C'}],isGoalOpportunity:false},
  step:{id:`${id}:step`,kind:'decision',phase:'first_half',minute:34,title:'Décision générique',text:'Ancienne scène générique',choices:[{text:'A'},{text:'B'},{text:'C'}]}
 };
}

test('un MC reçoit une vraie situation MID à la place d’une décision générique',()=>{
 const s=session('MC','mid-runtime');
 const decision=buildPositionPlayDecision(state('MC'),s,s.decision);
 assert.ok(decision);
 assert.match(decision.opportunityId,/^MID-/);
 assert.equal(decision.isMidfieldPlayOpportunity,true);
 assert.equal(decision.isGoalOpportunity,false);
 assert.equal(decision.choices.length,3);
 assert.notEqual(decision.description,'Ancienne scène générique');
});

test('les alias LW/RW reçoivent les situations AG/AD',()=>{
 for(const position of ['LW','RW']){
  const s=session(position,`wing-${position}`);
  const decision=buildPositionPlayDecision(state(position),s,s.decision);
  assert.ok(decision);
  assert.match(decision.opportunityId,/^WNG-/);
  assert.equal(decision.isWingerPlayOpportunity,true);
  assert.equal(decision.choices.length,3);
 }
});

test('les autres postes ne sont pas détournés vers MID ou WNG',()=>{
 for(const position of ['BU','DC','DG','DD','GK']){
  const s=session(position,`other-${position}`);
  assert.equal(buildPositionPlayDecision(state(position),s,s.decision),null);
 }
});

test('les vraies occasions de but restent dans le mélange pour MC et ailier',()=>{
 for(const position of ['MC','AG']){
  let replaced=0,kept=0;
  for(let i=0;i<200;i++){
   const s=session(position,`goal-${position}-${i}`);
   s.decision.isGoalOpportunity=true;
   s.decision.opportunityId='OCC-001';
   const decision=buildPositionPlayDecision(state(position),s,s.decision);
   if(decision)replaced+=1;else kept+=1;
  }
  assert.ok(replaced>0,`${position} doit parfois vivre une situation de poste`);
  assert.ok(kept>0,`${position} doit conserver certaines occasions de but`);
 }
});

test('l’enrichissement remplace ensemble la décision canonique et l’étape affichée',()=>{
 const s=session('MOC','enrich');
 const result=enrichPositionPlayDecision(state('MOC'),s,{finished:false,session:s,step:s.step,decision:s.decision});
 assert.match(result.decision.opportunityId,/^MID-/);
 assert.equal(result.session.decision.opportunityId,result.decision.opportunityId);
 assert.equal(result.step.title,result.decision.title);
 assert.equal(result.step.text,result.decision.description);
 assert.deepEqual(result.step.choices,result.decision.choices);
});
