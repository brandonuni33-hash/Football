// domain/career/childCareerSystem.js
// Deuxième génération : une nouvelle carrière ne peut être débloquée
// qu'après avoir réellement eu un enfant garçon.
// L'ancienne origine « fils de pro » n'est volontairement pas utilisée.

const START_AGE = 14;
const MIN_RETIREMENT_AGE = 34;

export class ChildCareerSystem {
    getSons(state, playerId) {
        return (state?.family?.children || [])
            .filter(child => child.parentPlayerId === playerId)
            .filter(child => String(child.gender || '').toLowerCase() === 'male' || String(child.gender || '').toLowerCase() === 'garçon');
    }

    getSuccessorOptions({ state, playerId, currentAge }) {
        const sons = this.getSons(state, playerId);
        const careerAge = Number(currentAge ?? 0);

        if (careerAge < MIN_RETIREMENT_AGE) {
            return [];
        }

        return sons.map(son => {
            const age = this.#ageOf(son, state);
            return {
                childId: son.id,
                name: son.firstName || 'Votre fils',
                age,
                availableNow: age >= START_AGE,
                pendingUntil: age < START_AGE ? START_AGE - age : 0,
                unlocked: true,
                reason: age >= START_AGE ? 'eligible_second_generation' : 'child_too_young'
            };
        });
    }

    canStart({ state, playerId, childId, currentAge }) {
        const option = this.getSuccessorOptions({ state, playerId, currentAge })
            .find(item => item.childId === childId);
        return Boolean(option?.unlocked && option.availableNow);
    }

    createSuccessorCareer({ state, playerId, childId, currentAge, world = {} }) {
        if (!this.canStart({ state, playerId, childId, currentAge })) return null;

        const child = state.family.children.find(item => item.id === childId);
        const network = this.#inheritNetwork(state, playerId, world);
        const successor = {
            id: `career_generation_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            generation: Number(state.careerGeneration || 1) + 1,
            parentPlayerId: playerId,
            childId,
            childName: child.firstName || 'Votre fils',
            age: START_AGE,
            origin: 'second_generation',
            originLocked: true,
            unlockedBy: 'child_birth',
            inheritedNetwork: network,
            createdAt: new Date().toISOString()
        };

        state.careerGeneration = successor.generation;
        state.nextCareer = successor;
        return successor;
    }

    #inheritNetwork(state, playerId, world) {
        const relationships = (state?.relationshipNetwork || [])
            .filter(edge => edge.sourceId === playerId || edge.targetId === playerId)
            .filter(edge => Number(edge.strength ?? 0) >= 45)
            .map(edge => ({
                personId: edge.sourceId === playerId ? edge.targetId : edge.sourceId,
                type: edge.type,
                strength: edge.strength
            }));

        const clubs = (state?.careerMemory || [])
            .filter(memory => memory.clubId)
            .slice(-20)
            .map(memory => memory.clubId);

        const uniqueClubs = [...new Set(clubs)];
        const knownClubs = Array.isArray(world.clubs)
            ? world.clubs.filter(club => uniqueClubs.includes(club.id)).map(club => ({ id: club.id, familiarity: 60 }))
            : uniqueClubs.map(id => ({ id, familiarity: 60 }));

        return {
            people: relationships,
            clubs: knownClubs,
            reputationBonus: Math.min(15, relationships.length * 2),
            note: 'network inherited from the parent career; not an automatic professional status'
        };
    }

    #ageOf(child, state) {
        if (Number.isFinite(Number(child.age))) return Number(child.age);
        const birthSeason = Number(child.birthSeason);
        const currentSeason = Number(state?.season ?? state?.career?.season);
        if (Number.isFinite(birthSeason) && Number.isFinite(currentSeason)) {
            return Math.max(0, currentSeason - birthSeason);
        }
        if (child.birthDate) {
            const birth = new Date(child.birthDate);
            const now = new Date();
            return Math.max(0, now.getUTCFullYear() - birth.getUTCFullYear());
        }
        return 0;
    }
}

export default ChildCareerSystem;
