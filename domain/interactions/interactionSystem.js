// domain/interactions/interactionSystem.js
// Façade de transition pour les décisions qui étaient directement portées
// par GameEngine. Les règles restent dans les systèmes historiques pendant
// la migration.

import { eventResponse } from '../career/careerEventNarrativeLibrary.js';

export class InteractionSystem {
    constructor({ eventEngine, coachSystem, mediaSystem, playerLogic, careerSystem, stateManager } = {}) {
        Object.assign(this, { eventEngine, coachSystem, mediaSystem, playerLogic, careerSystem, stateManager });
    }

    resolveEventChoice(state, choiceIndex) {
        if (!state?.pendingEvent) return null;
        const event = state.pendingEvent;
        const choices = event.choices || event.choix || [];
        const choice = choices[Number(choiceIndex)] || null;
        const result = this.eventEngine.resolveChoice(state, event.id, choiceIndex);
        state.pendingEvent = null;
        this.playerLogic.ensure(state.player);
        this.stateManager.save(state);
        if (!result) return result;
        return {
            ...result,
            responseText: eventResponse(choice, result.responseText || result.immediateReaction || ''),
            eventTitle: event.title || event.titre || null,
            choiceText: choice?.text || choice?.texte || result.choiceText || null
        };
    }

    resolveCoachChoice(state, choiceIndex) {
        if (!state?.pendingCoachEvent) return null;
        const event = state.pendingCoachEvent;
        const result = this.coachSystem.resolveCoachChoice(state, choiceIndex, event);
        state.pendingCoachEvent = null;
        this.playerLogic.ensure(state.player);
        this.stateManager.save(state);
        return result;
    }

    resolveMediaChoice(state, choiceIndex) {
        if (!state?.media?.recentDilemma) return null;
        const result = this.mediaSystem.resolveDilemma(state, choiceIndex);
        this.stateManager.save(state);
        return result;
    }

    resolvePositionProposal(state, accepted) {
        const proposal = state?.pendingPositionProposal;
        if (!proposal) return false;
        const result = this.careerSystem.applyPositionChange(state.player, Boolean(accepted), proposal);
        state.pendingPositionProposal = null;
        state.careerStructure = state.player.careerProfile || null;
        this.playerLogic.ensure(state.player);
        this.stateManager.save(state);
        return result;
    }
}

export default InteractionSystem;
