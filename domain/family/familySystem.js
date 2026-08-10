// domain/family/familySystem.js
// Source de vérité pour la vie familiale et les événements familiaux majeurs.
// Le système ne décide jamais seul des choix du joueur : il produit des faits
// familiaux consommables par les autres systèmes via l'event bus.

import { EventBus } from '../../core/eventBus.js';

const MALE = new Set(['male', 'm', 'garçon', 'garcon']);
const FEMALE = new Set(['female', 'f', 'fille']);

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
const normalizeGender = gender => {
    const value = String(gender || '').toLowerCase().trim();
    if (MALE.has(value)) return 'male';
    if (FEMALE.has(value)) return 'female';
    return 'unknown';
};

const ensureFamily = state => {
    state.family ??= {};
    state.family.members ??= [];
    state.family.couples ??= [];
    state.family.children ??= [];
    state.family.events ??= [];
    return state.family;
};

export class FamilySystem {
    constructor({ eventBus = EventBus } = {}) {
        this.eventBus = eventBus;
    }

    ensure(state) {
        return ensureFamily(state);
    }

    evaluateChildBirth({ state, player = {}, context = {} }) {
        this.ensure(state);
        const age = Number(player.age ?? 18);
        const relationship = clamp(context.relationship ?? 0);
        const stability = clamp(context.stability ?? 50);
        const desire = clamp(context.familyDesire ?? 50);
        const seasonContext = clamp(context.lifeStage ?? 50);
        const base = Number(context.baseProbability ?? 0);
        const ageFactor = age < 20 ? 0.08 : age < 24 ? 0.35 : age < 28 ? 0.75 : age < 34 ? 1 : 0.7;
        const score = base * ageFactor + relationship * 0.15 + stability * 0.10 + desire * 0.15 + seasonContext * 0.05;
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
            age: 0,
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
        this.eventBus?.emit?.('family.child.birth', { state, playerId: child.parentPlayerId, childId: child.id, child, event });
        return child;
    }

    registerBirth({ state, parentPlayerId, firstName, gender, birthSeason, birthDate = null }) {
        this.ensure(state);
        const child = {
            id: `child_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            parentPlayerId,
            firstName: String(firstName || 'Enfant').trim(),
            gender: normalizeGender(gender),
            birthSeason: Number.isFinite(Number(birthSeason)) ? Number(birthSeason) : null,
            birthDate,
            age: 0,
            createdAt: new Date().toISOString()
        };
        state.family.children.push(child);
        state.family.events.push({
            type: 'child_born',
            childId: child.id,
            parentPlayerId,
            season: child.birthSeason,
            createdAt: child.createdAt
        });
        return child;
    }

    advanceSeason(state, currentSeason) {
        const family = this.ensure(state);
        for (const child of family.children) {
            if (Number.isFinite(Number(child.birthSeason)) && Number.isFinite(Number(currentSeason))) {
                child.age = Math.max(0, Number(currentSeason) - Number(child.birthSeason));
            } else if (Number.isFinite(Number(child.age))) {
                child.age += 1;
            }
        }
        return family.children;
    }

    listChildren(state, playerId) {
        return this.ensure(state).children.filter(child => child.parentPlayerId === playerId);
    }

    getChildren(state, parentPlayerId) {
        return this.listChildren(state, parentPlayerId);
    }

    getSons(state, parentPlayerId) {
        return this.getChildren(state, parentPlayerId).filter(child => normalizeGender(child.gender) === 'male');
    }

    getDaughters(state, parentPlayerId) {
        return this.getChildren(state, parentPlayerId).filter(child => normalizeGender(child.gender) === 'female');
    }
}

export { normalizeGender };
export default FamilySystem;
