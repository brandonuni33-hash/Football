import test from 'node:test';
import assert from 'node:assert/strict';
import { StateManager } from '../../state/stateManager.js';
import { startInteractiveMatch } from '../../domain/match/interactiveMatchController.js';

test('une session legacy sans chronologie canonique est interrompue et son match reste recommençable', () => {
  const previous = globalThis.localStorage;
  const memory = new Map();
  globalThis.localStorage = {
    getItem:key=>memory.get(key)??null,
    setItem:(key,value)=>memory.set(key,String(value)),
    removeItem:key=>memory.delete(key)
  };
  try {
    localStorage.setItem(StateManager.STORAGE_KEY,JSON.stringify({
      schemaVersion:11,
      player:{id:'legacy-player',firstname:'Alex',lastname:'Legacy',age:18,position:'BU',attributes:{vitesse:60,tir:60,passe:60,dribble:60,defense:30,physique:55,mental:60},stats:{}},
      activeMatchSession:{id:'old-session',flowVersion:4,matchIndex:7,match:{id:'fixture-to-restart'},score:{home:2,away:1},events:[]}
    }));
    const migrated = StateManager.load();
    assert.equal(migrated.activeMatchSession,null);
    assert.deepEqual(migrated.interruptedInteractiveMatch,{reason:'canonical-goal-events-required',matchIndex:7,fixtureId:'fixture-to-restart'});
    assert.deepEqual(migrated.committedInteractiveMatchIds,[]);
    const restarted = startInteractiveMatch(migrated,{id:'fixture-to-restart',opponent:'Rival',home:true,playerSelection:{started:true,minutes:90}},7);
    assert.equal(restarted.flowVersion,5);
    assert.deepEqual(restarted.goalEvents,[]);
    assert.equal(Object.hasOwn(migrated,'interruptedInteractiveMatch'),false);
  } finally {
    if(previous===undefined)delete globalThis.localStorage;
    else globalThis.localStorage=previous;
  }
});

test('un résultat interactif legacy est conservé sans reconstruction canonique', () => {
  const previous = globalThis.localStorage;
  const memory = new Map();
  globalThis.localStorage = {
    getItem:key=>memory.get(key)??null,
    setItem:(key,value)=>memory.set(key,String(value)),
    removeItem:key=>memory.delete(key)
  };
  try {
    localStorage.setItem(StateManager.STORAGE_KEY,JSON.stringify({
      schemaVersion:11,
      player:{id:'legacy-player',firstname:'Alex',lastname:'Legacy',age:18,position:'BU',attributes:{vitesse:60,tir:60,passe:60,dribble:60,defense:30,physique:55,mental:60},stats:{}},
      committedInteractiveMatchIds:['legacy-result'],
      interactiveBlockResults:[{
        interactive:true,
        interactiveFlowVersion:4,
        matchId:'legacy-result',
        matchIndex:2,
        fixture:{id:'fixture-result'},
        score:{home:2,away:1},
        teamGoals:2,
        opponentGoals:1,
        goalEvents:[]
      }]
    }));
    const migrated = StateManager.load();
    assert.equal(migrated.interactiveBlockResults.length,1);
    assert.equal(migrated.interactiveBlockResults[0].interactive,false);
    assert.equal(migrated.interactiveBlockResults[0].recoveredLegacyInteractive,true);
    assert.equal(migrated.interactiveBlockResults[0].matchIndex,2);
    assert.deepEqual(migrated.interactiveBlockResults[0].score,{home:2,away:1});
    assert.equal(Object.hasOwn(migrated.interactiveBlockResults[0],'goalEvents'),false);
    assert.deepEqual(migrated.committedInteractiveMatchIds,['legacy-result']);
    assert.deepEqual(migrated.interruptedInteractiveBlock,{
      reason:'canonical-goal-events-required',
      matches:[{matchIndex:2,fixtureId:'fixture-result',matchId:'legacy-result'}]
    });
  } finally {
    if(previous===undefined)delete globalThis.localStorage;
    else globalThis.localStorage=previous;
  }
});
