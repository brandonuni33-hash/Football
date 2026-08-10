// application/engineFacade.js
// Compatibilité de transition entre l'ancienne API GameEngine et la nouvelle
// architecture applicative.

export function bindEngineToRegistry(engine, registry) {
    if (!engine || !registry) throw new Error('bindEngineToRegistry requires an engine and a registry.');

    engine.startCareer = (selectedData = {}) => {
        const state = registry.careerApplication.create(selectedData);
        engine.state = state;
        return state;
    };
    engine.playBlock = (selectedChoice = null) => registry.blockSystem.execute(engine.state, selectedChoice);
    engine.advanceCalendar = () => {
        const result = registry.calendarSystem.advance(engine.state);
        // L'âge des enfants évolue avec la saison, sans créer une seconde source de vérité.
        registry.familySystem?.advanceSeason?.(
            engine.state,
            engine.state?.calendar?.currentSeasonYear ?? engine.state?.season
        );
        return result;
    };
    engine.getPeriodName = (month) => registry.calendarSystem.getPeriodName(month);

    engine.setTrainingFocus = (focusKey) => {
        const training = registry.trainingSystem;
        if (!training?.isValidFocus?.(focusKey) || !engine.state?.player) return false;
        engine.state.trainingFocus = focusKey;
        registry.blockSystem.stateManager.save(engine.state);
        return true;
    };

    engine.resolveEventChoice = (choiceIndex) => registry.interactionSystem.resolveEventChoice(engine.state, choiceIndex);
    engine.resolveCoachChoice = (choiceIndex) => registry.interactionSystem.resolveCoachChoice(engine.state, choiceIndex);
    engine.resolveMediaDilemma = (choiceIndex) => registry.interactionSystem.resolveMediaChoice(engine.state, choiceIndex);
    engine.resolvePositionProposal = (accepted) => registry.interactionSystem.resolvePositionProposal(engine.state, accepted);
    engine.acceptTransferOffer = () => registry.transferSystem.accept(engine.state);
    engine.rejectTransferOffer = () => registry.transferSystem.reject(engine.state);
    engine.retireCareer = () => registry.careerLifecycleSystem.retire(engine.state);

    // ─────────────────────────────────────────────────────────────
    // Famille / deuxième génération
    // Une seule API publique pour que l'UI ne connaisse pas les détails
    // des systèmes familiaux.
    // ─────────────────────────────────────────────────────────────
    engine.registerChildBirth = ({ firstName, gender, birthSeason, birthDate = null } = {}) => {
        if (!engine.state?.player?.id) return null;
        return registry.familySystem.registerBirth({
            state: engine.state,
            parentPlayerId: engine.state.player.id,
            firstName,
            gender,
            birthSeason,
            birthDate
        });
    };

    engine.getChildren = () => {
        if (!engine.state?.player?.id) return [];
        return registry.familySystem.getChildren(engine.state, engine.state.player.id);
    };

    engine.getSuccessorOptions = () => {
        if (!engine.state?.player?.id) return [];
        return registry.generationSimulationFacade.getOptions({
            state: engine.state,
            playerId: engine.state.player.id,
            currentAge: engine.state.player.age
        });
    };

    engine.simulateSuccessorTo14 = (childId) => {
        if (!engine.state?.player?.id) return null;
        return registry.generationSimulationFacade.simulateTo14({
            state: engine.state,
            playerId: engine.state.player.id,
            childId,
            currentAge: engine.state.player.age,
            world: engine.state.world || {}
        });
    };

    engine.startSuccessorCareer = (childId) => {
        if (!engine.state?.player?.id) return null;
        return registry.generationSimulationFacade.startIfReady({
            state: engine.state,
            playerId: engine.state.player.id,
            childId,
            currentAge: engine.state.player.age,
            world: engine.state.world || {}
        });
    };

    engine.resetCareer = () => {
        const result = registry.careerLifecycleSystem.reset();
        engine.state = null;
        if (engine.ui) {
            engine.ui.activeApp = 'home';
            engine.ui.currentStep = 1;
            engine.ui.selectedData = {
                firstname: '', lastname: '', position: null, continent: null,
                country: null, origin: null, heartClub: null, youthClub: null,
                coachVision: null, coachName: null
            };
            engine.ui.render?.();
        }
        return result;
    };

    engine.__architecture = Object.freeze({
        phase: 6,
        delegated: [
            'startCareer', 'playBlock', 'advanceCalendar', 'getPeriodName',
            'setTrainingFocus', 'resolveEventChoice', 'resolveCoachChoice',
            'resolveMediaDilemma', 'resolvePositionProposal', 'acceptTransferOffer',
            'rejectTransferOffer', 'retireCareer', 'resetCareer',
            'registerChildBirth', 'getChildren', 'getSuccessorOptions',
            'simulateSuccessorTo14', 'startSuccessorCareer'
        ]
    });

    return engine;
}

export default bindEngineToRegistry;
