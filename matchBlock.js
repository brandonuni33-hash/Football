// matchBlock.js
// Compatibilité historique uniquement.
// Les responsabilités réelles vivent désormais dans domain/match/.

import InteractiveMatchSystem from './domain/match/interactiveMatchSystem.js';
import BlockMatchSimulator from './domain/match/blockMatchSimulator.js';

export const MatchBlockManager = Object.freeze({
    ...InteractiveMatchSystem,
    ...BlockMatchSimulator
});

export default MatchBlockManager;
