// social.js

export class SocialSystem {
    constructor(engine) {
        this.engine = engine;
    }

    // Initialisation des données sociales au lancement d'une carrière
    initSocialData(coachName) {
        return {
            romance: {
                unlocked: false,
                partnerName: null,
                partnerType: null, // 'supportive', 'influencer', 'childhood'
                affection: 50,     // De 0 à 100
                status: 'célibataire'
            },
            relationships: [
                { id: 'coach', name: coachName, role: 'Entraîneur', score: 50, status: 'Neutre' }
            ]
        };
    }

    // Vérification des évolutions (âge, impacts sur le moral)
    updateSocialCycle(state) {
        if (!state.social) return;

        // Déblocage de la romance à 18 ans
        if (state.player.age >= 18 && !state.social.romance.unlocked) {
            state.social.romance.unlocked = true;
            // On peut déclencher un événement ou une notification ici
        }

        // Impact du couple sur le moral
        const romance = state.social.romance;
        if (romance.unlocked && romance.status !== 'célibataire') {
            if (romance.affection > 75) {
                state.player.morale = Math.min(100, state.player.morale + 3);
            } else if (romance.affection < 30) {
                state.player.morale = Math.max(0, state.player.morale - 6);
            }
        }
    }

    // Modifier le score de relation avec un personnage (coach ou coéquipier)
    modifyRelationship(state, characterId, amount) {
        if (!state.social || !state.social.relationships) return;

        const rel = state.social.relationships.find(r => r.id === characterId);
        if (rel) {
            rel.score = Math.max(-100, Math.min(100, rel.score + amount));
            
            // Mise à jour du statut textuel
            if (rel.score <= -30) rel.status = 'Rival / Tendu';
            else if (rel.score >= 30) rel.status = 'Allié / Ami';
            else rel.status = 'Neutre';
        }
    }

    // Générer un événement aléatoire (Dilemme de vestiaire ou de couple)
    getRandomSocialEvent(state) {
        const events = [];

        // Événement entraineur / vestiaire
        events.push({
            type: 'coach',
            title: 'Tension à l’entraînement',
            description: 'Ton entraîneur te reproche un manque d’implication lors de la dernière séance tactique devant tout le groupe.',
            choices: [
                { text: 'S’excuser platement et redoubler d’efforts', effect: { coachDelta: +10, moraleDelta: -2 } },
                { text: 'Lui répondre vertement pour défendre ta place', effect: { coachDelta: -20, moraleDelta: +5 } }
            ]
        });

        // Événement romance (si en couple)
        if (state.social?.romance?.unlocked && state.social.romance.status !== 'célibataire') {
            events.push({
                type: 'romance',
                title: 'Soirée importante vs Repos',
                description: `${state.social.romance.partnerName} t'organise une belle soirée surprise, mais ton match capital de la semaine demande une concentration maximale.`,
                choices: [
                    { text: 'Profiter de la soirée (Risque de fatigue sportive)', effect: { affectionDelta: +15, fitnessDelta: -10 } },
                    { text: 'Annuler pour se reposer et préparer le match', effect: { affectionDelta: -15, fitnessDelta: +10 } }
                ]
            });
        }

        // Sélectionner un événement au hasard s'il y en a de dispo
        if (events.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * events.length);
        return events[randomIndex];
    }
}
