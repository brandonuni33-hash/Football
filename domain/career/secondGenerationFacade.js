// domain/career/secondGenerationFacade.js
// Façade unique pour l'UI / GameEngine.
// Les couches supérieures n'ont pas besoin de connaître les détails de la famille,
// de la mémoire ou du réseau relationnel.

import ChildCareerSystem from './childCareerSystem.js';
import { buildInheritedNetwork } from './networkInheritance.js';

export class SecondGenerationFacade {
    constructor({ childCareerSystem = new ChildCareerSystem() } = {}) {
        this.childCareerSystem = childCareerSystem;
    }

    getState({ state, playerId, currentAge }) {
        const options = this.childCareerSystem.getSuccessorOptions({
            state,
            playerId,
            currentAge
        });

        return {
            unlocked: options.length > 0,
            options,
            available: options.filter(option => option.availableNow),
            waiting: options.filter(option => !option.availableNow)
        };
    }

    prepareSelection({ state, playerId, childId, currentAge, world = {} }) {
        if (!this.childCareerSystem.canStart({ state, playerId, childId, currentAge })) {
            return { ok: false, reason: 'successor_not_available' };
        }

        const child = (state.family?.children || []).find(item => item.id === childId);
        if (!child) return { ok: false, reason: 'child_not_found' };

        return {
            ok: true,
            child: {
                id: child.id,
                firstName: child.firstName,
                age: Number(child.age || 0)
            },
            origin: 'second_generation',
            inheritedNetwork: buildInheritedNetwork({ state, playerId, world })
        };
    }

    start({ state, playerId, childId, currentAge, world = {} }) {
        const selection = this.prepareSelection({ state, playerId, childId, currentAge, world });
        if (!selection.ok) return null;

        return this.childCareerSystem.createSuccessorCareer({
            state,
            playerId,
            childId,
            currentAge,
            world
        });
    }
}

export default SecondGenerationFacade;
