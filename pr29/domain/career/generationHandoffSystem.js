// domain/career/generationHandoffSystem.js
// Prépare la passation entre une première carrière et une éventuelle deuxième génération.
// Aucun enfant n'est créé ici : le système consomme uniquement les faits familiaux.

import ChildCareerSystem from './childCareerSystem.js';

export class GenerationHandoffSystem {
    constructor({ childCareer = new ChildCareerSystem() } = {}) {
        this.childCareer = childCareer;
    }

    evaluate({ state, playerId, currentAge, careerSummary = {} }) {
        const options = this.childCareer.getSuccessorOptions({ state, playerId, currentAge });
        return {
            careerEnded: Number(currentAge ?? 0) >= 34,
            options,
            hasSuccessor: options.length > 0,
            summary: careerSummary
        };
    }

    buildLegacy({ state, playerId, currentAge, careerSummary = {}, world = {} }) {
        const evaluation = this.evaluate({ state, playerId, currentAge, careerSummary });
        return {
            type: 'generation_handoff',
            generation: Number(state?.careerGeneration || 1),
            parentPlayerId: playerId,
            careerSummary,
            successors: evaluation.options.map(option => ({
                childId: option.childId,
                name: option.name,
                age: option.age,
                availableNow: option.availableNow,
                pendingUntil: option.pendingUntil,
                inheritedNetworkPreview: option.availableNow
                    ? this.childCareer.createSuccessorCareer({ state: { ...state }, playerId, childId: option.childId, currentAge, world })?.inheritedNetwork || null
                    : null
            }))
        };
    }

    startChildCareer({ state, playerId, childId, currentAge, world = {} }) {
        return this.childCareer.createSuccessorCareer({ state, playerId, childId, currentAge, world });
    }
}

export default GenerationHandoffSystem;
