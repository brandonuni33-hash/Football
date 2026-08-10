// application/engineFacade.js
// Compatibilité de transition entre l'ancienne API GameEngine et la nouvelle
// architecture applicative. L'UI conserve son API historique pendant que les
// implémentations métier sont déplacées hors du moteur.

export function bindEngineToRegistry(engine, registry) {
    if (!engine || !registry) {
        throw new Error('bindEngineToRegistry requires an engine and a registry.');
    }

    const legacy = {
        startCareer: engine.startCareer?.bind(engine),
        playBlock: engine.playBlock?.bind(engine),
        advanceCalendar: engine.advanceCalendar?.bind(engine),
        getPeriodName: engine.getPeriodName?.bind(engine),
        setTrainingFocus: engine.setTrainingFocus?.bind(engine),
        resolveEventChoice: engine.resolveEventChoice?.bind(engine),
        resolveCoachChoice: engine.resolveCoachChoice?.bind(engine),
        resolveMediaDilemma: engine.resolveMediaDilemma?.bind(engine),
        resolvePositionProposal: engine.resolvePositionProposal?.bind(engine),
        acceptTransferOffer: engine.acceptTransferOffer?.bind(engine),
        rejectTransferOffer: engine.rejectTransferOffer?.bind(engine),
        retireCareer: engine.retireCareer?.bind(engine),
        resetCareer: engine.resetCareer?.bind(engine)
    };

    engine.startCareer = (selectedData = {}) => {
        const career = registry.careerApplication;
        if (!career?.create) return legacy.startCareer?.(selectedData) ?? null;
        const state = career.create(selectedData);
        engine.state = state;
        return state;
    };

    engine.playBlock = (selectedChoice = null) => {
        const blockSystem = registry.blockSystem;
        if (!blockSystem?.execute) return legacy.playBlock?.(selectedChoice) ?? null;
        return blockSystem.execute(engine.state, selectedChoice);
    };

    engine.advanceCalendar = () => {
        const calendarSystem = registry.calendarSystem;
        if (!calendarSystem?.advance) return legacy.advanceCalendar?.() ?? null;
        return calendarSystem.advance(engine.state);
    };

    engine.getPeriodName = (month) => {
        const calendarSystem = registry.calendarSystem;
        if (!calendarSystem?.getPeriodName) return legacy.getPeriodName?.(month) ?? '';
        return calendarSystem.getPeriodName(month);
    };

    engine.setTrainingFocus = (focusKey) => {
        const training = registry.trainingSystem;
        if (!training?.isValidFocus?.(focusKey)) return legacy.setTrainingFocus?.(focusKey) ?? false;
        if (!engine.state?.player) return false;
        engine.state.trainingFocus = focusKey;
        registry.blockSystem?.stateManager?.save?.(engine.state);
        return true;
    };

    engine.resolveEventChoice = (choiceIndex) => {
        const interactions = registry.interactionSystem;
        if (!interactions?.resolveEventChoice) return legacy.resolveEventChoice?.(choiceIndex) ?? null;
        return interactions.resolveEventChoice(engine.state, choiceIndex);
    };

    engine.resolveCoachChoice = (choiceIndex) => {
        const interactions = registry.interactionSystem;
        if (!interactions?.resolveCoachChoice) return legacy.resolveCoachChoice?.(choiceIndex) ?? null;
        return interactions.resolveCoachChoice(engine.state, choiceIndex);
    };

    engine.resolveMediaDilemma = (choiceIndex) => {
        const interactions = registry.interactionSystem;
        if (!interactions?.resolveMediaChoice) return legacy.resolveMediaDilemma?.(choiceIndex) ?? null;
        return interactions.resolveMediaChoice(engine.state, choiceIndex);
    };

    engine.resolvePositionProposal = (accepted) => {
        const interactions = registry.interactionSystem;
        if (!interactions?.resolvePositionProposal) return legacy.resolvePositionProposal?.(accepted) ?? false;
        return interactions.resolvePositionProposal(engine.state, accepted);
    };

    engine.acceptTransferOffer = () => {
        const transfer = registry.transferSystem;
        if (!transfer?.accept) return legacy.acceptTransferOffer?.() ?? null;
        return transfer.accept(engine.state);
    };

    engine.rejectTransferOffer = () => {
        const transfer = registry.transferSystem;
        if (!transfer?.reject) return legacy.rejectTransferOffer?.() ?? false;
        return transfer.reject(engine.state);
    };

    engine.retireCareer = () => {
        const lifecycle = registry.careerLifecycleSystem;
        if (!lifecycle?.retire) return legacy.retireCareer?.() ?? null;
        return lifecycle.retire(engine.state);
    };

    engine.resetCareer = () => {
        const lifecycle = registry.careerLifecycleSystem;
        if (!lifecycle?.reset) return legacy.resetCareer?.() ?? null;
        const result = lifecycle.reset();
        engine.state = null;
        if (engine.ui) {
            engine.ui.activeApp = 'home';
            engine.ui.currentStep = 1;
            engine.ui.selectedData = {
                firstname: '',
                lastname: '',
                position: null,
                continent: null,
                country: null,
                origin: null,
                heartClub: null,
                youthClub: null,
                coachVision: null,
                coachName: null
            };
            engine.ui.render?.();
        }
        return result;
    };

    engine.__architecture = Object.freeze({
        phase: 5,
        delegated: [
            'startCareer',
            'playBlock',
            'advanceCalendar',
            'getPeriodName',
            'setTrainingFocus',
            'resolveEventChoice',
            'resolveCoachChoice',
            'resolveMediaDilemma',
            'resolvePositionProposal',
            'acceptTransferOffer',
            'rejectTransferOffer',
            'retireCareer',
            'resetCareer'
        ]
    });

    return engine;
}

export default bindEngineToRegistry;
