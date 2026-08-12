// domain/match/interactiveMatchSystem.js
// Propriétaire canonique du cycle interactif d'un match.

import { InteractiveMatchRuntime } from './interactiveMatchRuntime.js';

export const InteractiveMatchSystem = Object.freeze({
    startInteractiveMatch: InteractiveMatchRuntime.startInteractiveMatch,
    advanceInteractiveMatch: InteractiveMatchRuntime.advanceInteractiveMatch,
    resolveInteractiveDecision: InteractiveMatchRuntime.resolveInteractiveDecision,
    commitInteractiveResult: InteractiveMatchRuntime.commitInteractiveResult
});

export default InteractiveMatchSystem;
