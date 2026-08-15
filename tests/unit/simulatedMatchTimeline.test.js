import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSimulatedMatchTimeline, formatFootballClock } from '../../domain/match/simulatedMatchTimeline.js';

const row={matchId:'sim:test:1',matchIndex:0,home:true,team:'Blagnac U15',opponent:'Lens U15',competitionName:'U15',score:{home:3,away:1},goals:2,assists:1,shots:4,shotsOnTarget:3,duels:5,tackles:2,successfulPasses:22,playerPlayed:true};

test('la chronologie conserve exactement le score simulé et les contributions possibles',()=>{
 const timeline=buildSimulatedMatchTimeline(row,{seed:'score-seed',player:{age:14,club:'Blagnac U15'}});
 const goals=timeline.events.filter(event=>event.type==='GOAL');
 assert.equal(goals.length,4);
 assert.equal(goals.filter(event=>event.possessionSide==='HOME').length,3);
 assert.equal(goals.filter(event=>event.possessionSide==='AWAY').length,1);
 assert.deepEqual(timeline.events.at(-1).score,{home:3,away:1});
 assert.equal(goals.filter(event=>event.playerContribution==='GOAL').length,2);
 assert.equal(goals.filter(event=>event.playerContribution==='ASSIST').length,1);
});

test('une seed donne exactement la même chronologie et les minutes varient entre matchs',()=>{
 const a=buildSimulatedMatchTimeline(row,{seed:'same'}),b=buildSimulatedMatchTimeline(row,{seed:'same'});
 assert.deepEqual(a.events,b.events);
 const labels=new Set();
 for(let i=0;i<16;i+=1)buildSimulatedMatchTimeline(row,{seed:`variation-${i}`}).events.filter(event=>event.type==='GOAL').forEach(event=>labels.add(event.minuteLabel));
 assert.ok(labels.size>8);
 assert.ok(!([...labels].length===1&&labels.has("47'")));
});

test('le temps additionnel et la prolongation utilisent la notation football',()=>{
 assert.equal(formatFootballClock({period:'FIRST_HALF',regulationMinute:45,stoppageMinute:2}),"45+2'");
 assert.equal(formatFootballClock({period:'SECOND_HALF',regulationMinute:90,stoppageMinute:3}),"90+3'");
 assert.equal(formatFootballClock({period:'EXTRA_FIRST',regulationMinute:105,stoppageMinute:1}),"105+1'");
 assert.equal(formatFootballClock({period:'EXTRA_SECOND',regulationMinute:120,stoppageMinute:2}),"120+2'");
 const timeline=buildSimulatedMatchTimeline({...row,matchId:'extra',extraTime:true},{seed:'extra'});
 assert.equal(timeline.extraTime,true);
 assert.equal(timeline.events.at(-1).minuteLabel,"120'");
});

test('le porteur déclaré appartient toujours à l équipe en possession',()=>{
 const timeline=buildSimulatedMatchTimeline(row,{seed:'carrier'});
 for(const event of timeline.events)assert.equal(event.ballCarrier.team,event.possessionSide);
});
