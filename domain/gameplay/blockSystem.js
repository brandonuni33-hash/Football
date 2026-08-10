// domain/gameplay/blockSystem.js
// Orchestrateur du bloc de carrière.
// Les règles historiques restent injectées pour permettre une migration sûre.

import { EventBus } from '../../core/eventBus.js';
import { EVENTS } from '../../core/events.js';

export class BlockSystem {
    constructor({
        trainingManager,
        matchBlockManager,
        worldSystem,
        socialSystem,
        mediaSystem,
        eventEngine,
        coachSystem,
        careerSystem,
        transferMarket,
        stateManager,
        familyLifeSystem = null,
        advanceCalendar
    } = {}) {
        Object.assign(this, {
            trainingManager,
            matchBlockManager,
            worldSystem,
            socialSystem,
            mediaSystem,
            eventEngine,
            coachSystem,
            careerSystem,
            transferMarket,
            stateManager,
            familyLifeSystem,
            advanceCalendar
        });
    }

    execute(state, selectedChoice = null) {
        if (!state?.player) return null;
        EventBus.emit(EVENTS.GAME_BLOCK_STARTED, { state, playerId: state.player.id });

        try {
            const player = state.player;
            if (player.retired || player.careerEnded || Number(player.age) >= 42) {
                player.careerEnded = true;
                const result = { careerEnded: true, report: { summary: { rating: 0, goals: 0, assists: 0, passes: 0, tackles: 0, yellowCards: 0, finance: null } } };
                EventBus.emit(EVENTS.CAREER_ENDED, { reason: 'age_or_retirement', playerId: player.id });
                return result;
            }

            if (player.isInjured) {
                if (player.injuryDuration > 0) player.injuryDuration--;
                player.fitness = Math.min(100, (player.fitness || 50) + 12);
                if (player.injuryDuration <= 0) {
                    player.isInjured = false;
                    player.injuryDuration = 0;
                    EventBus.emit(EVENTS.PLAYER_RECOVERED, { playerId: player.id });
                }
                const calendar = this.advanceCalendar(state);
                this.stateManager.save(state);
                const result = { recoveryOnly: true, report: { summary: { rating: 0, goals: 0, assists: 0, passes: 0, tackles: 0, yellowCards: 0, finance: null } }, calendar, event: null, coachEvent: null, familyBirths: [] };
                EventBus.emit(EVENTS.GAME_BLOCK_COMPLETED, { state, playerId: player.id, result });
                return result;
            }

            const trainingReport = this.trainingManager.applyTraining(player, state.trainingFocus);
            const report = this.matchBlockManager.simulateBlock(state, state.trainingFocus, selectedChoice);

            this.worldSystem.recordPlayerMatches(state, report.summary?.scheduledMatches || [], report.summary || {});
            this.socialSystem.updateSocialCycle(state);
            if (typeof this.mediaSystem.generatePostAfterBlock === 'function') {
                this.mediaSystem.generatePostAfterBlock(state, report.summary);
            }

            state.pendingEvent = this.eventEngine.checkAndTriggerEvent(state);
            state.pendingCoachEvent = state.pendingEvent ? null : this.coachSystem.checkCoachInteraction(state);

            this.careerSystem.refreshStage(player);
            const discoveredRole = this.careerSystem.detectRole(player);
            const positionProposal = this.careerSystem.evaluatePositionChange(player);
            state.pendingPositionProposal = positionProposal || null;

            state.pendingTransferOffer = null;
            if (!player.isInjured) {
                if (player.age < 22) state.pendingTransferOffer = this.careerSystem.recruitmentOffer(player);
                if (!state.pendingTransferOffer && player.age >= 18 && Math.random() < 0.08) {
                    state.pendingTransferOffer = this.transferMarket.generateTransferOffer(player);
                }
            }

            // La naissance est un fait familial, pas un événement arbitraire de bloc.
            // Une seule vérification par saison est assurée par FamilyLifeSystem.
            const season = Number(
                state.calendar?.currentSeasonYear ??
                state.season ??
                state.career?.season ??
                1
            );
            const familyBirths = this.familyLifeSystem?.evaluateBirths?.({
                state,
                player,
                season
            }) || [];

            // Les naissances récentes alimentent une notification persistante,
            // consommable par le Dashboard sans créer une seconde UI.
            if (familyBirths.length) {
                state.notifications ||= [];
                for (const birth of familyBirths) {
                    const child = birth.child;
                    state.notifications.push({
                        id: `birth_${child.id}`,
                        type: 'family',
                        kind: 'child_born',
                        title: 'Une naissance dans votre famille',
                        message: `${child.firstName} est né(e).`,
                        childId: child.id,
                        createdAt: child.createdAt,
                        unread: true
                    });
                }
            }

            const calendar = this.advanceCalendar(state);
            this.stateManager.save(state);

            const result = {
                report: { ...report, training: trainingReport },
                calendar,
                event: state.pendingEvent,
                coachEvent: state.pendingCoachEvent,
                transferOffer: state.pendingTransferOffer,
                mediaDilemma: state.media?.recentDilemma || null,
                positionProposal: state.pendingPositionProposal,
                discoveredRole,
                familyBirths
            };
            EventBus.emit(EVENTS.GAME_BLOCK_COMPLETED, { state, playerId: player.id, result });
            return result;
        } catch (error) {
            EventBus.emit(EVENTS.GAME_BLOCK_COMPLETED, { state, error, failed: true });
            throw error;
        }
    }

    advanceCalendar(state) {
        if (typeof this.advanceCalendar !== 'function') {
            throw new Error('BlockSystem requires an advanceCalendar handler');
        }
        return this.advanceCalendar(state);
    }
}

export default BlockSystem;
