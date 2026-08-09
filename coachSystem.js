// coachSystem.js

import { ConsequenceSystem } from './consequenceSystem.js';

export class CoachSystem {
    /**
     * Vérifie et déclenche une interaction avec l'entraîneur formateur selon l'origine et le contexte
     */
    static checkCoachInteraction(state) {
        if (!state || !state.player) return null;

        const player = state.player;
        const coachName = state.social?.coachData?.name || state.social?.formativeCoach || "l'entraîneur";
        
        // Sécurisation de la récupération de l'origine (minuscules et valeur par défaut)
        const rawOrigin = player.origin || state.selectedData?.origin || 'academy';
        const origin = typeof rawOrigin === 'string' ? rawOrigin.toLowerCase() : 'academy';

        if (!state.social) {
            state.social = {};
        }

        if (!state.social.coachData) {
            state.social.coachData = {
                name: coachName,
                relation: player.stats?.relationCoach || 50,
                opinion: "Neutre",
                hasLeftClub: false
            };
        }

        const coachState = state.social.coachData;
        const hasTransferred = coachState.hasLeftClub || (player.club !== state.social?.youthClubName);

        // 1. SCÉNARIOS SPÉCIFIQUES LIÉS À L'ORIGINE DU JOUEUR
        if (!hasTransferred && Math.random() < 0.35) {
            
            // --- ORIGINE : FUTSAL ---
            if (origin.includes('futsal')) {
                return {
                    id: 'coach_origin_futsal',
                    title: `💬 Remontrance de ${coachState.name} : Les réflexes de salle`,
                    description: `À l'entraînement, après un énième dribble superflu dans l'axe qui a failli coûter un contre, ${coachState.name} t'arrête net : "${player.firstname || 'Le joueur'}! Ici on est sur grand terrain, pas au futsal ! La technique en pivot ne fait pas tout, il faut lâcher ton ballon plus vite et penser collectif !"`,
                    choices: [
                        {
                            text: "Comprendre sa critique : 'Désolé Coach, j'essaie de trop porter la balle comme avant.'",
                            impacts: { technique: +1, mental: +2, relationCoach: +8 },
                            opinionChange: "Fier",
                            response: `"${coachState.name} tape dans ses mains : 'Voilà. Garde ta créativité, mais mets-la au service de l'équipe, pas pour le spectacle.'"`
                        },
                        {
                            text: "Défendre ton style : 'C'est ma force d'éliminer dans les petits espaces, je ne vais pas changer.'",
                            impacts: { charisme: +2, relationCoach: -6, discipline: -2 },
                            opinionChange: "Neutre",
                            response: `"${coachState.name} soupire : 'Ton dribble de salon ne te sauvera pas sur un tacle glissé de 40 mètres. Adapte-toi.'"`
                        },
                        {
                            text: "Provoquer légèrement : 'Pourtant, c'est bien ce qui fait lever les foules.'",
                            impacts: { morale: +3, relationCoach: -12, discipline: -5 },
                            opinionChange: "Déçu",
                            response: `"${coachState.name} hausse le ton : 'Ici on cherche des joueurs de foot à 11, pas des circassiens. Au travail !'"`
                        },
                        {
                            text: "Baisser la tête en silence et battre en retraite",
                            impacts: { discipline: +2, relationCoach: +3 },
                            opinionChange: "Neutre",
                            response: `*(Le coach te regarde repartir en espérant que la leçon portera ses fruits pour le prochain match).*`
                        }
                    ]
                };
            } 
            
            // --- ORIGINE : STREET (FOOT DE RUE) ---
            else if (origin.includes('street') || origin.includes('rue') || origin.includes('quartier')) {
                return {
                    id: 'coach_origin_street',
                    title: `💬 Rappel à l'ordre de ${coachState.name} : L'esprit de quartier`,
                    description: `Après une intervention un peu trop virulente à l'entraînement, ${coachState.name} te convoque : "${player.firstname || 'Le joueur'}, tu as la grinta de la rue, c'est bien, mais tes réactions épidermiques et ton manque de discipline tactique vont te valoir des cartons rouges en match officiel."`,
                    choices: [
                        {
                            text: "S'excuser platement : 'Vous avez raison Coach, j'ai du mal à canaliser mon agressivité.'",
                            impacts: { discipline: +4, relationCoach: +8, mental: +2 },
                            opinionChange: "Fier",
                            response: `"${coachState.name} hoche la tête : 'Canalise cette rage contre l'adversaire le week-end, pas à l'entraînement.'"`
                        },
                        {
                            text: "Minimiser : 'C'est le terrain qui veut ça, on ne va pas se laisser marcher dessus.'",
                            impacts: { physique: +1, relationCoach: -5 },
                            opinionChange: "Neutre",
                            response: `"${coachState.name} fronce les sourcils : 'Ici, tu défends avec ton cerveau autant qu'avec tes muscles.'"`
                        },
                        {
                            text: "Répondre agressivement : 'Laissez-moi m'exprimer comme je suis, c'est ce qui fait ma force.'",
                            impacts: { discipline: -8, relationCoach: -15, morale: -3 },
                            opinionChange: "Fâché",
                            response: `"${coachState.name} s'emporte : 'Ta rue, elle ne paiera pas tes factures si tu te fais virer du club. Redescends d'un étage.'"`
                        },
                        {
                            text: "Ignorer sa remarque et faire profil bas",
                            impacts: { mental: +1, relationCoach: -2 },
                            opinionChange: "Neutre",
                            response: `*(Le coach te fixe du regard, attendant de voir un vrai changement de comportement).*`
                        }
                    ]
                };
            } 
            
            // --- ORIGINE : ACADÉMIE / CENTRE DE FORMATION CLASSIQUE ---
            else {
                return {
                    id: 'coach_origin_academy',
                    title: `💬 Point de ${coachState.name} : Trop stéréotypé`,
                    description: `Le coach t'appelle après la séance vidéo : "${player.firstname || 'Le joueur'}, tu appliques la tactique à la lettre, c'est propre, c'est scolaire... mais tu manques cruellement de folie ! Tu joues trop en sécurité, prends des risques."`,
                    choices: [
                        {
                            text: "Écouter le conseil : 'Je vais essayer de tenter davantage de passes risquées et de percuter.'",
                            impacts: { technique: +2, relationCoach: +8, mental: +1 },
                            opinionChange: "Fier",
                            response: `"${coachState.name} sourit : 'Voilà. On veut un joueur intelligent, pas un robot sur un pré-carré.'"`
                        },
                        {
                            text: "Justifier son jeu : 'Je préfère assurer mes transmissions pour ne pas déséquilibrer l'équipe.'",
                            impacts: { discipline: +2, relationCoach: -3 },
                            opinionChange: "Neutre",
                            response: `"${coachState.name} soupire : 'La sécurité ne fait pas gagner de trophées majeurs. Ose un peu !'"`
                        },
                        {
                            text: "Lui rejeter la faute : 'C'est votre système de jeu rigide qui nous bride sur le terrain.'",
                            impacts: { charisme: +2, relationCoach: -12, discipline: -4 },
                            opinionChange: "Déçu",
                            response: `"${coachState.name} hausse le ton : 'Ne rejette pas ta frilosité sur mes consignes tactiques ! Remets-toi en question.'"`
                        },
                        {
                            text: "Opiner du chef sans conviction",
                            impacts: { mental: -1, relationCoach: +1 },
                            opinionChange: "Neutre",
                            response: `*(Le coach te regarde dubitatif, espérant voir plus de mordant lors du prochain match).*`
                        }
                    ]
                };
            }
        }

        // 2. SCÉNARIO APRÈS UN TRANSFERT
        if (hasTransferred && Math.random() < 0.3) {
            return {
                id: 'coach_post_transfer',
                title: `📱 Nouvelles de ${coachState.name}`,
                description: `Quelques semaines après ton départ, ton téléphone vibre : "${player.firstname || 'Le joueur'}, je vois tes matchs dans ta nouvelle équipe. J'espère que tu montres enfin de quoi tu es capable, sans t'éparpiller."`,
                choices: [
                    {
                        text: "Le remercier chaleureusement : 'Je n'oublie pas vos exigences, Coach, c'est grâce à votre rigueur.'",
                        impacts: { relationCoach: +12, morale: +5, fame: +2 },
                        opinionChange: "Fier",
                        response: `"${coachState.name} sourit : 'Heureux de voir que le travail finit par payer. Bonne route à toi.'"`
                    },
                    {
                        text: "Lui lancer un pique : 'Ici, on me laisse enfin exprimer tout mon potentiel sans bridage.'",
                        impacts: { relationCoach: -15, discipline: -3, fame: +5 },
                        opinionChange: "Déçu",
                        response: `"${coachState.name} répond sec : 'Le talent sans discipline ne dure qu'un temps. On en reparlera.'"`
                    },
                    {
                        text: "Répondre sobrement : 'Je fais mon travail, le niveau est exigeant mais je m'accroche.'",
                        impacts: { relationCoach: -2, mental: +3 },
                        opinionChange: "Neutre",
                        response: `"${coachState.name} : 'Accroche-toi bien, c'est là que tout commence.'"`
                    },
                    {
                        text: "Ne pas donner suite à son message",
                        impacts: { relationCoach: -20, morale: -2 },
                        opinionChange: "Fâché",
                        response: `*(Pas de réponse de ta part. Le lien se distend définitivement entre vous).*`
                    }
                ]
            };
        }

        // 3. SCÉNARIO CLASSIQUE : Gestion de la forme et de la fatigue
        if (!hasTransferred && player.fitness < 65 && Math.random() < 0.35) {
            return {
                id: 'coach_fatigue_warning',
                title: `💬 L'avertissement de ${coachState.name}`,
                description: `À la fin de la séance, ${coachState.name} t'isole dans son bureau : "${player.firstname || 'Le joueur'}, tu tires sur la corde physiquement. À force de vouloir tout faire, tu vas te blesser."`,
                choices: [
                    {
                        text: "Accepter de lever le pied : 'Vous avez raison Coach, j'ai besoin de souffler.'",
                        impacts: { fitness: +15, relationCoach: +10, morale: +3 },
                        opinionChange: "Fier",
                        response: `"${coachState.name} pose sa main sur ton épaule : 'Sage décision. Repose-toi, le groupe a besoin de toi à 100%.'"`
                    },
                    {
                        text: "Insister pour en faire plus : 'Je me sens bien, ne me mettez pas au repos !'",
                        impacts: { morale: +5, fitness: -5, relationCoach: -5 },
                        opinionChange: "Neutre",
                        response: `"${coachState.name} soupire : 'Ta fougue te perdra. Je te surveille de près.'"`
                    },
                    {
                        text: "Protester : 'Les autres en font moins que moi et vous ne dites rien !'",
                        impacts: { morale: -5, relationCoach: -15, discipline: -5 },
                        opinionChange: "Déçu",
                        response: `"${coachState.name} s'emporte : 'Parce que c'est toi qu'on attend au tournant ! Au boulot, silence radio !'"`
                    },
                    {
                        text: "Gérer en solo : 'Laissez-moi gérer ma récupération, je connais mon corps.'",
                        impacts: { mental: +3, relationCoach: -8, discipline: -2 },
                        opinionChange: "Déçu",
                        response: `"${coachState.name} croise les bras : 'On en reparlera à l'infirmerie.'"`
                    }
                ]
            };
        }

        return null;
    }

    /**
     * Résout le choix du joueur et met à jour les stats et l'opinion du coach de façon sécurisée
     */
    static resolveCoachChoice(state, choiceIndex, eventData) {
        if (!state?.player || !eventData?.choices?.[choiceIndex]) return null;

        const choice = eventData.choices[choiceIndex];
        const coachState = state.social?.coachData;

        const result = ConsequenceSystem.applyCoachChoice(
            state,
            choice
        );

        if (choice.opinionChange && coachState) {
            coachState.opinion = choice.opinionChange;
        }

        if (coachState) {
            // relationCoach est synchronisée par ConsequenceSystem.
            coachState.relation = Math.min(
                100,
                Math.max(
                    0,
                    Number(
                        state.player.stats?.relationCoach ??
                        state.player.relationCoach ??
                        coachState.relation ??
                        50
                    )
                )
            );

            state.player.stats ||= {};
            state.player.stats.relationCoach = coachState.relation;
        }

        return {
            ...result,
            responseText: choice.response,
            newRelation: coachState ? coachState.relation : 50,
            newOpinion: coachState ? coachState.opinion : 'Neutre'
        };
    }


    /**
     * Récupère les données formatées du coach pour l'affichage UI
     */
    static getCoachData(state) {
        if (!state || !state.social) return null;
        const coachState = state.social.coachData || {
            name: state.social.formativeCoach || "l'entraîneur",
            relation: state.social.relationCoach || 50,
            opinion: "Neutre",
            hasLeftClub: false
        };

        let relationshipStatus = "Neutre";
        if (coachState.relation >= 75) relationshipStatus = "Fier / Excellent";
        else if (coachState.relation >= 60) relationshipStatus = "Satisfait";
        else if (coachState.relation <= 30) relationshipStatus = "Fâché / Déçu";

        return {
            name: coachState.name,
            vision: state.social.coachVision || "Équilibré",
            relationshipScore: coachState.relation,
            relationshipStatus: relationshipStatus,
            opinion: coachState.opinion
        };
    }
}

