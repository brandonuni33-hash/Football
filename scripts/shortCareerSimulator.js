// Simulateur headless déterministe de la tranche courte Jalon 0.
import { FOOTBALL_ATTRIBUTES, calculateOverall } from '../domain/player/playerSystem.js';
import {
    MATCH_PROGRESSION_RULES,
    applyMatchProgression
} from '../domain/player/matchProgressionSystem.js';
import {
    GOAL_ACTOR_TYPE,
    GOAL_TEAM_SIDE,
    PLAYER_GOAL_CONTRIBUTION,
    createGoalEvent,
    deriveGoalSummary,
    validateGoalEvents
} from '../domain/match/goalEventResolver.js';

export const SHORT_CAREER_ORIGINS = Object.freeze([
    'CENTRE_FORMATION',
    'CLUB_AMATEUR',
    'FUTSAL'
]);

export const SHORT_CAREER_ARCHETYPES = Object.freeze({
    FINISSEUR: { position: 'BU', focusAttribute: 'finition' },
    CREATEUR_AXIAL: { position: 'MOC', focusAttribute: 'passe' },
    AILIER: { position: 'AD', focusAttribute: 'dribble' }
});

const MATCHES_PER_CAREER = MATCH_PROGRESSION_RULES.matchesPerChapter;
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

function mulberry32(seed) {
    let value = seed >>> 0;
    return () => {
        value += 0x6D2B79F5;
        let mixed = value;
        mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
        mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
        return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
}

function combinedSeed(seed, originIndex, archetypeIndex) {
    return ((seed * 2654435761) ^ ((originIndex + 1) * 2246822519) ^ ((archetypeIndex + 1) * 3266489917)) >>> 0;
}

function basePlayer(seed, origin, archetype) {
    const definition = SHORT_CAREER_ARCHETYPES[archetype];
    const originShift = origin === 'CENTRE_FORMATION' ? 1 : origin === 'CLUB_AMATEUR' ? 0 : 2;
    const attributes = Object.fromEntries(FOOTBALL_ATTRIBUTES.map((key, index) => [
        key,
        48 + ((seed + index * 3) % 5) + originShift
    ]));
    attributes[definition.focusAttribute] += 3;
    const player = {
        id: `sim-player-${seed}-${origin}-${archetype}`,
        age: 14,
        origin,
        position: definition.position,
        attributes,
        mental: {
            concentration: 58,
            sangFroid: 58,
            decision: 58,
            regularite: 62,
            resistancePression: 58
        },
        hidden: { consistency: 12, bigMatchPlayer: 12, injuryProneness: 8 },
        potentialProfile: { current: 82 },
        potential: 82,
        stats: {}
    };
    player.overall = calculateOverall(player);
    return player;
}

function actor(actorType, actorId, displayName) {
    return { actorType, actorId, displayName };
}

function teammate(rng, excludedId = null) {
    let number = 1 + Math.floor(rng() * 8);
    if (`teammate-${number}` === excludedId) number = (number % 8) + 1;
    return actor(GOAL_ACTOR_TYPE.TEAMMATE, `teammate-${number}`, `Coéquipier ${number}`);
}

function opponent(rng, excludedId = null) {
    let number = 1 + Math.floor(rng() * 11);
    if (`opponent-${number}` === excludedId) number = (number % 11) + 1;
    return actor(GOAL_ACTOR_TYPE.OPPONENT, `opponent-${number}`, `Adversaire ${number}`);
}

function playerTeamGoalDraft({ playerId, rng, order }) {
    const playerScored = rng() < .24;
    const scorer = playerScored
        ? actor(GOAL_ACTOR_TYPE.PLAYER, playerId, 'Joueur simulé')
        : teammate(rng);
    let assist = null;
    let playerContribution = PLAYER_GOAL_CONTRIBUTION.NONE;
    if (playerScored) {
        playerContribution = PLAYER_GOAL_CONTRIBUTION.GOAL;
        if (rng() < .55) assist = teammate(rng, scorer.actorId);
    } else if (rng() < .18) {
        assist = actor(GOAL_ACTOR_TYPE.PLAYER, playerId, 'Joueur simulé');
        playerContribution = PLAYER_GOAL_CONTRIBUTION.ASSIST;
    } else if (rng() < .55) {
        assist = teammate(rng, scorer.actorId);
    }
    return {
        order,
        minute: 8 + Math.floor(rng() * 82),
        teamSide: GOAL_TEAM_SIDE.PLAYER,
        scorer,
        assist,
        playerContribution
    };
}

function opponentGoalDraft({ rng, order }) {
    const scorer = opponent(rng);
    return {
        order,
        minute: 8 + Math.floor(rng() * 82),
        teamSide: GOAL_TEAM_SIDE.OPPONENT,
        scorer,
        assist: rng() < .55 ? opponent(rng, scorer.actorId) : null,
        playerContribution: PLAYER_GOAL_CONTRIBUTION.NONE
    };
}

function canonicalGoalTimeline({ matchId, playerId, teamGoals, opponentGoals, rng }) {
    const drafts = [];
    for (let index = 0; index < teamGoals; index += 1) {
        drafts.push(playerTeamGoalDraft({ playerId, rng, order: drafts.length }));
    }
    for (let index = 0; index < opponentGoals; index += 1) {
        drafts.push(opponentGoalDraft({ rng, order: drafts.length }));
    }
    drafts.sort((left, right) => left.minute - right.minute || left.order - right.order);
    return drafts.map((draft, index) => createGoalEvent({
        matchId,
        sequence: index + 1,
        minute: draft.minute,
        teamSide: draft.teamSide,
        scorer: draft.scorer,
        assist: draft.assist,
        playerContribution: draft.playerContribution,
        source: { type: 'SHORT_CAREER_SIMULATION' }
    }));
}

function finiteTree(value, seen = new Set()) {
    if (typeof value === 'number') return Number.isFinite(value);
    if (!value || typeof value !== 'object') return true;
    if (seen.has(value)) return true;
    seen.add(value);
    return Object.values(value).every(item => finiteTree(item, seen));
}

function uniquePlayerCredits(goalEvents, playerId) {
    const credits = [];
    for (const event of goalEvents) {
        if (event.scorer?.actorId === playerId) credits.push(`${event.id}:scorer`);
        if (event.assist?.actorId === playerId) credits.push(`${event.id}:assister`);
        if (event.scorer?.actorId === playerId && event.assist?.actorId === playerId) return false;
    }
    return credits.length === new Set(credits).size;
}

function simulateMatch({ seed, origin, archetype, player, matchNumber, rng }) {
    const matchId = `short:${seed}:${origin}:${archetype}:${matchNumber}`;
    const home = matchNumber % 2 === 1;
    const teamGoals = Math.floor(rng() * 4);
    const opponentGoals = Math.floor(rng() * 4);
    const goalEvents = canonicalGoalTimeline({ matchId, playerId: player.id, teamGoals, opponentGoals, rng });
    const summary = deriveGoalSummary(goalEvents, { home, playerId: player.id });
    const { score, goals, assists } = summary;
    const rating = Number(clamp(5.4 + rng() * 3 + goals * .2 + assists * .12, 4, 9.4).toFixed(1));
    const result = {
        matchId,
        played: true,
        playerPlayed: true,
        minutesPlayed: 55 + Math.floor(rng() * 36),
        rating,
        goalEvents,
        ...summary
    };
    const progression = applyMatchProgression(player, result, {
        matchId,
        chapterId: `short-career:${seed}:${origin}:${archetype}`,
        focusAttribute: SHORT_CAREER_ARCHETYPES[archetype].focusAttribute
    });
    const canonicalValidation = validateGoalEvents(goalEvents, { matchId });
    const creditsMatchFacts = goals === goalEvents.filter(event => event.scorer?.actorId === player.id).length
        && assists === goalEvents.filter(event => event.assist?.actorId === player.id).length;
    return {
        seed,
        origin,
        archetype,
        match: matchNumber,
        matchId,
        score,
        rating,
        goals,
        assists,
        goalEvents,
        progression,
        invariants: {
            finite: finiteTree({ result, progression, player }),
            score: [score.home, score.away].every(value => Number.isInteger(value) && value >= 0)
                && summary.teamGoals === teamGoals
                && summary.opponentGoals === opponentGoals
                && goalEvents.length === teamGoals + opponentGoals,
            uniqueCredit: canonicalValidation.valid
                && creditsMatchFacts
                && uniquePlayerCredits(goalEvents, player.id),
            progression: progression?.chapterOverallGain <= MATCH_PROGRESSION_RULES.maxOverallGainPerChapter
                && progression?.chapterAttributeGain <= MATCH_PROGRESSION_RULES.maxFocusedAttributeGainPerChapter
        }
    };
}

function failuresForCareer(career, initial) {
    const failures = [];
    for (const row of career.matches) {
        for (const [invariant, valid] of Object.entries(row.invariants)) {
            if (!valid) failures.push({
                seed: career.seed,
                origin: career.origin,
                archetype: career.archetype,
                match: row.match,
                invariant
            });
        }
    }
    if (!career.loop.valid) failures.push({
        seed: career.seed,
        origin: career.origin,
        archetype: career.archetype,
        match: career.loop.completedMatches,
        invariant: 'loop'
    });
    const focus = SHORT_CAREER_ARCHETYPES[career.archetype].focusAttribute;
    const overallDelta = career.final.overall - initial.overall;
    const attributeDelta = career.final.attributes[focus] - initial.attributes[focus];
    if (overallDelta > MATCH_PROGRESSION_RULES.maxOverallGainPerChapter) failures.push({
        seed: career.seed,
        origin: career.origin,
        archetype: career.archetype,
        match: MATCHES_PER_CAREER,
        invariant: 'chapter-overall-cap',
        actual: overallDelta
    });
    if (attributeDelta > MATCH_PROGRESSION_RULES.maxFocusedAttributeGainPerChapter) failures.push({
        seed: career.seed,
        origin: career.origin,
        archetype: career.archetype,
        match: MATCHES_PER_CAREER,
        invariant: 'chapter-attribute-cap',
        actual: attributeDelta
    });
    return failures;
}

export function simulateShortCareers({ seedsPerCombination = 112 } = {}) {
    const careers = [];
    const failures = [];
    SHORT_CAREER_ORIGINS.forEach((origin, originIndex) => {
        Object.keys(SHORT_CAREER_ARCHETYPES).forEach((archetype, archetypeIndex) => {
            for (let seed = 1; seed <= seedsPerCombination; seed += 1) {
                const rng = mulberry32(combinedSeed(seed, originIndex, archetypeIndex));
                const player = basePlayer(seed, origin, archetype);
                const initial = { overall: player.overall, attributes: { ...player.attributes } };
                const matches = [];
                let matchNumber = 1;
                let guard = 0;
                while (matchNumber <= MATCHES_PER_CAREER && guard < MATCHES_PER_CAREER + 1) {
                    guard += 1;
                    matches.push(simulateMatch({ seed, origin, archetype, player, matchNumber, rng }));
                    matchNumber += 1;
                }
                const career = {
                    seed,
                    origin,
                    archetype,
                    matches,
                    loop: {
                        guard,
                        completedMatches: matches.length,
                        valid: guard === MATCHES_PER_CAREER && matches.length === MATCHES_PER_CAREER
                    },
                    initial,
                    final: { overall: player.overall, attributes: { ...player.attributes } }
                };
                failures.push(...failuresForCareer(career, initial));
                careers.push(career);
            }
        });
    });
    return {
        version: 1,
        deterministic: true,
        seedsPerCombination,
        combinations: SHORT_CAREER_ORIGINS.length * Object.keys(SHORT_CAREER_ARCHETYPES).length,
        careerCount: careers.length,
        matchCount: careers.length * MATCHES_PER_CAREER,
        careers,
        failures,
        valid: failures.length === 0
    };
}

export default simulateShortCareers;
