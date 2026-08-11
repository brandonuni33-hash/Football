// domain/match/simulatedMatchSystem.js
// Simulation canonique des matchs non interactifs.
import { evaluateMatch } from './matchPerformanceEngine.js';
import { PotentialSystem } from '../player/potentialSystem.js';
import { applyProgression } from '../player/playerSystem.js';
import CompetitionSystem from '../competition/competitionSystem.js';
import EconomyManager from '../economy/economySystem.js';
import SquadSelectionSystem from './squadSelectionSystem.js';

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
    const quality = clamp((performance?.performanceLevel || 0) + .55, -.2, 1.1);
    const base = .55 + quality * .85 + n(performance?.goals) * .35;
    return Math.min(5, Math.max(0, Math.floor(Math.random() * (base + 1))));
}
function commitPlayerResult(player, row) {
    if (!row?.playerPlayed) return;
    const stats = player.stats || (player.stats = {});
    const previous = n(stats.matchesPlayed);
    stats.matchesPlayed = previous + 1;
    stats.starts = n(stats.starts) + (row.started ? 1 : 0);
    stats.subAppearances = n(stats.subAppearances) + (row.started ? 0 : 1);
    stats.minutesPlayed = n(stats.minutesPlayed) + n(row.minutesPlayed);
    stats.goals = n(stats.goals) + n(row.goals);
    stats.assists = n(stats.assists) + n(row.assists);
    stats.tackles = n(stats.tackles) + n(row.tackles);
    stats.successfulPasses = n(stats.successfulPasses) + n(row.successfulPasses);
    if (row.cleanSheet) stats.cleanSheets = n(stats.cleanSheets) + 1;
    stats.averageRating = Number((((n(stats.averageRating) * previous) + n(row.rating)) / (previous + 1)).toFixed(1));
    PotentialSystem.recordMatch(player, { rating: row.rating, goals: row.goals, assists: row.assists, tackles: row.tackles }, 1);
    applyProgression(player, { rating: row.rating, goals: row.goals, assists: row.assists, type: 'match' });
}
function summarize(results = []) {
    const appearances = results.filter(row => row?.playerPlayed);
    const matches = appearances.length;
    const rating = matches ? Number((appearances.reduce((sum, row) => sum + n(row.rating), 0) / matches).toFixed(1)) : 0;
    return {
        rating,
        goals: appearances.reduce((sum, row) => sum + n(row.goals), 0),
        assists: appearances.reduce((sum, row) => sum + n(row.assists), 0),
        passes: appearances.reduce((sum, row) => sum + n(row.successfulPasses), 0),
        tackles: appearances.reduce((sum, row) => sum + n(row.tackles), 0),
        cleanSheets: appearances.reduce((sum, row) => sum + (row.cleanSheet ? 1 : 0), 0),
        yellowCards: 0,
        matchesPlayed: matches,
        starts: appearances.filter(row => row.started).length,
        subAppearances: appearances.filter(row => !row.started).length,
        matchesOnBench: results.filter(row => row?.appearance === 'bench').length,
        matchesOut: results.filter(row => row?.appearance === 'out').length,
        injured: false
    };
}

export class SimulatedMatchSystem {
    simulateMatches(state, fixtures = [], options = {}) {
        const player = state?.player;
        if (!player) throw new Error('SimulatedMatchSystem: joueur absent.');
        const scheduled = Array.isArray(fixtures) ? fixtures : [];
        const indices = Array.isArray(options.indices) ? options.indices : [];
        const selectionEntries = Array.isArray(options.selectionEntries) ? options.selectionEntries : [];
        const role = roleOf(player.position);
        const results = [];

        for (const [localIndex, match] of scheduled.entries()) {
            const matchIndex = Number.isFinite(Number(indices[localIndex])) ? Number(indices[localIndex]) : localIndex;
            const selection = selectionEntries.find(item => Number(item?.matchIndex) === matchIndex)
                || { appearance: 'starter', selected: true, started: true, minutes: 90 };
            const playerPlayed = Boolean(selection.selected);
            const minutes = playerPlayed ? Math.max(1, n(selection.minutes) || (selection.started ? 90 : 25)) : 0;
            const strength = n(match?.opponentStrength ?? match?.opponentOverall ?? 55) || 55;
            const important = ['important', 'major', 'exceptional'].includes(String(match?.importance || '').toLowerCase())
                || String(match?.phase || '').toLowerCase().includes('final')
                || String(match?.round || '').toLowerCase().includes('final');
            const performance = playerPlayed
                ? evaluateMatch(player, { opponentStrength: strength, opponentOverall: strength, important, minutes })
                : { performanceLevel: (n(player.overall) - strength) / 100, goals: 0, assists: 0, tackles: 0, interceptions: 0, successfulPasses: 0, passes: 0, shots: 0, shotsOnTarget: 0, duels: 0, duelsWon: 0, rating: null, expression: null };
            const home = typeof match?.home === 'boolean' ? match.home : match?.venue !== 'Extérieur';
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
                rating: playerPlayed ? performance.rating : null,
                goals: playerPlayed ? performance.goals : 0,
                assists: playerPlayed ? performance.assists : 0,
                tackles: playerPlayed ? performance.tackles : 0,
                interceptions: playerPlayed ? performance.interceptions : 0,
                successfulPasses: playerPlayed ? performance.successfulPasses : 0,
                passes: playerPlayed ? performance.passes : 0,
                cleanSheet: Boolean(playerPlayed && role === 'goalkeeper' && goalsAgainst === 0),
                shots: playerPlayed ? performance.shots : 0,
                shotsOnTarget: playerPlayed ? performance.shotsOnTarget : 0,
                duels: playerPlayed ? performance.duels : 0,
                duelsWon: playerPlayed ? performance.duelsWon : 0,
                expression: playerPlayed ? performance.expression : null,
                performanceLevel: playerPlayed ? performance.performanceLevel : null,
                played: true,
                playerPlayed,
                appearance: selection.appearance || (selection.started ? 'starter' : 'substitute'),
                started: Boolean(selection.started),
                minutesPlayed: minutes,
                squadStatus: state?.player?.squadStatus || null,
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
        const selectionPlan = SquadSelectionSystem.getPlan(state, scheduled);
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
            results: this.simulateMatches(state, remaining, { indices, selectionEntries: selectionPlan.entries })
        };
    }

    simulateBlock(state) {
        const player = state?.player;
        if (!player) throw new Error('SimulatedMatchSystem: joueur absent.');
        const plan = CompetitionSystem.getBlockPlan(state);
        const scheduled = Array.isArray(plan?.scheduledMatches) ? plan.scheduledMatches : [];
        const selectionPlan = SquadSelectionSystem.getPlan(state, scheduled);
        const results = this.simulateMatches(state, scheduled, { selectionEntries: selectionPlan.entries });
        const summary = summarize(results);

        if (summary.matchesPlayed) {
            player.morale = clamp(n(player.morale ?? 50) + (summary.rating >= 7 ? 3 : summary.rating < 5.8 ? -2 : 0), 0, 100);
            player.fitness = clamp(n(player.fitness ?? 80) - summary.matchesPlayed * 2, 0, 100);
        } else {
            player.fitness = clamp(n(player.fitness ?? 80) + 8, 0, 100);
        }

        const finance = EconomyManager.processBlockFinances(state, summary);
        const european = CompetitionSystem.recordEuropeanResults?.(state, scheduled, results) || null;
        return {
            results,
            summary: {
                ...summary,
                squadStatus: selectionPlan.status,
                squadStatusScore: selectionPlan.score,
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
