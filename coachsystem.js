// coachSystem.js

export class CoachSystem {
    /**
     * Vérifie et déclenche une interaction avec l'entraîneur formateur selon le contexte (club actuel ou après transfert)
     */
    static checkCoachInteraction(state) {
        const player = state.player;
        const coachName = state.social?.formativeCoach || "le coach";
        
        // Initialisation des données de l'entraîneur si elles n'existent pas encore
        if (!state.social.coachData) {
            state.social.coachData = {
                name: coachName,
                relation: player.stats?.relationCoach || 50,
                opinion: "Neutre", // "Fier", "Neutre", "Déçu", "Fâché"
                hasLeftClub: false
            };
        }

        const coachState = state.social.coachData;
        const hasTransferred = coachState.hasLeftClub || (player.club !== state.social?.youthClubName);

        // 1. SCÉNARIO APRÈS UN TRANSFERT (Si tu as quitté son club)
        if (hasTransferred && Math.random() < 0.3) {
            return {
                id: 'coach_post_transfer',
                title: `📱 Nouvelles de ${coachState.name}`,
                description: `Quelques semaines après ton départ pour ton nouveau club, ton téléphone vibre. Cp'est un message de ton ancien formateur : "${player.firstname}, je vois tes matchs dans ta nouvelle équipe. C'est un autre monde... J'espère que tu gardes les pieds sur terre."`,
                choices: [
                    {
                        text: "Lui répondre avec respect : 'Je n'oublie rien de vos leçons, Coach, c'est grâce à vous.'",
                        impacts: { relationCoach: +12, morale: +5, fame: +2 },
                        opinionChange: "Fier",
                        response: `"${coachState.name} sourit à travers l'écran : 'Heureux de l'entendre. Continue de bosser dur, gamin.'"`
                    },
                    {
                        text: "Lui lancer un pique : 'J'ai surtout franchi un palier et découvert des structures professionnelles.'",
                        impacts: { relationCoach: -15, discipline: -3, fame: +5 },
                        opinionChange: "Déçu",
                        response: `"${coachState.name} fronce les sourcils : 'Déjà la grosse tête... Le talent ne fait pas tout, retiens bien ça.'"`
                    },
                    {
                        text: "Être pragmatique : 'C'est le football moderne, il faut savoir saisir les opportunités de carrière.'",
                        impacts: { relationCoach: -5, mental: +3 },
                        opinionChange: "Neutre",
                        response: `"${coachState.name} hoche la tête : 'Business avant tout, hein ? Ne perds pas ton football en route.'"`
                    },
                    {
                        text: "Ignorer purement et simplement son message.",
                        impacts: { relationCoach: -20, morale: -2 },
                        opinionChange: "Fâché",
                        response: `*(Il ne reçoit aucune réponse. Dans la presse locale, il déclarera plus tard que tu as brûlé les étapes un peu trop vite).*`
                    }
                ]
            };
        }

        // 2. SCÉNARIO QUAND TU ES DANS SON CLUB (Baisse de forme / Fatigué)
        if (!hasTransferred && player.fitness < 65 && Math.random() < 0.35) {
            return {
                id: 'coach_fatigue_warning',
                title: `💬 L'avertissement du mentor (${coachState.name})`,
                description: `À la fin de la séance, ${coachState.name} t'isole dans son bureau. Ton carnet de notes sous les yeux, il te fixe : "${player.firstname}, tu es cramé physiquement. À force de tirer sur la corde, tu vas te blesser bêtement. Je dois te ménager."`,
                choices: [
                    {
                        text: "Baisser la tête et accepter ses conseils : 'Vous avez raison Coach, j'ai besoin de souffler.'",
                        impacts: { fitness: +15, relationCoach: +10, morale: +3 },
                        opinionChange: "Fier",
                        response: `"${coachState.name} pose sa main sur ton épaule : 'La sagesse commence ici. Repose-toi, on a besoin de toi à 100%.'"`
                    },
                    {
                        text: "Insister pour jouer : 'Je me sens bien, j'ai faim de ballon, ne me mettez pas sur le banc !'",
                        impacts: { morale: +5, fitness: -5, relationCoach: -5 },
                        opinionChange: "Neutre",
                        response: `"${coachState.name} soupire : 'Ta fougue te perdra. Je te surveille de près lors du prochain décrassage.'"`
                    },
                    {
                        text: "Protester ouvertement : 'Les autres s'entraînent autant, pourquoi c'est toujours moi qu'on pointe du doigt ?'",
                        impacts: { morale: -5, relationCoach: -15, discipline: -5 },
                        opinionChange: "Déçu",
                        response: `"${coachState.name} s'emporte : 'Parce que c'est toi le plus grand potentiel ici, et que tu ganches tout ! Au boulot, silence radio !'"`
                    },
                    {
                        text: "Jouer la carte de l'autonomie : 'Laissez-moi gérer ma récupération en solo, je connais mon corps.'",
                        impacts: { mental: +3, relationCoach: -8, discipline: -2 },
                        opinionChange: "Déçu",
                        response: `"${coachState.name} croise les bras : 'On en repartera à l'infirmerie si tu te déchires les ischios.'"`
                    }
                ]
            };
        }

        // 3. SCÉNARIO GÉNÉRAL : Bilan de progression ou recadrage tactique
        if (!hasTransferred && Math.random() < 0.25) {
            return {
                id: 'coach_tactical_review',
                title: `📋 Point tactique individuel avec ${coachState.name}`,
                description: `Le coach t'appelle pour analyser ton volume de jeu des dernières semaines. Il cherche à savoir si tu es réceptif à sa vision du jeu collectif.`,
                choices: [
                    {
                        text: "Boire ses paroles et lui demander des axes de progression précis",
                        impacts: { technique: +2, relationCoach: +8, mental: +2 },
                        opinionChange: "Fier",
                        response: `"${coachState.name} sourit, ravi de voir ton implication : 'Voilà l'attitude d'un vrai pro. On va bosser tes transmissions.'"`
                    },
                    {
                        text: "Mettre en avant tes stats personnelles : 'Mes chiffres parlent pour moi, je suis décisif.'",
                        impacts: { charisme: +3, relationCoach: -6, vestiaire: +2 },
                        opinionChange: "Neutre",
                        response: `"${coachState.name} te recadre sec : 'Le football se joue à onze, pas tout seul sur ta feuille de stats.'"`
                    },
                    {
                        text: "Proposer de changer de rôle tactique sur le terrain pour exprimer ton plein potentiel",
                        impacts: { mental: +3, technique: +1, relationCoach: +2 },
                        opinionChange: "Neutre",
                        response: `"${coachState.name} réfléchit : 'Intéressant... Tu as du culot, voyons si tu arrives à l'assumer en match.'"`
                    },
                    {
                        text: "Montrer un désintérêt total et bâcler l'entretien",
                        impacts: { morale: -5, relationCoach: -12, discipline: -8 },
                        opinionChange: "Fâché",
                        response: `"${coachState.name} encaisse mal ton attitude : 'Sors de mon bureau. Si tu joues perso sur le terrain, tu finiras sur le banc.'"`
                    }
                ]
            };
        }

        return null;
    }

    /**
     * Permet de résoudre le choix du joueur et d'appliquer l'impact sur l'entraîneur
     */
    static resolveCoachChoice(state, choiceIndex, eventData) {
        const choice = eventData.choices[choiceIndex];
        if (!choice) return null;

        const player = state.player;
        const coachState = state.social.coachData;

        // 1. Appliquer les impacts sur les stats du joueur
        if (choice.impacts) {
            for (const [statKey, val] of Object.entries(choice.impacts)) {
                if (statKey === 'relationCoach') {
                    coachState.relation = Math.min(100, Math.max(0, coachState.relation + val));
                    // Synchroniser avec player.stats si présent
                    if (player.stats) player.stats.relationCoach = coachState.relation;
                } else if (player[statKey] !== undefined) {
                    player[statKey] = Math.min(100, Math.max(0, player[statKey] + val));
                } else if (player.stats && player.stats[statKey] !== undefined) {
                    player.stats[statKey] = Math.min(100, Math.max(0, player.stats[statKey] + val));
                }
            }
        }

        // 2. Mettre à jour son opinion globale
        if (choice.opinionChange) {
            coachState.opinion = choice.opinionChange;
        }

        return {
            responseText: choice.response,
            newRelation: coachState.relation,
            newOpinion: coachState.opinion
        };
    }
}
