// Point d'entrée applicatif : interprétation, réduction narrative, puis présentation.

import NarrativePresenter from './narrativePresenter.js';

export class NarrativeOrchestrator {
    constructor({ engine, presenter = new NarrativePresenter() } = {}) {
        if (!engine) throw new Error('NarrativeOrchestrator requires a NarrativeEngine.');
        this.engine = engine;
        this.presenter = presenter;
    }

    processMatchEnd({ state, report } = {}) {
        return this.presenter.present(this.engine.processMatchEnd({ state, report }));
    }

    composeMatchEnd({ state, report } = {}) {
        return this.processMatchEnd({ state, report }).primaryScene;
    }
}

export default NarrativeOrchestrator;
