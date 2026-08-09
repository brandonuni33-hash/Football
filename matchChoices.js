// matchChoices.js

export class MatchChoiceManager {
    /**
     * Détermine si un dilemme d'avant-match doit avoir lieu (par exemple 30% de chance par bloc, 
     * sauf si c'est un match spécial : finale, derby, etc.)
     */
    static shouldTriggerDilemma(matchType) {
        if (matchType === 'final' || matchType === 'rival') {
            return true; // Toujours présent pour les gros matchs
        }
        // 35% de chance d'avoir un dilemme tactique lors d'un match classique pour laisser la place aux événements normaux
        return Math.random() < 0.35;
    }

    static getMatchDilemma(matchType, opponentName) {
        // 1. FINALE
        if (matchType === 'final') {
            return {
                type: 'final',
                title: "🏆 Le Jour de la Finale : " + opponentName,
                description: "La pression est à son comble dans les couloirs du stade. Ton entraîneur te prend à part pour définir ta partition tactique sur ce match décisif.",
                choices: [
                    {
                        text: "Insister sur un pressing ultra-offensif quitte à s'épuiser physiquement",
                        impacts: { 
                            stats: { physique: +2, mental: +1 },
                            matchBonuses: { goalChance: +0.07, ratingBonus: +0.15, fatigueRisk: +7}, careerMomentum: +1
                        }
                    },
                    {
                        text: "Jouer la carte de la sécurité, privilégier la conservation et limiter les risques",
                        impacts: { 
                            stats: { technique: +2, discipline: +2 },
                            matchBonuses: { passAccuracy: +0.12, goalChance: -0.03, ratingBonus: +0.08}, careerMomentum: +1
                        }
                    },
                    {
                        text: "Prendre la parole dans le vestiaire pour galvaniser les troupes (Rôle de leader)",
                        impacts: { 
                            stats: { charisme: +3, relationCoach: +2, vestiaire: +3 },
                            matchBonuses: { teamBoost: +0.10, ratingBonus: +0.12}, careerMomentum: +1
                        }
                    },
                    {
                        text: "Rester dans ta bulle, se focaliser uniquement sur tes duels individuels",
                        impacts: { 
                            stats: { mental: +3 },
                            matchBonuses: { duelBonus: +0.10, assistChance: -0.03 }
                        }
                    }
                ]
            };
        } 
        
        // 2. DERBY / RIVAL
        else if (matchType === 'rival') {
            return {
                type: 'rival',
                title: "🔥 Le Derby de tous les Dangers vs " + opponentName,
                description: "L'ambiance est électrique, les supporters attendent un match engagé. Comment abordes-tu l'aspect psychologique de la rencontre ?",
                choices: [
                    {
                        text: "Rentrer dans le duel physique et répondre à l'impact de l'adversaire",
                        impacts: { 
                            stats: { physique: +2, discipline: -4 },
                            matchBonuses: { duelBonus: +0.12, cardRisk: +0.10}, careerMomentum: +1
                        }
                    },
                    {
                        text: "Esquiver les provocations et répondre uniquement par le jeu et la vision",
                        impacts: { 
                            stats: { mental: +3, technique: +1 },
                            matchBonuses: { passAccuracy: +0.10, ratingBonus: +0.12}, careerMomentum: +1
                        }
                    },
                    {
                        text: "Provoquer la défense adverse pour tenter de gratter des fautes ou des penaltys",
                        impacts: { 
                            stats: { charisme: +2, technique: +1 },
                            matchBonuses: { goalChance: +0.08, duelBonus: +0.06}, careerMomentum: +1
                        }
                    }
                ]
            };
        } 
        
        // 3. MATCH CLASSIQUE (Plus rare grâce au filtre)
        else {
            const classicDilemmas = [
                {
                    title: "⚡ Consignes du Coach : Animation Offensive",
                    description: "Avant le coup d'envoi, le coach te demande d'ajuster ton positionnement pour exploiter les failles adverses.",
                    choices: [
                        {
                            text: "Jouer la transition rapide en contre-attaque sur ton aile",
                            impacts: { stats: { vitesse: +2 }, matchBonuses: { counterAttack: +0.12, passAccuracy: -0.03}, careerMomentum: +1 },
                        },
                        {
                            text: "Décrocher au milieu de terrain pour faire circuler le ballon",
                            impacts: { stats: { technique: +2, mental: +1 }, matchBonuses: { assistChance: +0.08, goalChance: -0.03}, careerMomentum: +1 },
                        },
                        {
                            text: "Rester haut sur le terrain pour rôder à l'affût des erreurs de marquage",
                            impacts: { stats: { mental: +2 }, matchBonuses: { goalChance: +0.08, fatigueRisk: +4}, careerMomentum: +1 }
                        }
                    ]
                },
                {
                    title: "🛡️ Ajustement défensif tactique",
                    description: "L'adversaire du jour est réputé pour son jeu de transition rapide. Comment adaptes-tu ton placement ?",
                    choices: [
                        {
                            text: "Coller ton vis-à-vis de près et harceler le porteur de balle",
                            impacts: { stats: { physique: +1, defense: +2 }, matchBonuses: { duelBonus: +0.08, cardRisk: +0.08}, careerMomentum: +1 },
                        },
                        {
                            text: "Garder une position équilibrée pour couper les lignes de passe",
                            impacts: { stats: { mental: +2, defense: +1 }, matchBonuses: { passAccuracy: +0.06, ratingBonus: +0.08}, careerMomentum: +1 }
                        }
                    ]
                }
            ];

            // Sélectionne un dilemme classique au hasard dans la liste
            const randomIndex = Math.floor(Math.random() * classicDilemmas.length);
            return classicDilemmas[randomIndex];
        }
    }
}