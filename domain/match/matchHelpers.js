// domain/match/matchHelpers.js
// Fonctions pures partagées par les moteurs de match.

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;

export function positionGroup(position) {
    const p = String(position || '').toUpperCase();
    if (['GK', 'GB', 'G'].includes(p)) return 'goalkeeper';
    if (['DC', 'CB', 'DD', 'RB', 'DG', 'LB', 'D'].includes(p)) return 'defender';
    if (['MC', 'CM', 'MOC', 'CAM', 'MD', 'MG', 'M'].includes(p)) return 'midfielder';
    return 'attacker';
}

export function opponentName(match) {
    return match?.opponent || match?.awayClub || match?.homeClub || 'Adversaire';
}

export function isHomeMatch(match) {
    return typeof match?.home === 'boolean'
        ? match.home
        : typeof match?.isHome === 'boolean'
            ? match.isHome
            : true;
}

export function competitionLabel(match) {
    return match?.competitionName || match?.competition || match?.competitionId || match?.competitionType || 'Match';
}

export function matchType(match) {
    const phase = String(match?.phase || '').toLowerCase();
    const round = String(match?.round || match?.europeanRound || '').toLowerCase();
    const importance = String(match?.importance || '').toLowerCase();
    if (phase.includes('final') || round.includes('final') || importance === 'final' || importance === 'exceptional') return 'final';
    if (match?.rival || match?.isDerby || String(match?.type || '').toLowerCase().includes('rival')) return 'rival';
    return 'classic';
}

export function importanceFor(match) {
    const explicit = String(match?.importance || '').toLowerCase();
    if (explicit === 'exceptional') return 'exceptional';
    if (explicit === 'major' || explicit === 'important' || explicit === 'high') return 'important';
    const type = matchType(match);
    if (type === 'final') return 'exceptional';
    if (type === 'rival') return 'important';
    return 'normal';
}

export function decisionCount(match) {
    const importance = importanceFor(match);
    if (importance === 'exceptional') return 4;
    if (importance === 'important') return 3;
    return 2;
}

export function decisionMoments(match) {
    const count = decisionCount(match);
    const base = count === 4 ? [15, 34, 62, 82] : count === 3 ? [24, 55, 76] : [31, 68];
    return base.slice(0, count);
}

export function buildScore({ player, rating, group, goalChance, opponentStrength = 50 }) {
    const quality = clamp((number(player.overall) - opponentStrength) / 100, -0.45, 0.45);
    const playerInfluence = clamp((rating - 5.5) / 8, -0.2, 0.55);
    const base = group === 'goalkeeper' ? 0.9 : 1.05;
    const lambda = clamp(base + quality * 1.1 + playerInfluence + goalChance * 0.7 + Math.random() * 0.45, 0.15, 2.9);
    return Math.min(6, Math.floor(-Math.log(Math.max(0.0001, Math.random())) * lambda));
}

export function reconcilePlayerContributions(teamGoals, playerGoals, playerAssists) {
    const goals = Math.max(0, Math.floor(number(playerGoals)));
    const assists = Math.max(0, Math.floor(number(playerAssists)));
    return {
        teamGoals: Math.max(0, Math.floor(number(teamGoals)), goals + assists),
        goals,
        assists
    };
}

export function buildMatchResult({ player, scheduledMatch, matchIndex, rating, group, goalChance, assistChance, duelChance }) {
    const home = isHomeMatch(scheduledMatch);
    const opponent = opponentName(scheduledMatch);
    const opponentStrength = number(scheduledMatch?.opponentStrength ?? scheduledMatch?.opponentOverall ?? 50) || 50;
    const generatedTeamGoals = buildScore({ player, rating, group, goalChance, opponentStrength });
    const opponentGoals = Math.min(6, Math.floor(Math.random() * Math.max(1, 1.1 + opponentStrength / 55)));
    const playerGoal = Math.random() < clamp(goalChance, 0.01, 0.75) ? 1 : 0;
    const playerAssist = Math.random() < clamp(assistChance, 0.01, 0.75) ? 1 : 0;
    const contributions = reconcilePlayerContributions(generatedTeamGoals, playerGoal, playerAssist);
    const { teamGoals, goals: actualGoals, assists: actualAssists } = contributions;
    const tackles = group === 'goalkeeper'
        ? 0
        : Math.max(0, Math.floor(2 + Math.random() * 7 + duelChance * 8 + number(player.attributes?.defense) * .035));
    const cleanSheet = group === 'goalkeeper' && opponentGoals === 0;

    return {
        matchIndex,
        competitionId: scheduledMatch?.competitionId || null,
        competitionType: scheduledMatch?.competitionType || scheduledMatch?.type || null,
        competitionName: competitionLabel(scheduledMatch),
        phase: scheduledMatch?.phase || null,
        round: scheduledMatch?.round || scheduledMatch?.europeanRound || null,
        opponent,
        home,
        venue: scheduledMatch?.venue || null,
        score: { home: home ? teamGoals : opponentGoals, away: home ? opponentGoals : teamGoals },
        teamGoals,
        opponentGoals,
        result: teamGoals > opponentGoals ? 'win' : teamGoals < opponentGoals ? 'loss' : 'draw',
        rating,
        goals: actualGoals,
        assists: actualAssists,
        tackles,
        cleanSheet,
        played: true
    };
}

export default {
    clamp,
    number,
    positionGroup,
    opponentName,
    isHomeMatch,
    competitionLabel,
    matchType,
    importanceFor,
    decisionCount,
    decisionMoments,
    buildScore,
    buildMatchResult
};
