// Chronologie visuelle canonique d'un résultat de match déjà simulé.
// Elle ne recalcule jamais le score ni les statistiques : elle ordonne les faits résolus
// et produit les informations communes au texte, au terrain et au ballon.

export const SIMULATED_MATCH_EVENT = Object.freeze({
    KICKOFF: 'KICKOFF', BUILD_UP: 'BUILD_UP', PRESSING: 'PRESSING', DUEL: 'DUEL',
    COUNTER_ATTACK: 'COUNTER_ATTACK', CROSS: 'CROSS', SHOT: 'SHOT',
    SET_PIECE: 'SET_PIECE', GOAL: 'GOAL', FULL_TIME: 'FULL_TIME'
});

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

function hash(seed = 'match') {
    let value = 2166136261;
    for (const char of String(seed)) { value ^= char.charCodeAt(0); value = Math.imul(value, 16777619); }
    return value >>> 0;
}
function randomFactory(seed) {
    let value = hash(seed) || 1;
    return () => {
        value += 0x6D2B79F5;
        let t = value;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
const integer = (random, min, max) => min + Math.floor(random() * Math.max(1, max - min + 1));
function shuffle(values, random) {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(random() * (index + 1));
        [result[index], result[swap]] = [result[swap], result[index]];
    }
    return result;
}

export function formatFootballClock(clock = {}) {
    const minute = Math.max(0, Math.round(n(clock.regulationMinute)));
    const stoppage = Math.max(0, Math.round(n(clock.stoppageMinute)));
    return `${minute}${stoppage ? `+${stoppage}` : ''}'`;
}
function normalClock(minute) {
    const value = clamp(Math.round(minute), 0, 120);
    return {
        period: value <= 45 ? 'FIRST_HALF' : value <= 90 ? 'SECOND_HALF' : value <= 105 ? 'EXTRA_FIRST' : 'EXTRA_SECOND',
        regulationMinute: value,
        stoppageMinute: 0
    };
}
function clockOrder(clock = {}) { return n(clock.regulationMinute) + n(clock.stoppageMinute) / 100; }
const clockKey = clock => `${clock.period}:${clock.regulationMinute}:${clock.stoppageMinute || 0}`;

function randomGoalClock(random, occupied, extraTime) {
    const ranges = extraTime
        ? [[6,44,34],[46,89,38],[91,104,11],[106,119,11]]
        : [[6,44,46],[46,89,48]];
    for (let attempt = 0; attempt < 40; attempt += 1) {
        const roll = integer(random, 1, 100);
        let clock;
        if (roll <= 3) clock = { period:'FIRST_HALF', regulationMinute:45, stoppageMinute:integer(random,1,3) };
        else if (roll <= 6) clock = { period:'SECOND_HALF', regulationMinute:90, stoppageMinute:integer(random,1,5) };
        else if (extraTime && roll <= 8) clock = { period:'EXTRA_FIRST', regulationMinute:105, stoppageMinute:integer(random,1,2) };
        else if (extraTime && roll <= 10) clock = { period:'EXTRA_SECOND', regulationMinute:120, stoppageMinute:integer(random,1,2) };
        else {
            let cursor = integer(random, 1, ranges.reduce((sum, range) => sum + range[2], 0));
            const range = ranges.find(item => (cursor -= item[2]) <= 0) || ranges.at(-1);
            clock = normalClock(integer(random, range[0], range[1]));
        }
        const key = clockKey(clock);
        if (!occupied.has(key)) { occupied.add(key); return clock; }
    }
    for (let minute = 6; minute <= (extraTime ? 119 : 89); minute += 1) {
        if ([45,90,105].includes(minute)) continue;
        const clock = normalClock(minute), key = clockKey(clock);
        if (!occupied.has(key)) { occupied.add(key); return clock; }
    }
    return normalClock(extraTime ? 119 : 89);
}
function contextClock(random, min, max, occupied) {
    let minute = integer(random, min, max);
    for (let attempt = 0; attempt <= max - min + 1; attempt += 1) {
        const clock = normalClock(minute), key = clockKey(clock);
        if (!occupied.has(key)) { occupied.add(key); return clock; }
        minute = minute >= max ? min : minute + 1;
    }
    return normalClock(min);
}

function finalScore(row = {}) { return { home:Math.max(0,Math.round(n(row.score?.home))), away:Math.max(0,Math.round(n(row.score?.away))) }; }
const playerSide = row => row.home === false ? 'AWAY' : 'HOME';
function teamNames(row = {}, player = {}) {
    const own = row.team || player.club || 'Ton équipe', opponent = row.opponent || 'Adversaire';
    return row.home === false ? { home:opponent, away:own, player:'AWAY' } : { home:own, away:opponent, player:'HOME' };
}
function hasExtraTime(row = {}) {
    const text = `${row.phase || ''} ${row.round || ''} ${row.fixture?.phase || ''} ${row.fixture?.round || ''}`.toLowerCase();
    return row.extraTime === true || row.fixture?.extraTime === true || /prolong|extra.?time/.test(text);
}
function lane(random) {
    const roll = random();
    if (roll < .3) return { y:integer(random,18,30), lane:'LEFT' };
    if (roll > .7) return { y:integer(random,70,82), lane:'RIGHT' };
    return { y:integer(random,43,57), lane:'CENTER' };
}
function zoneFor(type, side, random) {
    const spot = lane(random), homeX = ({BUILD_UP:34,PRESSING:47,DUEL:55,COUNTER_ATTACK:69,CROSS:78,SHOT:82,SET_PIECE:72,GOAL:88})[type] || 52;
    const x = side === 'HOME' ? homeX : 100 - homeX;
    return { x, y:['SHOT','SET_PIECE','GOAL'].includes(type)?clamp(spot.y,34,66):spot.y, lane:spot.lane, third:x<34?'DEFENSIVE':x>66?'ATTACKING':'MIDDLE' };
}
function carrierIndex(type, sideLane) {
    if (type === 'CROSS') return sideLane === 'LEFT' ? 8 : 10;
    if (type === 'BUILD_UP') return 6;
    if (type === 'PRESSING') return 5;
    if (type === 'SET_PIECE') return 7;
    return 9;
}
function cameraState(type) {
    return ({BUILD_UP:'BUILD_UP',COUNTER_ATTACK:'COUNTER_ATTACK',DUEL:'DUEL',PRESSING:'DUEL',CROSS:'DANGER',SHOT:'SHOT',SET_PIECE:'SET_PIECE',GOAL:'GOAL'})[type] || 'NORMAL';
}
function visualFocus(type) {
    return ({COUNTER_ATTACK:'open-space',DUEL:'duel',PRESSING:'duel',CROSS:'cross-zone',SHOT:'shot-line',SET_PIECE:'set-piece',GOAL:'goal'})[type] || 'ball';
}
function labelForSide(side, names) { return side === names.player ? 'Ton équipe' : side === 'HOME' ? names.home : names.away; }
function textFor(event, names) {
    const team = labelForSide(event.possessionSide, names);
    if (event.type==='KICKOFF') return `${names.home} et ${names.away} se mettent en place. Le ballon part et les deux blocs prennent leurs premières distances.`;
    if (event.type==='BUILD_UP') return `${team} ressort le ballon. Le porteur lève la tête pendant que les lignes cherchent la largeur et une solution vers l'avant.`;
    if (event.type==='PRESSING') return `${team} joue sous pression. Plusieurs adversaires convergent vers le ballon et réduisent le temps disponible.`;
    if (event.type==='DUEL') return `Le ballon arrive dans une zone de duel. Le porteur protège son appui pendant qu'un adversaire ferme l'angle de progression.`;
    if (event.type==='COUNTER_ATTACK') return `${team} part en transition. Les soutiens prennent de la profondeur pendant que la défense court vers son propre but.`;
    if (event.type==='CROSS') return `${team} trouve de la largeur. Le porteur attaque le couloir pendant que la surface se remplit devant lui.`;
    if (event.type==='SHOT') return `${team} ouvre une fenêtre de frappe. La défense se resserre et le gardien ajuste sa position face au ballon.`;
    if (event.type==='SET_PIECE') return `Le jeu s'arrête. Les deux équipes se replacent autour du ballon avant le coup de pied arrêté.`;
    if (event.type==='GOAL') {
        if (event.playerContribution==='GOAL') return `But. Tu conclus l'action et le score passe à ${event.score.home}-${event.score.away}.`;
        if (event.playerContribution==='ASSIST') return `But. Ta dernière passe ouvre directement la défense et le score passe à ${event.score.home}-${event.score.away}.`;
        return `${team} marque. Le score passe à ${event.score.home}-${event.score.away}.`;
    }
    const own = names.player==='HOME'?event.score.home:event.score.away, against=names.player==='HOME'?event.score.away:event.score.home;
    return `${own>against?'La victoire est acquise.':own<against?'Le match se termine par une défaite.':'Le score ne bougera plus.'} Résultat final : ${event.score.home}-${event.score.away}.`;
}
function contextTypes(row, random, count) {
    const pool=[SIMULATED_MATCH_EVENT.BUILD_UP,SIMULATED_MATCH_EVENT.COUNTER_ATTACK];
    if(n(row.tackles)+n(row.duels)>1)pool.push(SIMULATED_MATCH_EVENT.DUEL,SIMULATED_MATCH_EVENT.PRESSING);
    if(n(row.shots)+n(row.shotsOnTarget)>0)pool.push(SIMULATED_MATCH_EVENT.SHOT);
    if(n(row.assists)>0||n(row.successfulPasses)>12)pool.push(SIMULATED_MATCH_EVENT.CROSS);
    if(random()>.78)pool.push(SIMULATED_MATCH_EVENT.SET_PIECE);
    const values=[];while(values.length<count)values.push(pool[values.length%pool.length]);return shuffle(values,random);
}
function assignPlayerContributions(goals, row, random) {
    const own=goals.filter(event=>event.possessionSide===playerSide(row)), indexes=shuffle(own.map((_,index)=>index),random);
    const goalCount=Math.min(Math.max(0,Math.round(n(row.goals))),own.length);
    const assistCount=Math.min(Math.max(0,Math.round(n(row.assists))),Math.max(0,own.length-goalCount));
    for(let i=0;i<goalCount;i+=1)own[indexes[i]].playerContribution='GOAL';
    for(let i=0;i<assistCount;i+=1)own[indexes[goalCount+i]].playerContribution='ASSIST';
}

export function buildSimulatedMatchTimeline(row = {}, { seed = null, player = {} } = {}) {
    const matchId=row.matchId||row.fixture?.id||`simulated:${row.matchIndex??0}:${row.opponent||'opponent'}`, random=randomFactory(seed||matchId), names=teamNames(row,player), score=finalScore(row), extraTime=hasExtraTime(row);
    const fullTimeMinute=extraTime?120:90, occupied=new Set([`FIRST_HALF:0:0`,`${extraTime?'EXTRA_SECOND':'SECOND_HALF'}:${fullTimeMinute}:0`]), drafts=[];
    const kickoffSide=random()<.5?'HOME':'AWAY';
    drafts.push({id:`${matchId}:visual:kickoff`,type:'KICKOFF',clock:normalClock(0),possessionSide:kickoffSide,zone:{x:50,y:50,lane:'CENTER',third:'MIDDLE'},ballCarrier:{team:kickoffSide,index:6,role:'midfielder'},playerContribution:'NONE'});
    const goalSides=shuffle([...Array(score.home).fill('HOME'),...Array(score.away).fill('AWAY')],random);
    const goals=goalSides.map((side,index)=>{const clock=randomGoalClock(random,occupied,extraTime),zone=zoneFor('GOAL',side,random);return{id:`${matchId}:visual:goal:${index+1}`,type:'GOAL',clock,possessionSide:side,zone,ballCarrier:{team:side,index:9,role:'attacker'},playerContribution:'NONE'};});
    assignPlayerContributions(goals,row,random);drafts.push(...goals);
    const count=Math.max(2,Math.min(extraTime?5:4,6-goals.length)),types=contextTypes(row,random,count),windows=extraTime?[[8,22],[26,41],[53,69],[72,87],[96,116]]:[[8,22],[26,41],[53,69],[72,87]];
    types.forEach((type,index)=>{const [min,max]=windows[index]||windows.at(-1),side=random()<.56?names.player:(names.player==='HOME'?'AWAY':'HOME'),clock=contextClock(random,min,max,occupied),zone=zoneFor(type,side,random);drafts.push({id:`${matchId}:visual:context:${index+1}`,type,clock,possessionSide:side,zone,ballCarrier:{team:side,index:carrierIndex(type,zone.lane),role:['BUILD_UP','PRESSING','SET_PIECE'].includes(type)?'midfielder':'attacker'},playerContribution:'NONE'});});
    drafts.push({id:`${matchId}:visual:full-time`,type:'FULL_TIME',clock:normalClock(fullTimeMinute),possessionSide:names.player,zone:{x:50,y:50,lane:'CENTER',third:'MIDDLE'},ballCarrier:{team:names.player,index:6,role:'midfielder'},playerContribution:'NONE'});
    drafts.sort((a,b)=>clockOrder(a.clock)-clockOrder(b.clock)||a.id.localeCompare(b.id));
    const running={home:0,away:0};
    const events=drafts.map((draft,sequence)=>{const before={...running};if(draft.type==='GOAL'){draft.possessionSide==='HOME'?running.home+=1:running.away+=1;}if(draft.type==='FULL_TIME'){running.home=score.home;running.away=score.away;}const event={...draft,sequence,minuteLabel:formatFootballClock(draft.clock),scoreBefore:before,score:{...running},cameraState:cameraState(draft.type),visualFocus:visualFocus(draft.type),playerInvolved:row.playerPlayed!==false&&(draft.playerContribution==='GOAL'||draft.playerContribution==='ASSIST'||(draft.possessionSide===names.player&&['DUEL','SHOT','CROSS'].includes(draft.type)))};event.text=textFor(event,names);return event;});
    return {matchId,team:row.team||player.club||'Ton équipe',opponent:row.opponent||'Adversaire',competition:row.competitionName||row.fixture?.competitionName||row.fixture?.competition||'Match',playerAge:Number(player.age??row.playerAge??row.fixture?.playerAge??0)||0,playerSide:names.player,homeTeam:names.home,awayTeam:names.away,finalScore:score,playerPlayed:row.playerPlayed!==false,extraTime,events};
}

export default buildSimulatedMatchTimeline;
