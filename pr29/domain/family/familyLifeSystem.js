// domain/family/familyLifeSystem.js
// Vie de couple et famille : évolution lente, événements majeurs et arbitrages carrière/vie privée.

import RelationshipDynamics from '../relationship/relationshipDynamics.js';
import RelationshipMemory from '../relationship/relationshipMemory.js';
import FamilySystem from './familySystem.js';
import { familyEventText } from '../narrative/careerLifeNarrativeLibrary.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const MALE_NAMES = ['Lucas', 'Hugo', 'Gabriel', 'Noah', 'Léo', 'Nathan', 'Ethan', 'Jules', 'Arthur', 'Louis'];
const FEMALE_NAMES = ['Emma', 'Chloé', 'Léa', 'Jade', 'Louise', 'Alice', 'Mia', 'Rose', 'Anna', 'Inès'];
const randomName = list => list[Math.floor(Math.random() * list.length)];
const narrativeSeed = state => state?.narrativeState?.seed || state?.career?.seed || state?.player?.id || 'family';

export class FamilyLifeSystem {
    constructor({ dynamics = new RelationshipDynamics(), memory = new RelationshipMemory(), familySystem = new FamilySystem() } = {}) {
        this.dynamics = dynamics;
        this.memory = memory;
        this.familySystem = familySystem;
    }

    ensure(state) {
        state.family ||= { members: [], children: [], events: [], couples: [] };
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
        const couple = { id: `couple_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, playerId, partnerId, relationshipId: relationshipId || null, status: 'together', createdAt, lastReviewAt: createdAt, familyDesire: 50 };
        family.couples.push(couple);
        return couple;
    }

    evaluate({ state, couple, context = {} }) {
        if (!couple) return null;
        const stability = clamp(Number(context.stability ?? 50));
        const communication = clamp(Number(context.communication ?? 50));
        const careerPressure = clamp(Number(context.careerPressure ?? 0));
        const distance = clamp(Number(context.distance ?? 0));
        const familyDesire = clamp(Number(context.familyDesire ?? couple.familyDesire ?? 50));
        const pressure = clamp(careerPressure * 0.35 + distance * 0.35 + (100 - communication) * 0.20 + (100 - stability) * 0.10);
        const resilience = clamp(communication * 0.35 + stability * 0.35 + (100 - pressure) * 0.20 + familyDesire * 0.10);
        return { pressure: Math.round(pressure), resilience: Math.round(resilience), state: pressure >= 75 ? 'critical' : pressure >= 55 ? 'strained' : resilience >= 75 ? 'strong' : 'stable' };
    }

    applyEvent({ state, couple, event, impact = {}, context = {} }) {
        const family = this.ensure(state);
        const before = { status: couple.status };
        const relationship = context.relationship;
        if (relationship) this.dynamics.apply(relationship, impact, context);
        if (event === 'separation') couple.status = 'separated';
        if (event === 'reconciliation') couple.status = 'together';
        const narrativeType = event === 'separation' ? 'separation' : event === 'reconciliation' ? 'reconciliation' : Number(context.careerPressure || 0) >= 65 ? 'pressure' : 'support';
        const record = {
            id: `family_event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            type: event, coupleId: couple.id, playerId: couple.playerId, partnerId: couple.partnerId, before, after: { status: couple.status },
            createdAt: new Date().toISOString(), context: { ...context },
            narrativeText: familyEventText({ seed: narrativeSeed(state), event: narrativeType })
        };
        family.events.push(record);
        this.memory.remember({ state, relationshipId: couple.relationshipId, actorId: couple.playerId, targetId: couple.partnerId, event: `family_${event}`, impact, context: { ...context, narrativeText: record.narrativeText } });
        return record;
    }

    evaluateBirths({ state, player, season }) {
        const family = this.ensure(state);
        const age = Number(player?.age ?? 0);
        if (!player?.id || age < 18 || age > 40) return [];
        if (family.lastBirthCheckSeason === season) return [];
        family.lastBirthCheckSeason = season;

        const births = [];
        for (const couple of family.couples) {
            if (couple.playerId !== player.id || couple.status !== 'together') continue;
            if (family.children.some(child => child.parentPlayerId === player.id && child.birthSeason === season)) continue;

            const relationship = couple.relationshipId ? state?.relationships?.[couple.relationshipId] : null;
            const axes = relationship?.axes || {};
            const stability = clamp(Number(axes.trust ?? 50) * 0.35 + Number(axes.affection ?? 50) * 0.45 + Number(axes.respect ?? 50) * 0.20);
            const familyDesire = clamp(Number(couple.familyDesire ?? 50));
            const baseChance = 0.035;
            const stabilityBonus = Math.max(0, stability - 55) * 0.0015;
            const desireBonus = Math.max(0, familyDesire - 50) * 0.001;
            const ageModifier = age >= 28 && age <= 35 ? 1.15 : 1;
            const chance = (baseChance + stabilityBonus + desireBonus) * ageModifier;
            if (Math.random() >= chance) continue;

            const gender = Math.random() < 0.51 ? 'male' : 'female';
            const firstName = gender === 'male' ? randomName(MALE_NAMES) : randomName(FEMALE_NAMES);
            const child = this.familySystem.registerBirth({ state, parentPlayerId: player.id, firstName, gender, birthSeason: Number(season), birthDate: new Date().toISOString() });
            child.partnerId = couple.partnerId;
            const event = family.events[family.events.length - 1];
            if (event) event.narrativeText = familyEventText({ seed: narrativeSeed(state), event: 'birth', name: firstName });
            births.push({ child, event, narrativeText: event?.narrativeText || familyEventText({ seed: narrativeSeed(state), event: 'birth', name: firstName }) });
        }
        return births;
    }

    children(state, playerId) { return this.familySystem.getChildren(state, playerId); }
}

export default FamilyLifeSystem;
