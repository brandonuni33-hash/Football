// application/uiGateway.js
// Contrat unique entre l'interface et l'application.

export class UIGateway {
    constructor({ application, engine } = {}) {
        if (!application) throw new Error('UIGateway requires a GameApplication.');
        this.application = application;
        this.engine = engine || application.engine;
    }

    get state() { return this.engine?.state || this.application.state || null; }
    startCareer(selectedData = {}) { const state = this.application.registry?.careerApplication?.create?.(selectedData); if (state) this.engine.state = state; return state; }
    playBlock(choice = null) { return this.application.registry?.blockSystem?.execute?.(this.state, choice) ?? null; }

    playNextBlock(choice = null) {
        const state = this.state;
        if (!state?.player) return null;
        const active = state.activeMatchSession;

        if (active) {
            const choices = active.decision?.choices || [];
            const choiceIndex = typeof choice === 'number'
                ? choice
                : Math.max(0, choices.findIndex(item => item === choice || item?.text === choice?.text || item?.texte === choice?.texte));
            const result = this.resolveInteractiveMatchDecision(choiceIndex);
            if (!result.finished) return { interactive: true, interactiveDecision: result.decision, interactiveEvent: result.event || null };
        }

        const next = this.getNextPlayableMatch();
        if (next) {
            const session = this.startInteractiveMatch(next.fixture, next.matchIndex);
            return {
                interactive: true,
                interactiveDecision: session?.decision || null,
                interactiveEvent: null,
                matchImportance: next.importance || null
            };
        }

        return this.completeInteractiveBlock();
    }

    advanceCalendar() { return this.application.registry?.calendarSystem?.advance?.(this.state) ?? null; }
    setTrainingFocus(focusKey) {
        const training = this.application.registry?.trainingSystem;
        if (!training?.isValidFocus?.(focusKey) || !this.state?.player) return false;
        this.state.trainingFocus = focusKey;
        this.application.registry.blockSystem.stateManager.save(this.state);
        return true;
    }

    shouldTriggerMatchDilemma() {
        if (this.state?.activeMatchSession) return true;
        return Boolean(!this.state?.player?.isInjured && this.getNextPlayableMatch());
    }

    getMatchDilemma(type = 'standard', opponent = "l'adversaire") {
        const state = this.state;
        if (!state?.activeMatchSession) {
            const next = this.getNextPlayableMatch();
            if (next) this.startInteractiveMatch(next.fixture, next.matchIndex);
        }
        return state?.activeMatchSession?.decision || this.application.registry?.matchChoiceManager?.getMatchDilemma?.(type, opponent) || null;
    }

    resolveEventChoice(i) { return this.application.registry?.interactionSystem?.resolveEventChoice?.(this.state, i) ?? null; }
    resolveCoachChoice(i) { return this.application.registry?.interactionSystem?.resolveCoachChoice?.(this.state, i) ?? null; }
    resolveMediaDilemma(i) { return this.application.registry?.interactionSystem?.resolveMediaChoice?.(this.state, i) ?? null; }
    resolvePositionProposal(a) { return this.application.registry?.interactionSystem?.resolvePositionProposal?.(this.state, a) ?? null; }
    acceptTransferOffer() { return this.application.registry?.transferSystem?.accept?.(this.state) ?? null; }
    rejectTransferOffer() { return this.application.registry?.transferSystem?.reject?.(this.state) ?? false; }
    retireCareer() { return this.application.registry?.careerLifecycleSystem?.retire?.(this.state) ?? null; }
    resetCareer() { const result = this.application.registry?.careerLifecycleSystem?.reset?.(); this.engine.state = null; return result; }
    getPeriodName(month) { return this.application.registry?.calendarSystem?.getPeriodName?.(month) ?? ''; }

    getScheduledMatches() {
        try {
            const plan = this.application.registry?.competitionSystem?.getBlockPlan?.(this.state);
            return Array.isArray(plan?.scheduledMatches) ? plan.scheduledMatches : [];
        } catch { return []; }
    }

    getMatchInteractionPlan() {
        const state = this.state;
        if (!state?.player) return { key: null, budget: 0, playableCount: 0, entries: [] };
        const matches = this.getScheduledMatches();
        const key = `${state.calendar?.currentSeasonYear ?? state.season ?? 'season'}:${state.calendar?.currentMonth ?? 'month'}:${matches.length}`;
        const cached = state.matchInteractionPlan;
        if (cached?.key === key && Array.isArray(cached.entries)) {
            return {
                ...cached,
                entries: cached.entries.map(entry => ({ ...entry, fixture: matches[entry.matchIndex] || null }))
            };
        }

        const planner = this.application.registry?.matchImportanceSystem;
        const planned = planner?.planBlock?.(state, matches) || { key, budget: 0, playableCount: 0, entries: [] };
        const serializable = {
            key,
            budget: planned.budget || 0,
            playableCount: planned.playableCount || 0,
            entries: (planned.entries || []).map(({ fixture, ...entry }) => entry)
        };
        state.matchInteractionPlan = serializable;
        return {
            ...serializable,
            entries: serializable.entries.map(entry => ({ ...entry, fixture: matches[entry.matchIndex] || null }))
        };
    }

    getNextPlayableMatch() {
        const plan = this.getMatchInteractionPlan();
        const completed = new Set((Array.isArray(this.state?.interactiveBlockResults) ? this.state.interactiveBlockResults : [])
            .map(result => Number(result?.matchIndex))
            .filter(Number.isFinite));
        return plan.entries.find(entry => entry.playable && entry.fixture && !completed.has(Number(entry.matchIndex))) || null;
    }

    startInteractiveMatch(match, index = 0) {
        const manager = this.application.registry?.interactiveMatchSystem;
        const session = manager?.startInteractiveMatch?.(this.state, match, index);
        if (session) this.state.activeMatchSession = session;
        return session;
    }

    resolveInteractiveMatchDecision(choiceIndex) {
        const manager = this.application.registry?.interactiveMatchSystem;
        const session = this.state?.activeMatchSession;
        if (!manager || !session) throw new Error('Aucun match interactif actif.');
        const result = manager.resolveInteractiveDecision(this.state, session, choiceIndex);
        if (result.finished) {
            manager.commitInteractiveResult(this.state, result.result);
            this.state.interactiveBlockResults ||= [];
            this.state.interactiveBlockResults.push({ ...result.result, fixture: session.match, interactive: true });
            this.state.activeMatchSession = null;
        } else {
            this.state.activeMatchSession = result.session;
        }
        return result;
    }

    completeInteractiveBlock() { return this.application.registry?.blockSystem?.execute?.(this.state) ?? null; }
    getSuccessorOptions(playerId = this.state?.player?.id, currentAge = this.state?.player?.age) { return this.application.registry?.generationSimulationFacade?.getOptions?.({ state: this.state, playerId, currentAge }) || []; }
    simulateChildTo14(childId, playerId = this.state?.player?.id) { const result = this.application.registry?.generationSimulationFacade?.simulateTo14?.({ state: this.state, playerId, childId, currentAge: this.state?.player?.age, world: this.state?.world || {} }); this.application.registry?.blockSystem?.stateManager?.save?.(this.state); return result; }
    startSuccessorCareer(childId, playerId = this.state?.player?.id) { const result = this.application.registry?.generationSimulationFacade?.startIfReady?.({ state: this.state, playerId, childId, currentAge: this.state?.player?.age, world: this.state?.world || {} }); if (result) this.application.registry?.blockSystem?.stateManager?.save?.(this.state); return result; }
}

export default UIGateway;
