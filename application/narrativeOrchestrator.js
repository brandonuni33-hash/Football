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

    processBlock({ state, report, resolved = {} } = {}) {
        return this.presenter.present(this.engine.processBlock({ state, report, resolved }));
    }

    composeMatchEnd({ state, report } = {}) {
        return this.processMatchEnd({ state, report }).primaryScene;
    }

    composeBlock({ state, report, resolved = {} } = {}) {
        return this.processBlock({ state, report, resolved }).primaryScene;
    }
}

export default NarrativeOrchestrator;
