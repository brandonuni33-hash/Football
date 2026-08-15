import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GOAL_ACTOR_TYPE, GOAL_TEAM_SIDE, PLAYER_GOAL_CONTRIBUTION,
  appendGoalEvent, canonicalPlayerGoalEvents, deriveGoalSummary,
  scoreAfterGoal, synchronizeResultWithGoals, validateGoalEvents
} from '../../domain/match/goalEventResolver.js';

const player = { actorType:GOAL_ACTOR_TYPE.PLAYER, actorId:'p1', displayName:'Alex Test' };
const teammate = { actorType:GOAL_ACTOR_TYPE.TEAMMATE, actorId:'mate', displayName:'Un coéquipier' };
const opponent = { actorType:GOAL_ACTOR_TYPE.OPPONENT, actorId:'opp', displayName:'Un adversaire' };

test('tous les scores et contributions sont dérivés de la chronologie canonique', () => {
  const session = { id:'m1', home:false, playerId:'p1', goalEvents:[], score:{home:0,away:0} };
  const first = appendGoalEvent(session, { minute:60, teamSide:GOAL_TEAM_SIDE.PLAYER, scorer:player, assist:teammate, source:{type:'INTERACTIVE_DECISION'}, playerContribution:PLAYER_GOAL_CONTRIBUTION.GOAL });
  const second = appendGoalEvent(session, { minute:61, teamSide:GOAL_TEAM_SIDE.OPPONENT, scorer:opponent, source:{type:'BACKGROUND_SIMULATION'} });
  const third = appendGoalEvent(session, { minute:62, teamSide:GOAL_TEAM_SIDE.PLAYER, scorer:teammate, assist:player, source:{type:'INTERACTIVE_DECISION'}, playerContribution:PLAYER_GOAL_CONTRIBUTION.ASSIST });
  assert.deepEqual(deriveGoalSummary(session.goalEvents,{home:false,playerId:'p1'}),{score:{home:1,away:2},teamGoals:2,opponentGoals:1,goals:1,assists:1,result:'win'});
  assert.deepEqual(scoreAfterGoal(session.goalEvents,first.id,{home:false}),{home:0,away:1});
  assert.deepEqual(scoreAfterGoal(session.goalEvents,second.id,{home:false}),{home:1,away:1});
  assert.equal(canonicalPlayerGoalEvents({goalEvents:session.goalEvents},{id:'p1'}).length,1);
  assert.equal(third.id,'m1:goal:3');
  assert.deepEqual(
    synchronizeResultWithGoals({matchId:'m1',home:false,goalEvents:session.goalEvents,score:{home:9,away:9},goals:9,assists:9},'p1'),
    {matchId:'m1',home:false,goalEvents:session.goalEvents,score:{home:1,away:2},teamGoals:2,opponentGoals:1,goals:1,assists:1,result:'win'}
  );
});

test('les événements restent uniques même si deux buts partagent volontairement une minute', () => {
  const session = { id:'m2', home:true, playerId:'p1', goalEvents:[], score:{home:0,away:0} };
  appendGoalEvent(session,{minute:90,teamSide:GOAL_TEAM_SIDE.PLAYER,scorer:teammate,source:{type:'BACKGROUND_SIMULATION'}});
  appendGoalEvent(session,{minute:90,teamSide:GOAL_TEAM_SIDE.OPPONENT,scorer:opponent,source:{type:'BACKGROUND_SIMULATION'}});
  assert.equal(new Set(session.goalEvents.map(event=>event.id)).size,2);
  assert.deepEqual(validateGoalEvents(session.goalEvents,{matchId:'m2'}),{valid:true,errors:[]});
});

test('une identité ou une attribution contradictoire invalide la chronologie', () => {
  const session = { id:'m-invalid', home:true, playerId:'p1', goalEvents:[], score:{home:0,away:0} };
  appendGoalEvent(session,{minute:42,teamSide:GOAL_TEAM_SIDE.PLAYER,scorer:player,assist:teammate,source:{type:'INTERACTIVE_DECISION'},playerContribution:PLAYER_GOAL_CONTRIBUTION.GOAL});
  const invalidId = structuredClone(session.goalEvents);
  invalidId[0].id = 'presentation-reconstructed-from-score';
  assert.deepEqual(validateGoalEvents(invalidId,{matchId:'m-invalid'}),{valid:false,errors:['invalid-id']});
  const invalidCredit = structuredClone(session.goalEvents);
  invalidCredit[0].playerContribution = PLAYER_GOAL_CONTRIBUTION.NONE;
  assert.deepEqual(validateGoalEvents(invalidCredit,{matchId:'m-invalid'}),{valid:false,errors:['invalid-player-goal-contribution']});
  const invalidActor = structuredClone(session.goalEvents);
  invalidActor[0].scorer.actorType = 'ALIEN';
  assert.equal(validateGoalEvents(invalidActor,{matchId:'m-invalid'}).errors.includes('invalid-scorer-type'),true);
  const skippedSequence = structuredClone(session.goalEvents);
  skippedSequence[0].sequence = 3;
  skippedSequence[0].id = 'm-invalid:goal:3';
  assert.equal(validateGoalEvents(skippedSequence,{matchId:'m-invalid'}).errors.includes('invalid-sequence'),true);
  const invalidContribution = structuredClone(session.goalEvents);
  invalidContribution[0].playerContribution = 'ALIEN';
  assert.equal(validateGoalEvents(invalidContribution,{matchId:'m-invalid'}).errors.includes('invalid-player-contribution'),true);
  assert.throws(()=>appendGoalEvent({id:'m-rejected',home:true,goalEvents:[],score:{home:0,away:0}},{minute:43,teamSide:GOAL_TEAM_SIDE.PLAYER,scorer:player,source:{type:'BACKGROUND_SIMULATION'},playerContribution:PLAYER_GOAL_CONTRIBUTION.NONE}),/contribution GOAL/);
});

test('aucun but joueur n est reconstruit depuis un simple total', () => {
  assert.deepEqual(canonicalPlayerGoalEvents({matchId:'m3',goals:4},{id:'p1'}),[]);
});

test('un but ajouté hors ordre est rejeté avant de corrompre la chronologie', () => {
  const session = {id:'ordered-match',home:true,playerId:'p1',goalEvents:[],score:{home:0,away:0}};
  const scorer = {actorType:GOAL_ACTOR_TYPE.TEAMMATE,actorId:'mate',displayName:'Un coéquipier'};
  appendGoalEvent(session,{minute:60,teamSide:GOAL_TEAM_SIDE.PLAYER,scorer,source:{type:'BACKGROUND_SIMULATION'}});
  assert.throws(() => appendGoalEvent(session,{minute:30,teamSide:GOAL_TEAM_SIDE.PLAYER,scorer,source:{type:'BACKGROUND_SIMULATION'}}),/invalid-minute/);
  assert.equal(session.goalEvents.length,1);
});
