// matchBlock.js
import { EconomyManager } from './economy.js';

export const MatchBlockManager = {
    /**
     * Simule un bloc de 4 matchs en tenant compte des attributs cachés du joueur
     * @param {Object} state - L'état global du joueur/carrière
     * @returns {Object} - Le rapport complet du bloc (résultats, finances, blessure, résumé)
     */
    simulateBlock(state) {
        const player = state.player;
        
        // Sécurité : initialisation des attributs cachés s'ils n'existent pas encore
        if (!player.attributes) {
            player.attributes = {
                consistency: Math.floor(Math.random() * 8) + 8,      // Entre 8 et 15
                bigMatchPlayer: Math.floor(Math.random() * 8) + 8,   // Entre 8 et 15
                injuryProneness: Math.floor(Math.random() * 10) + 6  // Entre 6 et 15
            };
        }

        const attrs = player.attributes;

        // 1. Calcul de la Constance (Impact sur la volatilité des notes)
        const volatility = 4.0 - (attrs.consistency / 20 * 2.5); 

        // 2. Gestion du risque de blessure (pondéré)
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

        // Résumé pour l'évolution et les rapports
        const blockSummary = {
            rating: avgRating,
            goals: totalGoals,
            assists: totalAssists
        };

        // 5. Mise à jour de l'économie (primes de performance)
        const financeReport = EconomyManager.processWeeklyFinances(state, blockSummary);

        // 6. Impact sur le joueur (Moral, Fitness et État de santé)
        const moraleImpact = avgRating >= 7.0 ? 5 : -3;
        player.morale = Math.min(100, Math.max(0, (player.morale || 50) + moraleImpact));
        player.fitness = Math.min(100, Math.max(0, (player.fitness || 80) - 5));
        
        player.isInjured = isInjured;
        if (isInjured) {
            player.morale = Math.max(0, player.morale - 15);
        }

        // 7. Évolution dynamique des attributs cachés
        this.updateHiddenAttributes(player, blockSummary);

        // 8. Retour du rapport complet pour l'affichage dans l'UI
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
    },

    /**
     * Fait évoluer les attributs cachés du joueur en fonction de ses performances
     */
    updateHiddenAttributes(player, blockSummary) {
        const attrs = player.attributes;

        // Évolution de la CONSTANCE
        if (blockSummary.rating >= 7.0 && Math.random() < 0.4) {
            if (attrs.consistency < 20) attrs.consistency++;
        } else if (blockSummary.rating < 5.5 && Math.random() < 0.3) {
            if (attrs.consistency > 1) attrs.consistency--;
        }

        // Évolution de MATCH IMPORTANT (Big Match Player)
        if ((blockSummary.goals > 0 || blockSummary.rating >= 8.0) && Math.random() < 0.25) {
            if (attrs.bigMatchPlayer < 20) attrs.bigMatchPlayer++;
        }

        // Évolution de la RÉSISTANCE AUX BLESSURES
        if (!player.isInjured && Math.random() < 0.15) {
            if (attrs.injuryProneness < 20) attrs.injuryProneness++;
        }
    }
};
