// domain/gameplay/interactiveBlockFinalizer.js
// Finalise un bloc après une séquence de matchs joués décision par décision.
import { TrainingManager } from '../../entrainement.js';
import { EconomyManager } from '../economy/economySystem.js';
import { recalibrateMatchResult } from '../match/matchPerformanceEngine.js';

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;

export function finalizeInteractiveBlock(state, results = [], trainingFocus = 'TECHNIQUE') {
    const player = state.player;
    const matches = (Array.isArray(results) ? results : []).map(result => recalibrateMatchResult(player, result, {
        opponentStrength: result?.opponentStrength ?? result?.opponentOverall ?? 55,
        important: result?.importance === 'important' || result?.importance === 'exceptional' || result?.type === 'final' || result?.type === 'rival'
    }));
    const count = matches.length;
    const avgRating = count ? Number((matches.reduce((s, r) => s + n(r.rating), 0) / count).toFixed(1)) : 0;
    const goals = matches.reduce((s, r) => s + n(r.goals), 0);
    const assists = matches.reduce((s, r) => s + n(r.assists), 0);
    const tackles = matches.reduce((s, r) => s + n(r.tackles), 0);
    const cleanSheets = matches.reduce((s, r) => s + (r.cleanSheet ? 1 : 0), 0);
    const passes = matches.reduce((s, r) => s + n(r.successfulPasses), 0);
    const yellowCards = 0;
    const summary = { rating: avgRating, goals, assists, passes, tackles, cleanSheets, yellowCards, matchesPlayed: count, injured: Boolean(player.isInjured) };
    const training = TrainingManager.applyTraining ? TrainingManager.applyTraining(player, trainingFocus) : null;
    const finance = EconomyManager.processBlockFinances(state, summary);
    player.morale = Math.max(0, Math.min(100, n(player.morale ?? 50) + (avgRating >= 7 ? 5 : avgRating < 5.5 && count ? -3 : 0)));
    player.fitness = Math.max(0, Math.min(100, n(player.fitness ?? 80) - count * 2));
    return { results: matches, summary: { rating: avgRating, goals, assists, passes, tackles, cleanSheets, yellowCards, matchesPlayed: count, injured: Boolean(player.isInjured), training, finance } };
}
