// state/stateManager.js
// Façade de persistance de transition.
// Ne change pas encore le stockage historique : il délègue à state.js.

import { StateManager as LegacyStateManager, SCHEMA_VERSION } from '../state.js';

export const StateManager = {
    STORAGE_KEY: LegacyStateManager.STORAGE_KEY,
    SCHEMA_VERSION,

    load() {
        return LegacyStateManager.load();
    },

    save(state) {
        return LegacyStateManager.save(state);
    },

    clear() {
        return LegacyStateManager.clear();
    },

    createEmpty() {
        return LegacyStateManager.createEmpty();
    }
};

export default StateManager;
