// Projection canonique d'un résultat de match simulé en chronologie visible.
// Ce module ne décide jamais du score : il transforme uniquement des faits déjà résolus.

export const SIMULATED_MATCH_EVENT = Object.freeze({
    KICKOFF: 'KICKOFF',
    BUILD_UP: 'BUILD_UP',
    PRESSING: 'PRESSING',
    DUEL: 'DUEL',
    COUNTER_ATTACK: 'COUNTER_ATTACK',
    CROSS: 'CROSS',
    SHOT: 'SHOT',
    SET_PIECE: 'SET_PIECE',
    GOAL: 'GOAL',
    FULL_TIME: 'FULL_TIME'
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;

function hash32(seed = 'match') {
    let hash = 2166136261;
    for (const char of String(seed)) {
        hash ^= char.charCodeAt(0);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function randomFactory(seed) {
    let value = hash32(seed) || 1;
    return () => {
        value += 0x6D2B79F5;
        let t = value;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function integer(random, min, max) {
    return min + Math.floor(random() * Math.max(1, max - min + 1));
}

function shuffle(values, random) {
    const copy = [...values];
    for (let index = copy.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(random() * (index + 1));
        [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
}

export function formatFootballClock(clock = {}) {
    const minute = Math.max(0, Math.round(n(clock.regulationMinute)));
    const stoppage = Math.max(0, Math.round(n(clock.stoppageMinute)));
    return `${minute}${stoppage ? `+${stoppage}` : ''}'`;
}

function clockOrder(clock = {}) {
    const period = String(clock.period || 'FIRST_HALF');
    const minute = n(clock.regulationMinute);
    const stoppage = n(clock.stoppageMinute) / 100;
    if (period === 'FIRST_HALF') return minute + stoppage;
    if (period === 'SECOND_HALF') return minute + stoppage;
    if (period === 'EXTRA_FIRST') return minute + stoppage;
    if (period === 'EXTRA_SECOND') return minute + stoppage;
    return minute + stoppage;
}

function normalClock(minute) {
    const value = clamp(Math.round(minute), 0, 120);
    if (value <= 45) return { period: 'FIRST_HALF', regulationMinute: value, stoppageMinute: 0 };
    if (value <= 90) return { period: 'SECOND_HALF', regulationMinute: value, stoppageMinute: 0 };
    if (value <= 105) return { period: 'EXTRA_FIRST', regulationMinute: value, stoppageMinute: 0 };
    return { period: 'EXTRA_SECOND', regulationMinute: value, stoppageMinute: 0 };
}

function clockKey(clock) {
    return `${clock.period}:${clock.regulationMinute}:${clock.stoppageMinute || 0}`;
}

function randomMatchClock(random, occupied) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
        const roll = random();
        let clock;
        if (roll < .43) clock = normalClock(integer(random, 6, 44));
        else if (roll < .47) clock = { period: 'FIRST_HALF', regulationMinute: 45, stoppageMinute: integer(random, 1, 3) };
        else if (roll < .94) clock = normalClock(integer(random, 46, 89));
        else clock = { period: 'SECOND_HALF', regulationMinute: 90, stoppageMinute: integer(random, 1, 5) };
        const key = clockKey(clock);
        if (!occupied.has(key)) {
            occupied.add(key);
            return clock;
        }
    }
    for (let minute = 6; minute <= 89; minute += 1) {
        if (minute === 45) continue;
        const clock = normalClock(minute);
        const key = clockKey(clock);
        if (!occupied.has(key)) {
            occupied.add(key);
            return clock;
        }
    }
    return normalClock(89);
}

function contextClock(random, min, max, occupied) {
    let minute = integer(random, min, max);
    for (let attempts = 0; attempts < max - min + 2; attempts += 1) {
        const clock = normalClock(minute);
        const key = clockKey(clock);
        if (!occupied.has(key)) {
            occupied.add(key);
            return clock;
        }
        minute = minute >= max ? min : minute + 1;
    }
    return normalClock(min);
}

function scorePair(row = {}) {
    const score = row.score || {};
    const home = Math.max(0, Math.round(n(score.home)));
    const away = Math.max(0, Math.round(n(score.away)));
    return { home, away };
}

function playerSide(row = {}) {
    return row.home === false ? 'AWAY' : 'HOME';
}

function teamNames(row = {}, player = {}) {
    const own = row.team || player.club || 'Ton équipe';
    const opponent = row.opponent || 'Adversaire';
    return row.home === false
        ? { home: opponent, away: own, player: 'AWAY' }
        : { home: own, away: opponent, player: 'HOME' };
}

function laneFor(random) {
    const roll = random();
    if (roll < .3) return { y: integer(random, 18, 30), lane: 'LEFT' };
    if (roll > .7) return { y: integer(random, 70, 82), lane: 'RIGHT' };
    return { y: integer(random, 43, 57), lane: 'CENTER' };
}

function zoneFor(type, side, random) {
    const direction = side === 'HOME' ? 1 : -1;
    const lane = laneFor(random);
    const xByType = {
        BUILD_UP: 34,
        PRESSING: 47,
        DUEL: 55,
        COUNTER_ATTACK: 69,
        CROSS: 78,
        SHOT: 82,
        SET_PIECE: 72,
        GOAL: 88
    };
    const homeX = xByType[type] || 52;
    const x = direction === 1 ? homeX : 100 - homeX;
    return {
        x,
        y: type === 'SET_PIECE' || type === 'SHOT' || type === 'GOAL' ? clamp(lane.y, 34, 66) : lane.y,
        lane: lane.lane,
        third: x < 34 ? 'DEFENSIVE' : x > 66 ? 'ATTACKING' : 'MIDDLE'
    };
}

function carrierIndexFor(type, lane) {
    if (type === 'CROSS') return lane === 'LEFT' ? 8 : 10;
    if (type === 'BUILD_UP') return 6;
    if (type === 'PRESSING') return 5;
    if (type === 'SET_PIECE') return 7;
    return 9;
}

function cameraStateFor(type) {
    if (type === 'BUILD_UP') return 'BUILD_UP';
    if (type === 'COUNTER_ATTACK') return 'COUNTER_ATTACK';
    if (type === 'DUEL' || type === 'PRESSING') return 'DUEL';
    if (type === 'CROSS') return 'DANGER';
    if (type === 'SHOT') return 'SHOT';
    if (type === 'SET_PIECE') return 'SET_PIECE';
    if (type === 'GOAL') return 'GOAL';
    return 'NORMAL';
}

function visualFocusFor(type) {
    if (type === 'COUNTER_ATTACK') return 'open-space';
    if (type === 'DUEL' || type === 'PRESSING') return 'duel';
    if (type === 'CROSS') return 'cross-zone';
    if (type === 'SHOT') return 'shot-line';
    if (type === 'SET_PIECE') return 'set-piece';
    if (type === 'GOAL') return 'goal';
    return 'ball';
}

function teamLabel(side, names) {
    return side === names.player ? 'Ton équipe' : side === 'HOME' ? names.home : names.away;
}

function eventText(event, context) {
    const { names, row } = context;
    const sideLabel = teamLabel(event.possessionSide, names);
    if (event.type === 'KICKOFF') return `${names.home} et ${names.away} se mettent en place. Le match commence sans mise en scène inutile.`;
    if (event.type === 'BUILD_UP') return `${sideLabel} ressort le ballon proprement. Les lignes s'étirent et le porteur cherche l'espace avant d'accélérer.`;
    if (event.type === 'PRESSING') return `${sideLabel} doit jouer sous pression. Autour du ballon, les distances se réduisent et les solutions deviennent plus courtes.`;
    if (event.type === 'DUEL') return `Le ballon arrive dans une zone de duel. Le porteur protège son premier appui pendant qu'un adversaire ferme l'angle de progression.`;
    if (event.type === 'COUNTER_ATTACK') return `${sideLabel} part en transition. Les attaquants prennent de la profondeur pendant que la défense court vers son propre but.`;
    if (event.type === 'CROSS') return `${sideLabel} trouve de la largeur. Le ballon est amené vers le couloir avant d'être envoyé dans une surface déjà en mouvement.`;
    if (event.type === 'SHOT') return `${sideLabel} ouvre une fenêtre de frappe. La défense se resserre entre le ballon et le but pendant que le gardien ajuste sa position.`;
    if (event.type === 'SET_PIECE') return `Le jeu s'arrête quelques secondes. Les deux blocs se replacent autour du ballon avant le coup de pied arrêté.`;
    if (event.type === 'GOAL') {
        if (event.playerContribution === 'GOAL') return `But. Tu termines l'action et le score passe à ${event.score.home}-${event.score.away}.`;
        if (event.playerContribution === 'ASSIST') return `But. Ta dernière passe crée directement l'ouverture et le score passe à ${event.score.home}-${event.score.away}.`;
        const scorer = event.possessionSide === names.player ? 'Ton équipe' : teamLabel(event.possessionSide, names);
        return `${scorer} marque. Le score passe à ${event.score.home}-${event.score.away}.`;
    }
    if (event.type === 'FULL_TIME') {
        const own = names.player === 'HOME' ? event.score.home : event.score.away;
        const against = names.player === 'HOME' ? event.score.away : event.score.home;
        const verdict = own > against ? 'La victoire est acquise.' : own < against ? 'Le match se termine par une défaite.' : 'Le score ne bougera plus.';
        return `${verdict} Le résultat final est ${event.score.home}-${event.score.away}.`;
    }
    return row.playerPlayed === false ? 'Le match continue sans intervention directe de ton joueur.' : 'Le match continue.';
}

function contextTypes(row = {}, random, count) {
    const pool = [SIMULATED_MATCH_EVENT.BUILD_UP];
    if (n(row.tackles) + n(row.duels) > 1) pool.push(SIMULATED_MATCH_EVENT.DUEL, SIMULATED_MATCH_EVENT.PRESSING);
    if (n(row.shots) > 0 || n(row.shotsOnTarget) > 0) pool.push(SIMULATED_MATCH_EVENT.SHOT);
    if (n(row.assists) > 0 || n(row.successfulPasses) > 12) pool.push(SIMULATED_MATCH_EVENT.CROSS);
    pool.push(SIMULATED_MATCH_EVENT.COUNTER_ATTACK);
    if (random() > .78) pool.push(SIMULATED_MATCH_EVENT.SET_PIECE);
    const result = [];
    while (result.length < count) result.push(pool[result.length % pool.length]);
    return shuffle(result, random);
}

function assignPlayerContributions(goalEvents, row, random) {
    const ownSide = playerSide(row);
    const ownGoals = goalEvents.filter(event => event.possessionSide === ownSide);
    const indexes = shuffle(ownGoals.map((_, index) => index), random);
    const goalCount = Math.min(Math.max(0, Math.round(n(row.goals))), ownGoals.length);
    const assistCount = Math.min(Math.max(0, Math.round(n(row.assists))), Math.max(0, ownGoals.length - goalCount));
    for (let index = 0; index < goalCount; index += 1) ownGoals[indexes[index]].playerContribution = 'GOAL';
    for (let index = 0; index < assistCount; index += 1) ownGoals[indexes[goalCount + index]].playerContribution = 'ASSIST';
}

export function buildSimulatedMatchTimeline(row = {}, { seed = null, player = {} } = {}) {
    const matchId = row.matchId || row.fixture?.id || `simulated:${row.matchIndex ?? 0}:${row.opponent || 'opponent'}`;
    const random = randomFactory(seed || matchId);
    const names = teamNames(row, player);
    const finalScore = scorePair(row);
    const occupied = new Set(['FIRST_HALF:0:0', 'SECOND_HALF:90:0']);
    const drafts = [];

    drafts.push({
        id: `${matchId}:visual:kickoff`,
        type: SIMULATED_MATCH_EVENT.KICKOFF,
        clock: normalClock(0),
        possessionSide: random() < .5 ? 'HOME' : 'AWAY',
        zone: { x: 50, y: 50, lane: 'CENTER', third: 'MIDDLE' },
        ballCarrier: { team: random() < .5 ? 'HOME' : 'AWAY', index: 6, role: 'midfielder' }
    });

    const goalSides = shuffle([
        ...Array(finalScore.home).fill('HOME'),
        ...Array(finalScore.away).fill('AWAY')
    ], random);
    const goalEvents = goalSides.map((side, index) => {
        const clock = randomMatchClock(random, occupied);
        const zone = zoneFor(SIMULATED_MATCH_EVENT.GOAL, side, random);
        return {
            id: `${matchId}:visual:goal:${index + 1}`,
            type: SIMULATED_MATCH_EVENT.GOAL,
            clock,
            possessionSide: side,
            zone,
            ballCarrier: { team: side, index: 9, role: 'attacker' },
            playerContribution: 'NONE'
        };
    });
    assignPlayerContributions(goalEvents, row, random);
    drafts.push(...goalEvents);

    const contextCount = Math.max(2, Math.min(4, 6 - goalEvents.length));
    const types = contextTypes(row, random, contextCount);
    const windows = [[8, 22], [26, 41], [53, 69], [72, 87]];
    types.forEach((type, index) => {
        const window = windows[index] || [55, 86];
        const side = random() < .56 ? names.player : (names.player === 'HOME' ? 'AWAY' : 'HOME');
        const clock = contextClock(random, window[0], window[1], occupied);
        const zone = zoneFor(type, side, random);
        drafts.push({
            id: `${matchId}:visual:context:${index + 1}`,
            type,
            clock,
            possessionSide: side,
            zone,
            ballCarrier: { team: side, index: carrierIndexFor(type, zone.lane), role: ['BUILD_UP', 'PRESSING', 'SET_PIECE'].includes(type) ? 'midfielder' : 'attacker' },
            playerContribution: 'NONE'
        });
    });

    drafts.push({
        id: `${matchId}:visual:full-time`,
        type: SIMULATED_MATCH_EVENT.FULL_TIME,
        clock: normalClock(90),
        possessionSide: names.player,
        zone: { x: 50, y: 50, lane: 'CENTER', third: 'MIDDLE' },
        ballCarrier: { team: names.player, index: 6, role: 'midfielder' }
    });

    drafts.sort((a, b) => clockOrder(a.clock) - clockOrder(b.clock) || a.id.localeCompare(b.id));
    const running = { home: 0, away: 0 };
    const events = drafts.map((draft, sequence) => {
        const before = { ...running };
        if (draft.type === SIMULATED_MATCH_EVENT.GOAL) {
            if (draft.possessionSide === 'HOME') running.home += 1;
            else running.away += 1;
        }
        if (draft.type === SIMULATED_MATCH_EVENT.FULL_TIME) {
            running.home = finalScore.home;
            running.away = finalScore.away;
        }
        const event = {
            ...draft,
            sequence,
            minuteLabel: formatFootballClock(draft.clock),
            scoreBefore: before,
            score: { ...running },
            cameraState: cameraStateFor(draft.type),
            visualFocus: visualFocusFor(draft.type),
            playerInvolved: row.playerPlayed !== false && (draft.playerContribution === 'GOAL' || draft.playerContribution === 'ASSIST' || (draft.possessionSide === names.player && ['DUEL', 'SHOT', 'CROSS'].includes(draft.type)))
        };
        event.text = eventText(event, { names, row });
        return event;
    });

    return {
        matchId,
        team: row.team || player.club || 'Ton équipe',
        opponent: row.opponent || 'Adversaire',
        competition: row.competitionName || row.fixture?.competitionName || row.fixture?.competition || 'Match',
        playerAge: Number(player.age ?? row.playerAge ?? row.fixture?.playerAge ?? 0) || 0,
        playerSide: names.player,
        homeTeam: names.home,
        awayTeam: names.away,
        finalScore,
        playerPlayed: row.playerPlayed !== false,
        events
    };
}

export default buildSimulatedMatchTimeline;
