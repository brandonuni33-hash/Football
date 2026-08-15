// state.js
// Façade de compatibilité historique. Toute la persistance vit désormais
// dans state/stateManager.js.

export { StateManager, SCHEMA_VERSION } from './state/stateManager.js';
export { StateManager as default } from './state/stateManager.js';
