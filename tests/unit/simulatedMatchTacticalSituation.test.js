import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSimulatedMatchTacticalSituation, tacticalExperienceProfile } from '../../domain/match/simulatedMatchTacticalSituation.js';

const duel={id:'duel-1',type:'DUEL',cameraState:'DUEL',possessionSide:'HOME',zone:{x:58,y:42,lane:'CENTER'},ballCarrier:{team:'HOME',index:9}};

test('chaque situation contient exactement onze joueurs par équipe et un ballon cadré',()=>{
 for(const type of ['BUILD_UP','PRESSING','DUEL','COUNTER_ATTACK','CROSS','SHOT','SET_PIECE','GOAL']){
  const event={...duel,id:`event-${type}`,type,cameraState:type,possessionSide:'HOME'};
  const tactical=buildSimulatedMatchTacticalSituation(event,{playerAge:14,competition:'U15'});
  assert.equal(tactical.home.length,11);assert.equal(tactical.away.length,11);
  for(const point of [...tactical.home,...tactical.away,tactical.ball]){assert.ok(point.x>=3&&point.x<=97);assert.ok(point.y>=3&&point.y<=97);}
 }
});

test('le ballon est rattaché au porteur sauf lorsqu il voyage vers le but',()=>{
 const tactical=buildSimulatedMatchTacticalSituation(duel,{seed:'duel'});
 assert.deepEqual(tactical.ball.owner,{team:'HOME',index:9});
 assert.equal(tactical.home[9].x,duel.zone.x);assert.equal(tactical.home[9].y,duel.zone.y);
 const shot=buildSimulatedMatchTacticalSituation({...duel,type:'SHOT',cameraState:'SHOT'},{seed:'shot'});
 assert.equal(shot.ball.owner,null);assert.ok(shot.ball.x>duel.zone.x);
 const goal=buildSimulatedMatchTacticalSituation({...duel,type:'GOAL',cameraState:'GOAL'},{seed:'goal'});
 assert.equal(goal.ball.owner,null);assert.ok(goal.ball.x>=96);
});

test('les jeunes sont moins parfaitement organisés que les pros sans devenir aléatoires',()=>{
 assert.ok(tacticalExperienceProfile({playerAge:14,competition:'U15'}).discipline<tacticalExperienceProfile({playerAge:25,competition:'Ligue 1'}).discipline);
 const youthA=buildSimulatedMatchTacticalSituation(duel,{playerAge:14,competition:'U15',seed:'stable'});
 const youthB=buildSimulatedMatchTacticalSituation(duel,{playerAge:14,competition:'U15',seed:'stable'});
 const pro=buildSimulatedMatchTacticalSituation(duel,{playerAge:25,competition:'Ligue 1',seed:'stable'});
 assert.deepEqual(youthA,youthB);
 assert.notDeepEqual(youthA.home,pro.home);
});
