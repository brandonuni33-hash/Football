// application/handlers/gameplayHandlers.js
// Tous les handlers applicatifs migrés sont regroupés ici : aucune commande ne
// doit patcher GameEngine pour atteindre un système du domaine.

import { COMMANDS } from '../../core/commands.js';

export function registerGameplayHandlers({ application, registry, engine }) {
    const unregister = [];
    const blockSystem = registry?.blockSystem;
    const interactionSystem = registry?.interactionSystem;
    const trainingSystem = registry?.trainingSystem;
    const calendarSystem = registry?.calendarSystem;
    const transferSystem = registry?.transferSystem;
    const careerLifecycleSystem = registry?.careerLifecycleSystem;
    const careerApplication = registry?.careerApplication;

    if (!registry) return unregister;

    unregister.push(application.registerCommand(COMMANDS.START_GAME, (payload, context) => {
        const state = careerApplication?.create?.(payload || {});
        if (engine && state) engine.state = state;
        if (context) context.state = state;
        return state;
    }));

    unregister.push(application.registerCommand(COMMANDS.CAREER_CREATE, (payload, context) => {
        const state = careerApplication?.create?.(payload || {});
        if (engine && state) engine.state = state;
        if (context) context.state = state;
        return state;
    }));

    unregister.push(application.registerCommand(COMMANDS.START_BLOCK, (payload) =>
        blockSystem?.execute?.(engine?.state, payload?.selectedChoice ?? payload ?? null) ?? null
    ));

    unregister.push(application.registerCommand(COMMANDS.ADVANCE_CALENDAR, () => {
        const state = engine?.state;
        if (!state) return null;
        const result = calendarSystem?.advance?.(state) ?? null;
        registry.familySystem?.advanceSeason?.(state, state.calendar?.currentSeasonYear ?? state.season);
        return result;
    }));

    unregister.push(application.registerCommand(COMMANDS.SET_TRAINING_FOCUS, (payload) => {
        const focusKey = payload?.focusKey ?? payload;
        if (!engine?.state?.player || !trainingSystem?.isValidFocus?.(focusKey)) return false;
        engine.state.trainingFocus = focusKey;
        blockSystem?.stateManager?.save?.(engine.state);
        return true;
    }));

    unregister.push(application.registerCommand(COMMANDS.RESOLVE_EVENT_CHOICE, (payload) =>
        interactionSystem?.resolveEventChoice?.(engine?.state, payload?.choiceIndex ?? payload) ?? null
    ));

    unregister.push(application.registerCommand(COMMANDS.RESOLVE_COACH_CHOICE, (payload) =>
        interactionSystem?.resolveCoachChoice?.(engine?.state, payload?.choiceIndex ?? payload) ?? null
    ));

    unregister.push(application.registerCommand(COMMANDS.RESOLVE_MEDIA_CHOICE, (payload) =>
        interactionSystem?.resolveMediaChoice?.(engine?.state, payload?.choiceIndex ?? payload) ?? null
    ));

    unregister.push(application.registerCommand(COMMANDS.RESOLVE_POSITION_PROPOSAL, (payload) =>
        interactionSystem?.resolvePositionProposal?.(engine?.state, Boolean(payload?.accepted ?? payload)) ?? null
    ));

    unregister.push(application.registerCommand(COMMANDS.ACCEPT_TRANSFER, () =>
        transferSystem?.accept?.(engine?.state) ?? null
    ));

    unregister.push(application.registerCommand(COMMANDS.REJECT_TRANSFER, () =>
        transferSystem?.reject?.(engine?.state) ?? false
    ));

    unregister.push(application.registerCommand(COMMANDS.RETIRE, () =>
        careerLifecycleSystem?.retire?.(engine?.state) ?? null
    ));

    unregister.push(application.registerCommand(COMMANDS.RESET_CAREER, () => {
        const result = careerLifecycleSystem?.reset?.() ?? null;
        if (engine) engine.state = null;
        return result;
    }));

    return unregister;
}

export default registerGameplayHandlers;
