// domain/relationship/socialSimulationSystem.js
// Fait évoluer le réseau social entre les pas de carrière, même sans interaction directe du joueur.

import RelationshipDynamics from './relationshipDynamics.js';
import RelationshipMemory from './relationshipMemory.js';

const clamp = (value, min = -100, max = 100) => Math.max(min, Math.min(max, value));

export class SocialSimulationSystem {
    constructor({ dynamics = new RelationshipDynamics(), memory = new RelationshipMemory() } = {}) {
        this.dynamics = dynamics;
        this.memory = memory;
    }

    tick({ state, relationships = [], context = {} }) {
        if (!state) return [];
        const changes = [];
        const days = Math.max(1, Number(context.daysElapsed ?? 1));
        const isolation = clamp(Number(context.playerIsolation ?? 0), 0, 100);

        for (const relationship of relationships) {
            if (!relationship?.id) continue;
            const inactivity = Number(relationship.daysSinceInteraction ?? days);
            const drift = this.#drift(relationship, inactivity, isolation);
            if (!drift) continue;

            const before = {
                trust: relationship.trust,
                affection: relationship.affection,
                communication: relationship.communication,
                tension: relationship.tension
            };
            this.dynamics.apply(relationship, drift, { repetition: relationship.interactionCount || 0 });
            const after = {
                trust: relationship.trust,
                affection: relationship.affection,
                communication: relationship.communication,
                tension: relationship.tension
            };

            const change = {
                relationshipId: relationship.id,
                reason: drift.__reason,
                before,
                after,
                createdAt: new Date().toISOString()
            };
            changes.push(change);
            this.memory.remember({
                state,
                relationshipId: relationship.id,
                actorId: relationship.sourceId,
                targetId: relationship.targetId,
                event: 'background_drift',
                impact: drift,
                context: { days, isolation }
            });
        }

        return changes;
    }

    simulateEvent({ state, relationship, event, impact = {}, context = {} }) {
        if (!relationship) return null;
        const before = { trust: relationship.trust, affection: relationship.affection, respect: relationship.respect, tension: relationship.tension };
        this.dynamics.apply(relationship, impact, context);
        return this.memory.remember({
            state,
            relationshipId: relationship.id,
            actorId: relationship.sourceId,
            targetId: relationship.targetId,
            event,
            impact,
            context: { ...context, before, after: { trust: relationship.trust, affection: relationship.affection, respect: relationship.respect, tension: relationship.tension } }
        });
    }

    #drift(relationship, inactivity, isolation) {
        const role = relationship.type || 'person';
        const threshold = role === 'family' ? 45 : role === 'agent' ? 30 : 60;
        if (inactivity < threshold) return null;

        const amount = Math.min(5, Math.floor((inactivity - threshold) / threshold) + 1);
        const reason = isolation > 60 ? 'player_isolation' : 'time_without_contact';
        return {
            communication: -amount,
            affection: role === 'family' ? -Math.ceil(amount / 2) : -Math.floor(amount / 2),
            tension: isolation > 60 ? Math.ceil(amount / 2) : 0,
            __reason: reason
        };
    }
}

export default SocialSimulationSystem;
