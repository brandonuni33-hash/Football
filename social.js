// social.js
// Système social léger. Les relations sont centralisées ici : le coach reste
// la relation principale et la relation vestiaire est séparée.

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

function relationStatus(score) {
    if (score <= -30) return 'Rival / Tendu';
    if (score >= 30) return 'Allié / Ami';
    return 'Neutre';
}

export class SocialSystem {
    constructor(engine) {
        this.engine = engine;
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
            // Relation distincte avec le vestiaire pour les événements sociaux.
            relationships: [
                { id: 'coach', name: coachName, role: 'Entraîneur', score: 50, status: 'Neutre' },
                { id: 'vestiaire', name: 'Le vestiaire', role: 'Coéquipiers', score: 50, status: 'Neutre' }
            ]
        };
    }

    ensureRelationships(state) {
        if (!state) return;
        state.social ||= this.initSocialData(state.player?.coachName || 'l’entraîneur');
        state.social.relationships ||= [];

        if (!state.social.relationships.some(r => r.id === 'coach')) {
            state.social.relationships.push({
                id: 'coach',
                name: state.social.coachData?.name || state.player?.coachName || 'l’entraîneur',
                role: 'Entraîneur',
                score: clamp(state.player?.stats?.relationCoach ?? 50, 0, 100),
                status: 'Neutre'
            });
        }

        if (!state.social.relationships.some(r => r.id === 'vestiaire')) {
            state.social.relationships.push({
                id: 'vestiaire',
                name: 'Le vestiaire',
                role: 'Coéquipiers',
                score: clamp(state.player?.stats?.vestiaire ?? 50, 0, 100),
                status: relationStatus(clamp(state.player?.stats?.vestiaire ?? 50, 0, 100) - 50)
            });
        }

        state.social.coachData ||= {
            name: state.player?.coachName || 'l’entraîneur',
            relation: clamp(state.player?.stats?.relationCoach ?? 50, 0, 100),
            opinion: 'Neutre',
            hasLeftClub: false
        };

        const coach = state.social.relationships.find(r => r.id === 'coach');
        const vestiaire = state.social.relationships.find(r => r.id === 'vestiaire');

        // Source de vérité du coach : coachData.relation.
        state.social.coachData.relation = clamp(state.social.coachData.relation, 0, 100);
        if (coach) {
            coach.score = state.social.coachData.relation;
            coach.status = relationStatus(coach.score - 50);
        }
        if (state.player?.stats) state.player.stats.relationCoach = state.social.coachData.relation;
        if (vestiaire && state.player?.stats) state.player.stats.vestiaire = clamp(vestiaire.score, 0, 100);
    }

    updateSocialCycle(state) {
        if (!state?.player) return;
        this.ensureRelationships(state);

        if (state.player.age >= 18 && !state.social.romance.unlocked) {
            state.social.romance.unlocked = true;
        }

        const romance = state.social.romance;
        if (romance.unlocked && romance.status !== 'célibataire') {
            if (romance.affection > 75) {
                state.player.morale = Math.min(100, state.player.morale + 3);
            } else if (romance.affection < 30) {
                state.player.morale = Math.max(0, state.player.morale - 6);
            }
        }
    }

    modifyRelationship(state, characterId, amount) {
        if (!state?.player) return null;
        this.ensureRelationships(state);

        const rel = state.social.relationships.find(r => r.id === characterId);
        if (!rel) return null;

        const delta = Number(amount) || 0;
        const before = rel.score;
        rel.score = clamp(rel.score + delta, 0, 100);
        rel.status = relationStatus(rel.score - 50);

        if (characterId === 'coach') {
            state.social.coachData.relation = rel.score;
            state.player.stats.relationCoach = rel.score;
        } else if (characterId === 'vestiaire') {
            state.player.stats.vestiaire = rel.score;
        }

        return {
            characterId,
            before,
            after: rel.score,
            delta: rel.score - before,
            status: rel.status
        };
    }

    getRelationship(state, characterId) {
        this.ensureRelationships(state);
        return state?.social?.relationships?.find(r => r.id === characterId) || null;
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
}