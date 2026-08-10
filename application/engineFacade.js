// application/engineFacade.js
// Compatibilité de transition entre l'ancienne API GameEngine et la nouvelle
// architecture applicative. L'UI conserve son API historique pendant que les
// implémentations métier sont déplacées hors du moteur.

export function bindEngineToRegistry(engine, registry) {
    if (!engine || !registry) {
        throw new Error('bindEngineToRegistry requires an engine and a registry.');
    }

    const legacy = {};

    engine.startCareer = (selectedData = {}) => {
        const career = registry.careerApplication;
        if (!career?.create) throw new Error('CareerApplication is not registered.');
        const state = career.create(selectedData);
        engine.state = state;
        return state;
    };

    engine.playBlock = (selectedChoice = null) => {
        const blockSystem = registry.blockSystem;
        if (!blockSystem?.execute) throw new Error('BlockSystem is not registered.');
        return blockSystem.execute(engine.state, selectedChoice);
    };

    engine.advanceCalendar = () => {
        const calendarSystem = registry.calendarSystem;
        if (!calendarSystem?.advance) throw new Error('CalendarSystem is not registered.');
        return calendarSystem.advance(engine.state);
    };

    engine.getPeriodName = (month) => registry.calendarSystem.getPeriodName(month);

    engine.setTrainingFocus = (focusKey) => {
        const training = registry.trainingSystem;
        if (!training?.isValidFocus?.(focusKey) || !engine.state?.player) return false;
        engine.state.trainingFocus = focusKey;
        registry.blockSystem.stateManager.save(engine.state);
        return true;
    };

    engine.resolveEventChoice = (choiceIndex) =>
        registry.interactionSystem.resolveEventChoice(engine.state, choiceIndex);

    engine.resolveCoachChoice = (choiceIndex) =>
        registry.interactionSystem.resolveCoachChoice(engine.state, choiceIndex);

    engine.resolveMediaDilemma = (choiceIndex) =>
        registry.interactionSystem.resolveMediaChoice(engine.state, choiceIndex);

    engine.resolvePositionProposal = (accepted) =>
        registry.interactionSystem.resolvePositionProposal(engine.state, accepted);

    engine.acceptTransferOffer = () => registry.transferSystem.accept(engine.state);

    engine.rejectTransferOffer = () => registry.transferSystem.reject(engine.state);

    engine.retireCareer = () => registry.careerLifecycleSystem.retire(engine.state);

    engine.resetCareer = () => {
        const result = registry.careerLifecycleSystem.reset();
        engine.state = null;

        // Cette remise à zéro de navigation reste la seule partie UI de la
        // façade de compatibilité. Elle sera déplacée lorsque l'UI passera
        // entièrement par ses propres commandes applicatives.
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
        phase: 5,
        delegated: [
            'startCareer', 'playBlock', 'advanceCalendar', 'getPeriodName',
            'setTrainingFocus', 'resolveEventChoice', 'resolveCoachChoice',
            'resolveMediaDilemma', 'resolvePositionProposal',
            'acceptTransferOffer', 'rejectTransferOffer', 'retireCareer', 'resetCareer'
        ]
    });

    return engine;
}

export default bindEngineToRegistry;
