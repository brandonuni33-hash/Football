// domain/match/interactiveMatchSystem.js
// Propriétaire canonique du cycle interactif d'un match.

import { InteractiveMatchController } from './interactiveMatchController.js';

export const InteractiveMatchSystem = Object.freeze({
    startInteractiveMatch: InteractiveMatchController.startInteractiveMatch,
    resolveInteractiveDecision: InteractiveMatchController.resolveInteractiveDecision,
    commitInteractiveResult: InteractiveMatchController.commitInteractiveResult
});

export default InteractiveMatchSystem;
