// domain/relationship/relationshipNetwork.js
// Modélise les relations entre les personnes autour du joueur.

export class RelationshipNetwork {
    connect({ state, sourceId, targetId, type = 'relationship', strength = 50 }) {
        if (!state || !sourceId || !targetId || sourceId === targetId) return null;
        state.relationshipNetwork ||= [];
        const existing = state.relationshipNetwork.find(edge => edge.sourceId === sourceId && edge.targetId === targetId && edge.type === type);
        if (existing) {
            existing.strength = strength;
            existing.updatedAt = new Date().toISOString();
            return existing;
        }
        const edge = {
            id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            sourceId,
            targetId,
            type,
            strength,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        state.relationshipNetwork.push(edge);
        return edge;
    }

    neighbors(state, actorId, minStrength = 0) {
        return (state?.relationshipNetwork || [])
            .filter(edge => (edge.sourceId === actorId || edge.targetId === actorId) && edge.strength >= minStrength)
            .map(edge => edge.sourceId === actorId ? edge.targetId : edge.sourceId);
    }

    indirectInfluence(state, sourceId, targetId) {
        if (!sourceId || !targetId || sourceId === targetId) return 0;
        const direct = (state?.relationshipNetwork || []).find(edge =>
            ((edge.sourceId === sourceId && edge.targetId === targetId) ||
             (edge.sourceId === targetId && edge.targetId === sourceId))
        );
        if (direct) return direct.strength;

        const first = this.neighbors(state, sourceId, 40);
        const second = new Set(this.neighbors(state, targetId, 40));
        return first.some(id => second.has(id)) ? 30 : 0;
    }
}

export default RelationshipNetwork;
