// application/uiGateway.js
// Contrat unique entre l'interface et l'application.
// La UI ne connaît plus les systèmes métier ni GameEngine comme orchestrateur.

export class UIGateway {
    constructor({ application, engine } = {}) {
        if (!application) throw new Error('UIGateway requires a GameApplication.');
        this.application = application;
        this.engine = engine || application.engine;
    }

    get state() {
        return this.engine?.state || this.application.state || null;
    }

    startCareer(selectedData = {}) {
        const state = this.application.registry?.careerApplication?.create?.(selectedData);
        if (state) this.engine.state = state;
        return state;
    }

    playBlock(choice = null) {
        return this.application.registry?.blockSystem?.execute?.(this.state, choice) ?? null;
    }

    advanceCalendar() {
        return this.application.registry?.calendarSystem?.advance?.(this.state) ?? null;
    }

    setTrainingFocus(focusKey) {
        const training = this.application.registry?.trainingSystem;
        if (!training?.isValidFocus?.(focusKey) || !this.state?.player) return false;
        this.state.trainingFocus = focusKey;
        this.application.registry.blockSystem.stateManager.save(this.state);
        return true;
    }

    resolveEventChoice(choiceIndex) {
        return this.application.registry?.interactionSystem?.resolveEventChoice?.(this.state, choiceIndex) ?? null;
    }

    resolveCoachChoice(choiceIndex) {
        return this.application.registry?.interactionSystem?.resolveCoachChoice?.(this.state, choiceIndex) ?? null;
    }

    resolveMediaDilemma(choiceIndex) {
        return this.application.registry?.interactionSystem?.resolveMediaChoice?.(this.state, choiceIndex) ?? null;
    }

    resolvePositionProposal(accepted) {
        return this.application.registry?.interactionSystem?.resolvePositionProposal?.(this.state, accepted) ?? null;
    }

    acceptTransferOffer() {
        return this.application.registry?.transferSystem?.accept?.(this.state) ?? null;
    }

    rejectTransferOffer() {
        return this.application.registry?.transferSystem?.reject?.(this.state) ?? false;
    }

    retireCareer() {
        return this.application.registry?.careerLifecycleSystem?.retire?.(this.state) ?? null;
    }

    resetCareer() {
        const result = this.application.registry?.careerLifecycleSystem?.reset?.();
        this.engine.state = null;
        return result;
    }

    getPeriodName(month) {
        return this.application.registry?.calendarSystem?.getPeriodName?.(month) ?? '';
    }
}

export default UIGateway;
