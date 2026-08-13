import test from 'node:test';
import assert from 'node:assert/strict';
import { startInteractiveMatch,advanceInteractiveMatch } from '../../domain/match/interactiveMatchSystem.js';

function state(position='MC',stage='pro'){
 return{player:{id:'p-refactor',firstname:'Noa',lastname:'Test',club:'FC Test',position,overall:74,careerStage:stage,squadStatus:stage==='pro'?'first_team':'academy',origin:'STREET',mental:70,morale:70,fitness:92,attributes:{controle:78,dribble:78,tir:71,passe:79},stats:{},hidden:{},temporaryEffects:[]},career:{balance:0},social:{},consequences:[],careerMemory:[]};
}
function fixture(id,competition='Ligue 1'){return{id,competitionName:competition,competition,opponent:'Adversaire',home:true,importance:'normal',playerSelection:{started:true,minutes:90},minutes:90};}
function reachDecision(st,session){let result={finished:false,session,step:session.step};for(let guard=0;guard<12&&session.step?.kind!=='decision'&&!session.finished;guard++)result=advanceInteractiveMatch(st,session,{});return result;}

test('le manager réellement utilisé par l UI applique le rythme pro enrichi',()=>{
 const st=state('MC','pro'),session=startInteractiveMatch(st,fixture('runtime-pro-rhythm'),0);
 assert.equal(session.professionalRhythm,true);
 assert.ok(session.moments.length>=3&&session.moments.length<=4);
});

test('le runtime jouable peut réellement servir une scène MID à un MC',()=>{
 let found=false;
 for(let i=0;i<40&&!found;i++){
  const st=state('MC','pro'),session=startInteractiveMatch(st,fixture(`runtime-mid-${i}`),0);
  const result=reachDecision(st,session);
  const id=result.session?.decision?.opportunityId||session.decision?.opportunityId||'';
  if(/^MID-/.test(id))found=true;
 }
 assert.equal(found,true);
});

test('le runtime jouable peut réellement servir une scène WNG à un ailier',()=>{
 let found=false;
 for(let i=0;i<40&&!found;i++){
  const st=state('AG','pro'),session=startInteractiveMatch(st,fixture(`runtime-wing-${i}`),0);
  const result=reachDecision(st,session);
  const id=result.session?.decision?.opportunityId||session.decision?.opportunityId||'';
  if(/^WNG-/.test(id))found=true;
 }
 assert.equal(found,true);
});

test('une compétition jeune ne reçoit pas artificiellement le rythme pro',()=>{
 const st=state('MC','youth'),session=startInteractiveMatch(st,fixture('runtime-youth','Championnat National U15'),0);
 assert.notEqual(session.professionalRhythm,true);
 assert.ok(session.moments.length>=1&&session.moments.length<=2);
});

test('un but adverse canonique devient une étape manuelle dans le manager jouable',()=>{
 const oldRandom=Math.random;Math.random=()=>0;
 try{
  const st=state('BU','pro'),session=startInteractiveMatch(st,fixture('runtime-opponent-goal'),0);
  let sawOpponentGoal=false;
  for(let guard=0;guard<80&&!session.finished;guard++){
   const action=session.step?.kind==='decision'?{choiceIndex:0}:{};
   const result=advanceInteractiveMatch(st,session,action);
   if(result.step?.label==='⚽ BUT ADVERSE'){
    sawOpponentGoal=true;
    assert.equal(result.step.goal.opponentGoal,true);
    assert.ok(Number(result.step.score.away)>0);
    break;
   }
  }
  assert.equal(sawOpponentGoal,true);
 }finally{Math.random=oldRandom;}
});
