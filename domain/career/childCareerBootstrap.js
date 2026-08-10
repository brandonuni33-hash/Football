// domain/career/childCareerBootstrap.js
// Construit l'identité de départ du fils à 14 ans sans copier la carrière du père.
// Le réseau hérité est social ; les attributs sportifs restent propres au fils.

import NetworkInheritance from './networkInheritance.js';

const START_AGE = 14;
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export class ChildCareerBootstrap {
    constructor({ networkInheritance = new NetworkInheritance() } = {}) {
        this.networkInheritance = networkInheritance;
    }

    build({ state, playerId, childId, world = {}, profile = {} }) {
        const child = state?.family?.children?.find(item => item.id === childId);
        if (!child) return null;

        const age = Number(child.age ?? 0);
        if (age < START_AGE) {
            return { ready: false, reason: 'child_too_young', age, requiredAge: START_AGE };
        }

        const inheritedNetwork = this.networkInheritance.build({ state, playerId, world });
        const preCareer = child.preCareer || {};

        const career = {
            generation: Number(state?.careerGeneration ?? 1) + 1,
            parentPlayerId: playerId,
            childId,
            age: START_AGE,
            identity: {
                firstName: child.firstName || profile.firstName || 'Votre fils',
                familyName: profile.familyName || null,
                birthDate: child.birthDate || null,
                gender: child.gender || 'male'
            },
            socialContext: {
                inheritedNetwork,
                childhoodNetwork: [...(preCareer.network || [])],
                clubFamiliarity: { ...(preCareer.familiarity || {}) },
                footballExposure: Number(preCareer.traits?.footballExposure ?? 0),
                socialConfidence: Number(preCareer.traits?.socialConfidence ?? 45)
            },
            sportingProfile: {
                overall: null,
                potential: null,
                position: profile.position || null,
                generatedIndependently: true
            },
            status: 'ready_to_start'
        };

        return career;
    }

    finalize({ state, career }) {
        if (!career?.childId) return null;
        state.careerGeneration = career.generation;
        state.activePlayerId = career.childId;
        state.currentCareer = career;
        state.generationHistory ||= [];
        state.generationHistory.push({
            generation: career.generation,
            parentPlayerId: career.parentPlayerId,
            playerId: career.childId,
            startedAt: new Date().toISOString()
        });
        return career;
    }
}

export default ChildCareerBootstrap;
