// domain/relationship/relationshipMemory.js
// Conserve les interactions significatives sans dépendre de l'identité des systèmes consommateurs.

export class RelationshipMemory {
    remember({ state, relationshipId, actorId, targetId, event, impact = {}, context = {} }) {
        if (!state || !relationshipId) return null;
        state.relationshipMemory ||= [];
        const memory = {
            id: `relmem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            relationshipId,
            actorId: actorId || null,
            targetId: targetId || null,
            event: event || 'interaction',
            impact: { ...impact },
            context: { ...context },
            createdAt: new Date().toISOString()
        };
        state.relationshipMemory.push(memory);
        return memory;
    }

    recent(state, relationshipId, limit = 10) {
        return (state?.relationshipMemory || [])
            .filter(item => item.relationshipId === relationshipId)
            .slice(-limit)
            .reverse();
    }

    count(state, relationshipId, event) {
        return (state?.relationshipMemory || [])
            .filter(item => item.relationshipId === relationshipId && (!event || item.event === event)).length;
    }
}

export default RelationshipMemory;
