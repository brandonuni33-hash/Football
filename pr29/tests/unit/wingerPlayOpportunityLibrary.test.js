import test from 'node:test';
import assert from 'node:assert/strict';
import { WINGER_PLAY_OPPORTUNITIES, selectWingerPlayOpportunity, buildWingerPlayDecision } from '../../domain/match/wingerPlayOpportunityLibrary.js';

test('winger play catalog contains 60 authored AG AD scenarios',()=>{
 assert.equal(WINGER_PLAY_OPPORTUNITIES.length,60);
 assert.equal(new Set(WINGER_PLAY_OPPORTUNITIES.map(x=>x.id)).size,60);
 for(const item of WINGER_PLAY_OPPORTUNITIES){
  assert.match(item.id,/^WNG-0[0-5][0-9]$|^WNG-060$/);
  assert.deepEqual(item.positions,['AG','AD']);
  assert.equal(item.choices.length,3);
  assert.ok(new Set(item.choices.map(c=>c.style)).size>=2);
 }
});

test('winger opportunities are exclusive to AG AD',()=>{
 for(const position of ['BU','MC','MOC','DC','DG','DD','GK'])assert.equal(selectWingerPlayOpportunity({seed:'x',position,minute:50}),null);
 assert.ok(selectWingerPlayOpportunity({seed:'ag',position:'AG',minute:50}));
 assert.ok(selectWingerPlayOpportunity({seed:'ad',position:'AD',minute:50}));
});

test('LW RW aliases map to AG AD',()=>{
 assert.ok(selectWingerPlayOpportunity({seed:'lw',position:'LW',minute:50}));
 assert.ok(selectWingerPlayOpportunity({seed:'rw',position:'RW',minute:50}));
});

test('conditional winger scenes do not leak outside context',()=>{
 const normal=Array.from({length:100},(_,index)=>selectWingerPlayOpportunity({seed:`normal-${index}`,index,position:'AG',minute:60,scoreFor:1,scoreAgainst:1,fatigue:20})).filter(Boolean);
 assert.ok(normal.every(item=>!item.requiresExtraTime&&!item.requiresTrailing&&!item.requiresLead&&!item.requiresCoachSignal&&!item.requiresSideSwitch&&!item.requiresLowInvolvement&&!item.requiresOpponentYellow&&!item.requiresRivalry&&!item.requiresFatigue));
});

test('late extra-time winger context can select from the full eligible pool',()=>{
 const found=Array.from({length:500},(_,index)=>selectWingerPlayOpportunity({seed:`et-${index}`,index,position:'AD',minute:112,scoreFor:2,scoreAgainst:2,fatigue:80,extraTime:true,coachSignal:true,sideSwitch:true,lowInvolvement:true,opponentYellow:true,rivalry:true,directOpponent:{playerDuelsWon:3,opponentDuelsWon:1}})).filter(Boolean);
 assert.ok(found.some(item=>item.id==='WNG-059'));
});

test('winger decision keeps authored text and three choices',()=>{
 const source=WINGER_PLAY_OPPORTUNITIES.find(x=>x.id==='WNG-021');
 const decision=buildWingerPlayDecision(source,{minute:64});
 assert.equal(decision.opportunityId,'WNG-021');
 assert.equal(decision.isWingerPlayOpportunity,true);
 assert.match(decision.title,/64'/);
 assert.equal(decision.choices.length,3);
});
