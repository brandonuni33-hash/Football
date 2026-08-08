// events.js

export const EventManager = {
    // Liste des événements narratifs possibles
    eventsPool: [
        {
            id: 'sponsor_local',
            title: "Proposition d'un équipementier local",
            description: "Une marque de sport régionale a remarqué tes débuts prometteurs et te propose un petit contrat de sponsoring pour porter leurs chaussures.",
            condition: (state) => state.player.fame >= 15 && state.calendar.currentMonth >= 3,
            choices: [
                {
                    text: "Signer le contrat (Gagner de l'argent, augmente la popularité)",
                    effect: (state) => {
                        const bonus = 1500;
                        state.career.balance += bonus;
                        state.player.fame += 5;
                        return `Contrat signé ! +${bonus} € et +5 de popularité.`;
                    }
                },
                {
                    text: "Refuser pour rester indépendant",
                    effect: (state) => {
                        state.player.morale += 2;
                        return "Tu préfères te concentrer uniquement sur le terrain. (+2 Moral)";
                    }
                }
            ]
        },
        {
            id: 'soiree_coequipiers',
            title: "Sortie entre coéquipiers",
            description: "Les cadres de l'équipe organisent une soirée pour intégrer les jeunes. C'est l'occasion de resserrer les liens, mais attention aux excès avant l'entraînement...",
            condition: (state) => state.player.morale < 70,
            choices: [
                {
                    text: "Y aller et profiter à fond (Booste le moral, fatigue physique)",
                    effect: (state) => {
                        state.player.morale = Math.min(100, state.player.morale + 12);
                        state.player.fitness = Math.max(0, state.player.fitness - 5);
                        return "Super soirée ! Le groupe t'a adopté. (+12 Moral, -5 Forme)";
                    }
                },
                {
                    text: "Passer une tête par politesse puis rentrer se reposer",
                    effect: (state) => {
                        state.player.morale = Math.min(100, state.player.morale + 5);
                        return "Bon équilibre entre vie sociale et repos. (+5 Moral)";
                    }
                },
                {
                    text: "Décliner l'invitation et faire une nuit blanche de récupération",
                    effect: (state) => {
                        state.player.fitness = Math.min(100, state.player.fitness + 3);
                        return "Tu restes concentré sur tes objectifs physiques. (+3 Forme)";
                    }
                }
            ]
        },
        {
            id: 'pression_entraineur',
            title: "Mise au point avec le coach",
            description: "L'entraîneur principal t'appelle dans son bureau pour discuter de tes dernières performances et de ton implication à l'entraînement.",
            condition: (state) => state.player.stats.averageRating < 6.0 && state.player.stats.matchesPlayed >= 4,
            choices: [
                {
                    text: "Faudra faire profil bas et promettre de redoubler d'efforts",
                    effect: (state) => {
                        state.player.morale = Math.max(0, state.player.morale - 5);
                        return "Le coach apprécie ton humilité, mais la pression monte. (-5 Moral)";
                    }
                },
                {
                    text: "Affirmer ton ambition et demander plus de responsabilités",
                    effect: (state) => {
                        // Risqué : peut motiver ou agacer le coach
                        const success = Math.random() > 0.5;
                        if (success) {
                            state.player.morale += 8;
                            return "Le coach aime ton caractère ! Il te donne sa confiance. (+8 Moral)";
                        } else {
                            state.player.morale -= 10;
                            return "Le coach trouve que tu as le bulbe enflé. Tu t'isoles un peu. (-10 Moral)";
                        }
                    }
                }
            ]
        },
        {
            id: 'fatigue_proches',
            title: "Visite de la famille",
            description: "Tes proches trouvent que tu passes trop de temps loin d'eux à cause du rythme des entraînements et des matchs.",
            condition: (state) => state.player.fitness < 60,
            choices: [
                {
                    text: "Prendre un week-end pour souffler avec eux (Remonte le moral)",
                    effect: (state) => {
                        state.player.morale = Math.min(100, state.player.morale + 10);
                        state.player.fitness = Math.max(0, state.player.fitness - 3);
                        return "Ça fait du bien de couper un peu du foot. (+10 Moral)";
                    }
                },
                {
                    text: "Leur expliquer que le haut niveau exige des sacrifices",
                    effect: (state) => {
                        state.player.fitness = Math.min(100, state.player.fitness + 2);
                        return "Ils comprennent, mais l'ambiance est un peu froide. (+2 Forme)";
                    }
                }
            ]
        }
    ],

    /**
     * Vérifie et déclenche un événement aléatoire valide selon l'état actuel
     */
    checkAndTriggerEvent(state) {
        // Filtrer les événements dont les conditions sont remplies
        const availableEvents = this.eventsPool.filter(ev => {
            try {
                return ev.condition(state);
            } catch (e) {
                return false;
            }
        });

        // S'il n'y a rien de spécifique, on peut piocher un événement neutre/aléatoire, ou ne rien renvoyer (ex: 30% de chance d'avoir un event par mois)
        if (availableEvents.length === 0 || Math.random() > 0.4) {
            return null; 
        }

        // Sélection aléatoire parmi les événements disponibles
        const randomIndex = Math.floor(Math.random() * availableEvents.length);
        return availableEvents[randomIndex];
    },

    /**
     * Applique le choix fait par le joueur
     */
    resolveEventChoice(state, eventId, choiceIndex) {
        const event = this.eventsPool.find(ev => ev.id === eventId);
        if (!event || !event.choices[choiceIndex]) return "Erreur de choix.";

        const selectedChoice = event.choices[choiceIndex];
        return selectedChoice.effect(state);
    }
};
