// Projection tactique d'un événement de match simulé.
// Les positions sont une conséquence du fait canonique ; l'UI ne les invente jamais.

const clamp = (value, min = 3, max = 97) => Math.max(min, Math.min(max, Number(value) || 50));
const point = (x, y, role = 'outfield', facing = 0) => ({ x: clamp(x), y: clamp(y), role, facing: Number(facing) || 0 });
const ballPoint = (x, y) => ({ x: clamp(x, 1.5, 98.5), y: clamp(y, 2, 98), role: 'ball' });

const FORMATIONS = Object.freeze({
    '4-3-3': Object.freeze([
        point(7,50,'goalkeeper'), point(21,15),point(22,37),point(22,63),point(21,85),
        point(40,25),point(43,50),point(40,75), point(62,18),point(66,50),point(62,82)
    ]),
    '4-2-3-1': Object.freeze([
        point(7,50,'goalkeeper'), point(21,15),point(22,37),point(22,63),point(21,85),
        point(38,37),point(38,63), point(53,20),point(55,50),point(53,80), point(66,50)
    ]),
    '4-4-2': Object.freeze([
        point(7,50,'goalkeeper'), point(21,15),point(22,37),point(22,63),point(21,85),
        point(41,15),point(43,39),point(43,61),point(41,85), point(63,37),point(63,63)
    ]),
    '3-4-3': Object.freeze([
        point(7,50,'goalkeeper'), point(23,25),point(24,50),point(23,75),
        point(41,14),point(43,38),point(43,62),point(41,86),
        point(63,20),point(66,50),point(63,80)
    ]),
    '3-5-2': Object.freeze([
        point(7,50,'goalkeeper'), point(23,25),point(24,50),point(23,75),
        point(39,13),point(43,33),point(44,50),point(43,67),point(39,87),
        point(64,38),point(64,62)
    ])
});
const OWN_FORMATIONS = Object.freeze(['4-3-3','4-2-3-1','4-4-2']);
const OPPONENT_FORMATIONS = Object.freeze(['4-3-3','4-2-3-1','4-4-2','3-4-3','3-5-2']);

const PLAYER_SLOTS = Object.freeze({
    '4-3-3': Object.freeze({GK:0,GB:0,DG:1,LB:1,DC:2,CB:2,DCD:3,DD:4,RB:4,MG:5,LM:5,MDC:6,CDM:6,MC:6,CM:6,MOC:6,CAM:6,MD:7,RM:7,AG:8,LW:8,BU:9,ST:9,AC:9,AD:10,RW:10}),
    '4-2-3-1': Object.freeze({GK:0,GB:0,DG:1,LB:1,DC:2,CB:2,DCD:3,DD:4,RB:4,MDC:5,CDM:5,MC:6,CM:6,MG:7,LM:7,AG:7,LW:7,MOC:8,CAM:8,MD:9,RM:9,AD:9,RW:9,BU:10,ST:10,AC:10}),
    '4-4-2': Object.freeze({GK:0,GB:0,DG:1,LB:1,DC:2,CB:2,DCD:3,DD:4,RB:4,MG:5,LM:5,MDC:6,CDM:6,MC:6,CM:6,MOC:7,CAM:7,MD:8,RM:8,AG:5,LW:5,AD:8,RW:8,BU:9,ST:9,AC:10})
});

const EXPERIENCE = Object.freeze({
    U15: Object.freeze({id:'U15',discipline:.52,disorder:4.8,lineDrift:3.5,ballAttraction:.12}),
    YOUTH: Object.freeze({id:'YOUTH',discipline:.69,disorder:3,lineDrift:2.2,ballAttraction:.075}),
    SEMI_PRO: Object.freeze({id:'SEMI_PRO',discipline:.84,disorder:1.55,lineDrift:1.15,ballAttraction:.035}),
    PRO: Object.freeze({id:'PRO',discipline:.96,disorder:.65,lineDrift:.45,ballAttraction:.012})
});

function hash(seed=''){let value=2166136261;for(const char of String(seed)){value^=char.charCodeAt(0);value=Math.imul(value,16777619);}return value>>>0;}
function signedUnit(seed=''){return(hash(seed)%2001)/1000-1;}
function chooseFormation(seed,pool){return pool[hash(seed)%pool.length];}

export function tacticalExperienceProfile({playerAge=0,competition=''}={}){
    const age=Number(playerAge)||0,text=String(competition||'').toLowerCase();
    if(/\bu\s?15\b|moins de 15/.test(text)||(age&&age<=15))return EXPERIENCE.U15;
    if(/\bu\s?1[6789]\b|formation|academy|académie|juvenil|youth/.test(text)||(age&&age<=18))return EXPERIENCE.YOUTH;
    if(/national|regional|régional|semi.?pro|district|serie c|league one|3\. liga|primera federaci[oó]n/.test(text))return EXPERIENCE.SEMI_PRO;
    return EXPERIENCE.PRO;
}

function normalizePosition(position='BU'){
    const raw=String(position||'BU').trim().toUpperCase().replaceAll(' ','').replaceAll('-','');
    const aliases={G:'GK',GARDIEN:'GK',GOALKEEPER:'GK',DL:'DG',LEFTBACK:'LB',DR:'DD',RIGHTBACK:'RB',DEF:'DC',DEFENSEUR:'DC',CENTREBACK:'CB',MIL:'MC',MILIEU:'MC',CENTREMID:'CM',AILIERG:'AG',LEFTWING:'LW',AILIERD:'AD',RIGHTWING:'RW',AT:'BU',ATT:'BU',ATTAQUANT:'BU',STRIKER:'ST'};
    return aliases[raw]||raw;
}
export function playerSlotForPosition(position='BU',formation='4-3-3'){
    const slots=PLAYER_SLOTS[formation]||PLAYER_SLOTS['4-3-3'],normalized=normalizePosition(position);
    if(Number.isInteger(slots[normalized]))return slots[normalized];
    if(/^DC/.test(normalized))return slots.DC??2;
    if(/^(AG|LW)/.test(normalized))return slots.AG??slots.MG??8;
    if(/^(AD|RW)/.test(normalized))return slots.AD??slots.MD??10;
    if(/^(MDC|CDM)/.test(normalized))return slots.MDC??slots.MC??6;
    if(/^(MOC|CAM)/.test(normalized))return slots.MOC??slots.MC??6;
    if(/^(MC|CM)/.test(normalized))return slots.MC??6;
    return slots.BU??9;
}
function positionFamily(position='BU'){
    const normalized=normalizePosition(position);
    if(/^(GK|GB)/.test(normalized))return'GOALKEEPER';
    if(/^(DG|DD|LB|RB|DC|CB|DCD)/.test(normalized))return'DEFENCE';
    if(/^(MDC|CDM|MC|CM|MG|MD|LM|RM|MOC|CAM)/.test(normalized))return'MIDFIELD';
    return'ATTACK';
}
function playerCanCarryEvent(event={},position='BU'){
    if(event.playerContribution==='GOAL'||event.playerContribution==='ASSIST')return true;
    const family=positionFamily(position);
    if(event.type==='DUEL')return family!=='GOALKEEPER';
    if(event.type==='BUILD_UP'||event.type==='PRESSING')return family==='DEFENCE'||family==='MIDFIELD';
    if(['COUNTER_ATTACK','CROSS','SHOT'].includes(event.type))return family==='MIDFIELD'||family==='ATTACK';
    return false;
}

// Changer de côté est une rotation de 180° : l'ailier droit doit rester à droite
// par rapport à sa propre direction d'attaque, et non au bord fixe de l'écran.
function mirrored(points){return points.map(p=>point(100-p.x,100-p.y,p.role,(Number(p.facing)||0)+180));}
function formationPoints(name,attackingRight){const base=FORMATIONS[name]||FORMATIONS['4-3-3'];return(attackingRight?base:mirrored(base)).map(p=>({...p}));}
function periodAttacksRight(team,event={}){const period=String(event.clock?.period||'').toUpperCase(),secondEnd=period==='SECOND_HALF'||period==='EXTRA_SECOND',homeRight=!secondEnd;return team==='HOME'?homeRight:!homeRight;}
function progressFor(p,attackingRight){return attackingRight?p.x:100-p.x;}
function xForProgress(progress,attackingRight){return attackingRight?progress:100-progress;}
function structuralLine(p,attackingRight){const progress=progressFor(p,attackingRight);return progress<32?'defence':progress<56?'midfield':'attack';}
function shiftBlock(points,dx,squeeze=1){return points.map(p=>p.role==='goalkeeper'?{...p}:point(p.x+dx,50+(p.y-50)*squeeze,p.role,p.facing));}
function setCarrier(points,index,zone,attackingRight){const target=Math.max(1,Math.min(10,Number(index)||9));points[target]=point(zone.x,zone.y,'carrier',attackingRight?0:180);return target;}
function closestDefenderIndex(points,zone){let best=1,distance=Infinity;for(let index=1;index<points.length;index+=1){const p=points[index],d=Math.hypot(p.x-zone.x,p.y-zone.y);if(d<distance){distance=d;best=index;}}return best;}
function nearestOutfieldIndexes(points,zone,excluded=new Set()){
    return points.map((p,index)=>({index,p,d:index===0||excluded.has(index)?Infinity:Math.hypot(p.x-zone.x,p.y-zone.y)})).filter(item=>Number.isFinite(item.d)).sort((a,b)=>a.d-b.d).map(item=>item.index);
}
function neutralHalfShape(points,attackingRight,kickoffTeam=false){const min=attackingRight?3:50.6,max=attackingRight?49.4:97;return points.map((p,index)=>{if(index===0)return{...p};if(kickoffTeam&&index===9)return point(attackingRight?49.4:50.6,50,'carrier',attackingRight?0:180);return point(clamp(p.x,min,max),p.y,p.role,p.facing);});}

function advanceSupport(owning,zone,direction,carrierIndex){
    const targets=[[5,zone.x-direction*20,clamp(zone.y-18,15,85)],[6,zone.x-direction*17,clamp(zone.y+4,18,82)],[7,zone.x-direction*20,clamp(zone.y+22,15,85)],[8,zone.x-direction*9,clamp(zone.y-20,10,90)],[10,zone.x-direction*7,clamp(zone.y+20,10,90)]];
    for(const[index,x,y]of targets)if(index!==carrierIndex&&owning[index])owning[index]=point(x,y,'support');
}
function compactOpenPlay(owning,defending,zone,direction,carrierIndex,intensity=1){
    const ownRight=direction>0,defRight=!ownRight,zoneProgress=progressFor(zone,ownRight);
    owning.forEach((p,index)=>{if(index===0||index===carrierIndex)return;const line=structuralLine(p,ownRight);let targetProgress;if(line==='defence')targetProgress=clamp(zoneProgress-39*intensity,33,55);else if(line==='midfield')targetProgress=clamp(zoneProgress-21*intensity,45,72);else targetProgress=clamp(zoneProgress-7*intensity,58,88);owning[index]=point(xForProgress(targetProgress,ownRight),50+(p.y-50)*.9,p.role,p.facing);});
    const goalX=direction>0?96:4;
    defending.forEach((p,index)=>{if(index===0)return;const line=structuralLine(p,defRight),offset=line==='defence'?14:line==='midfield'?27:40;defending[index]=point(goalX-direction*offset,50+(p.y-50)*.9,p.role,p.facing);});
}
function arrangePressing(owning,defending,zone,direction,carrierIndex,event={}){
    const defRight=direction<0,forceSign=zone.y<38?1:zone.y>62?-1:(signedUnit(`${event.id||'press'}:angle`)>=0?1:-1),defenders=nearestOutfieldIndexes(defending,zone),primaryIndex=defenders[0],coverIndexes=defenders.slice(1,3),reserved=new Set([primaryIndex,...coverIndexes]);
    if(Number.isInteger(primaryIndex))defending[primaryIndex]=point(zone.x+direction*3.5,clamp(zone.y+forceSign*3,6,94),'presser');
    if(Number.isInteger(coverIndexes[0]))defending[coverIndexes[0]]=point(zone.x+direction*8.5,clamp(zone.y-forceSign*8,9,91),'press-cover');
    if(Number.isInteger(coverIndexes[1]))defending[coverIndexes[1]]=point(zone.x+direction*11.5,clamp(zone.y+forceSign*11,9,91),'press-cover');
    defending.forEach((p,index)=>{
        if(index===0||reserved.has(index))return;
        const line=structuralLine(p,defRight),offset=line==='defence'?19:line==='midfield'?12:6,targetY=50+(p.y-50)*.52+(zone.y-50)*.28;
        defending[index]=point(zone.x+direction*offset,clamp(targetY,10,90),line==='defence'?'press-line':'press-balance');
    });
    defending[0]=point(direction>0?93.5:6.5,clamp(50+(zone.y-50)*.18,42,58),'goalkeeper');
    const outlets=nearestOutfieldIndexes(owning,zone,new Set([carrierIndex])).slice(0,2);
    if(Number.isInteger(outlets[0]))owning[outlets[0]]=point(zone.x-direction*8,clamp(zone.y-forceSign*9,9,91),'escape-option');
    if(Number.isInteger(outlets[1]))owning[outlets[1]]=point(zone.x-direction*12,clamp(zone.y+forceSign*12,9,91),'escape-option');
    return{primaryIndex,coverIndexes,trigger:String(event.pressTrigger||'TEAM_TRIGGER').toUpperCase()};
}
function arrangeFreeKick(owning,defending,zone,direction,carrierIndex,cross){
    const goalX=direction>0?96:4;defending[0]=point(goalX,50,'goalkeeper',direction>0?180:0);
    const wallSize=cross?3:4,wallX=zone.x+direction*7;[2,3,5,6].slice(0,wallSize).forEach((index,offset)=>defending[index]=point(wallX,zone.y-((wallSize-1)*3.2)+offset*6.4,'wall'));
    const boxX=direction>0?84:16;[8,9,10].filter(index=>index!==carrierIndex).forEach((index,offset)=>owning[index]=point(boxX-direction*(offset%2?2:5),34+offset*16,'target'));
    [1,4,7].forEach((index,offset)=>{if(defending[index])defending[index]=point(boxX+direction*1.5,32+offset*18,'marker');});
}
function arrangeCorner(owning,defending,direction,carrierIndex,event){
    const leftCorner=String(event.zone?.lane||'').toUpperCase()==='LEFT',cornerX=direction>0?96.4:3.6,cornerY=leftCorner?3.6:96.4;owning[carrierIndex]=point(cornerX,cornerY,'carrier',direction>0?0:180);
    const goalX=direction>0?96:4;defending[0]=point(goalX,50,'goalkeeper',direction>0?180:0);const boxX=direction>0?87:13;
    [8,9,10,6].filter(i=>i!==carrierIndex).forEach((index,offset)=>owning[index]=point(boxX-direction*(offset%2?3:6),28+offset*14,'target'));
    [1,2,3,4,5].forEach((index,offset)=>defending[index]=point(boxX+direction*(offset%2?1:3),25+offset*12,'marker'));
}
function arrangePenalty(owning,defending,direction,carrierIndex){
    const spotX=direction>0?89.5:10.5;owning[carrierIndex]=point(spotX,50,'carrier',direction>0?0:180);defending[0]=point(direction>0?96.5:3.5,50,'goalkeeper',direction>0?180:0);
    const outsideX=direction>0?80.5:19.5;[1,2,3,4,5,6,7,8,9,10].filter(i=>i!==carrierIndex).forEach((index,offset)=>owning[index]=point(outsideX-direction*(offset%3)*1.4,25+(offset%5)*12.5,'waiting'));
    [1,2,3,4,5,6,7,8,9,10].forEach((index,offset)=>defending[index]=point(outsideX-direction*(1.5+(offset%3)*1.3),24+(offset%5)*13,'waiting'));
}

function applySituation(home,away,event){
    const side=event.possessionSide==='AWAY'?'AWAY':'HOME',owning=side==='HOME'?home:away,defending=side==='HOME'?away:home,attackingRight=periodAttacksRight(side,event),direction=attackingRight?1:-1,zone=event.zone||{x:50,y:50};
    const carrierIndex=setCarrier(owning,event.ballCarrier?.index,zone,attackingRight),defenderIndex=closestDefenderIndex(defending,zone);let pressing=null;
    if(event.type==='KICKOFF'||event.type==='FULL_TIME'){
        const homeRight=periodAttacksRight('HOME',event),awayRight=periodAttacksRight('AWAY',event),h=neutralHalfShape(home,homeRight,side==='HOME'&&event.type==='KICKOFF'),a=neutralHalfShape(away,awayRight,side==='AWAY'&&event.type==='KICKOFF');h.forEach((p,i)=>home[i]=p);a.forEach((p,i)=>away[i]=p);
        if(event.type==='FULL_TIME'){const ownerTeam=side==='HOME'?home:away;ownerTeam[carrierIndex]=point(attackingRight?57:43,50,'carrier',attackingRight?0:180);}return{side,carrierIndex,defenderIndex,direction,pressing};
    }
    if(event.type==='BUILD_UP'){const shifted=shiftBlock(owning,direction*5,.94);shifted.forEach((p,index)=>{if(index!==carrierIndex)owning[index]=p;});defending.forEach((p,index)=>{if(index>0)defending[index]=point(p.x+direction*5,p.y,p.role,p.facing);});}
    if(event.type==='PRESSING')pressing=arrangePressing(owning,defending,zone,direction,carrierIndex,event);
    if(event.type==='DUEL'){if(progressFor(zone,attackingRight)>62)compactOpenPlay(owning,defending,zone,direction,carrierIndex,.92);defending[defenderIndex]=point(zone.x+direction*3.6,zone.y+(zone.y<50?2.5:-2.5),'direct-opponent');if(owning[6]&&carrierIndex!==6)owning[6]=point(zone.x-direction*9,clamp(zone.y+13,10,90),'support');}
    if(event.type==='COUNTER_ATTACK'){compactOpenPlay(owning,defending,zone,direction,carrierIndex,.82);advanceSupport(owning,zone,direction,carrierIndex);const lineX=zone.x+direction*12;[1,2,3,4].forEach((index,offset)=>{if(defending[index])defending[index]=point(lineX,20+offset*20,'retreating');});}
    if(event.type==='CROSS'){compactOpenPlay(owning,defending,zone,direction,carrierIndex,.96);const boxX=direction>0?86:14;if(owning[9]&&carrierIndex!==9)owning[9]=point(boxX-direction*5,42,'target');if(owning[10]&&carrierIndex!==10)owning[10]=point(boxX-direction*3,61,'target');if(owning[6]&&carrierIndex!==6)owning[6]=point(boxX-direction*13,50,'support');if(defending[2])defending[2]=point(boxX-direction*2,39,'marker');if(defending[3])defending[3]=point(boxX-direction*2,59,'marker');}
    if(event.type==='SHOT'||event.type==='GOAL'){compactOpenPlay(owning,defending,zone,direction,carrierIndex,1);const goalX=direction>0?96:4;defending[0]=point(goalX,50,'goalkeeper',direction>0?180:0);advanceSupport(owning,zone,direction,carrierIndex);if(defending[2])defending[2]=point(zone.x+direction*3,42,'blocker');if(defending[3])defending[3]=point(zone.x+direction*3,58,'blocker');if(defending[5])defending[5]=point(zone.x-direction*7,34,'cover');if(defending[6])defending[6]=point(zone.x-direction*7,66,'cover');}
    if(event.type==='SET_PIECE'){const kind=String(event.setPieceKind||'FREE_KICK_DIRECT').toUpperCase();if(kind==='PENALTY')arrangePenalty(owning,defending,direction,carrierIndex);else if(kind==='CORNER')arrangeCorner(owning,defending,direction,carrierIndex,event);else arrangeFreeKick(owning,defending,zone,direction,carrierIndex,kind==='FREE_KICK_CROSS');}
    return{side,carrierIndex,defenderIndex,direction,pressing};
}

function keepInOwnHalf(points,attackingRight){const min=attackingRight?3:50.6,max=attackingRight?49.4:97;return points.map(p=>point(clamp(p.x,min,max),p.y,p.role,p.facing));}
function applyExperience(points,{profile,ball,seed,team,attackingRight,protectedIndexes=new Set(),neutral=false}){
    return points.map((p,index)=>{if(p.role==='goalkeeper'||protectedIndexes.has(index))return{...p};const line=structuralLine(p,attackingRight),roleFactor=/^press/.test(String(p.role||''))?.55:1,factor=(neutral?.45:1)*roleFactor,xNoise=signedUnit(`${seed}:${team}:${index}:x`)*profile.disorder*factor,yNoise=signedUnit(`${seed}:${team}:${index}:y`)*profile.disorder*1.12*factor,lineNoise=signedUnit(`${seed}:${team}:${line}:line`)*profile.lineDrift*factor,attraction=neutral?0:profile.ballAttraction;return point(p.x+xNoise+lineNoise+(ball.x-p.x)*attraction*.32,p.y+yNoise+(ball.y-p.y)*attraction,p.role,p.facing);});
}
function faceBall(points,ball){return points.map(p=>{const radians=Math.atan2(ball.y-p.y,ball.x-p.x);return{...p,facing:radians*180/Math.PI};});}
function trajectoryFor(event,situation,carrier){
    const direction=situation.direction,goalX=direction>0?97.5:2.5,goalY=clamp(50+signedUnit(`${event.id||event.type}:target`)*8,42,58);let target=null,kind=null;
    if(event.type==='SHOT'||event.type==='GOAL'){target=ballPoint(goalX,goalY);kind=event.type;}
    else if(event.type==='CROSS'){target=ballPoint(direction>0?86:14,clamp(50+signedUnit(`${event.id}:cross`)*16,34,66));kind='CROSS';}
    else if(event.type==='SET_PIECE'){const setPiece=String(event.setPieceKind||'FREE_KICK_DIRECT').toUpperCase();target=(setPiece==='FREE_KICK_DIRECT'||setPiece==='PENALTY')?ballPoint(goalX,goalY):ballPoint(direction>0?86:14,clamp(50+signedUnit(`${event.id}:set-piece`)*15,34,66));kind=setPiece;}
    return target?{kind,from:ballPoint(carrier.x,carrier.y),to:target}:null;
}
function ballAtFeet(carrier,target,direction){
    const aim=target||{x:carrier.x+direction*12,y:carrier.y},dx=aim.x-carrier.x,dy=aim.y-carrier.y,distance=Math.hypot(dx,dy)||1,offset=1.8;
    return ballPoint(carrier.x+(dx/distance)*offset,carrier.y+(dy/distance)*offset);
}

export function buildSimulatedMatchTacticalSituation(event={}, {playerAge=0,competition='',seed=null,playerSide='HOME',playerPosition='BU'}={}){
    const stableSeed=seed||event.matchId||String(event.id||event.type||'match'),ownFormation=chooseFormation(`${stableSeed}:own-formation`,OWN_FORMATIONS),opponentFormation=chooseFormation(`${stableSeed}:opponent-formation`,OPPONENT_FORMATIONS),homeFormation=playerSide==='AWAY'?opponentFormation:ownFormation,awayFormation=playerSide==='AWAY'?ownFormation:opponentFormation;
    const home=formationPoints(homeFormation,periodAttacksRight('HOME',event)),away=formationPoints(awayFormation,periodAttacksRight('AWAY',event));
    const playerSlot=playerSlotForPosition(playerPosition,ownFormation),shouldUsePlayer=event.playerInvolved&&event.possessionSide===playerSide&&playerCanCarryEvent(event,playerPosition),effectiveEvent=shouldUsePlayer?{...event,ballCarrier:{...(event.ballCarrier||{}),team:playerSide,index:playerSlot}}:event;
    const situation=applySituation(home,away,effectiveEvent),owning=situation.side==='HOME'?home:away,zone=effectiveEvent.zone||{x:50,y:50},carrier=owning[situation.carrierIndex]||point(zone.x,zone.y,'carrier');
    const profile=tacticalExperienceProfile({playerAge,competition}),homeProtected=new Set(),awayProtected=new Set();(situation.side==='HOME'?homeProtected:awayProtected).add(situation.carrierIndex);(situation.side==='HOME'?awayProtected:homeProtected).add(situation.defenderIndex);if(effectiveEvent.type==='SET_PIECE'){for(let i=0;i<11;i+=1){homeProtected.add(i);awayProtected.add(i);}}
    const neutral=effectiveEvent.type==='KICKOFF'||effectiveEvent.type==='FULL_TIME',rawBall=ballPoint(carrier.x,carrier.y),homeRight=periodAttacksRight('HOME',effectiveEvent),awayRight=periodAttacksRight('AWAY',effectiveEvent);
    let shapedHome=applyExperience(home,{profile,ball:rawBall,seed:stableSeed,team:'home',attackingRight:homeRight,protectedIndexes:homeProtected,neutral}),shapedAway=applyExperience(away,{profile,ball:rawBall,seed:stableSeed,team:'away',attackingRight:awayRight,protectedIndexes:awayProtected,neutral});
    if(neutral){shapedHome=keepInOwnHalf(shapedHome,homeRight);shapedAway=keepInOwnHalf(shapedAway,awayRight);}
    const shapedOwner=situation.side==='HOME'?shapedHome[situation.carrierIndex]:shapedAway[situation.carrierIndex],owner={team:situation.side,index:situation.carrierIndex},rawTrajectory=trajectoryFor(effectiveEvent,situation,shapedOwner),finalBall=ballAtFeet(shapedOwner,rawTrajectory?.to,situation.direction),trajectory=rawTrajectory?{...rawTrajectory,from:{...finalBall}}:null;
    shapedHome=faceBall(shapedHome,trajectory?.to||finalBall);shapedAway=faceBall(shapedAway,trajectory?.to||finalBall);
    const pressing=situation.pressing?{team:situation.side==='HOME'?'AWAY':'HOME',...situation.pressing}:null;
    return{state:effectiveEvent.cameraState||'NORMAL',eventType:effectiveEvent.type||'NORMAL',home:shapedHome,away:shapedAway,ball:{...finalBall,owner,trajectory},carrier:owner,pressing,playerFocal:{team:playerSide,index:playerSlot,position:normalizePosition(playerPosition)},formations:{home:homeFormation,away:awayFormation,own:ownFormation,opponent:opponentFormation},sides:{homeAttacksRight:homeRight,awayAttacksRight:awayRight},organization:{level:profile.id,discipline:profile.discipline}};
}
export default buildSimulatedMatchTacticalSituation;
