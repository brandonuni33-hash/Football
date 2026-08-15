// Source canonique des buts d'un match.
//
// Un but existe d'abord dans `goalEvents`. Le score, le resultat collectif et
// les contributions du joueur sont uniquement des projections de ces faits.

export const GOAL_TEAM_SIDE = Object.freeze({
    PLAYER: 'PLAYER_TEAM',
    OPPONENT: 'OPPONENT'
});

export const GOAL_ACTOR_TYPE = Object.freeze({
    PLAYER: 'PLAYER',
    TEAMMATE: 'TEAMMATE',
    OPPONENT: 'OPPONENT'
});

export const PLAYER_GOAL_CONTRIBUTION = Object.freeze({
    GOAL: 'GOAL',
    ASSIST: 'ASSIST',
    PRE_ASSIST: 'PRE_ASSIST',
    CHANCE_CREATED: 'CHANCE_CREATED',
    NONE: 'NONE'
});

const integer = value => Math.floor(Number(value));
const actorId = value => value === null || value === undefined ? null : String(value);

function normalizeActor(actor, fallbackType) {
    if (!actor || typeof actor !== 'object') throw new Error('Un but canonique exige un acteur.');
    const type = String(actor.actorType || fallbackType || '').toUpperCase();
    if (!Object.values(GOAL_ACTOR_TYPE).includes(type)) throw new Error(`Type d'acteur de but invalide : ${type || 'absent'}.`);
    const displayName = String(actor.displayName || actor.name || '').trim();
    if (!displayName) throw new Error('Un but canonique exige un nom affichable.');
    return { actorType: type, actorId: actorId(actor.actorId ?? actor.id), displayName };
}

export function createGoalEvent({
    matchId,
    sequence,
    minute,
    teamSide,
    scorer,
    assist = null,
    source = { type: 'BACKGROUND_SIMULATION' },
    playerContribution = PLAYER_GOAL_CONTRIBUTION.NONE,
    gesture = null
} = {}) {
    const normalizedMatchId = String(matchId || '').trim();
    const normalizedSequence = integer(sequence);
    const normalizedMinute = integer(minute);
    const normalizedSide = String(teamSide || '').toUpperCase();
    const normalizedContribution = String(playerContribution || PLAYER_GOAL_CONTRIBUTION.NONE).toUpperCase();
    if (!normalizedMatchId) throw new Error('Un but canonique exige un matchId.');
    if (!Number.isInteger(normalizedSequence) || normalizedSequence < 1) throw new Error('La sequence du but doit etre un entier positif.');
    if (!Number.isInteger(normalizedMinute) || normalizedMinute < 1 || normalizedMinute > 120) throw new Error('La minute du but doit etre comprise entre 1 et 120.');
    if (!Object.values(GOAL_TEAM_SIDE).includes(normalizedSide)) throw new Error(`Camp du but invalide : ${normalizedSide || 'absent'}.`);
    if (!Object.values(PLAYER_GOAL_CONTRIBUTION).includes(normalizedContribution)) throw new Error(`Contribution joueur invalide : ${normalizedContribution}.`);

    const normalizedScorer = normalizeActor(scorer, normalizedSide === GOAL_TEAM_SIDE.OPPONENT ? GOAL_ACTOR_TYPE.OPPONENT : GOAL_ACTOR_TYPE.TEAMMATE);
    const normalizedAssist = assist ? normalizeActor(assist, normalizedSide === GOAL_TEAM_SIDE.OPPONENT ? GOAL_ACTOR_TYPE.OPPONENT : GOAL_ACTOR_TYPE.TEAMMATE) : null;
    if (normalizedAssist?.actorId && normalizedAssist.actorId === normalizedScorer.actorId) throw new Error('Le buteur ne peut pas etre son propre passeur.');
    if (normalizedContribution === PLAYER_GOAL_CONTRIBUTION.GOAL && normalizedScorer.actorType !== GOAL_ACTOR_TYPE.PLAYER) throw new Error('Une contribution GOAL exige le joueur comme buteur.');
    if (normalizedContribution === PLAYER_GOAL_CONTRIBUTION.ASSIST && normalizedAssist?.actorType !== GOAL_ACTOR_TYPE.PLAYER) throw new Error('Une contribution ASSIST exige le joueur comme passeur.');
    if (normalizedScorer.actorType === GOAL_ACTOR_TYPE.PLAYER && normalizedContribution !== PLAYER_GOAL_CONTRIBUTION.GOAL) throw new Error('Un joueur buteur exige une contribution GOAL.');
    if (normalizedAssist?.actorType === GOAL_ACTOR_TYPE.PLAYER && normalizedContribution !== PLAYER_GOAL_CONTRIBUTION.ASSIST) throw new Error('Un joueur passeur exige une contribution ASSIST.');
    if (normalizedSide === GOAL_TEAM_SIDE.OPPONENT && (normalizedScorer.actorType === GOAL_ACTOR_TYPE.PLAYER || normalizedAssist?.actorType === GOAL_ACTOR_TYPE.PLAYER || normalizedContribution !== PLAYER_GOAL_CONTRIBUTION.NONE)) throw new Error('Un but adverse ne peut pas créditer le joueur.');

    const sourceType = String(source?.type || '').trim().toUpperCase();
    if (!sourceType) throw new Error('Un but canonique exige une source.');
    return {
        id: `${normalizedMatchId}:goal:${normalizedSequence}`,
        kind: 'goal',
        matchId: normalizedMatchId,
        sequence: normalizedSequence,
        minute: normalizedMinute,
        teamSide: normalizedSide,
        scorer: normalizedScorer,
        assist: normalizedAssist,
        source: { ...source, type: sourceType },
        playerContribution: normalizedContribution,
        gesture: gesture ? String(gesture) : null
    };
}

export function validateGoalEvents(events = [], { matchId = null } = {}) {
    const errors = [];
    const ids = new Set();
    let previousSequence = 0;
    let previousMinute = 0;
    for (const event of Array.isArray(events) ? events : []) {
        if (!event || event.kind !== 'goal') { errors.push('invalid-kind'); continue; }
        if (matchId && event.matchId !== String(matchId)) errors.push('wrong-match-id');
        if (event.id !== `${event.matchId}:goal:${event.sequence}`) errors.push('invalid-id');
        if (ids.has(event.id)) errors.push('duplicate-id');
        ids.add(event.id);
        if (!Number.isInteger(Number(event.sequence)) || Number(event.sequence) !== previousSequence + 1) errors.push('invalid-sequence');
        if (!Number.isInteger(Number(event.minute)) || Number(event.minute) < previousMinute || Number(event.minute) < 1 || Number(event.minute) > 120) errors.push('invalid-minute');
        if (!Object.values(GOAL_TEAM_SIDE).includes(event.teamSide)) errors.push('invalid-team-side');
        if (!event.scorer?.displayName) errors.push('missing-scorer');
        if (!Object.values(GOAL_ACTOR_TYPE).includes(event.scorer?.actorType)) errors.push('invalid-scorer-type');
        if (event.assist && !event.assist?.displayName) errors.push('missing-assist');
        if (event.assist && !Object.values(GOAL_ACTOR_TYPE).includes(event.assist?.actorType)) errors.push('invalid-assist-type');
        if (event.assist?.actorId && event.assist.actorId === event.scorer?.actorId) errors.push('self-assist');
        if (!event.source?.type) errors.push('missing-source');
        if (!Object.values(PLAYER_GOAL_CONTRIBUTION).includes(event.playerContribution)) errors.push('invalid-player-contribution');
        const playerScored = event.scorer?.actorType === GOAL_ACTOR_TYPE.PLAYER;
        const playerAssisted = event.assist?.actorType === GOAL_ACTOR_TYPE.PLAYER;
        if (event.teamSide === GOAL_TEAM_SIDE.OPPONENT && (playerScored || playerAssisted || event.playerContribution !== PLAYER_GOAL_CONTRIBUTION.NONE)) errors.push('invalid-opponent-contribution');
        if (event.teamSide === GOAL_TEAM_SIDE.OPPONENT && event.scorer?.actorType !== GOAL_ACTOR_TYPE.OPPONENT) errors.push('invalid-opponent-scorer');
        if (event.teamSide === GOAL_TEAM_SIDE.OPPONENT && event.assist && event.assist?.actorType !== GOAL_ACTOR_TYPE.OPPONENT) errors.push('invalid-opponent-assist');
        if (event.teamSide === GOAL_TEAM_SIDE.PLAYER && event.scorer?.actorType === GOAL_ACTOR_TYPE.OPPONENT) errors.push('invalid-player-team-scorer');
        if (event.teamSide === GOAL_TEAM_SIDE.PLAYER && event.assist?.actorType === GOAL_ACTOR_TYPE.OPPONENT) errors.push('invalid-player-team-assist');
        if (playerScored !== (event.playerContribution === PLAYER_GOAL_CONTRIBUTION.GOAL)) errors.push('invalid-player-goal-contribution');
        if (playerAssisted !== (event.playerContribution === PLAYER_GOAL_CONTRIBUTION.ASSIST)) errors.push('invalid-player-assist-contribution');
        previousSequence = Number(event.sequence) || previousSequence;
        previousMinute = Number(event.minute) || previousMinute;
    }
    return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function assertCanonicalGoalEvents(events = [], options = {}) {
    const validation = validateGoalEvents(events, options);
    if (!validation.valid) throw new Error(`Chronologie de buts invalide : ${validation.errors.join(', ')}.`);
    return true;
}

export function deriveGoalSummary(events = [], { home = true, playerId = null } = {}) {
    const list = Array.isArray(events) ? events : [];
    const normalizedPlayerId = actorId(playerId);
    const teamGoals = list.filter(event => event?.teamSide === GOAL_TEAM_SIDE.PLAYER).length;
    const opponentGoals = list.filter(event => event?.teamSide === GOAL_TEAM_SIDE.OPPONENT).length;
    const goals = list.filter(event => event?.scorer?.actorType === GOAL_ACTOR_TYPE.PLAYER && (!normalizedPlayerId || event.scorer.actorId === normalizedPlayerId)).length;
    const assists = list.filter(event => event?.assist?.actorType === GOAL_ACTOR_TYPE.PLAYER && (!normalizedPlayerId || event.assist.actorId === normalizedPlayerId)).length;
    const score = home ? { home: teamGoals, away: opponentGoals } : { home: opponentGoals, away: teamGoals };
    return {
        score,
        teamGoals,
        opponentGoals,
        goals,
        assists,
        result: teamGoals > opponentGoals ? 'win' : teamGoals < opponentGoals ? 'loss' : 'draw'
    };
}

export function scoreAfterGoal(events = [], eventId, { home = true } = {}) {
    const index = (Array.isArray(events) ? events : []).findIndex(event => event?.id === eventId);
    if (index < 0) throw new Error(`But absent de la chronologie : ${eventId}.`);
    return deriveGoalSummary(events.slice(0, index + 1), { home }).score;
}

export function appendGoalEvent(session, input = {}) {
    if (!session?.id || !Array.isArray(session.goalEvents)) throw new Error('Session sans chronologie canonique de buts.');
    assertCanonicalGoalEvents(session.goalEvents, { matchId:session.id });
    const sequence = session.goalEvents.length + 1;
    const event = createGoalEvent({ ...input, matchId: session.id, sequence });
    if (session.goalEvents.some(item => item.id === event.id)) throw new Error(`But deja enregistre : ${event.id}.`);
    assertCanonicalGoalEvents([...session.goalEvents, event], { matchId:session.id });
    session.goalEvents.push(event);
    session.score = deriveGoalSummary(session.goalEvents, { home: session.home, playerId: session.playerId }).score;
    return event;
}

export function synchronizeResultWithGoals(result = {}, playerId = null) {
    if (!result.matchId || !Array.isArray(result.goalEvents)) throw new Error('Un resultat interactif exige ses goalEvents canoniques.');
    assertCanonicalGoalEvents(result.goalEvents, { matchId: result.matchId });
    const summary = deriveGoalSummary(result.goalEvents, { home: result.home, playerId });
    if (result.wentToPenalties === true) {
        const teamPenalties = Number(result.penaltyScore?.team);
        const opponentPenalties = Number(result.penaltyScore?.opponent);
        if (!Number.isFinite(teamPenalties) || !Number.isFinite(opponentPenalties) || teamPenalties === opponentPenalties) {
            throw new Error('Un resultat aux tirs au but exige un score canonique non nul.');
        }
        const shootoutWinner = teamPenalties > opponentPenalties ? 'team' : 'opponent';
        if (result.shootoutWinner && result.shootoutWinner !== shootoutWinner) {
            throw new Error('Le vainqueur des tirs au but contredit le score canonique.');
        }
        result = { ...result, shootoutWinner };
        summary.result = shootoutWinner === 'team' ? 'win' : 'loss';
    }
    return { ...result, ...summary };
}

// Compatibilite de lecture uniquement : cette fonction ne reconstruit plus de
// buts depuis un total. Elle filtre la chronologie canonique existante.
export function canonicalPlayerGoalEvents(result = {}, player = {}) {
    const playerId = actorId(player.id);
    if (!Array.isArray(result.goalEvents)) return [];
    return result.goalEvents.filter(event => event?.scorer?.actorType === GOAL_ACTOR_TYPE.PLAYER && (!playerId || event.scorer.actorId === playerId));
}

export default deriveGoalSummary;
