// domain/career/secondGenerationSystem.js
// Débloque une seconde carrière uniquement grâce à un fils issu de la carrière précédente.
// L'arc ne dépend jamais d'une origine choisie à la création du premier joueur.

const START_AGE = 14;
const RETIREMENT_AGE = 34;
const MAX_RETIREMENT_AGE = 42;
const NETWORK_INHERITANCE_FACTOR = 0.65;

export class SecondGenerationSystem {
    canUnlock({ state, player, currentAge }) {
        if (!player?.id) return false;
        const age = Number(currentAge ?? player.age ?? 0);
        if (age < RETIREMENT_AGE) return false;
        if (age > MAX_RETIREMENT_AGE) return false;

        return this.getEligibleSons(state, player.id).length > 0;
    }

    getEligibleSons(state, parentPlayerId, currentDate = new Date()) {
        const children = state?.family?.children || [];
        return children.filter(child => {
            if (child.parentPlayerId !== parentPlayerId) return false;
            if (String(child.gender).toLowerCase() !== 'male') return false;
            if (!child.birthDate) return false;
            return this.ageAt(child.birthDate, currentDate) >= START_AGE;
        });
    }

    getAllSons(state, parentPlayerId) {
        return (state?.family?.children || []).filter(child =>
            child.parentPlayerId === parentPlayerId && String(child.gender).toLowerCase() === 'male'
        );
    }

    buildArc({ state, parentPlayer, son, currentDate = new Date() }) {
        if (!son || !parentPlayer) return null;
        const sonAge = this.ageAt(son.birthDate, currentDate);
        if (sonAge < START_AGE) return null;

        const inheritedNetwork = this.inheritNetwork(state, parentPlayer.id);
        const inheritedMemory = this.inheritCareerMemory(state, parentPlayer.id);

        return {
            generation: 2,
            parentPlayerId: parentPlayer.id,
            childId: son.id,
            childName: son.firstName || 'Votre fils',
            startAge: START_AGE,
            currentAge: sonAge,
            origin: 'second_generation',
            unlockedBy: 'child_birth',
            inheritedNetwork,
            inheritedMemory,
            legacy: {
                parentCareerExists: true,
                networkStrength: inheritedNetwork.reduce((sum, item) => sum + item.strength, 0),
                memoryCount: inheritedMemory.length
            }
        };
    }

    inheritNetwork(state, parentPlayerId) {
        const edges = state?.relationshipNetwork || [];
        const memories = state?.careerMemory || [];
        const knownIds = new Set();

        for (const edge of edges) {
            if (edge.sourceId === parentPlayerId) knownIds.add(edge.targetId);
            if (edge.targetId === parentPlayerId) knownIds.add(edge.sourceId);
        }

        for (const memory of memories) {
            if (memory.actorId === parentPlayerId) knownIds.add(memory.targetId);
            if (memory.targetId === parentPlayerId) knownIds.add(memory.actorId);
        }

        return [...knownIds]
            .filter(Boolean)
            .map(actorId => {
                const edge = edges.find(item =>
                    (item.sourceId === parentPlayerId && item.targetId === actorId) ||
                    (item.targetId === parentPlayerId && item.sourceId === actorId)
                );
                return {
                    actorId,
                    strength: Math.round(Number(edge?.strength ?? 40) * NETWORK_INHERITANCE_FACTOR),
                    source: 'parent_network'
                };
            });
    }

    inheritCareerMemory(state, parentPlayerId) {
        return (state?.careerMemory || [])
            .filter(memory => memory.actorId === parentPlayerId || memory.targetId === parentPlayerId)
            .slice(-30)
            .map(memory => ({
                memoryId: memory.id,
                category: memory.category,
                title: memory.title,
                clubId: memory.clubId || null,
                inherited: true
            }));
    }

    startSecondCareer({ state, parentPlayer, son, currentDate = new Date() }) {
        const arc = this.buildArc({ state, parentPlayer, son, currentDate });
        if (!arc) return null;

        state.secondGeneration ||= { unlocked: [], active: null, completed: [] };
        if (!state.secondGeneration.unlocked.some(item => item.childId === son.id)) {
            state.secondGeneration.unlocked.push(arc);
        }
        state.secondGeneration.active = arc;
        return arc;
    }

    ageAt(birthDate, currentDate) {
        const birth = new Date(birthDate);
        const current = new Date(currentDate);
        let age = current.getUTCFullYear() - birth.getUTCFullYear();
        const beforeBirthday =
            current.getUTCMonth() < birth.getUTCMonth() ||
            (current.getUTCMonth() === birth.getUTCMonth() && current.getUTCDate() < birth.getUTCDate());
        if (beforeBirthday) age -= 1;
        return age;
    }
}

export default SecondGenerationSystem;
