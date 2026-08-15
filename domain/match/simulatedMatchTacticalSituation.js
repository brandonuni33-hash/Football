// Projection tactique d'un événement de match simulé.
// Les positions sont une conséquence du fait canonique ; l'UI ne les invente jamais.

const clamp = (value, min = 3, max = 97) => Math.max(min, Math.min(max, Number(value) || 50));
const point = (x, y, role = 'outfield', facing = 0) => ({ x: clamp(x), y: clamp(y), role, facing: Number(facing) || 0 });

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

const EXPERIENCE = Object.freeze({
    U15: Object.freeze({ id:'U15', discipline:.52, disorder:4.8, lineDrift:3.5, ballAttraction:.12 }),
    YOUTH: Object.freeze({ id:'YOUTH', discipline:.69, disorder:3.0, lineDrift:2.2, ballAttraction:.075 }),
    SEMI_PRO: Object.freeze({ id:'SEMI_PRO', discipline:.84, disorder:1.55, lineDrift:1.15, ballAttraction:.035 }),
    PRO: Object.freeze({ id:'PRO', discipline:.96, disorder:.65, lineDrift:.45, ballAttraction:.012 })
});

function hash(seed = '') {
    let value = 2166136261;
    for (const char of String(seed)) { value ^= char.charCodeAt(0); value = Math.imul(value, 16777619); }
    return value >>> 0;
}
function signedUnit(seed = '') { return (hash(seed) % 2001) / 1000 - 1; }
function chooseFormation(seed, pool) { return pool[hash(seed) % pool.length]; }

export function tacticalExperienceProfile({ playerAge = 0, competition = '' } = {}) {
    const age = Number(playerAge) || 0;
    const text = String(competition || '').toLowerCase();
    if (/\bu\s?15\b|moins de 15/.test(text) || (age && age <= 15)) return EXPERIENCE.U15;
    if (/\bu\s?1[6789]\b|formation|academy|académie|juvenil|youth/.test(text) || (age && age <= 18)) return EXPERIENCE.YOUTH;
    if (/national|regional|régional|semi.?pro|district|serie c|league one|3\. liga|primera federaci[oó]n/.test(text)) return EXPERIENCE.SEMI_PRO;
    return EXPERIENCE.PRO;
}

function mirrored(points) { return points.map(p => point(100 - p.x, p.y, p.role, 180)); }
function formationPoints(name, attackingRight) {
    const base = FORMATIONS[name] || FORMATIONS['4-3-3'];
    return (attackingRight ? base : mirrored(base)).map(p => ({ ...p }));
}
function periodAttacksRight(team, event = {}) {
    const period = String(event.clock?.period || '').toUpperCase();
    const secondEnd = period === 'SECOND_HALF' || period === 'EXTRA_SECOND';
    const homeRight = !secondEnd;
    return team === 'HOME' ? homeRight : !homeRight;
}
function shiftBlock(points, dx, squeeze = 1) {
    return points.map(p => p.role === 'goalkeeper' ? { ...p } : point(p.x + dx, 50 + (p.y - 50) * squeeze, p.role, p.facing));
}
function setCarrier(points, index, zone, attackingRight) {
    const target = Math.max(1, Math.min(10, Number(index) || 9));
    points[target] = point(zone.x, zone.y, 'carrier', attackingRight ? 0 : 180);
    return target;
}
function closestDefenderIndex(points, zone) {
    let best = 1, distance = Infinity;
    for (let index = 1; index < Math.min(5, points.length); index += 1) {
        const p = points[index], d = Math.hypot(p.x - zone.x, p.y - zone.y);
        if (d < distance) { distance = d; best = index; }
    }
    return best;
}
function neutralHalfShape(points, attackingRight, kickoffTeam = false) {
    const ownMin = attackingRight ? 3 : 50.6;
    const ownMax = attackingRight ? 49.4 : 97;
    return points.map((p, index) => {
        if (index === 0) return { ...p };
        const x = clamp(p.x, ownMin, ownMax);
        return point(x, p.y, p.role, p.facing);
    }).map((p, index) => {
        if (!kickoffTeam || index !== 9) return p;
        return point(attackingRight ? 49.4 : 50.6, 50, 'carrier', attackingRight ? 0 : 180);
    });
}
function advanceSupport(owning, zone, direction, carrierIndex) {
    const targets = [
        [5, zone.x - direction * 20, clamp(zone.y - 18, 15, 85)],
        [6, zone.x - direction * 17, clamp(zone.y + 4, 18, 82)],
        [7, zone.x - direction * 20, clamp(zone.y + 22, 15, 85)],
        [8, zone.x - direction * 9, clamp(zone.y - 20, 10, 90)],
        [10, zone.x - direction * 7, clamp(zone.y + 20, 10, 90)]
    ];
    for (const [index,x,y] of targets) if (index !== carrierIndex && owning[index]) owning[index] = point(x,y,'support');
}
function arrangeFreeKick(owning, defending, zone, direction, carrierIndex, cross) {
    const goalX = direction > 0 ? 96 : 4;
    defending[0] = point(goalX,50,'goalkeeper',direction > 0 ? 180 : 0);
    const wallSize = cross ? 3 : 4;
    const wallX = zone.x + direction * 7;
    const wallIndexes = [2,3,5,6].slice(0,wallSize);
    wallIndexes.forEach((index,offset) => defending[index] = point(wallX, zone.y - ((wallSize - 1) * 3.2) + offset * 6.4, 'wall'));
    const boxX = direction > 0 ? 84 : 16;
    const ownBox = [8,9,10].filter(index => index !== carrierIndex);
    ownBox.forEach((index,offset) => owning[index] = point(boxX - direction * (offset % 2 ? 2 : 5), 34 + offset * 16, 'target'));
    [1,4,7].forEach((index,offset) => {
        if (defending[index]) defending[index] = point(boxX + direction * 1.5, 32 + offset * 18, 'marker');
    });
}
function arrangeCorner(owning, defending, direction, carrierIndex, event) {
    const leftCorner = String(event.zone?.lane || '').toUpperCase() === 'LEFT';
    const cornerX = direction > 0 ? 96.4 : 3.6;
    const cornerY = leftCorner ? 3.6 : 96.4;
    owning[carrierIndex] = point(cornerX,cornerY,'carrier',direction > 0 ? 0 : 180);
    const goalX = direction > 0 ? 96 : 4;
    defending[0] = point(goalX,50,'goalkeeper',direction > 0 ? 180 : 0);
    const boxX = direction > 0 ? 87 : 13;
    [8,9,10,6].filter(i=>i!==carrierIndex).forEach((index,offset)=>owning[index]=point(boxX-direction*(offset%2?3:6),28+offset*14,'target'));
    [1,2,3,4,5].forEach((index,offset)=>defending[index]=point(boxX+direction*(offset%2?1:3),25+offset*12,'marker'));
}
function arrangePenalty(owning, defending, direction, carrierIndex) {
    const spotX = direction > 0 ? 89.5 : 10.5;
    owning[carrierIndex] = point(spotX,50,'carrier',direction > 0 ? 0 : 180);
    defending[0] = point(direction > 0 ? 96.5 : 3.5,50,'goalkeeper',direction > 0 ? 180 : 0);
    const outsideX = direction > 0 ? 80.5 : 19.5;
    const ownIndexes = [1,2,3,4,5,6,7,8,9,10].filter(i=>i!==carrierIndex);
    ownIndexes.forEach((index,offset)=>owning[index]=point(outsideX-direction*(offset%3)*1.4,25+(offset%5)*12.5,'waiting'));
    [1,2,3,4,5,6,7,8,9,10].forEach((index,offset)=>defending[index]=point(outsideX-direction*(1.5+(offset%3)*1.3),24+(offset%5)*13,'waiting'));
}
function applySituation(home, away, event) {
    const side = event.possessionSide === 'AWAY' ? 'AWAY' : 'HOME';
    const owning = side === 'HOME' ? home : away;
    const defending = side === 'HOME' ? away : home;
    const attackingRight = periodAttacksRight(side,event);
    const direction = attackingRight ? 1 : -1;
    const zone = event.zone || { x:50,y:50 };
    const carrierIndex = setCarrier(owning,event.ballCarrier?.index,zone,attackingRight);
    const defenderIndex = closestDefenderIndex(defending,zone);

    if (event.type === 'KICKOFF' || event.type === 'FULL_TIME') {
        const homeRight = periodAttacksRight('HOME',event), awayRight = periodAttacksRight('AWAY',event);
        const homeKickoff = side === 'HOME' && event.type === 'KICKOFF';
        const awayKickoff = side === 'AWAY' && event.type === 'KICKOFF';
        const h = neutralHalfShape(home,homeRight,homeKickoff), a = neutralHalfShape(away,awayRight,awayKickoff);
        h.forEach((p,i)=>home[i]=p); a.forEach((p,i)=>away[i]=p);
        if (event.type === 'FULL_TIME') {
            const ownerTeam = side === 'HOME' ? home : away;
            const idx = Math.max(1,Math.min(10,carrierIndex));
            ownerTeam[idx] = point(attackingRight ? 43 : 57,50,'carrier',attackingRight?0:180);
        }
        return { side,carrierIndex,defenderIndex,direction };
    }
    if (event.type === 'BUILD_UP') {
        const shifted = shiftBlock(owning,direction*4,.96);
        shifted.forEach((p,index)=>{if(index!==carrierIndex)owning[index]=p;});
        defending.forEach((p,index)=>{if(index>4)defending[index]=point(p.x-direction*4,p.y,p.role,p.facing);});
    }
    if (event.type === 'PRESSING') {
        [5,6,8,9].forEach((index,offset)=>defending[index]=point(zone.x+direction*(5+offset*1.4),zone.y+[-9,6,-17,15][offset],'presser'));
    }
    if (event.type === 'DUEL') {
        defending[defenderIndex]=point(zone.x+direction*3.6,zone.y+(zone.y<50?2.5:-2.5),'direct-opponent');
        owning[6]=point(zone.x-direction*9,clamp(zone.y+13,10,90),'support');
    }
    if (event.type === 'COUNTER_ATTACK') {
        advanceSupport(owning,zone,direction,carrierIndex);
        const lineX=zone.x+direction*13;
        [1,2,3,4].forEach((index,offset)=>defending[index]=point(lineX,20+offset*20,'retreating'));
    }
    if (event.type === 'CROSS') {
        const boxX=direction>0?86:14;
        owning[9]=carrierIndex===9?owning[9]:point(boxX-direction*5,42,'target');
        owning[10]=carrierIndex===10?owning[10]:point(boxX-direction*3,61,'target');
        owning[6]=point(boxX-direction*13,50,'support');
        defending[2]=point(boxX,39,'marker'); defending[3]=point(boxX,59,'marker');
    }
    if (event.type === 'SHOT' || event.type === 'GOAL') {
        const goalX=direction>0?96:4;
        defending[0]=point(goalX,50,'goalkeeper',direction>0?180:0);
        advanceSupport(owning,zone,direction,carrierIndex);
        defending[2]=point(zone.x+direction*5,42,'blocker');
        defending[3]=point(zone.x+direction*5,58,'blocker');
        defending[5]=point(zone.x+direction*8,33,'cover');
        defending[6]=point(zone.x+direction*8,67,'cover');
    }
    if (event.type === 'SET_PIECE') {
        const kind=String(event.setPieceKind||'FREE_KICK_DIRECT').toUpperCase();
        if (kind==='PENALTY') arrangePenalty(owning,defending,direction,carrierIndex);
        else if (kind==='CORNER') arrangeCorner(owning,defending,direction,carrierIndex,event);
        else arrangeFreeKick(owning,defending,zone,direction,carrierIndex,kind==='FREE_KICK_CROSS');
    }
    return { side,carrierIndex,defenderIndex,direction };
}
function lineId(index) {
    if(index===0)return'goalkeeper';
    if(index<=4)return'defence';
    if(index<=7)return'midfield';
    return'attack';
}
function keepInOwnHalf(points,attackingRight){
    const min=attackingRight?3:50.6,max=attackingRight?49.4:97;
    return points.map(p=>point(clamp(p.x,min,max),p.y,p.role,p.facing));
}
function applyExperience(points,{profile,ball,seed,team,protectedIndexes=new Set(),neutral=false}){
    return points.map((p,index)=>{
        if(p.role==='goalkeeper'||protectedIndexes.has(index))return{...p};
        const line=lineId(index);
        const factor=neutral?.45:1;
        const xNoise=signedUnit(`${seed}:${team}:${index}:x`)*profile.disorder*factor;
        const yNoise=signedUnit(`${seed}:${team}:${index}:y`)*profile.disorder*1.12*factor;
        const lineNoise=signedUnit(`${seed}:${team}:${line}:line`)*profile.lineDrift*factor;
        const attraction=neutral?0:profile.ballAttraction;
        return point(p.x+xNoise+lineNoise+(ball.x-p.x)*attraction*.32,p.y+yNoise+(ball.y-p.y)*attraction,p.role,p.facing);
    });
}
function faceBall(points,ball){return points.map(p=>{if(p.role==='goalkeeper')return p;const radians=Math.atan2(ball.y-p.y,ball.x-p.x);return{...p,facing:radians*180/Math.PI};});}

export function buildSimulatedMatchTacticalSituation(event = {}, { playerAge = 0, competition = '', seed = null, playerSide = 'HOME' } = {}) {
    const stableSeed=seed||event.matchId||String(event.id||event.type||'match');
    const ownFormation=chooseFormation(`${stableSeed}:own-formation`,OWN_FORMATIONS);
    const opponentFormation=chooseFormation(`${stableSeed}:opponent-formation`,OPPONENT_FORMATIONS);
    const homeFormation=playerSide==='AWAY'?opponentFormation:ownFormation;
    const awayFormation=playerSide==='AWAY'?ownFormation:opponentFormation;
    const home=formationPoints(homeFormation,periodAttacksRight('HOME',event));
    const away=formationPoints(awayFormation,periodAttacksRight('AWAY',event));
    const situation=applySituation(home,away,event);
    const owning=situation.side==='HOME'?home:away;
    const zone=event.zone||{x:50,y:50};
    const carrier=owning[situation.carrierIndex]||point(zone.x,zone.y,'carrier');
    // Règle STP : tant que la visualisation ne dessine pas une trajectoire explicite,
    // le ballon reste lié au joueur qui porte, passe, centre ou frappe.
    const ball=point(carrier.x,carrier.y,'ball');
    const owner={team:situation.side,index:situation.carrierIndex};

    const profile=tacticalExperienceProfile({playerAge,competition});
    const homeProtected=new Set(),awayProtected=new Set();
    (situation.side==='HOME'?homeProtected:awayProtected).add(situation.carrierIndex);
    (situation.side==='HOME'?awayProtected:homeProtected).add(situation.defenderIndex);
    if(event.type==='SET_PIECE'){for(let i=0;i<11;i+=1){homeProtected.add(i);awayProtected.add(i);}}
    const neutral=event.type==='KICKOFF'||event.type==='FULL_TIME';
    let shapedHome=applyExperience(home,{profile,ball,seed:stableSeed,team:'home',protectedIndexes:homeProtected,neutral});
    let shapedAway=applyExperience(away,{profile,ball,seed:stableSeed,team:'away',protectedIndexes:awayProtected,neutral});
    if(neutral){
        shapedHome=keepInOwnHalf(shapedHome,periodAttacksRight('HOME',event));
        shapedAway=keepInOwnHalf(shapedAway,periodAttacksRight('AWAY',event));
    }
    // Le ballon doit rester exactement au pied du porteur après la déformation des blocs.
    const shapedOwner=situation.side==='HOME'?shapedHome[situation.carrierIndex]:shapedAway[situation.carrierIndex];
    const finalBall=point(shapedOwner.x,shapedOwner.y,'ball');
    shapedHome=faceBall(shapedHome,finalBall); shapedAway=faceBall(shapedAway,finalBall);

    const focal=event.playerInvolved&&event.possessionSide===playerSide?{team:playerSide,index:situation.carrierIndex}:null;
    return {
        state:event.cameraState||'NORMAL',eventType:event.type||'NORMAL',
        home:shapedHome,away:shapedAway,ball:{...finalBall,owner},carrier:owner,
        playerFocal:focal,
        formations:{home:homeFormation,away:awayFormation,own:ownFormation,opponent:opponentFormation},
        sides:{homeAttacksRight:periodAttacksRight('HOME',event),awayAttacksRight:periodAttacksRight('AWAY',event)},
        organization:{level:profile.id,discipline:profile.discipline}
    };
}
export default buildSimulatedMatchTacticalSituation;
