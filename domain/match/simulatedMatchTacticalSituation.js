// Projection tactique d'un événement de match simulé.
// Les positions sont une conséquence du fait canonique ; l'UI ne les invente jamais.

const clamp = value => Math.max(3, Math.min(97, Number(value) || 50));
const point = (x, y, role = 'outfield', facing = 0) => ({ x: clamp(x), y: clamp(y), role, facing: Number(facing) || 0 });

const HOME_BASE = Object.freeze([
    point(7, 50, 'goalkeeper', 0),
    point(21, 15), point(22, 37), point(22, 63), point(21, 85),
    point(40, 24), point(43, 50), point(40, 76),
    point(62, 18), point(66, 50), point(62, 82)
]);
const AWAY_BASE = Object.freeze(HOME_BASE.map(p => point(100 - p.x, p.y, p.role, 180)));

const EXPERIENCE = Object.freeze({
    U15: Object.freeze({ id: 'U15', discipline: .52, disorder: 4.8, lineDrift: 3.5, ballAttraction: .12 }),
    YOUTH: Object.freeze({ id: 'YOUTH', discipline: .69, disorder: 3.0, lineDrift: 2.2, ballAttraction: .075 }),
    SEMI_PRO: Object.freeze({ id: 'SEMI_PRO', discipline: .84, disorder: 1.55, lineDrift: 1.15, ballAttraction: .035 }),
    PRO: Object.freeze({ id: 'PRO', discipline: .96, disorder: .65, lineDrift: .45, ballAttraction: .012 })
});

function signedUnit(seed = '') {
    let hash = 2166136261;
    for (const char of String(seed)) {
        hash ^= char.charCodeAt(0);
        hash = Math.imul(hash, 16777619);
    }
    return ((hash >>> 0) % 2001) / 1000 - 1;
}

export function tacticalExperienceProfile({ playerAge = 0, competition = '' } = {}) {
    const age = Number(playerAge) || 0;
    const text = String(competition || '').toLowerCase();
    if (/\bu\s?15\b|moins de 15/.test(text) || (age && age <= 15)) return EXPERIENCE.U15;
    if (/\bu\s?1[6789]\b|formation|academy|académie|juvenil|youth/.test(text) || (age && age <= 18)) return EXPERIENCE.YOUTH;
    if (/national|regional|régional|semi.?pro|district|serie c|league one|3\. liga|primera federaci[oó]n/.test(text)) return EXPERIENCE.SEMI_PRO;
    return EXPERIENCE.PRO;
}

function cloneBase(base) {
    return base.map(p => ({ ...p }));
}

function shiftBlock(points, dx, squeeze = 1) {
    return points.map(p => p.role === 'goalkeeper' ? { ...p } : point(p.x + dx, 50 + (p.y - 50) * squeeze, p.role, p.facing));
}

function setCarrier(points, index, zone, side) {
    const target = Math.max(1, Math.min(10, Number(index) || 9));
    points[target] = point(zone.x, zone.y, 'carrier', side === 'HOME' ? 0 : 180);
    return target;
}

function closestDefenderIndex(event) {
    const y = Number(event?.zone?.y) || 50;
    if (y < 31) return 1;
    if (y > 69) return 4;
    return y < 50 ? 2 : 3;
}

function applySituation(home, away, event) {
    const side = event.possessionSide === 'AWAY' ? 'AWAY' : 'HOME';
    const owning = side === 'HOME' ? home : away;
    const defending = side === 'HOME' ? away : home;
    const direction = side === 'HOME' ? 1 : -1;
    const zone = event.zone || { x: 50, y: 50 };
    const carrierIndex = setCarrier(owning, event.ballCarrier?.index, zone, side);
    const defenderIndex = closestDefenderIndex(event);

    if (event.type === 'BUILD_UP') {
        const shifted = shiftBlock(owning, direction * 2, .96);
        shifted.forEach((p, index) => { if (index !== carrierIndex) owning[index] = p; });
        defending.forEach((p, index) => { if (index > 4) defending[index] = point(p.x - direction * 3, p.y, p.role, p.facing); });
    }
    if (event.type === 'PRESSING') {
        defending[5] = point(zone.x + direction * 6, zone.y - 8, 'presser');
        defending[6] = point(zone.x + direction * 5, zone.y + 5, 'presser');
        defending[8] = point(zone.x + direction * 10, zone.y - 16, 'presser');
        defending[9] = point(zone.x + direction * 8, zone.y + 15, 'presser');
    }
    if (event.type === 'DUEL') {
        defending[defenderIndex] = point(zone.x + direction * 4.4, zone.y + (zone.y < 50 ? 2.5 : -2.5), 'direct-opponent');
        owning[6] = point(zone.x - direction * 11, zone.y + 13);
    }
    if (event.type === 'COUNTER_ATTACK') {
        owning[8] = point(zone.x - direction * 9, Math.max(12, zone.y - 20), 'runner');
        owning[9] = point(zone.x, zone.y, 'carrier');
        owning[10] = point(zone.x - direction * 7, Math.min(88, zone.y + 21), 'runner');
        const lineX = side === 'HOME' ? 82 : 18;
        [1, 2, 3, 4].forEach((index, offset) => { defending[index] = point(lineX, 20 + offset * 20, 'retreating'); });
    }
    if (event.type === 'CROSS') {
        const boxX = side === 'HOME' ? 84 : 16;
        owning[9] = point(boxX - direction * 5, 44, 'runner');
        owning[10] = point(boxX - direction * 3, 61, 'runner');
        defending[2] = point(boxX, 40, 'marker');
        defending[3] = point(boxX, 59, 'marker');
    }
    if (event.type === 'SHOT' || event.type === 'GOAL') {
        const goalX = side === 'HOME' ? 93 : 7;
        defending[0] = point(goalX, 50, 'goalkeeper', side === 'HOME' ? 180 : 0);
        defending[2] = point(zone.x + direction * 5, 42, 'blocker');
        defending[3] = point(zone.x + direction * 5, 58, 'blocker');
    }
    if (event.type === 'SET_PIECE') {
        const wallX = zone.x + direction * 8;
        [2, 3, 5, 6].forEach((index, offset) => { defending[index] = point(wallX, 38 + offset * 8, 'wall'); });
        owning[8] = point(zone.x - direction * 12, 29, 'runner');
        owning[10] = point(zone.x - direction * 10, 71, 'runner');
    }
    return { side, carrierIndex, defenderIndex };
}

function lineId(index) {
    if (index === 0) return 'goalkeeper';
    if (index <= 4) return 'defence';
    if (index <= 7) return 'midfield';
    return 'attack';
}

function applyExperience(points, { profile, ball, seed, team, protectedIndexes = new Set() }) {
    return points.map((p, index) => {
        if (p.role === 'goalkeeper' || protectedIndexes.has(index)) return { ...p };
        const line = lineId(index);
        const xNoise = signedUnit(`${seed}:${team}:${index}:x`) * profile.disorder;
        const yNoise = signedUnit(`${seed}:${team}:${index}:y`) * profile.disorder * 1.12;
        const lineNoise = signedUnit(`${seed}:${team}:${line}:line`) * profile.lineDrift;
        const attraction = profile.ballAttraction;
        return point(
            p.x + xNoise + lineNoise + (ball.x - p.x) * attraction * .32,
            p.y + yNoise + (ball.y - p.y) * attraction,
            p.role,
            p.facing
        );
    });
}

function faceBall(points, ball) {
    return points.map(p => {
        if (p.role === 'goalkeeper') return p;
        const radians = Math.atan2(ball.y - p.y, ball.x - p.x);
        return { ...p, facing: radians * 180 / Math.PI };
    });
}

export function buildSimulatedMatchTacticalSituation(event = {}, { playerAge = 0, competition = '', seed = null } = {}) {
    const home = cloneBase(HOME_BASE);
    const away = cloneBase(AWAY_BASE);
    const situation = applySituation(home, away, event);
    const zone = event.zone || { x: 50, y: 50 };
    const direction = situation.side === 'HOME' ? 1 : -1;
    let ball = point(zone.x, zone.y, 'ball');
    let owner = { team: situation.side, index: situation.carrierIndex };
    if (event.type === 'SHOT') {
        ball = point(zone.x + direction * 5, zone.y, 'ball');
        owner = null;
    } else if (event.type === 'GOAL') {
        ball = point(situation.side === 'HOME' ? 96 : 4, clamp(zone.y, 43, 57), 'ball');
        owner = null;
    }

    const profile = tacticalExperienceProfile({ playerAge, competition });
    const stableSeed = seed || event.id || `${event.type}:${event.minuteLabel || ''}`;
    const homeProtected = new Set();
    const awayProtected = new Set();
    (situation.side === 'HOME' ? homeProtected : awayProtected).add(situation.carrierIndex);
    (situation.side === 'HOME' ? awayProtected : homeProtected).add(situation.defenderIndex);
    let shapedHome = applyExperience(home, { profile, ball, seed: stableSeed, team: 'home', protectedIndexes: homeProtected });
    let shapedAway = applyExperience(away, { profile, ball, seed: stableSeed, team: 'away', protectedIndexes: awayProtected });
    shapedHome = faceBall(shapedHome, ball);
    shapedAway = faceBall(shapedAway, ball);

    return {
        state: event.cameraState || 'NORMAL',
        eventType: event.type || 'NORMAL',
        home: shapedHome,
        away: shapedAway,
        ball: { ...ball, owner },
        carrier: owner,
        organization: { level: profile.id, discipline: profile.discipline }
    };
}

export default buildSimulatedMatchTacticalSituation;
