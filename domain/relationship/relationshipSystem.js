// domain/relationship/relationshipSystem.js
// Moteur indépendant des relations humaines et institutionnelles.
// Une relation est une histoire évolutive, pas une simple valeur numérique.

import { EventBus } from '../../core/eventBus.js';
import { RELATIONSHIP_AXES, RELATIONSHIP_STATES } from './relationshipTypes.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export class RelationshipSystem {
    constructor({ eventBus = EventBus } = {}) {
        this.eventBus = eventBus;
    }

    ensure(state, subjectId, targetId, type = 'unknown', traits = {}) {
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
        }
        return state.relationships[key];
    }

    interact({ state, subjectId, targetId, type, effects = {}, context = {} }) {
        const relation = this.ensure(state, subjectId, targetId, type, context.initialTraits);
        const before = { ...relation.axes };

        for (const axis of RELATIONSHIP_AXES) {
            if (effects[axis] !== undefined) relation.axes[axis] = clamp(relation.axes[axis] + Number(effects[axis]));
        }

        // Les relations peuvent se réparer ou se détériorer lentement selon l'absence d'interaction.
        relation.lastInteractionAt = new Date().toISOString();
        relation.interactionCount += 1;
        relation.state = this.#state(relation.axes);
        relation.history.push({ at: relation.lastInteractionAt, before, after: { ...relation.axes }, context: { ...context } });

        this.eventBus.emit('relationship.changed', { state, relationship: relation, before, after: relation.axes, context });
        return relation;
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
