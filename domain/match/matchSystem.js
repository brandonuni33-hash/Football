// domain/match/matchSystem.js
// Façade de domaine pour la simulation des blocs de match.
// Tous les matchs passent par le moteur de performance commun.

import { recalibrateReport } from './matchPerformanceEngine.js';
import { PotentialSystem } from '../player/potentialSystem.js';

const n = v => Number.isFinite(Number(v)) ? Number(v) : 0;

function totals(report) {
    const rows = Array.isArray(report?.results) ? report.results : Array.isArray(report?.summary?.matchResults) ? report.summary.matchResults : [];
    return {
        matches: rows.length,
        goals: rows.reduce((s, r) => s + n(r.goals), 0),
        assists: rows.reduce((s, r) => s + n(r.assists), 0),
        tackles: rows.reduce((s, r) => s + n(r.tackles), 0),
        passes: rows.reduce((s, r) => s + n(r.successfulPasses), 0),
        rating: rows.length ? rows.reduce((s, r) => s + n(r.rating), 0) / rows.length : 0
    };
}

function reconcilePlayerStats(player, beforeReport, afterReport) {
    if (!player?.stats) return;
    const before = totals(beforeReport);
    const after = totals(afterReport);
    const stats = player.stats;
    stats.goals = Math.max(0, n(stats.goals) + after.goals - before.goals);
    stats.assists = Math.max(0, n(stats.assists) + after.assists - before.assists);
    stats.tackles = Math.max(0, n(stats.tackles) + after.tackles - before.tackles);
    stats.successfulPasses = Math.max(0, n(stats.successfulPasses) + after.passes - before.passes);
    const totalMatches = n(stats.matchesPlayed);
    const previousMatches = Math.max(0, totalMatches - after.matches);
    if (totalMatches > 0) {
        stats.averageRating = Number((((n(stats.averageRating) * previousMatches) + after.rating * after.matches) / totalMatches).toFixed(1));
    }
}

export class MatchSystem {
    constructor(matchBlockManager) {
        if (!matchBlockManager?.simulateBlock) throw new Error('MatchSystem requires a match block manager');
        this.legacy = matchBlockManager;
    }

    simulateBlock(state, trainingFocus = 'TECHNIQUE', userMatchChoice = null) {
        const player = state?.player;
        const potential = player ? PotentialSystem.ensure(player) : null;
        const previousPotentialPerformance = potential ? { ...potential.seasonPerformance } : null;

        const legacyReport = this.legacy.simulateBlock(state, trainingFocus, userMatchChoice);
        const correctedReport = recalibrateReport(player, legacyReport, { trainingFocus, interactive: Boolean(userMatchChoice) });

        if (potential && previousPotentialPerformance) {
            const corrected = totals(correctedReport);
            potential.seasonPerformance = {
                weightedRating: previousPotentialPerformance.weightedRating + corrected.rating * corrected.matches,
                matches: previousPotentialPerformance.matches + corrected.matches
            };
        }

        reconcilePlayerStats(player, legacyReport, correctedReport);
        return correctedReport;
    }
}

export default MatchSystem;
