// domain/relationship/relationshipDynamics.js
// Fait évoluer les relations avec inertie, contexte et répétition.

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export class RelationshipDynamics {
    apply(relationship, impact = {}, context = {}) {
        if (!relationship) return null;
        const inertia = clamp(Number(relationship.inertia ?? 70), 0, 100) / 100;
        const repetition = clamp(Number(context.repetition ?? 0), 0, 100);
        const multiplier = (1 - inertia * 0.65) * (1 + repetition / 300);

        for (const key of ['trust', 'respect', 'affection', 'loyalty', 'communication', 'tension']) {
            if (impact[key] == null) continue;
            const delta = Number(impact[key]) * multiplier;
            relationship[key] = clamp(Number(relationship[key] ?? 50) + delta);
        }

        relationship.lastInteractionAt = new Date().toISOString();
        relationship.interactionCount = Number(relationship.interactionCount || 0) + 1;
        relationship.state = this.stateOf(relationship);
        return relationship;
    }

    stateOf(relationship) {
        const trust = Number(relationship.trust ?? 50);
        const tension = Number(relationship.tension ?? 0);
        const affection = Number(relationship.affection ?? 50);
        if (tension >= 80 || trust <= 15) return 'hostile';
        if (tension >= 60 || trust <= 30) return 'strained';
        if (trust >= 78 && affection >= 70) return 'close';
        if (trust >= 58 || affection >= 58) return 'developing';
        if (relationship.interactionCount > 0) return 'acquaintance';
        return 'unknown';
    }
}

export default RelationshipDynamics;
