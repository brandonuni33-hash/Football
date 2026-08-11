// domain/match/simulatedMatchSystem.js
// Simulation canonique des matchs non interactifs.
import { evaluateMatch } from './matchPerformanceEngine.js';
import { PotentialSystem } from '../player/potentialSystem.js';
import { applyProgression } from '../player/playerSystem.js';
import CompetitionSystem from '../competition/competitionSystem.js';
import EconomyManager from '../economy/economySystem.js';

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

function roleOf(position) {
    const p = String(position || '').toUpperCase();
    if (['GK', 'GB', 'G'].includes(p)) return 'goalkeeper';
    if (['DC', 'CB', 'DD', 'DG', 'RB', 'LB', 'D', 'LAT'].includes(p)) return 'defender';
    if (['MC', 'CM', 'MOC', 'CAM', 'MD', 'MG', 'M', 'MDEF', 'MOFF'].includes(p)) return 'midfielder';
    return 'attacker';
}
function opponentGoals(strength, home) {
    const base = .55 + clamp(strength, 25, 95) / 115 + (home ? -.08 : .05);
    return Math.min(5, Math.max(0, Math.floor(Math.random() * (base + 1))));
}
function teamGoals(performance) {
    const quality = clamp((performance.performanceLevel || 0) + .55, -.2, 1.1);
    const base = .55 + quality * .85 + (performance.goals || 0) * .35;
    return Math.min(5, Math.max(0, Math.floor(Math.random() * (base + 1))));
}
function commitPlayerResult(player, row) {
    const stats = player.stats || (player.stats = {});
    const previous = n(stats.matchesPlayed);
    stats.matchesPlayed = previous + 1;
    stats.goals = n(stats.goals) + n(row.goals);
    stats.assists = n(stats.assists) + n(row.assists);
    stats.tackles = n(stats.tackles) + n(row.tackles);
    stats.successfulPasses = n(stats.successfulPasses) + n(row.successfulPasses);
    if (row.cleanSheet) stats.cleanSheets = n(stats.cleanSheets) + 1;
    stats.averageRating = Number((((n(stats.averageRating) * previous) + row.rating) / (previous + 1)).toFixed(1));
    PotentialSystem.recordMatch(player, { rating: row.rating, goals: row.goals, assists: row.assists, tackles: row.tackles }, 1);
    applyProgression(player, { rating: row.rating, goals: row.goals, assists: row.assists, type: 'match' });
}
function summarize(results = []) {
    const matches = results.length;
    const rating = matches ? Number((results.reduce((sum, row) => sum + n(row.rating), 0) / matches).toFixed(1)) : 0;
    return {
        rating,
        goals: results.reduce((sum, row) => sum + n(row.goals), 0),
        assists: results.reduce((sum, row) => sum + n(row.assists), 0),
        passes: results.reduce((sum, row) => sum + n(row.successfulPasses), 0),
        tackles: results.reduce((sum, row) => sum + n(row.tackles), 0),
        cleanSheets: results.reduce((sum, row) => sum + (row.cleanSheet ? 1 : 0), 0),
        yellowCards: 0,
        matchesPlayed: matches,
        injured: false
    };
}

export class SimulatedMatchSystem {
    simulateMatches(state, fixtures = [], options = {}) {
        const player = state?.player;
        if (!player) throw new Error('SimulatedMatchSystem: joueur absent.');
        const scheduled = Array.isArray(fixtures) ? fixtures : [];
        const indices = Array.isArray(options.indices) ? options.indices : [];
        const role = roleOf(player.position);
        const results = [];

        for (const [localIndex, match] of scheduled.entries()) {
            const matchIndex = Number.isFinite(Number(indices[localIndex])) ? Number(indices[localIndex]) : localIndex;
            const strength = n(match?.opponentStrength ?? match?.opponentOverall ?? 55) || 55;
            const important = ['important', 'major', 'exceptional'].includes(String(match?.importance || '').toLowerCase())
                || String(match?.phase || '').toLowerCase().includes('final')
                || String(match?.round || '').toLowerCase().includes('final');
            const performance = evaluateMatch(player, { opponentStrength: strength, opponentOverall: strength, important, minutes: 90 });
            const home = typeof match?.home === 'boolean' ? match.home : true;
            const goalsFor = teamGoals(performance);
            const goalsAgainst = opponentGoals(strength, home);
            const row = {
                matchIndex,
                fixture: match,
                competitionId: match?.competitionId || null,
                competitionType: match?.competitionType || match?.type || null,
                competitionName: match?.competitionName || match?.competition || match?.competitionId || 'Match',
                phase: match?.phase || null,
                round: match?.round || match?.europeanRound || null,
                opponent: match?.opponent || match?.awayClub || match?.homeClub || 'Adversaire',
                opponentStrength: strength,
                home,
                venue: match?.venue || null,
                score: { home: home ? goalsFor : goalsAgainst, away: home ? goalsAgainst : goalsFor },
                teamGoals: goalsFor,
                opponentGoals: goalsAgainst,
                result: goalsFor > goalsAgainst ? 'win' : goalsFor < goalsAgainst ? 'loss' : 'draw',
                rating: performance.rating,
                goals: performance.goals,
                assists: performance.assists,
                tackles: performance.tackles,
                interceptions: performance.interceptions,
                successfulPasses: performance.successfulPasses,
                passes: performance.passes,
                cleanSheet: Boolean(role === 'goalkeeper' && goalsAgainst === 0),
                shots: performance.shots,
                shotsOnTarget: performance.shotsOnTarget,
                duels: performance.duels,
                duelsWon: performance.duelsWon,
                expression: performance.expression,
                performanceLevel: performance.performanceLevel,
                played: true,
                interactive: false
            };
            results.push(row);
            commitPlayerResult(player, row);
        }
        return results;
    }

    simulateRemainingMatches(state, completedResults = []) {
        const plan = CompetitionSystem.getBlockPlan(state);
        const scheduled = Array.isArray(plan?.scheduledMatches) ? plan.scheduledMatches : [];
        const completedIndexes = new Set((Array.isArray(completedResults) ? completedResults : [])
            .map(result => Number(result?.matchIndex))
            .filter(Number.isFinite));
        const remaining = [];
        const indices = [];
        scheduled.forEach((match, index) => {
            if (!completedIndexes.has(index)) {
                remaining.push(match);
                indices.push(index);
            }
        });
        return {
            plan,
            scheduledMatches: scheduled,
            results: this.simulateMatches(state, remaining, { indices })
        };
    }

    simulateBlock(state) {
        const player = state?.player;
        if (!player) throw new Error('SimulatedMatchSystem: joueur absent.');
        const plan = CompetitionSystem.getBlockPlan(state);
        const scheduled = Array.isArray(plan?.scheduledMatches) ? plan.scheduledMatches : [];
        const results = this.simulateMatches(state, scheduled);
        const summary = summarize(results);

        if (summary.matchesPlayed) {
            player.morale = clamp(n(player.morale ?? 50) + (summary.rating >= 7 ? 3 : summary.rating < 5.8 ? -2 : 0), 0, 100);
            player.fitness = clamp(n(player.fitness ?? 80) - summary.matchesPlayed * 2, 0, 100);
        } else {
            player.fitness = clamp(n(player.fitness ?? 80) + 20, 0, 100);
        }

        const finance = EconomyManager.processBlockFinances(state, summary);
        const european = CompetitionSystem.recordEuropeanResults?.(state, scheduled, results) || null;
        return {
            results,
            summary: {
                ...summary,
                blockPlan: plan,
                scheduledMatches: scheduled,
                matchResults: results,
                finance,
                european
            }
        };
    }
}

export default SimulatedMatchSystem;
