// entrainement.js
import { PlayerLogic } from './player.js';

export const TrainingManager = {
    FOCUS_TYPES: {
        PHYSIQUE: {
            name: 'Physique',
            description: 'Développe l’endurance, la vitesse et la robustesse.',
            fitnessCost: 8,
            ratingBonus: 0.2,
            injuryRisk: 1.15,
            xp: 160,
            repartition: {
                vitesse: 0.30, physique: 0.45, defense: 0.15, tete: 0.10
            }
        },
        TECHNIQUE: {
            name: 'Technique',
            description: 'Améliore le toucher, la passe, le dribble et la finition.',
            fitnessCost: 4,
            ratingBonus: 0.4,
            injuryRisk: 1.0,
            xp: 180,
            repartition: {
                passes: 0.35, dribble: 0.30, tir: 0.20, vitesse: 0.05, physique: 0.05, defense: 0.05
            }
        },
        OFFENSIF: {
            name: 'Finition & Attaque',
            description: 'Travaille les tirs, appels et actions offensives.',
            fitnessCost: 6,
            ratingBonus: 0.5,
            injuryRisk: 1.05,
            xp: 170,
            repartition: {
                tir: 0.40, vitesse: 0.20, dribble: 0.25, passes: 0.10, tete: 0.05
            }
        },
        DEFENSIF: {
            name: 'Tactique & Défense',
            description: 'Renforce le placement, les duels et la rigueur.',
            fitnessCost: 5,
            ratingBonus: 0.3,
            injuryRisk: 1.0,
            xp: 170,
            repartition: {
                defense: 0.40, physique: 0.20, passes: 0.15, vitesse: 0.10, tete: 0.15
            }
        },
        REPOS: {
            name: 'Repos',
            description: 'Récupère de la forme et réduit le risque de blessure.',
            fitnessCost: -15,
            ratingBonus: -0.3,
            injuryRisk: 0.8,
            xp: 40,
            repartition: {}
        }
    },

    getEffect(focusKey) {
        return this.FOCUS_TYPES[focusKey] || this.FOCUS_TYPES.TECHNIQUE;
    },

    applyTraining(player, focusKey = 'TECHNIQUE') {
        if (!player) return null;

        const effect = this.getEffect(focusKey);

        // La forme est appliquée ici UNE seule fois.
        player.fitness = Math.max(
            0,
            Math.min(100, (player.fitness ?? 80) - effect.fitnessCost)
        );

        const progressionResult = PlayerLogic.applyProgression(player, {
            xp: effect.xp,
            type: 'entrainement',
            repartition: effect.repartition
        });

        return {
            ...effect,
            progressionResult,
            fitness: player.fitness,
            overall: player.overall
        };
    }
};
