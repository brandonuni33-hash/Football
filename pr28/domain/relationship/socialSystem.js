// domain/relationship/socialSystem.js
// Façade sociale du gameplay. RelationshipSystem possède les relations canoniques ;
// les anciens scores coach/vestiaire sont maintenus comme projections compatibles.

import { RELATIONSHIP_TYPES } from './relationshipTypes.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

function relationStatus(score) {
    if (score <= -30) return 'Rival / Tendu';
    if (score >= 30) return 'Allié / Ami';
    return 'Neutre';
}

export class SocialSystem {
    constructor(engineOrOptions = null) {
        const options = engineOrOptions && typeof engineOrOptions === 'object' && ('relationshipSystem' in engineOrOptions || 'engine' in engineOrOptions)
            ? engineOrOptions
            : { engine: engineOrOptions };
        this.engine = options.engine || null;
        this.relationshipSystem = options.relationshipSystem || null;
    }

    initSocialData(coachName = 'l’entraîneur') {
        return {
            romance: {
                unlocked: false,
                partnerName: null,
                partnerType: null,
                affection: 50,
                status: 'célibataire'
            },
            coachVision: 'Formateur Patient',
            youthClubName: 'Centre de Formation',
            coachData: {
                name: coachName,
                relation: 50,
                opinion: 'Neutre',
                hasLeftClub: false
            },
            relationships: [
                { id: 'coach', name: coachName, role: 'Entraîneur', score: 50, status: 'Neutre' },
                { id: 'vestiaire', name: 'Le vestiaire', role: 'Coéquipiers', score: 50, status: 'Neutre' }
            ],
            relationshipSync: {}
        };
    }

    ensureRelationships(state) {
        if (!state?.player) return;
        state.social ||= this.initSocialData(state.player.coachName || 'l’entraîneur');
        state.social.relationships ||= [];
        state.social.relationshipSync ||= {};
        state.player.stats ||= {};

        state.social.coachData ||= {
            name: state.player.coachName || 'l’entraîneur',
            relation: clamp(state.player.stats.relationCoach ?? 50, 0, 100),
            opinion: 'Neutre',
            hasLeftClub: false
        };

        this.#ensureLegacyRow(state, 'coach', state.social.coachData.name || state.player.coachName || 'l’entraîneur', 'Entraîneur');
        this.#ensureLegacyRow(state, 'vestiaire', 'Le vestiaire', 'Coéquipiers');

        this.#syncCoreRelation(state, 'coach');
        this.#syncCoreRelation(state, 'vestiaire');
    }

    updateSocialCycle(state) {
        if (!state?.player) return;
        this.ensureRelationships(state);

        if (state.player.age >= 18 && !state.social.romance.unlocked) state.social.romance.unlocked = true;

        const romance = state.social.romance;
        if (romance.unlocked && romance.status !== 'célibataire') {
            if (romance.affection > 75) state.player.morale = Math.min(100, state.player.morale + 3);
            else if (romance.affection < 30) state.player.morale = Math.max(0, state.player.morale - 6);
        }
    }

    modifyRelationship(state, characterId, amount, context = {}) {
        if (!state?.player) return null;
        this.ensureRelationships(state);

        const rel = state.social.relationships.find(item => item.id === characterId);
        if (!rel) return null;
        const delta = Number(amount) || 0;
        const before = Number(rel.score) || 50;
        const afterTarget = clamp(before + delta, 0, 100);

        const canonical = this.#canonicalRelation(state, characterId, before);
        if (canonical && this.relationshipSystem) {
            this.relationshipSystem.setCompatibilityScore({
                state,
                subjectId: state.player.id,
                targetId: this.#targetId(characterId),
                type: this.#type(characterId),
                score: afterTarget,
                context: { source: 'socialSystem', event: context.event || `social_${characterId}`, significant: Math.abs(delta) >= 8, ...context }
            });
        } else {
            rel.score = afterTarget;
        }

        const synced = this.#projectCanonical(state, characterId);
        return {
            characterId,
            before,
            after: synced,
            delta: synced - before,
            status: relationStatus(synced - 50)
        };
    }

    getRelationship(state, characterId) {
        this.ensureRelationships(state);
        return state?.social?.relationships?.find(item => item.id === characterId) || null;
    }

    getCanonicalRelationship(state, characterId) {
        if (!state?.player) return null;
        this.ensureRelationships(state);
        return this.relationshipSystem?.get?.(state, state.player.id, this.#targetId(characterId), this.#type(characterId)) || null;
    }

    getRandomSocialEvent(state) {
        this.ensureRelationships(state);
        const events = [
            {
                type: 'coach',
                title: 'Tension à l’entraînement',
                description: 'Ton entraîneur te reproche un manque d’implication lors de la dernière séance tactique devant tout le groupe.',
                choices: [
                    { text: 'S’excuser platement et redoubler d’efforts', effect: { coachDelta: +10, moraleDelta: -2 } },
                    { text: 'Lui répondre vertement pour défendre ta place', effect: { coachDelta: -20, moraleDelta: +5 } }
                ]
            },
            {
                type: 'vestiaire',
                title: 'Une blague qui tourne mal',
                description: 'Une plaisanterie de vestiaire te vise avant un match important. Tu peux désamorcer la situation ou répondre sur le même ton.',
                choices: [
                    { text: 'Rire avec le groupe', effect: { relationshipDelta: +8, moraleDelta: +2 } },
                    { text: 'Recadrer calmement le groupe', effect: { relationshipDelta: -4, disciplineDelta: +2 } }
                ]
            }
        ];

        if (state.social.romance?.unlocked && state.social.romance.status !== 'célibataire') {
            events.push({
                type: 'romance',
                title: 'Soirée importante vs Repos',
                description: `${state.social.romance.partnerName || 'Ton partenaire'} t'organise une belle soirée surprise, mais ton match capital demande une concentration maximale.`,
                choices: [
                    { text: 'Profiter de la soirée', effect: { affectionDelta: +15, fitnessDelta: -10 } },
                    { text: 'Annuler pour te reposer', effect: { affectionDelta: -15, fitnessDelta: +10 } }
                ]
            });
        }

        return events[Math.floor(Math.random() * events.length)] || null;
    }

    #syncCoreRelation(state, characterId) {
        const legacy = this.#legacyScore(state, characterId);
        const lastSynced = Number(state.social.relationshipSync?.[characterId]);
        let canonical = this.#canonicalRelation(state, characterId, legacy);

        // Tant que des systèmes historiques écrivent encore l'ancien score, toute
        // divergence depuis le dernier miroir est réinjectée une fois dans le canonique.
        if (canonical && Number.isFinite(lastSynced) && Math.round(legacy) !== Math.round(lastSynced)) {
            canonical = this.relationshipSystem?.setCompatibilityScore?.({
                state,
                subjectId: state.player.id,
                targetId: this.#targetId(characterId),
                type: this.#type(characterId),
                score: legacy,
                context: { source: 'legacy_projection_bridge', event: `legacy_${characterId}_changed`, significant: Math.abs(legacy - lastSynced) >= 8 }
            }) || canonical;
        }

        const score = canonical && this.relationshipSystem
            ? this.relationshipSystem.compatibilityScore(canonical)
            : legacy;
        this.#writeLegacyScore(state, characterId, score);
        state.social.relationshipSync[characterId] = score;
        return score;
    }

    #projectCanonical(state, characterId) {
        const relation = this.#canonicalRelation(state, characterId, this.#legacyScore(state, characterId));
        const score = relation && this.relationshipSystem ? this.relationshipSystem.compatibilityScore(relation) : this.#legacyScore(state, characterId);
        this.#writeLegacyScore(state, characterId, score);
        state.social.relationshipSync[characterId] = score;
        return score;
    }

    #canonicalRelation(state, characterId, seedScore = 50) {
        if (!this.relationshipSystem || !state?.player?.id) return null;
        return this.relationshipSystem.ensureFromScore(
            state,
            state.player.id,
            this.#targetId(characterId),
            this.#type(characterId),
            seedScore
        );
    }

    #legacyScore(state, characterId) {
        if (characterId === 'coach') return clamp(state.social?.coachData?.relation ?? state.player?.stats?.relationCoach ?? 50, 0, 100);
        if (characterId === 'vestiaire') return clamp(state.player?.stats?.vestiaire ?? state.social?.relationships?.find(item => item.id === 'vestiaire')?.score ?? 50, 0, 100);
        return clamp(state.social?.relationships?.find(item => item.id === characterId)?.score ?? 50, 0, 100);
    }

    #writeLegacyScore(state, characterId, score) {
        const value = clamp(score, 0, 100);
        const row = state.social.relationships.find(item => item.id === characterId);
        if (row) {
            row.score = value;
            row.status = relationStatus(value - 50);
        }
        if (characterId === 'coach') {
            state.social.coachData.relation = value;
            state.player.stats.relationCoach = value;
        } else if (characterId === 'vestiaire') {
            state.player.stats.vestiaire = value;
        }
    }

    #ensureLegacyRow(state, id, name, role) {
        if (state.social.relationships.some(item => item.id === id)) return;
        const score = id === 'coach' ? state.social.coachData?.relation ?? 50 : state.player.stats?.vestiaire ?? 50;
        state.social.relationships.push({ id, name, role, score: clamp(score, 0, 100), status: relationStatus(clamp(score, 0, 100) - 50) });
    }

    #targetId(characterId) {
        return characterId === 'vestiaire' ? 'locker_room' : characterId;
    }

    #type(characterId) {
        return characterId === 'coach' ? RELATIONSHIP_TYPES.COACH
            : characterId === 'vestiaire' ? RELATIONSHIP_TYPES.TEAMMATE
                : 'unknown';
    }
}

export default SocialSystem;
