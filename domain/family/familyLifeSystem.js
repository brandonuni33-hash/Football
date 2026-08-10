// domain/family/familyLifeSystem.js
// Vie de couple et famille : évolution lente, événements majeurs et arbitrages carrière/vie privée.

import RelationshipDynamics from '../relationship/relationshipDynamics.js';
import RelationshipMemory from '../relationship/relationshipMemory.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export class FamilyLifeSystem {
    constructor({ dynamics = new RelationshipDynamics(), memory = new RelationshipMemory() } = {}) {
        this.dynamics = dynamics;
        this.memory = memory;
    }

    ensure(state) {
        state.family ||= { members: [], children: [], events: [] };
        state.family.members ||= [];
        state.family.children ||= [];
        state.family.events ||= [];
        state.family.couples ||= [];
        return state.family;
    }

    createCouple({ state, playerId, partnerId, relationshipId, createdAt = new Date().toISOString() }) {
        const family = this.ensure(state);
        const existing = family.couples.find(c => c.playerId === playerId && c.partnerId === partnerId);
        if (existing) return existing;
        const couple = {
            id: `couple_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            playerId,
            partnerId,
            relationshipId: relationshipId || null,
            status: 'together',
            createdAt,
            lastReviewAt: createdAt
        };
        family.couples.push(couple);
        return couple;
    }

    evaluate({ state, couple, context = {} }) {
        if (!couple) return null;
        const stability = clamp(Number(context.stability ?? 50));
        const communication = clamp(Number(context.communication ?? 50));
        const careerPressure = clamp(Number(context.careerPressure ?? 0));
        const distance = clamp(Number(context.distance ?? 0));
        const familyDesire = clamp(Number(context.familyDesire ?? 50));

        const pressure = clamp(careerPressure * 0.35 + distance * 0.35 + (100 - communication) * 0.20 + (100 - stability) * 0.10);
        const resilience = clamp(communication * 0.35 + stability * 0.35 + (100 - pressure) * 0.20 + familyDesire * 0.10);

        return {
            pressure: Math.round(pressure),
            resilience: Math.round(resilience),
            state: pressure >= 75 ? 'critical' : pressure >= 55 ? 'strained' : resilience >= 75 ? 'strong' : 'stable'
        };
    }

    applyEvent({ state, couple, event, impact = {}, context = {} }) {
        const family = this.ensure(state);
        const before = { status: couple.status };
        const relationship = context.relationship;
        if (relationship) this.dynamics.apply(relationship, impact, context);

        if (event === 'separation') couple.status = 'separated';
        if (event === 'reconciliation') couple.status = 'together';

        const record = {
            id: `family_event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            type: event,
            coupleId: couple.id,
            playerId: couple.playerId,
            partnerId: couple.partnerId,
            before,
            after: { status: couple.status },
            createdAt: new Date().toISOString(),
            context: { ...context }
        };
        family.events.push(record);
        this.memory.remember({
            state,
            relationshipId: couple.relationshipId,
            actorId: couple.playerId,
            targetId: couple.partnerId,
            event: `family_${event}`,
            impact,
            context
        });
        return record;
    }

    children(state, playerId) {
        return (state?.family?.children || []).filter(child => child.parentPlayerId === playerId);
    }
}

export default FamilyLifeSystem;
