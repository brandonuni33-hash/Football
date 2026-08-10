// application/engineFacade.js
// Compatibilité de transition entre l'ancienne API GameEngine et la nouvelle architecture applicative.

export function bindEngineToRegistry(engine, registry) {
    if (!engine || !registry) throw new Error('bindEngineToRegistry requires an engine and a registry.');

    engine.startCareer = (selectedData = {}) => { const state = registry.careerApplication.create(selectedData); engine.state = state; return state; };
    engine.playBlock = (selectedChoice = null) => registry.blockSystem.execute(engine.state, selectedChoice);
    engine.advanceCalendar = () => {
        const result = registry.calendarSystem.advance(engine.state);
        registry.familySystem?.advanceSeason?.(engine.state, engine.state?.calendar?.currentSeasonYear ?? engine.state?.season);
        return result;
    };
    engine.getPeriodName = (month) => registry.calendarSystem.getPeriodName(month);
    engine.setTrainingFocus = (focusKey) => { const training = registry.trainingSystem; if (!training?.isValidFocus?.(focusKey) || !engine.state?.player) return false; engine.state.trainingFocus = focusKey; registry.blockSystem.stateManager.save(engine.state); return true; };
    engine.resolveEventChoice = (choiceIndex) => registry.interactionSystem.resolveEventChoice(engine.state, choiceIndex);
    engine.resolveCoachChoice = (choiceIndex) => registry.interactionSystem.resolveCoachChoice(engine.state, choiceIndex);
    engine.resolveMediaDilemma = (choiceIndex) => registry.interactionSystem.resolveMediaChoice(engine.state, choiceIndex);
    engine.resolvePositionProposal = (accepted) => registry.interactionSystem.resolvePositionProposal(engine.state, accepted);
    engine.acceptTransferOffer = () => registry.transferSystem.accept(engine.state);
    engine.rejectTransferOffer = () => registry.transferSystem.reject(engine.state);
    engine.retireCareer = () => registry.careerLifecycleSystem.retire(engine.state);

    engine.startInteractiveMatch = (scheduledMatch, matchIndex = 0) => {
        const manager = registry.interactiveMatchSystem;
        if (!manager?.startInteractiveMatch) throw new Error('InteractiveMatchSystem indisponible.');
        const session = manager.startInteractiveMatch(engine.state, scheduledMatch, matchIndex);
        engine.state.activeMatchSession = session;
        return session;
    };
    engine.resolveInteractiveMatchDecision = (choiceIndex) => {
        const manager = registry.interactiveMatchSystem;
        const session = engine.state?.activeMatchSession;
        if (!manager?.resolveInteractiveDecision || !session) throw new Error('Aucun match interactif actif.');
        const result = manager.resolveInteractiveDecision(engine.state, session, choiceIndex);
        if (result.finished) {
            manager.commitInteractiveResult(engine.state, result.result);
            engine.state.interactiveBlockResults ||= [];
            engine.state.interactiveBlockResults.push(result.result);
            engine.state.activeMatchSession = null;
            registry.blockSystem.stateManager.save(engine.state);
        } else {
            engine.state.activeMatchSession = result.session;
        }
        return result;
    };
    engine.completeInteractiveBlock = () => {
        if (!engine.state?.interactiveBlockResults?.length) return null;
        return registry.blockSystem.execute(engine.state);
    };
    engine.getScheduledMatches = () => {
        try {
            const plan = registry.competitionSystem?.getBlockPlan?.(engine.state);
            return Array.isArray(plan?.scheduledMatches) ? plan.scheduledMatches : [];
        } catch { return []; }
    };

    engine.registerChildBirth = ({ firstName, gender, birthSeason, birthDate = null } = {}) => {
        if (!engine.state?.player?.id) return null;
        return registry.familySystem.registerBirth({ state: engine.state, parentPlayerId: engine.state.player.id, firstName, gender, birthSeason, birthDate });
    };
    engine.getChildren = () => !engine.state?.player?.id ? [] : registry.familySystem.getChildren(engine.state, engine.state.player.id);
    engine.getSuccessorOptions = () => !engine.state?.player?.id ? [] : registry.generationSimulationFacade.getOptions({ state: engine.state, playerId: engine.state.player.id, currentAge: engine.state.player.age });
    engine.simulateSuccessorTo14 = (childId) => !engine.state?.player?.id ? null : registry.generationSimulationFacade.simulateTo14({ state: engine.state, playerId: engine.state.player.id, childId, currentAge: engine.state.player.age, world: engine.state.world || {} });
    engine.startSuccessorCareer = (childId) => !engine.state?.player?.id ? null : registry.generationSimulationFacade.startIfReady({ state: engine.state, playerId: engine.state.player.id, childId, currentAge: engine.state.player.age, world: engine.state.world || {} });
    engine.resetCareer = () => { const result = registry.careerLifecycleSystem.reset(); engine.state = null; if (engine.ui) { engine.ui.activeApp = 'home'; engine.ui.currentStep = 1; engine.ui.selectedData = { firstname:'',lastname:'',position:null,continent:null,country:null,origin:null,heartClub:null,youthClub:null,coachVision:null,coachName:null }; engine.ui.render?.(); } return result; };

    engine.__architecture = Object.freeze({ phase: 7, delegated: ['startCareer','playBlock','advanceCalendar','getPeriodName','setTrainingFocus','resolveEventChoice','resolveCoachChoice','resolveMediaDilemma','resolvePositionProposal','acceptTransferOffer','rejectTransferOffer','retireCareer','startInteractiveMatch','resolveInteractiveMatchDecision','completeInteractiveBlock','getScheduledMatches','resetCareer','registerChildBirth','getChildren','getSuccessorOptions','simulateSuccessorTo14','startSuccessorCareer'] });
    return engine;
}

export default bindEngineToRegistry;
