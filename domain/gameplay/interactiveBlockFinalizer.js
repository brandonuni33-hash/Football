// domain/gameplay/interactiveBlockFinalizer.js
// Finalise un bloc après une séquence de matchs joués décision par décision.
// IMPORTANT : les résultats interactifs sont déjà résolus par InteractiveMatchController.
// On ne les rejoue/recalibre jamais ici : cela créerait un second jet aléatoire
// et des statistiques de bloc différentes des statistiques réellement vécues.
import { TrainingManager } from '../training/trainingManager.js';
import { EconomyManager } from '../economy/economySystem.js';

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;

export function finalizeInteractiveBlock(state, results = [], trainingFocus = 'TECHNIQUE') {
    const player = state.player;
    const matches = (Array.isArray(results) ? results : []).filter(Boolean).map((result, index) => ({
        ...result,
        matchIndex: Number.isFinite(Number(result.matchIndex)) ? Number(result.matchIndex) : index,
        fixture: result.fixture || result.match || null
    }));

    const count = matches.length;
    const avgRating = count
        ? Number((matches.reduce((sum, result) => sum + n(result.rating), 0) / count).toFixed(1))
        : 0;
    const goals = matches.reduce((sum, result) => sum + n(result.goals), 0);
    const assists = matches.reduce((sum, result) => sum + n(result.assists), 0);
    const tackles = matches.reduce((sum, result) => sum + n(result.tackles), 0);
    const cleanSheets = matches.reduce((sum, result) => sum + (result.cleanSheet ? 1 : 0), 0);
    const passes = matches.reduce((sum, result) => sum + n(result.successfulPasses), 0);
    const yellowCards = matches.reduce((sum, result) => sum + n(result.yellowCards), 0);

    // Reconstitue les fixtures réellement joués afin que WorldSystem puisse
    // mettre à jour le classement sans dépendre d'un nouveau tirage.
    const scheduledMatches = matches
        .map(result => result.fixture)
        .filter(fixture => fixture && (fixture.type || fixture.competitionId || fixture.leagueId));

    const summary = {
        rating: avgRating,
        goals,
        assists,
        passes,
        tackles,
        cleanSheets,
        yellowCards,
        matchesPlayed: count,
        injured: Boolean(player.isInjured),
        matchResults: matches,
        scheduledMatches
    };

    const training = TrainingManager.applyTraining
        ? TrainingManager.applyTraining(player, trainingFocus)
        : null;
    const finance = EconomyManager.processBlockFinances(state, summary);

    player.morale = Math.max(
        0,
        Math.min(100, n(player.morale ?? 50) + (avgRating >= 7 ? 5 : avgRating < 5.5 && count ? -3 : 0))
    );
    player.fitness = Math.max(0, Math.min(100, n(player.fitness ?? 80) - count * 2));

    return {
        results: matches,
        summary: { ...summary, training, finance }
    };
}
