// coachSystem.js

import { ConsequenceSystem } from './consequenceSystem.js';
import { EventBus } from './core/eventBus.js';
import { EVENTS } from './core/events.js';

export class CoachSystem {
    static checkCoachInteraction(state) {
        if (!state || !state.player) return null;
        const player = state.player;
        const coachName = state.social?.coachData?.name || state.social?.formativeCoach || "l'entraîneur";
        const rawOrigin = player.origin || state.selectedData?.origin || 'academy';
        const origin = typeof rawOrigin === 'string' ? rawOrigin.toLowerCase() : 'academy';
        state.social ||= {};
        state.social.coachData ||= {
            name: coachName,
            relation: player.stats?.relationCoach || 50,
            opinion: "Neutre",
            hasLeftClub: false
        };
        const coachState = state.social.coachData;
        coachState.relation = Math.min(100, Math.max(0, Number(coachState.relation ?? player.stats?.relationCoach ?? 50)));
        if (player.stats) player.stats.relationCoach = coachState.relation;
        const hasTransferred = coachState.hasLeftClub || (player.club !== state.social?.youthClubName);

        // Le contenu détaillé des scénarios reste inchangé dans le système historique.
        // Cette méthode est volontairement conservée comme fournisseur de décisions.
        if (!hasTransferred && Math.random() < 0.35) {
            if (origin.includes('futsal')) {
                return {
                    id: 'coach_origin_futsal', title: `💬 Remontrance de ${coachState.name} : Les réflexes de salle`,
                    description: `À l'entraînement, ${coachState.name} te demande d'adapter ton jeu au grand terrain.`,
                    choices: [
                        { text: "Comprendre sa critique", impacts: { technique: 1, mental: 2, relationCoach: 8 }, opinionChange: "Fier" },
                        { text: "Défendre ton style", impacts: { charisme: 2, relationCoach: -6, discipline: -2 }, opinionChange: "Neutre" },
                        { text: "Provoquer légèrement", impacts: { morale: 3, relationCoach: -12, discipline: -5 }, opinionChange: "Déçu" },
                        { text: "Baisser la tête en silence", impacts: { discipline: 2, relationCoach: 3 }, opinionChange: "Neutre" }
                    ]
                };
            }
            if (origin.includes('street') || origin.includes('rue') || origin.includes('quartier')) {
                return {
                    id: 'coach_origin_street', title: `💬 Rappel à l'ordre de ${coachState.name} : L'esprit de quartier`,
                    description: `${coachState.name} te demande de canaliser ton agressivité et de progresser tactiquement.`,
                    choices: [
                        { text: "S'excuser", impacts: { discipline: 4, relationCoach: 8, mental: 2 }, opinionChange: "Fier" },
                        { text: "Minimiser", impacts: { physique: 1, relationCoach: -5 }, opinionChange: "Neutre" },
                        { text: "Répondre agressivement", impacts: { discipline: -8, relationCoach: -15, morale: -3 }, opinionChange: "Fâché" },
                        { text: "Faire profil bas", impacts: { mental: 1, relationCoach: -2 }, opinionChange: "Neutre" }
                    ]
                };
            }
            return {
                id: 'coach_origin_academy', title: `💬 Point de ${coachState.name} : Trop stéréotypé`,
                description: `${coachState.name} te demande de prendre davantage de risques dans ton jeu.`,
                choices: [
                    { text: "Écouter le conseil", impacts: { technique: 2, relationCoach: 8, mental: 1 }, opinionChange: "Fier" },
                    { text: "Justifier son jeu", impacts: { discipline: 2, relationCoach: -3 }, opinionChange: "Neutre" },
                    { text: "Lui rejeter la faute", impacts: { charisme: 2, relationCoach: -12, discipline: -4 }, opinionChange: "Déçu" },
                    { text: "Opiner du chef", impacts: { mental: -1, relationCoach: 1 }, opinionChange: "Neutre" }
                ]
            };
        }

        if (hasTransferred && Math.random() < 0.3) {
            return {
                id: 'coach_post_transfer', title: `📱 Nouvelles de ${coachState.name}`,
                description: `Quelques semaines après ton départ, ${coachState.name} prend de tes nouvelles.`,
                choices: [
                    { text: "Le remercier", impacts: { relationCoach: 12, morale: 5, fame: 2 }, opinionChange: "Fier" },
                    { text: "Lui lancer une pique", impacts: { relationCoach: -15, discipline: -3, fame: 5 }, opinionChange: "Déçu" },
                    { text: "Répondre sobrement", impacts: { relationCoach: -2, mental: 3 }, opinionChange: "Neutre" },
                    { text: "Ne pas répondre", impacts: { relationCoach: -20, morale: -2 }, opinionChange: "Fâché" }
                ]
            };
        }

        if (!hasTransferred && player.fitness < 65 && Math.random() < 0.35) {
            return {
                id: 'coach_fatigue_warning', title: `💬 L'avertissement de ${coachState.name}`,
                description: `${coachState.name} t'avertit que tu tires trop sur la corde physiquement.`,
                choices: [
                    { text: "Accepter de lever le pied", impacts: { fitness: 15, relationCoach: 10, morale: 3 }, opinionChange: "Fier" },
                    { text: "Insister pour en faire plus", impacts: { morale: 5, fitness: -5, relationCoach: -5 }, opinionChange: "Neutre" },
                    { text: "Protester", impacts: { morale: -5, relationCoach: -15, discipline: -5 }, opinionChange: "Déçu" },
                    { text: "Gérer en solo", impacts: { mental: 3, relationCoach: -8, discipline: -2 }, opinionChange: "Déçu" }
                ]
            };
        }
        return null;
    }

    static resolveCoachChoice(state, choiceIndex, eventData) {
        if (!state?.player || !eventData?.choices?.[choiceIndex]) return null;
        const choice = eventData.choices[choiceIndex];
        const coachState = state.social?.coachData;
        const result = ConsequenceSystem.applyCoachChoice(state, choice);

        if (choice.opinionChange && coachState) coachState.opinion = choice.opinionChange;
        if (coachState) {
            coachState.relation = Math.min(100, Math.max(0, Number(state.player.stats?.relationCoach ?? state.player.relationCoach ?? coachState.relation ?? 50)));
            state.player.stats ||= {};
            state.player.stats.relationCoach = coachState.relation;
            const coachRel = state.social?.relationships?.find(r => r.id === 'coach');
            if (coachRel) {
                coachRel.score = coachState.relation;
                coachRel.status = coachState.relation >= 80 ? 'Allié / Ami' : coachState.relation <= 20 ? 'Rival / Tendu' : 'Neutre';
            }
        }

        EventBus.emit(EVENTS.RELATIONSHIP_CHANGED, {
            state,
            relation: 'coach',
            score: coachState?.relation ?? null,
            playerId: state.player.id
        });
        EventBus.emit(EVENTS.RELATIONSHIP_ADVICE, {
            state,
            relation: 'coach',
            advice: choice.opinionChange || null,
            playerId: state.player.id
        });
        return result;
    }
}

export default CoachSystem;
