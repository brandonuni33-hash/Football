// domain/relationship/socialEventSystem.js
// Génère des situations sociales émergentes à partir du réseau, du temps et du contexte.
// Ne choisit jamais l'affichage : il produit uniquement des faits sociaux.

import RelationshipNetwork from './relationshipNetwork.js';
import RelationshipMemory from './relationshipMemory.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const EVENT_TYPES = Object.freeze({
    REUNION: 'reunion',
    RECONCILIATION: 'reconciliation',
    CONFLICT: 'conflict',
    RECOMMENDATION: 'recommendation',
    RIVALRY: 'rivalry',
    ALLIANCE: 'alliance',
    DISTANCE: 'distance',
    OPPORTUNITY: 'social_opportunity'
});

export class SocialEventSystem {
    constructor({ network = new RelationshipNetwork(), memory = new RelationshipMemory() } = {}) {
        this.network = network;
        this.memory = memory;
    }

    evaluate({ state, playerId, actorId, context = {} }) {
        const memories = this.memory.recent(state, context.relationshipId, 12);
        const indirect = this.network.indirectInfluence(state, playerId, actorId);
        const days = Number(context.daysElapsed ?? 0);
        const relationship = context.relationship || {};
        const trust = Number(relationship.trust ?? 50);
        const tension = Number(relationship.tension ?? 0);
        const opportunities = [];

        if (days >= 90 && trust >= 65) {
            opportunities.push(this.#candidate(EVENT_TYPES.REUNION, 45 + trust * 0.25, 'long_absence'));
        }
        if (tension >= 65 && trust >= 35) {
            opportunities.push(this.#candidate(EVENT_TYPES.RECONCILIATION, 35 + (100 - tension) * 0.2, 'relationship_can_recover'));
        }
        if (tension >= 70) {
            opportunities.push(this.#candidate(EVENT_TYPES.CONFLICT, 40 + tension * 0.35, 'accumulated_tension'));
        }
        if (indirect >= 30 && Number(context.clubNeed ?? 0) >= 65) {
            opportunities.push(this.#candidate(EVENT_TYPES.RECOMMENDATION, 45 + indirect * 0.35, 'network_connection'));
        }
        if (Number(context.competition ?? 0) >= 70 && trust < 55) {
            opportunities.push(this.#candidate(EVENT_TYPES.RIVALRY, 45 + Number(context.competition) * 0.35, 'competitive_context'));
        }
        if (trust >= 75 && indirect >= 30) {
            opportunities.push(this.#candidate(EVENT_TYPES.ALLIANCE, 40 + trust * 0.25 + indirect * 0.2, 'strong_social_network'));
        }
        if (days >= 120 && trust < 35) {
            opportunities.push(this.#candidate(EVENT_TYPES.DISTANCE, 45 + (100 - trust) * 0.3, 'relationship_decay'));
        }

        return opportunities
            .map(item => ({ ...item, memoryCount: memories.length }))
            .filter(item => item.score >= Number(context.minimumScore ?? 55));
    }

    create({ state, playerId, actorId, candidate, context = {} }) {
        if (!state || !candidate) return null;
        state.socialEvents ||= [];
        const event = {
            id: `social_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            playerId,
            actorId,
            type: candidate.type,
            score: candidate.score,
            reason: candidate.reason,
            context: { ...context },
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        state.socialEvents.push(event);
        this.memory.remember({
            state,
            relationshipId: context.relationshipId,
            actorId,
            targetId: playerId,
            event: candidate.type,
            impact: {},
            context: { reason: candidate.reason, score: candidate.score }
        });
        return event;
    }

    #candidate(type, score, reason) {
        return { type, score: Math.round(clamp(score)), reason };
    }
}

export { EVENT_TYPES as SOCIAL_EVENT_TYPES };
export default SocialEventSystem;
