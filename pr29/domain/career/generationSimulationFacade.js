// domain/career/generationSimulationFacade.js
// Façade unique pour la transition générationnelle : ne mélange pas famille, simulation et UI.

import PreCareerSimulationSystem from './preCareerSimulationSystem.js';
import ChildCareerSystem from './childCareerSystem.js';

export class GenerationSimulationFacade {
    constructor({ preCareer = new PreCareerSimulationSystem(), childCareer = new ChildCareerSystem() } = {}) {
        this.preCareer = preCareer;
        this.childCareer = childCareer;
    }

    getOptions({ state, playerId, currentAge }) {
        return this.childCareer.getSuccessorOptions({ state, playerId, currentAge });
    }

    simulateTo14({ state, playerId, childId, currentAge, world = {} }) {
        const option = this.getOptions({ state, playerId, currentAge })
            .find(item => item.childId === childId);
        if (!option || option.availableNow) return this.preCareer.snapshot({ state, playerId, childId, world });

        return this.preCareer.simulateToStart({
            state,
            playerId,
            childId,
            currentAge: option.age,
            targetAge: 14,
            world
        });
    }

    startIfReady({ state, playerId, childId, currentAge, world = {} }) {
        return this.childCareer.createSuccessorCareer({ state, playerId, childId, currentAge, world });
    }
}

export default GenerationSimulationFacade;
