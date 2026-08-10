// domain/family/familySystem.js
// Modélise les événements familiaux majeurs sans dépendre de l'UI.
// La naissance d'un enfant est un événement de vie rare, contextuel et persistant.

import { EventBus } from '../../core/eventBus.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export class FamilySystem {
    constructor({ eventBus = EventBus } = {}) {
        this.eventBus = eventBus;
    }

    ensure(state) {
        state.family ||= {
            members: [],
            children: [],
            events: []
        };
        state.family.members ||= [];
        state.family.children ||= [];
        state.family.events ||= [];
        return state.family;
    }

    evaluateChildBirth({ state, player = {}, context = {} }) {
        this.ensure(state);

        const age = Number(player.age ?? 18);
        const relationship = clamp(Number(context.relationship ?? 0));
        const stability = clamp(Number(context.stability ?? 50));
        const desire = clamp(Number(context.familyDesire ?? 50));
        const seasonContext = clamp(Number(context.lifeStage ?? 50));

        // La naissance n'est jamais une récompense automatique d'une relation élevée.
        // Le moteur reçoit une probabilité contextuelle fournie par le monde/simulation.
        const base = Number(context.baseProbability ?? 0);
        const ageFactor = age < 20 ? 0.08 : age < 24 ? 0.35 : age < 28 ? 0.75 : age < 34 ? 1 : 0.7;
        const score = base * ageFactor
            + relationship * 0.15
            + stability * 0.10
            + desire * 0.15
            + seasonContext * 0.05;

        return {
            eligible: age >= 18,
            score: Math.round(clamp(score)),
            age,
            factors: { relationship, stability, desire, seasonContext, ageFactor }
        };
    }

    createBirth({ state, player, context = {} }) {
        this.ensure(state);
        const evaluation = this.evaluateChildBirth({ state, player, context });
        if (!evaluation.eligible || context.allowBirth === false) return null;

        const child = {
            id: `child_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            parentPlayerId: player?.id || null,
            birthDate: context.birthDate || new Date().toISOString(),
            birthSeason: context.season ?? state.season ?? null,
            order: state.family.children.length + 1,
            firstName: context.firstName || null,
            gender: context.gender || null,
            otherParentId: context.otherParentId || null,
            birthContext: {
                ageAtBirth: evaluation.age,
                relationship: evaluation.factors.relationship,
                stability: evaluation.factors.stability
            }
        };

        state.family.children.push(child);
        const event = {
            id: `family_event_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            type: 'child_birth',
            childId: child.id,
            playerId: child.parentPlayerId,
            createdAt: child.birthDate,
            significance: 100
        };
        state.family.events.push(event);
        this.eventBus.emit('family.child.birth', { state, playerId: child.parentPlayerId, childId: child.id, child, event });
        return child;
    }

    listChildren(state, playerId) {
        return (state?.family?.children || []).filter(child => child.parentPlayerId === playerId);
    }
}

export default FamilySystem;
