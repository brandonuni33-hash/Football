import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSimulatedMatchTimeline, formatFootballClock } from '../../domain/match/simulatedMatchTimeline.js';

const row={matchId:'sim:test:1',matchIndex:0,home:true,team:'Blagnac U15',opponent:'Lens U15',competitionName:'U15',score:{home:3,away:1},goals:2,assists:1,shots:4,shotsOnTarget:3,duels:5,tackles:2,successfulPasses:22,playerPlayed:true};

test('la chronologie conserve exactement le score simulé et les contributions possibles',()=>{
 const timeline=buildSimulatedMatchTimeline(row,{seed:'score-seed',player:{age:14,club:'Blagnac U15'}});
 const goals=timeline.events.filter(event=>event.type==='GOAL');
 assert.equal(goals.length,4);assert.equal(goals.filter(event=>event.possessionSide==='HOME').length,3);assert.equal(goals.filter(event=>event.possessionSide==='AWAY').length,1);
 assert.deepEqual(timeline.events.at(-1).score,{home:3,away:1});
 assert.equal(goals.filter(event=>event.playerContribution==='GOAL').length,2);assert.equal(goals.filter(event=>event.playerContribution==='ASSIST').length,1);
});

test('une seed donne exactement la même chronologie et les minutes varient entre matchs',()=>{
 const a=buildSimulatedMatchTimeline(row,{seed:'same'}),b=buildSimulatedMatchTimeline(row,{seed:'same'});assert.deepEqual(a.events,b.events);
 const labels=new Set();for(let i=0;i<16;i+=1)buildSimulatedMatchTimeline(row,{seed:`variation-${i}`}).events.filter(event=>event.type==='GOAL').forEach(event=>labels.add(event.minuteLabel));
 assert.ok(labels.size>8);assert.ok(!([...labels].length===1&&labels.has("47'")));
});

test('le temps additionnel et la prolongation utilisent la notation football',()=>{
 assert.equal(formatFootballClock({period:'FIRST_HALF',regulationMinute:45,stoppageMinute:2}),"45+2'");
 assert.equal(formatFootballClock({period:'SECOND_HALF',regulationMinute:90,stoppageMinute:3}),"90+3'");
 assert.equal(formatFootballClock({period:'EXTRA_FIRST',regulationMinute:105,stoppageMinute:1}),"105+1'");
 assert.equal(formatFootballClock({period:'EXTRA_SECOND',regulationMinute:120,stoppageMinute:2}),"120+2'");
 const timeline=buildSimulatedMatchTimeline({...row,matchId:'extra',extraTime:true},{seed:'extra'});assert.equal(timeline.extraTime,true);assert.equal(timeline.events.at(-1).minuteLabel,"120'");
});

test('le porteur déclaré appartient toujours à l équipe en possession',()=>{
 const timeline=buildSimulatedMatchTimeline(row,{seed:'carrier'});
 for(const event of timeline.events)assert.equal(event.ballCarrier.team,event.possessionSide);
});

test('après la mi-temps les zones tactiques sont réellement inversées',()=>{
 const baseX={BUILD_UP:34,PASSING_PATTERN:54,COUNTER_PRESS:58,DEFENSIVE_RECOVERY:68,OFFSIDE_TRAP:61,DUEL:55,COUNTER_ATTACK:69,CROSS:78,SHOT:82,SET_PIECE:72,GOAL:88};
 for(let seedIndex=0;seedIndex<20;seedIndex+=1){
  const timeline=buildSimulatedMatchTimeline({...row,matchId:`side-${seedIndex}`},{seed:`side-${seedIndex}`});
  for(const event of timeline.events){
   if(event.type==='PRESSING'){
    const homeRight=event.clock.period!=='SECOND_HALF'&&event.clock.period!=='EXTRA_SECOND';
    const sideRight=event.possessionSide==='HOME'?homeRight:!homeRight;
    assert.ok(sideRight?event.zone.x>=32&&event.zone.x<=48:event.zone.x>=52&&event.zone.x<=68);
    continue;
   }
   if(!(event.type in baseX))continue;
   const homeRight=event.clock.period!=='SECOND_HALF'&&event.clock.period!=='EXTRA_SECOND';
   const sideRight=event.possessionSide==='HOME'?homeRight:!homeRight;
   const expected=sideRight?baseX[event.type]:100-baseX[event.type];
   assert.ok(Math.abs(event.zone.x-expected)<0.001,`${event.type} ${event.clock.period} ${event.possessionSide}: ${event.zone.x} != ${expected}`);
  }
 }
});

test('les familles tactiques majeures apparaissent sur une série de matchs sans surcharger chaque rencontre',()=>{
 const seen=new Set(),patterns=new Set();
 for(let i=0;i<80;i+=1){
  const timeline=buildSimulatedMatchTimeline({...row,matchId:`tactical-${i}`,score:{home:1,away:1}},{seed:`tactical-${i}`});
  const contexts=timeline.events.filter(event=>!['KICKOFF','GOAL','FULL_TIME'].includes(event.type));
  assert.ok(contexts.length<=4);
  for(const event of contexts){
   seen.add(event.type);
   if(event.type==='PASSING_PATTERN'){assert.ok(['THIRD_PLAYER','OVERLAP','SWITCH_PLAY'].includes(event.passingPattern));patterns.add(event.passingPattern);}
   if(event.type==='COUNTER_PRESS'){assert.notEqual(event.pressingSide,event.possessionSide);assert.equal(event.pressTrigger,'TURNOVER');}
   if(event.type==='DEFENSIVE_RECOVERY')assert.notEqual(event.recoveringSide,event.possessionSide);
   if(event.type==='OFFSIDE_TRAP'){assert.notEqual(event.trapSide,event.possessionSide);assert.equal(event.ballPressure,true);}
  }
 }
 for(const type of ['BUILD_UP','PASSING_PATTERN','PRESSING','COUNTER_PRESS','DEFENSIVE_RECOVERY','OFFSIDE_TRAP'])assert.ok(seen.has(type),`phase absente: ${type}`);
 assert.ok(patterns.size>=2);
});

test('le pressing possède des déclencheurs crédibles et identifie l équipe qui presse',()=>{
 const triggers=new Set(),perspectives=new Set();let total=0;
 for(let i=0;i<80;i+=1){
  const timeline=buildSimulatedMatchTimeline({...row,matchId:`press-${i}`,score:{home:1,away:0}},{seed:`press-${i}`});
  for(const event of timeline.events.filter(event=>event.type==='PRESSING')){
   total+=1;assert.ok(['TOUCHLINE','BACK_TO_GOAL','BACK_PASS','HEAVY_TOUCH'].includes(event.pressTrigger));assert.notEqual(event.pressingSide,event.possessionSide);assert.match(event.text,/press|ligne|bloc|couvr|axe/i);triggers.add(event.pressTrigger);perspectives.add(event.pressingSide===timeline.playerSide?'PLAYER_PRESSES':'OPPONENT_PRESSES');
  }
 }
 assert.ok(total>=10);assert.ok(triggers.size>=3);assert.ok(perspectives.has('PLAYER_PRESSES'));
});

test('les coups de pied arrêtés synthétiques n inventent jamais un penalty',()=>{
 for(let i=0;i<30;i+=1){
  const timeline=buildSimulatedMatchTimeline(row,{seed:`setpiece-${i}`});
  for(const event of timeline.events.filter(e=>e.type==='SET_PIECE'))assert.notEqual(event.setPieceKind,'PENALTY');
 }
});
