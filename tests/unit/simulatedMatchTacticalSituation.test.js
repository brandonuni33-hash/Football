import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSimulatedMatchTacticalSituation, tacticalExperienceProfile, playerSlotForPosition } from '../../domain/match/simulatedMatchTacticalSituation.js';

const duel={id:'duel-1',type:'DUEL',cameraState:'DUEL',clock:{period:'FIRST_HALF',regulationMinute:28,stoppageMinute:0},possessionSide:'HOME',zone:{x:58,y:42,lane:'CENTER'},ballCarrier:{team:'HOME',index:9}};

test('chaque situation contient exactement onze joueurs par équipe et un ballon cadré',()=>{
 for(const type of ['KICKOFF','BUILD_UP','PRESSING','DUEL','COUNTER_ATTACK','CROSS','SHOT','SET_PIECE','GOAL','FULL_TIME']){
  const event={...duel,id:`event-${type}`,type,cameraState:type,possessionSide:'HOME'};
  if(type==='KICKOFF')Object.assign(event,{clock:{period:'FIRST_HALF',regulationMinute:0,stoppageMinute:0},zone:{x:50,y:50,lane:'CENTER'}});
  if(type==='FULL_TIME')Object.assign(event,{clock:{period:'SECOND_HALF',regulationMinute:90,stoppageMinute:0},zone:{x:50,y:50,lane:'CENTER'}});
  const tactical=buildSimulatedMatchTacticalSituation(event,{playerAge:14,competition:'U15',seed:'bounds',playerSide:'HOME'});
  assert.equal(tactical.home.length,11);assert.equal(tactical.away.length,11);
  for(const p of [...tactical.home,...tactical.away,tactical.ball]){assert.ok(p.x>=1.5&&p.x<=98.5);assert.ok(p.y>=2&&p.y<=98);}
 }
});

test('le joueur focal dépend du poste et reste sur le slot de la formation',()=>{
 const shot={...duel,type:'SHOT',cameraState:'SHOT',playerInvolved:true,zone:{x:82,y:50,lane:'CENTER'}};
 const striker=buildSimulatedMatchTacticalSituation(shot,{seed:'position-map',playerSide:'HOME',playerPosition:'BU'});
 const centreBack=buildSimulatedMatchTacticalSituation(shot,{seed:'position-map',playerSide:'HOME',playerPosition:'DC'});
 assert.equal(striker.playerFocal.index,playerSlotForPosition('BU',striker.formations.own));
 assert.equal(centreBack.playerFocal.index,playerSlotForPosition('DC',centreBack.formations.own));
 assert.notEqual(striker.playerFocal.index,centreBack.playerFocal.index);
 assert.equal(striker.carrier.index,striker.playerFocal.index);
 assert.notEqual(centreBack.carrier.index,centreBack.playerFocal.index);
});

test('le ballon part du porteur puis vise la cible footballistique',()=>{
 const shot={...duel,type:'SHOT',cameraState:'SHOT',playerInvolved:true,zone:{x:82,y:50,lane:'CENTER'}};
 const first=buildSimulatedMatchTacticalSituation(shot,{seed:'flight',playerSide:'HOME',playerPosition:'BU'});
 const carrier=first.home[first.carrier.index];
 assert.equal(first.ball.x,carrier.x);assert.equal(first.ball.y,carrier.y);
 assert.equal(first.ball.trajectory.kind,'SHOT');
 assert.ok(first.ball.trajectory.to.x>first.ball.trajectory.from.x);
 assert.ok(first.ball.trajectory.to.x>=97);
 const second=buildSimulatedMatchTacticalSituation({...shot,clock:{period:'SECOND_HALF',regulationMinute:62},zone:{x:18,y:50,lane:'CENTER'}},{seed:'flight',playerSide:'HOME',playerPosition:'BU'});
 assert.ok(second.ball.trajectory.to.x<second.ball.trajectory.from.x);
 assert.ok(second.ball.trajectory.to.x<=3);
 const cross=buildSimulatedMatchTacticalSituation({...shot,type:'CROSS',cameraState:'DANGER',zone:{x:78,y:22,lane:'LEFT'}},{seed:'cross-flight',playerSide:'HOME',playerPosition:'AG'});
 assert.equal(cross.ball.trajectory.kind,'CROSS');
 assert.ok(cross.ball.trajectory.to.x>=84&&cross.ball.trajectory.to.x<=88);
 assert.ok(cross.ball.trajectory.to.y>=34&&cross.ball.trajectory.to.y<=66);
});

test('coup d envoi et fin de match gardent chacun dans sa moitié et les côtés sont inversés',()=>{
 const kickoff=buildSimulatedMatchTacticalSituation({...duel,type:'KICKOFF',clock:{period:'FIRST_HALF',regulationMinute:0},zone:{x:50,y:50},ballCarrier:{team:'HOME',index:9}},{seed:'halves',playerAge:14,competition:'U15',playerSide:'HOME'});
 assert.ok(kickoff.home.every(p=>p.x<=49.4));assert.ok(kickoff.away.every(p=>p.x>=50.6));
 assert.equal(kickoff.sides.homeAttacksRight,true);assert.equal(kickoff.sides.awayAttacksRight,false);
 const full=buildSimulatedMatchTacticalSituation({...duel,type:'FULL_TIME',clock:{period:'SECOND_HALF',regulationMinute:90},zone:{x:50,y:50},ballCarrier:{team:'HOME',index:9}},{seed:'halves',playerAge:14,competition:'U15',playerSide:'HOME'});
 assert.ok(full.home.every(p=>p.x>=50.6));assert.ok(full.away.every(p=>p.x<=49.4));
 assert.equal(full.sides.homeAttacksRight,false);assert.equal(full.sides.awayAttacksRight,true);
});

test('les formations restent stables pendant un match mais varient entre les matchs',()=>{
 const sameA=buildSimulatedMatchTacticalSituation(duel,{seed:'match-stable',playerSide:'HOME'});
 const sameB=buildSimulatedMatchTacticalSituation({...duel,type:'SHOT',zone:{x:82,y:50}},{seed:'match-stable',playerSide:'HOME'});
 assert.deepEqual(sameA.formations,sameB.formations);
 const own=new Set(),opponents=new Set();
 for(let i=0;i<30;i+=1){const t=buildSimulatedMatchTacticalSituation(duel,{seed:`formation-${i}`,playerSide:'HOME'});own.add(t.formations.own);opponents.add(t.formations.opponent);}
 assert.ok(own.size>=2);assert.ok(opponents.size>=4);
});

test('une phase offensive fait remonter notre défense et redescendre les attaquants adverses',()=>{
 const shot={...duel,type:'SHOT',cameraState:'SHOT',playerInvolved:true,zone:{x:82,y:50,lane:'CENTER'}};
 const tactical=buildSimulatedMatchTacticalSituation(shot,{seed:'compact-shot',playerSide:'HOME',playerPosition:'BU',playerAge:25,competition:'Ligue 1'});
 const ownDefence=tactical.home.slice(1,5).map(p=>p.x);
 assert.ok(ownDefence.every(x=>x>36));
 assert.ok(Math.min(...tactical.away.slice(1).map(p=>p.x))>50);
 const carrier=tactical.home[tactical.carrier.index];
 const near=tactical.home.filter((p,index)=>index!==tactical.carrier.index&&index!==0&&Math.hypot(p.x-carrier.x,p.y-carrier.y)<=27);
 assert.ok(near.length>=3);
});

test('les gardiens regardent toujours le ballon ou sa trajectoire',()=>{
 const shot={...duel,id:'keeper-facing',type:'SHOT',cameraState:'SHOT',playerInvolved:true,zone:{x:82,y:44,lane:'CENTER'}};
 const tactical=buildSimulatedMatchTacticalSituation(shot,{seed:'keeper-facing',playerSide:'HOME',playerPosition:'BU'});
 const target=tactical.ball.trajectory?.to||tactical.ball;
 for(const keeper of [tactical.home[0],tactical.away[0]]){
  const expected=Math.atan2(target.y-keeper.y,target.x-keeper.x)*180/Math.PI;
  assert.ok(Math.abs(keeper.facing-expected)<1e-9);
 }
});

test('les coups de pied arrêtés respectent des structures football lisibles',()=>{
 const freeKick=buildSimulatedMatchTacticalSituation({...duel,type:'SET_PIECE',cameraState:'SET_PIECE',setPieceKind:'FREE_KICK_DIRECT',zone:{x:73,y:49,lane:'CENTER'},ballCarrier:{team:'HOME',index:7}},{seed:'fk',playerSide:'HOME'});
 const wall=freeKick.away.filter(p=>p.role==='wall');assert.ok(wall.length>=3&&wall.length<=4);assert.equal(freeKick.ball.x,freeKick.home[7].x);assert.equal(freeKick.ball.y,freeKick.home[7].y);assert.ok(freeKick.ball.trajectory.to.x>=97);
 const penalty=buildSimulatedMatchTacticalSituation({...duel,type:'SET_PIECE',cameraState:'SET_PIECE',setPieceKind:'PENALTY',zone:{x:89.5,y:50,lane:'CENTER'},ballCarrier:{team:'HOME',index:9}},{seed:'pen',playerSide:'HOME'});
 assert.ok(penalty.home[9].x>88&&penalty.home[9].x<91);assert.ok(penalty.away[0].x>=96);assert.ok(penalty.home.filter((_,i)=>i!==9).every(p=>p.x<=81));assert.ok(penalty.away.filter((_,i)=>i!==0).every(p=>p.x<=81));assert.equal(penalty.ball.trajectory.kind,'PENALTY');
 const corner=buildSimulatedMatchTacticalSituation({...duel,type:'SET_PIECE',cameraState:'SET_PIECE',setPieceKind:'CORNER',zone:{x:96,y:4,lane:'LEFT'},ballCarrier:{team:'HOME',index:8}},{seed:'corner',playerSide:'HOME'});
 assert.ok(corner.home[8].x>=96&&corner.home[8].y<=4);assert.ok(corner.home.filter(p=>p.role==='target').length>=3);assert.equal(corner.ball.trajectory.kind,'CORNER');
});

test('les jeunes sont moins parfaitement organisés que les pros sans devenir aléatoires',()=>{
 assert.ok(tacticalExperienceProfile({playerAge:14,competition:'U15'}).discipline<tacticalExperienceProfile({playerAge:25,competition:'Ligue 1'}).discipline);
 const youthA=buildSimulatedMatchTacticalSituation(duel,{playerAge:14,competition:'U15',seed:'stable'}),youthB=buildSimulatedMatchTacticalSituation(duel,{playerAge:14,competition:'U15',seed:'stable'}),pro=buildSimulatedMatchTacticalSituation(duel,{playerAge:25,competition:'Ligue 1',seed:'stable'});
 assert.deepEqual(youthA,youthB);assert.notDeepEqual(youthA.home,pro.home);
});
