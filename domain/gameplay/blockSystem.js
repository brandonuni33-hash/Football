// domain/gameplay/blockSystem.js
// Orchestrateur du bloc de carrière.

import { EventBus } from '../../core/eventBus.js';
import { EVENTS } from '../../core/events.js';
import { finalizeInteractiveBlock } from './interactiveBlockFinalizer.js';

export class BlockSystem {
    constructor({ trainingManager, matchBlockManager, worldSystem, socialSystem, mediaSystem, eventEngine, coachSystem, careerSystem, transferMarket, transferSystem = null, stateManager, familyLifeSystem = null, consequenceSystem = null, advanceCalendar } = {}) {
        Object.assign(this, { trainingManager, matchBlockManager, worldSystem, socialSystem, mediaSystem, eventEngine, coachSystem, careerSystem, transferMarket, transferSystem, stateManager, familyLifeSystem, consequenceSystem, advanceCalendar });
    }

    execute(state, selectedChoice = null) {
        if (!state?.player) return null;
        EventBus.emit(EVENTS.GAME_BLOCK_STARTED, { state, playerId: state.player.id });
        try {
            const player = state.player;
            const revealedConsequences = this.consequenceSystem?.resolvePending?.(state, 'block_start') || [];

            if (player.retired || player.careerEnded || Number(player.age) >= 42) {
                player.careerEnded = true;
                const result = { careerEnded: true, revealedConsequences, report: { summary: { rating: 0, goals: 0, assists: 0, passes: 0, tackles: 0, yellowCards: 0, finance: null } } };
                EventBus.emit(EVENTS.CAREER_ENDED, { reason: 'age_or_retirement', playerId: player.id, state });
                return result;
            }

            if (player.isInjured) {
                if (player.injuryDuration > 0) player.injuryDuration--;
                player.fitness = Math.min(100, (player.fitness || 50) + 12);
                if (player.injuryDuration <= 0) {
                    player.isInjured = false;
                    player.injuryDuration = 0;
                    EventBus.emit(EVENTS.PLAYER_RECOVERED, { playerId: player.id, state });
                }
                delete state.matchInteractionPlan;
                delete state.activeMatchSession;
                delete state.interactiveBlockResults;
                const calendar = this.advanceCalendar(state);
                this.stateManager.save(state);
                const result = { recoveryOnly: true, revealedConsequences, report: { summary: { rating: 0, goals: 0, assists: 0, passes: 0, tackles: 0, yellowCards: 0, finance: null } }, calendar, event: null, coachEvent: null, familyBirths: [] };
                EventBus.emit(EVENTS.GAME_BLOCK_COMPLETED, { state, playerId: player.id, result });
                return result;
            }

            const interactiveResults = Array.isArray(state.interactiveBlockResults) ? state.interactiveBlockResults.filter(Boolean) : [];
            const hasInteractiveMatches = interactiveResults.length > 0;
            const trainingReport = hasInteractiveMatches ? null : this.trainingManager.applyTraining(player, state.trainingFocus);

            let report;
            if (hasInteractiveMatches) {
                const remainder = this.matchBlockManager.simulateRemainingMatches?.(state, interactiveResults) || { results: [] };
                const combinedResults = [...interactiveResults, ...(remainder.results || [])]
                    .sort((a, b) => Number(a?.matchIndex ?? 0) - Number(b?.matchIndex ?? 0));
                report = finalizeInteractiveBlock(state, combinedResults, state.trainingFocus);
            } else {
                report = this.matchBlockManager.simulateBlock(state, state.trainingFocus, selectedChoice);
            }

            delete state.interactiveBlockResults;
            delete state.activeMatchSession;
            delete state.matchInteractionPlan;

            this.worldSystem.recordPlayerMatches(state, report.summary?.scheduledMatches || [], report.summary || {});
            this.socialSystem.updateSocialCycle(state);
            if (typeof this.mediaSystem.generatePostAfterBlock === 'function') this.mediaSystem.generatePostAfterBlock(state, report.summary);
            state.pendingEvent = this.eventEngine.checkAndTriggerEvent(state);
            state.pendingCoachEvent = state.pendingEvent ? null : this.coachSystem.checkCoachInteraction(state);
            this.careerSystem.refreshStage(player);
            const discoveredRole = this.careerSystem.detectRole(player);
            const positionProposal = this.careerSystem.evaluatePositionChange(player);
            state.pendingPositionProposal = positionProposal || null;
            state.pendingTransferOffer = null;
            if (!player.isInjured) {
                state.pendingTransferOffer = this.transferSystem?.generateOffer?.(state) || null;
            }
            const season = Number(state.calendar?.currentSeasonYear ?? state.season ?? state.career?.season ?? 1);
            const familyBirths = this.familyLifeSystem?.evaluateBirths?.({ state, player, season }) || [];
            const calendar = this.advanceCalendar(state);
            this.stateManager.save(state);
            const result = { report: { ...report, training: trainingReport }, revealedConsequences, calendar, event: state.pendingEvent, coachEvent: state.pendingCoachEvent, transferOffer: state.pendingTransferOffer, mediaDilemma: state.media?.recentDilemma || null, positionProposal: state.pendingPositionProposal, discoveredRole, familyBirths };
            EventBus.emit(EVENTS.GAME_BLOCK_COMPLETED, { state, playerId: player.id, result });
            return result;
        } catch (error) {
            EventBus.emit(EVENTS.GAME_BLOCK_COMPLETED, { state, error, failed: true });
            throw error;
        }
    }

    advanceCalendar(state) {
        if (typeof this.advanceCalendar !== 'function') throw new Error('BlockSystem requires an advanceCalendar handler');
        return this.advanceCalendar(state);
    }
}

export default BlockSystem;
