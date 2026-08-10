// application/engineFacade.js
// Compatibilité de transition entre l'ancienne API GameEngine et la nouvelle
// architecture applicative. L'UI peut continuer à appeler game.startCareer(),
// game.playBlock() et game.advanceCalendar() pendant que les règles migrent.

export function bindEngineToRegistry(engine, registry) {
    if (!engine || !registry) {
        throw new Error('bindEngineToRegistry requires an engine and a registry.');
    }

    const legacyStartCareer = engine.startCareer?.bind(engine);
    const legacyPlayBlock = engine.playBlock?.bind(engine);
    const legacyAdvanceCalendar = engine.advanceCalendar?.bind(engine);

    engine.startCareer = (selectedData = {}) => {
        const career = registry.careerApplication;
        if (!career?.create) return legacyStartCareer?.(selectedData) ?? null;

        const state = career.create(selectedData);
        engine.state = state;
        return state;
    };

    engine.playBlock = (selectedChoice = null) => {
        const blockSystem = registry.blockSystem;
        if (!blockSystem?.execute) return legacyPlayBlock?.(selectedChoice) ?? null;
        return blockSystem.execute(engine.state, selectedChoice);
    };

    engine.advanceCalendar = () => {
        const calendarSystem = registry.calendarSystem;
        if (!calendarSystem?.advance) return legacyAdvanceCalendar?.() ?? null;
        return calendarSystem.advance(engine.state);
    };

    engine.__architecture = Object.freeze({
        phase: 2,
        delegated: ['startCareer', 'playBlock', 'advanceCalendar']
    });

    return engine;
}

export default bindEngineToRegistry;
