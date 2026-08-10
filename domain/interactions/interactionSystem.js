// domain/interactions/interactionSystem.js
// Façade de transition pour les décisions qui étaient directement portées
// par GameEngine. Les règles restent dans les systèmes historiques pendant
// la migration.

export class InteractionSystem {
    constructor({
        eventEngine,
        coachSystem,
        mediaSystem,
        playerLogic,
        careerSystem,
        stateManager
    } = {}) {
        Object.assign(this, {
            eventEngine,
            coachSystem,
            mediaSystem,
            playerLogic,
            careerSystem,
            stateManager
        });
    }

    resolveEventChoice(state, choiceIndex) {
        if (!state?.pendingEvent) return null;
        const event = state.pendingEvent;
        const result = this.eventEngine.resolveChoice(state, event.id, choiceIndex);
        state.pendingEvent = null;
        this.playerLogic.syncProgressionFromCanonical(state.player);
        this.stateManager.save(state);
        return result;
    }

    resolveCoachChoice(state, choiceIndex) {
        if (!state?.pendingCoachEvent) return null;
        const event = state.pendingCoachEvent;
        const result = this.coachSystem.resolveCoachChoice(state, choiceIndex, event);
        state.pendingCoachEvent = null;
        this.playerLogic.syncProgressionFromCanonical(state.player);
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
        const result = this.careerSystem.applyPositionChange(
            state.player,
            Boolean(accepted),
            proposal
        );
        state.pendingPositionProposal = null;
        state.careerStructure = state.player.careerProfile || null;
        this.playerLogic.syncProgressionFromCanonical(state.player);
        this.stateManager.save(state);
        return result;
    }
}

export default InteractionSystem;
