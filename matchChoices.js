// matchChoices.js
export class MatchChoiceManager {
    static getMatchDilemma(matchType, opponentName) {
        if (matchType === 'final') {
            return {
                title: "🏆 C'est l'heure de la Finale !",
                description: `Affronter ${opponentName} en finale demande une approche particulière. Quelle est ta stratégie dans le tunnel ?`,
                choices: [
                    {
                        texte: "Mettre une grosse pression physique dès les premières minutes",
                        impacts: { morale: 5, fitness: -10 },
                        bonusMatch: { goalChance: 0.15, tackleBonus: 0.2 }
                    },
                    {
                        texte: "Rester calme et miser sur la maîtrise technique",
                        impacts: { technique: 2, morale: 2 },
                        bonusMatch: { passAccuracy: 0.2, goalChance: 0.05 }
                    },
                    {
                        texte: "Motiver le vestiaire à fond (Rôle de leader)",
                        impacts: { relationCoach: 5, vestiaire: 5 },
                        bonusMatch: { teamBoost: 0.1 }
                    }
                ]
            };
        } else if (matchType === 'rival') {
            return {
                title: "🔥 Derby / Match contre le Rival : " + opponentName,
                description: "La tension est palpable sur les réseaux et dans le stade. Comment gères-tu ton entrée sur la pelouse ?",
                choices: [
                    {
                        texte: "Répondre aux provocations et jouer l'impact total",
                        impacts: { physique: 3, discipline: -5 },
                        bonusMatch: { duelBonus: 0.25 }
                    },
                    {
                        texte: "Se concentrer uniquement sur son jeu et esquiver les embrouilles",
                        impacts: { mental: 3 },
                        bonusMatch: { ratingBoost: 0.3 }
                    }
                ]
            };
        } else {
            // Match classique tous les 4 matchs par exemple
            return {
                title: "⚡ Analyse tactique avant le choc",
                description: "Le coach te convoque pour définir ton positionnement offensif sur ce match clé du bloc.",
                choices: [
                    {
                        texte: "Jouer le contre et utiliser ta pointe de vitesse",
                        impacts: { fitness: -5 },
                        bonusMatch: { counterAttack: 0.2 }
                    },
                    {
                        texte: "Participer activement à la construction du jeu au milieu",
                        impacts: { technique: 2 },
                        bonusMatch: { assistChance: 0.15 }
                    }
                ]
            };
        }
    }
}
