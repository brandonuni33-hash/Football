// domain/career/clubSeasonObjectiveSystem.js
// Suit les résultats réels du club du joueur afin de pouvoir évaluer un objectif
// de saison sans inventer de classement qui n'existe pas dans le world model.

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const clamp = (value, min, max) => Math.min(max, Math.max(min, n(value)));

function prestigeOf(state = {}) {
    const player = state.player || {};
    return clamp(player.clubPrestige ?? player.youthClubData?.prestige ?? 40, 0, 100);
}

export function buildClubSeasonObjective(state = {}) {
    const prestige = prestigeOf(state);
    if (prestige >= 78) return { id:'first_roles', label:'Jouer les premiers rôles', targetPointsPerMatch:1.9 };
    if (prestige >= 62) return { id:'top_half', label:'Viser le haut du tableau', targetPointsPerMatch:1.6 };
    if (prestige >= 45) return { id:'solid_season', label:'Faire une saison solide', targetPointsPerMatch:1.3 };
    return { id:'stay_competitive', label:'Rester compétitif toute la saison', targetPointsPerMatch:1.0 };
}

function freshPerformance(state = {}) {
    return {
        seasonYear:n(state.calendar?.currentSeasonYear),
        objective:buildClubSeasonObjective(state),
        matches:0,wins:0,draws:0,losses:0,points:0,
        recordedMatchKeys:[]
    };
}

export function ensureClubSeasonPerformance(state = {}) {
    state.career ||= {};
    const expectedYear = n(state.calendar?.currentSeasonYear);
    const current = state.career.clubSeasonPerformance;
    if (!current || n(current.seasonYear) !== expectedYear) state.career.clubSeasonPerformance = freshPerformance(state);
    return state.career.clubSeasonPerformance;
}

function resultKey(result = {}, index = 0) {
    const fixture = result.fixture || {};
    return String(fixture.id || result.matchId || result.id || `${result.matchIndex ?? index}|${result.opponent || 'opponent'}|${result.teamGoals ?? '?'}-${result.opponentGoals ?? '?'}`);
}

export function recordClubSeasonResults(state = {}, report = {}) {
    const performance = ensureClubSeasonPerformance(state);
    const raw = report?.summary?.matchResults || report?.results || [];
    const results = Array.isArray(raw) ? raw.filter(Boolean) : [];
    for (let index = 0; index < results.length; index += 1) {
        const result = results[index];
        const key = resultKey(result, index);
        if (performance.recordedMatchKeys.includes(key)) continue;
        performance.recordedMatchKeys.push(key);
        const teamGoals = n(result.teamGoals), opponentGoals = n(result.opponentGoals);
        performance.matches += 1;
        if (teamGoals > opponentGoals) { performance.wins += 1; performance.points += 3; }
        else if (teamGoals === opponentGoals) { performance.draws += 1; performance.points += 1; }
        else performance.losses += 1;
    }
    return performance;
}

export function evaluateClubSeasonObjective(state = {}) {
    const performance = ensureClubSeasonPerformance(state);
    const matches = n(performance.matches);
    const pointsPerMatch = matches ? Number((n(performance.points) / matches).toFixed(2)) : 0;
    const target = n(performance.objective?.targetPointsPerMatch);
    // Sans match du club enregistré, on ne prétend jamais que l'objectif a été atteint ou manqué.
    const status = matches === 0 ? 'unknown' : pointsPerMatch >= target ? 'reached' : 'missed';
    return {
        ...performance.objective,
        status,
        reached:status === 'reached',
        pointsPerMatch,
        matches,
        wins:n(performance.wins),
        draws:n(performance.draws),
        losses:n(performance.losses)
    };
}

export function resetClubSeasonPerformance(state = {}) {
    if (state.career) delete state.career.clubSeasonPerformance;
}

export const ClubSeasonObjectiveSystem = Object.freeze({
    buildClubSeasonObjective,
    ensureClubSeasonPerformance,
    recordClubSeasonResults,
    evaluateClubSeasonObjective,
    resetClubSeasonPerformance
});
export default ClubSeasonObjectiveSystem;
