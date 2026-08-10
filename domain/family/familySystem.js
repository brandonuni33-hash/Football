// domain/family/familySystem.js
// Source de vérité minimale pour la vie familiale.
// Le système ne décide jamais seul des choix du joueur : il produit des faits
// familiaux consommables par les autres systèmes via l'event bus.

import { EventBus } from '../../core/eventBus.js';

const MALE = new Set(['male', 'm', 'garçon', 'garcon']);
const FEMALE = new Set(['female', 'f', 'fille']);

const normalizeGender = gender => {
    const value = String(gender || '').toLowerCase().trim();
    if (MALE.has(value)) return 'male';
    if (FEMALE.has(value)) return 'female';
    return 'unknown';
};

const ensureFamily = state => {
    state.family ??= {};
    state.family.children ??= [];
    state.family.events ??= [];
    return state.family;
};

export class FamilySystem {
    ensure(state) {
        ensureFamily(state);
        return state.family;
    }

    registerBirth({ state, parentPlayerId, firstName, gender, birthSeason, birthDate = null }) {
        const family = ensureFamily(state);
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

        family.children.push(child);
        const event = {
            type: 'child_born',
            childId: child.id,
            parentPlayerId,
            season: child.birthSeason,
            createdAt: child.createdAt
        };
        family.events.push(event);

        EventBus.emit('family.child_born', {
            state,
            playerId: parentPlayerId,
            child,
            familyEvent: event
        });

        return child;
    }

    advanceSeason(state, currentSeason) {
        const family = ensureFamily(state);
        for (const child of family.children) {
            if (Number.isFinite(Number(child.birthSeason)) && Number.isFinite(Number(currentSeason))) {
                child.age = Math.max(0, Number(currentSeason) - Number(child.birthSeason));
            } else if (Number.isFinite(Number(child.age))) {
                child.age += 1;
            }
        }
        return family.children;
    }

    getChildren(state, parentPlayerId) {
        return ensureFamily(state).children.filter(child => child.parentPlayerId === parentPlayerId);
    }

    getSons(state, parentPlayerId) {
        return this.getChildren(state, parentPlayerId)
            .filter(child => normalizeGender(child.gender) === 'male');
    }

    getDaughters(state, parentPlayerId) {
        return this.getChildren(state, parentPlayerId)
            .filter(child => normalizeGender(child.gender) === 'female');
    }
}

export { normalizeGender };
export default FamilySystem;
