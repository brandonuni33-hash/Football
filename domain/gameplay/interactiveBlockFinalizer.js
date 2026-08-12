// domain/gameplay/interactiveBlockFinalizer.js
// Finalise un bloc après une séquence de matchs joués décision par décision.
// Les résultats interactifs sont déjà résolus : aucun second jet de match ici.
import { TrainingManager } from '../training/trainingManager.js';
import { EconomyManager } from '../economy/economySystem.js';
import { ConsequenceSystem } from '../decision/consequenceSystem.js';
import { CompetitionSystem } from '../competition/competitionSystem.js';
import CupSystem from '../competition/cupSystem.js';
import { updateHiddenAttributes } from '../match/blockMatchSimulator.js';
import { canonicalPlayerGoalEvents } from '../match/goalEventResolver.js';
import { buildInteractiveMatchReport } from '../match/interactiveMatchReport.js';
import { buildMatchBlockPresentation } from '../match/matchBlockPresentation.js';

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;

export function finalizeInteractiveBlock(state, results = [], trainingFocus = 'TECHNIQUE') {
    const player = state.player;
    const matches = (Array.isArray(results) ? results : []).filter(Boolean).map((raw, index) => {
        const result = {
            ...raw,
            matchIndex: Number.isFinite(Number(raw.matchIndex)) ? Number(raw.matchIndex) : index,
            fixture: raw.fixture || raw.match || null
        };
        if (result.interactive && result.matchId) {
            result.goalEvents = Array.isArray(result.goalEvents) && result.goalEvents.length
                ? result.goalEvents
                : canonicalPlayerGoalEvents(result, player);
            result.interactiveReport ||= buildInteractiveMatchReport(result);
        }
        return result;
    });
    const count = matches.length;
    const avgRating = count ? Number((matches.reduce((sum, result) => sum + n(result.rating), 0) / count).toFixed(1)) : 0;
    const goals = matches.reduce((sum, result) => sum + n(result.goals), 0);
    const assists = matches.reduce((sum, result) => sum + n(result.assists), 0);
    const tackles = matches.reduce((sum, result) => sum + n(result.tackles), 0);
    const cleanSheets = matches.reduce((sum, result) => sum + (result.cleanSheet ? 1 : 0), 0);
    const passes = matches.reduce((sum, result) => sum + n(result.successfulPasses), 0);
    const yellowCards = matches.reduce((sum, result) => sum + n(result.yellowCards), 0);
    const scheduledMatches = matches.map(result => result.fixture).filter(fixture => fixture && (fixture.type || fixture.competitionId || fixture.leagueId));
    const presentation = buildMatchBlockPresentation(matches);

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
        scheduledMatches,
        presentation
    };

    // Same block-level hooks as the simulated path, without regenerating a performance.
    // Morale and fitness are already committed per match by commitInteractiveResult().
    updateHiddenAttributes(player, summary);
    const expiredEffects = ConsequenceSystem.advanceMatch(player);
    let cupResult = null;
    const cupMatchIndex = scheduledMatches.findIndex(match => match.competitionType === 'national_cup');
    if (cupMatchIndex >= 0) {
        const cupMatch = scheduledMatches[cupMatchIndex];
        const result = matches.find(item => item.fixture?.id === cupMatch.id) || matches.find(item => Number(item.matchIndex) === Number(cupMatchIndex)) || {};
        cupResult = CupSystem.resolvePlayerMatch(state, cupMatch, result);
        CupSystem.simulateCurrentRound(state);
    } else {
        const cup = CupSystem.getCup(state);
        if (cup && cup.status === 'active' && Number(cup.roundMonth) === Number(state.calendar?.currentMonth) && cup.matches?.length) CupSystem.simulateCurrentRound(state);
    }
    const europeanStatus = CompetitionSystem.recordEuropeanResults(state, scheduledMatches, matches);

    const training = TrainingManager.applyTraining ? TrainingManager.applyTraining(player, trainingFocus) : null;
    const finance = EconomyManager.processBlockFinances(state, summary);

    return {
        results: matches,
        presentation,
        summary: { ...summary, training, finance, expiredEffects, cupResult, cup: CupSystem.getSummary(state), european: europeanStatus }
    };
}
