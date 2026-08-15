// domain/relationship/relationshipSystem.js
// Moteur canonique des relations humaines et institutionnelles.
// Les anciennes valeurs simples ne sont que des projections de compatibilité.

import { EventBus } from '../../core/eventBus.js';
import { RELATIONSHIP_AXES, RELATIONSHIP_STATES } from './relationshipTypes.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));

function traitsForScore(score = 50) {
    const value = clamp(score);
    return {
        trust: value,
        affection: value,
        respect: value,
        loyalty: value,
        communication: value,
        tension: 100 - value
    };
}

export class RelationshipSystem {
    constructor({ eventBus = EventBus, memory = null } = {}) {
        this.eventBus = eventBus;
        this.memory = memory;
    }

    ensure(state, subjectId, targetId, type = 'unknown', traits = {}) {
        if (!state || !subjectId || !targetId) return null;
        state.relationships ||= {};
        const key = this.#key(subjectId, targetId, type);
        if (!state.relationships[key]) {
            const axes = {};
            for (const axis of RELATIONSHIP_AXES) axes[axis] = clamp(Number(traits[axis] ?? (axis === 'tension' ? 10 : 50)));
            state.relationships[key] = {
                id: key,
                subjectId,
                targetId,
                type,
                axes,
                state: this.#state(axes),
                createdAt: new Date().toISOString(),
                lastInteractionAt: null,
                interactionCount: 0,
                history: []
            };
            this.eventBus.emit('relationship.created', { state, relationship: state.relationships[key] });
        }
        return state.relationships[key];
    }

    ensureFromScore(state, subjectId, targetId, type, score = 50) {
        const existing = this.get(state, subjectId, targetId, type);
        return existing || this.ensure(state, subjectId, targetId, type, traitsForScore(score));
    }

    interact({ state, subjectId, targetId, type, effects = {}, context = {} }) {
        const relation = this.ensure(state, subjectId, targetId, type, context.initialTraits);
        if (!relation) return null;
        const before = { ...relation.axes };

        for (const axis of RELATIONSHIP_AXES) {
            if (effects[axis] !== undefined) relation.axes[axis] = clamp(relation.axes[axis] + Number(effects[axis]));
        }

        relation.lastInteractionAt = new Date().toISOString();
        relation.interactionCount += 1;
        relation.state = this.#state(relation.axes);
        relation.history.push({ at: relation.lastInteractionAt, before, after: { ...relation.axes }, context: { ...context } });
        if (relation.history.length > 60) relation.history = relation.history.slice(-60);

        this.#remember(state, relation, effects, context);
        this.eventBus.emit('relationship.changed', { state, relationship: relation, before, after: relation.axes, context });
        return relation;
    }

    setCompatibilityScore({ state, subjectId, targetId, type, score, context = {} }) {
        const relation = this.ensureFromScore(state, subjectId, targetId, type, score);
        if (!relation) return null;
        const before = { ...relation.axes };
        const next = traitsForScore(score);
        relation.axes = { ...relation.axes, ...next };
        relation.lastInteractionAt = new Date().toISOString();
        relation.interactionCount += 1;
        relation.state = this.#state(relation.axes);
        relation.history.push({ at: relation.lastInteractionAt, before, after: { ...relation.axes }, context: { ...context, compatibilityProjection: true } });
        if (relation.history.length > 60) relation.history = relation.history.slice(-60);

        const delta = this.compatibilityScore(relation) - this.#scoreAxes(before);
        this.#remember(state, relation, { compatibility: delta }, context);
        this.eventBus.emit('relationship.changed', { state, relationship: relation, before, after: relation.axes, context });
        return relation;
    }

    compatibilityScore(relation) {
        return relation?.axes ? this.#scoreAxes(relation.axes) : 50;
    }

    drift(state, { days = 1 } = {}) {
        const relationships = Object.values(state?.relationships || {});
        for (const relation of relationships) {
            const tensionDrift = relation.axes.tension > 50 ? 0.15 : -0.05;
            relation.axes.tension = clamp(relation.axes.tension + tensionDrift * days);
            relation.state = this.#state(relation.axes);
        }
        return relationships;
    }

    get(state, subjectId, targetId, type) {
        return state?.relationships?.[this.#key(subjectId, targetId, type)] || null;
    }

    list(state, subjectId, { type = null, state: relationshipState = null } = {}) {
        return Object.values(state?.relationships || {})
            .filter(item => item.subjectId === subjectId)
            .filter(item => !type || item.type === type)
            .filter(item => !relationshipState || item.state === relationshipState);
    }

    #remember(state, relation, impact, context) {
        if (!this.memory || context.remember === false) return;
        const magnitude = Object.values(impact || {}).reduce((sum, value) => sum + Math.abs(Number(value) || 0), 0);
        if (magnitude < 4 && !context.significant) return;
        this.memory.remember({
            state,
            relationshipId: relation.id,
            actorId: relation.subjectId,
            targetId: relation.targetId,
            event: context.event || context.source || 'interaction',
            impact,
            context
        });
    }

    #scoreAxes(axes = {}) {
        const positive = clamp(axes.trust) * .25
            + clamp(axes.respect) * .25
            + clamp(axes.affection) * .15
            + clamp(axes.loyalty) * .10
            + clamp(axes.communication) * .15;
        const tensionInverse = (100 - clamp(axes.tension)) * .10;
        return Math.round(clamp(positive + tensionInverse));
    }

    #key(subjectId, targetId, type) {
        return `${type}:${subjectId}:${targetId}`;
    }

    #state(axes) {
        const trust = axes.trust;
        const affection = axes.affection;
        const respect = axes.respect;
        const tension = axes.tension;
        if (tension >= 85) return 'hostile';
        if (tension >= 68) return 'strained';
        if (trust <= 20 && affection <= 20) return 'broken';
        if (trust >= 78 && affection >= 72 && respect >= 70) return 'close';
        if (trust >= 55 || respect >= 60) return 'developing';
        if (trust > 30 || respect > 30) return 'acquaintance';
        return RELATIONSHIP_STATES[0];
    }
}

export default RelationshipSystem;
