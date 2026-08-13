import test from 'node:test';
import assert from 'node:assert/strict';
import { InteractiveMatchController } from '../../domain/match/interactiveMatchController.js';

function state(){return{player:{id:'canonical-score-player',club:'FC Test',position:'MC',overall:72,mental:70,morale:70,fitness:90,attributes:{controle:74,dribble:72,tir:65,passe:78},stats:{},temporaryEffects:[]},career:{balance:0},social:{},consequences:[],careerMemory:[]};}
function fixture(){return{id:'canonical-score-fixture',competitionName:'Ligue 1',competition:'Ligue 1',opponent:'Adversaire',home:true,opponentStrength:92,playerSelection:{started:true,minutes:90},minutes:90};}

test('le coup de sifflet final ne fabrique plus de buts absents du live',()=>{
 const st=state(),session=InteractiveMatchController.startInteractiveMatch(st,fixture(),0);
 session.stage='consequence';
 session.step={id:'last-consequence',kind:'narration',phase:'consequence_1',minute:84};
 session.moments=[84];
 session.currentMoment=0;
 session.score={home:2,away:1};
 session.modifiers={rating:0,goal:0,assist:0,duel:0,fatigue:0,cards:0,opponentThreat:0};
 const oldRandom=Math.random;Math.random=()=>0.99;
 try{
  const result=InteractiveMatchController.advanceInteractiveMatch(st,session,{});
  assert.equal(result.session.stage,'full_time_sequence');
  assert.deepEqual(result.session.score,{home:2,away:1});
  assert.deepEqual(result.session.result.score,{home:2,away:1});
  assert.equal(result.session.result.teamGoals,2);
  assert.equal(result.session.result.opponentGoals,1);
 }finally{Math.random=oldRandom;}
});

test('le contrôleur ne s’attribue plus aléatoirement buts et passes au moment de finaliser',()=>{
 const st=state(),session=InteractiveMatchController.startInteractiveMatch(st,fixture(),0);
 session.stage='consequence';
 session.step={id:'last-consequence',kind:'narration',phase:'consequence_1',minute:84};
 session.moments=[84];
 session.currentMoment=0;
 session.score={home:3,away:2};
 const oldRandom=Math.random;Math.random=()=>0.99;
 try{
  const result=InteractiveMatchController.advanceInteractiveMatch(st,session,{});
  assert.equal(result.session.result.goals,0);
  assert.equal(result.session.result.assists,0);
 }finally{Math.random=oldRandom;}
});
