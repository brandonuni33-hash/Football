// domain/career/networkInheritance.js
// Transforme la carrière du parent en capital relationnel transmissible.
// Important : le réseau ouvre des portes, il ne garantit jamais un contrat.

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));

export function buildInheritedNetwork({ state, playerId, world = {} }) {
    const edges = Array.isArray(state?.relationshipNetwork) ? state.relationshipNetwork : [];
    const memories = Array.isArray(state?.careerMemory) ? state.careerMemory : [];

    const people = edges
        .filter(edge => edge.sourceId === playerId || edge.targetId === playerId)
        .filter(edge => Number(edge.strength ?? 0) >= 45)
        .map(edge => ({
            personId: edge.sourceId === playerId ? edge.targetId : edge.sourceId,
            type: edge.type || 'contact',
            strength: clamp(edge.strength, 45, 100)
        }));

    const clubIds = [...new Set(
        memories
            .filter(memory => memory.clubId)
            .slice(-20)
            .map(memory => memory.clubId)
    )];

    const clubs = Array.isArray(world.clubs)
        ? world.clubs
            .filter(club => clubIds.includes(club.id))
            .map(club => ({ id: club.id, familiarity: 60 }))
        : clubIds.map(id => ({ id, familiarity: 60 }));

    const parentReputation = clamp(
        state?.player?.reputation ?? state?.reputation ?? state?.career?.reputation,
        0,
        100
    );

    return {
        people,
        clubs,
        parentReputation,
        reputationBonus: Math.min(15, Math.floor(parentReputation / 10)),
        active: people.length > 0 || clubs.length > 0,
        rules: {
            noGuaranteedContract: true,
            noGuaranteedStartingClub: true,
            noAutomaticPotentialBonus: true
        }
    };
}

export default buildInheritedNetwork;
