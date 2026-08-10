// domain/career/networkInheritance.js
// Traduit la carrière du parent en capital social transmissible.
// Ce module ne transmet jamais le niveau ou le potentiel sportif.

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export class NetworkInheritance {
    build({ state, playerId, world = {} }) {
        const edges = (state?.relationshipNetwork || [])
            .filter(edge => edge.sourceId === playerId || edge.targetId === playerId)
            .filter(edge => Number(edge.strength ?? 0) >= 45);

        const people = edges.map(edge => ({
            personId: edge.sourceId === playerId ? edge.targetId : edge.sourceId,
            relationshipType: edge.type || 'contact',
            familiarity: clamp(Number(edge.strength ?? 50))
        }));

        const memories = (state?.careerMemory || []).filter(item => item.clubId).slice(-30);
        const clubIds = [...new Set(memories.map(item => item.clubId))];
        const clubs = Array.isArray(world.clubs)
            ? world.clubs.filter(club => clubIds.includes(club.id)).map(club => ({ id: club.id, familiarity: 60 }))
            : clubIds.map(id => ({ id, familiarity: 60 }));

        return {
            people,
            clubs,
            socialCapital: clamp(people.length * 4 + clubs.length * 3),
            sportingInheritance: 0,
            professionalStatusInheritance: 0
        };
    }
}

export default NetworkInheritance;
