// application/engineFacade.js
// Compatibilité de transition entre l'ancienne API GameEngine et la nouvelle
// architecture applicative. L'UI conserve son API historique pendant que
// l'exécution migre vers les systèmes de domaine.

export function bindEngineToRegistry(engine, registry) {
    if (!engine || !registry) {
        throw new Error('bindEngineToRegistry requires an engine and a registry.');
    }

    const legacy = {
        startCareer: engine.startCareer?.bind(engine),
        playBlock: engine.playBlock?.bind(engine),
        advanceCalendar: engine.advanceCalendar?.bind(engine),
        resolveEventChoice: engine.resolveEventChoice?.bind(engine),
        resolveCoachChoice: engine.resolveCoachChoice?.bind(engine),
        resolveMediaDilemma: engine.resolveMediaDilemma?.bind(engine),
        resolvePositionProposal: engine.resolvePositionProposal?.bind(engine),
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

    engine.retireCareer = () => {
        const lifecycle = registry.careerLifecycleSystem;
        if (!lifecycle?.retire) return legacy.retireCareer?.() ?? null;
        return lifecycle.retire(engine.state, legacy.retireCareer);
    };

    engine.resetCareer = () => {
        const lifecycle = registry.careerLifecycleSystem;
        if (!lifecycle?.reset) return legacy.resetCareer?.() ?? null;
        return lifecycle.reset(legacy.resetCareer);
    };

    engine.__architecture = Object.freeze({
        phase: 3,
        delegated: [
            'startCareer',
            'playBlock',
            'advanceCalendar',
            'resolveEventChoice',
            'resolveCoachChoice',
            'resolveMediaDilemma',
            'resolvePositionProposal',
            'retireCareer',
            'resetCareer'
        ]
    });

    return engine;
}

export default bindEngineToRegistry;
