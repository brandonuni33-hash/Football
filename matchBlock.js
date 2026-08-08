// matchBlock.js
import { EconomyManager } from './economy.js';

export const MatchBlockManager = {
    /**
     * Simule un bloc de 4 matchs en tenant compte des attributs cachés du joueur
     * @param {Object} state - L'état global du joueur/carrière
     * @returns {Object} - Le rapport complet du bloc (résultats, finances, blessure)
     */
    simulateBlock(state) {
        const player = state.player;
        
        // Sécurité : initialisation des attributs cachés s'ils n'existent pas encore
        if (!player.attributes) {
            player.attributes = {
                consistency: Math.floor(Math.random() * 15) + 5,      // Entre 5 et 20
                bigMatchPlayer: Math.floor(Math.random() * 15) + 5,   // Entre 5 et 20
                injuryProneness: Math.floor(Math.random() * 15) + 5   // Entre 5 et 20
            };
        }

        const attrs = player.attributes;

        // 1. Calcul de la Constance (Impact sur la volatilité des notes)
        const volatility = 4.0 - (attrs.consistency / 20 * 2.5); 

        // 2. Gestion du risque de blessure (pondéré, pas systématique)
        const baseInjuryRisk = (21 - attrs.injuryProneness) * 0.15; 
        const fatigueMultiplier = (player.fitness || 80) < 50 ? 2 : 1; 
        const finalInjuryChance = baseInjuryRisk * fatigueMultiplier;
        
        const isInjured = Math.random() * 100 < finalInjuryChance;

        // 3. Simulation des 4 matchs
        const results = Array.from({ length: 4 }, () => {
            const baseRating = 6.0 + (Math.random() * volatility);
            
            return {
                rating: parseFloat(Math.min(10.0, Math.max(4.0, baseRating)).toFixed(1)),
                goals: Math.random() > 0.85 ? 1 : 0,
                assists: Math.random() > 0.8 ? 1 : 0
            };
        });

        // 4. Calcul des totaux et moyennes du bloc
        const totalGoals = results.reduce((acc, m) => acc + m.goals, 0);
        const totalAssists = results.reduce((acc, m) => acc + m.assists, 0);
        const avgRating = parseFloat((results.reduce((acc, m) => acc + m.rating, 0) / 4).toFixed(1));

        // 5. Mise à jour de l'économie (primes de performance)
        const financeReport = EconomyManager.processWeeklyFinances(state, {
            rating: avgRating,
            goals: totalGoals,
            assists: totalAssists
        });

        // 6. Impact sur le joueur (Moral, Fitness et État de santé)
        const moraleImpact = avgRating >= 7.0 ? 5 : -3;
        player.morale = Math.min(100, Math.max(0, (player.morale || 50) + moraleImpact));
        player.fitness = Math.min(100, Math.max(0, (player.fitness || 80) - 5));
        
        if (isInjured) {
            player.isInjured = true;
            player.morale = Math.max(0, player.morale - 15);
        }

        // 7. Retour du rapport complet pour l'affichage
        return {
            results,
            isInjured,
            summary: {
                goals: totalGoals,
                assists: totalAssists,
                rating: avgRating,
                finance: financeReport
            }
        };
    }
};
