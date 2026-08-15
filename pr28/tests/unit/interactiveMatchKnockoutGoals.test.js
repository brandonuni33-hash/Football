import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceInteractiveMatch } from '../../domain/match/interactiveMatchSystem.js';
import { commitInteractiveResult } from '../../domain/match/interactiveMatchController.js';
import { finalizeInteractiveBlock } from '../../domain/gameplay/interactiveBlockFinalizer.js';
import {
  appendGoalEvent, deriveGoalSummary, synchronizeResultWithGoals,
  GOAL_ACTOR_TYPE, GOAL_TEAM_SIDE
} from '../../domain/match/goalEventResolver.js';

const state = () => ({
  player:{id:'p1',position:'BU',overall:70,attributes:{tir:70}},
  career:{},careerMemory:[]
});

function knockoutSession(resolution) {
  const session = {
    id:'knockout-canonical',flowVersion:5,home:true,playerId:'p1',playerPosition:'BU',playerAge:24,
    team:'FC Test',opponent:'Rival',competition:'Coupe de France',
    match:{id:'fixture-knockout',competitionType:'cup',phase:'Finale',professional:true},
    goalEvents:[],score:{home:0,away:0},events:[],decisions:[],
    result:{matchId:'knockout-canonical',home:true,rating:7,minutesPlayed:90,events:[],decisions:[],goalEvents:[],score:{home:0,away:0}},
    knockoutRuntimeStage:'extra_time_intro',knockoutResolution:resolution,
    knockoutResumeStep:{id:'resume-full-time',phase:'full_time_sequence',kind:'narration'}
  };
  appendGoalEvent(session,{minute:30,teamSide:GOAL_TEAM_SIDE.PLAYER,scorer:{actorType:GOAL_ACTOR_TYPE.TEAMMATE,actorId:'mate',displayName:'Un coéquipier'},source:{type:'BACKGROUND_SIMULATION'}});
  appendGoalEvent(session,{minute:70,teamSide:GOAL_TEAM_SIDE.OPPONENT,scorer:{actorType:GOAL_ACTOR_TYPE.OPPONENT,actorId:'opp',displayName:'Un adversaire'},source:{type:'BACKGROUND_SIMULATION'}});
  Object.assign(session.result,deriveGoalSummary(session.goalEvents,{home:true,playerId:'p1'}),{goalEvents:structuredClone(session.goalEvents)});
  return session;
}

test('un but de prolongation rejoint la même chronologie et le score en est dérivé', () => {
  const session = knockoutSession({teamGoals:2,opponentGoals:1,regulationScore:{teamGoals:1,opponentGoals:1},wentToExtraTime:true,wentToPenalties:false,penaltyScore:null});
  const first = advanceInteractiveMatch(state(),session);
  assert.equal(first.step.phase,'extra_time_end');
  assert.equal(first.step.title,'2 – 1 après prolongation');
  assert.equal(session.goalEvents.length,3);
  assert.equal(session.goalEvents[2].source.type,'EXTRA_TIME');
  assert.deepEqual(session.score,{home:2,away:1});

  advanceInteractiveMatch(state(),session);
  assert.equal(session.knockoutRuntimeStage,'resume');
  assert.equal(session.result.goalEvents.length,3);
  assert.equal(session.result.teamGoals,2);
  assert.equal(session.result.opponentGoals,1);
  assert.equal(session.result.result,'win');
});

test('les tirs au but restent séparés des buts et ne gonflent jamais les statistiques', () => {
  const session = knockoutSession({teamGoals:1,opponentGoals:1,regulationScore:{teamGoals:1,opponentGoals:1},wentToExtraTime:true,wentToPenalties:true,penaltyScore:{team:4,opponent:3},shootoutWinner:'team'});
  advanceInteractiveMatch(state(),session);
  assert.equal(session.goalEvents.length,2);
  assert.deepEqual(session.score,{home:1,away:1});
  advanceInteractiveMatch(state(),session);
  assert.equal(session.knockoutRuntimeStage,'penalty_shootout');
  advanceInteractiveMatch(state(),session,{choiceIndex:0});
  assert.equal(session.knockoutRuntimeStage,'penalty_result');
  assert.equal(session.goalEvents.length,2);
  advanceInteractiveMatch(state(),session);
  assert.equal(session.result.wentToPenalties,true);
  assert.deepEqual(session.result.score,{home:1,away:1});
  assert.deepEqual(session.result.penaltyScore,session.knockoutResolution.penaltyScore);
  assert.equal(session.result.goalEvents.length,2);
  assert.equal(session.result.teamGoals+session.result.opponentGoals,2);
  assert.equal(synchronizeResultWithGoals(session.result,'p1').result,'win');
});

test('la synchronisation canonique conserve le vainqueur des tirs au but', () => {
  const won = knockoutSession({teamGoals:1,opponentGoals:1,regulationScore:{teamGoals:1,opponentGoals:1},wentToExtraTime:true,wentToPenalties:true,penaltyScore:{team:5,opponent:4},shootoutWinner:'team'});
  Object.assign(won.result,won.knockoutResolution,{result:'win'});
  assert.equal(synchronizeResultWithGoals(won.result,'p1').result,'win');

  const lost = knockoutSession({teamGoals:1,opponentGoals:1,regulationScore:{teamGoals:1,opponentGoals:1},wentToExtraTime:true,wentToPenalties:true,penaltyScore:{team:3,opponent:4},shootoutWinner:'opponent'});
  Object.assign(lost.result,lost.knockoutResolution,{result:'loss'});
  assert.equal(synchronizeResultWithGoals(lost.result,'p1').result,'loss');

  assert.throws(() => synchronizeResultWithGoals({
    ...won.result,
    shootoutWinner:'opponent'
  },'p1'),/contredit le score canonique/);
});

test('un résultat aux tirs au but reste gagnant jusqu au bloc final', () => {
  const current = state();
  Object.assign(current.player,{
    age:18,
    potential:80,
    attributes:{vitesse:65,acceleration:65,endurance:65,puissance:60,finition:70,tir:70,passe:60,controle:65,dribble:65,vision:60,placement:55,defense:35},
    mental:{regularite:65},
    hidden:{consistency:12,bigMatchPlayer:12,injuryProneness:8},
    stats:{},temporaryEffects:[],morale:70,fitness:90
  });
  Object.assign(current,{calendar:{currentMonth:8,currentSeasonYear:2026},consequences:[],committedInteractiveMatchIds:[]});
  const session = knockoutSession({teamGoals:1,opponentGoals:1,regulationScore:{teamGoals:1,opponentGoals:1},wentToExtraTime:true,wentToPenalties:true,penaltyScore:{team:4,opponent:3},shootoutWinner:'team'});
  advanceInteractiveMatch(current,session);
  advanceInteractiveMatch(current,session);
  advanceInteractiveMatch(current,session,{choiceIndex:0});
  advanceInteractiveMatch(current,session);
  session.result.interactive = true;
  const canonical = commitInteractiveResult(current,session.result);
  const finalized = finalizeInteractiveBlock(current,[canonical]);
  assert.equal(canonical.result,'win');
  assert.equal(finalized.results[0].result,'win');
  assert.deepEqual(finalized.results[0].penaltyScore,{team:4,opponent:3});
  assert.equal(current.player.stats.matchesPlayed,1);
});
