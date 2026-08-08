// matchBlock.js
import { EconomyManager } from './economy.js';
import { TrainingManager } from './entrainement.js'; // Import du module d'entraînement

export const MatchBlockManager = {
    /**
     * @param {Object} state - L'état global
     * @param {string} trainingFocus - Le focus choisi (ex: 'PHYSIQUE', 'TECHNIQUE')
     */
    simulateBlock(state, trainingFocus) {
        const player = state.player;
        const calendar = state.calendar;

        // 0. Interaction avec le TrainingManager : Récupération des effets du focus
        // On récupère les bonus de stats et l'impact sur la fatigue
        const trainingEffect = TrainingManager.getEffect(trainingFocus);
        
        // Détermination du nombre de matchs
        let matchesInMonth = 4;
        if (calendar.currentMonth === 12) matchesInMonth = 2;
        else if (calendar.currentMonth === 7) matchesInMonth = 0;
        
        // ... (Initialisation des attributs cachés reste identique)
        if (!player.attributes) {
            player.attributes = { consistency: 12, bigMatchPlayer: 12, injuryProneness: 10 };
        }

        const attrs = player.attributes;
        const volatility = 4.0 - (attrs.consistency / 20 * 2.5); 

        // 2. Gestion blessure avec impact du focus 'PHYSIQUE'
        const baseInjuryRisk = (21 - attrs.injuryProneness) * 0.15; 
        // Si entraînement physique poussé, risque un peu plus élevé si fatigue élevée
        const fatigueMultiplier = ((player.fitness || 80) < 50 || trainingFocus === 'PHYSIQUE') ? 2 : 1; 
        const finalInjuryChance = matchesInMonth > 0 ? (baseInjuryRisk * fatigueMultiplier) : 0;
        const isInjured = Math.random() * 100 < finalInjuryChance;

        // 3. Simulation avec bonus liés au TrainingManager
        const results = Array.from({ length: matchesInMonth }, () => {
            const baseRating = 6.0 + (Math.random() * volatility);
            // Application du bonus de performance via le TrainingManager
            const ratingBonus = trainingEffect.ratingBonus || 0;
            
            return {
                rating: parseFloat(Math.min(10.0, Math.max(4.0, baseRating + ratingBonus)).toFixed(1)),
                goals: Math.random() > (0.85 - (trainingEffect.goalBonus || 0)) ? 1 : 0,
                assists: Math.random() > (0.8 - (trainingEffect.assistBonus || 0)) ? 1 : 0
            };
        });

        // 4. Calcul des totaux et moyennes
        const totalGoals = results.reduce((acc, m) => acc + m.goals, 0);
        const totalAssists = results.reduce((acc, m) => acc + m.assists, 0);
        const avgRating = matchesInMonth > 0 ? parseFloat((results.reduce((acc, m) => acc + m.rating, 0) / matchesInMonth).toFixed(1)) : 0.0;
        const blockPasses = matchesInMonth > 0 ? Math.floor(Math.random() * 40) + 20 : 0;
        const blockTackles = matchesInMonth > 0 ? Math.floor(Math.random() * 12) + 3 : 0;

        const blockSummary = { rating: avgRating, goals: totalGoals, assists: totalAssists, passes: blockPasses, tackles: blockTackles };

        // 5. Mise à jour stats globales
        if (player.stats && matchesInMonth > 0) {
            // ... (logique de mise à jour stats reste identique)
        }

        // 6. Mise à jour économie
        const financeReport = EconomyManager.processBlockFinances(state, blockSummary);

        // 7. Impact sur le joueur (Intégration du coût énergétique de l'entraînement)
        if (matchesInMonth > 0) {
            const moraleImpact = avgRating >= 7.0 ? 5 : -3;
            player.morale = Math.min(100, Math.max(0, (player.morale || 50) + moraleImpact));
            // La fitness baisse selon les matchs ET le focus entraînement
            const fitnessLoss = (matchesInMonth * 2) + (trainingEffect.fitnessCost || 5);
            player.fitness = Math.min(100, Math.max(0, (player.fitness || 80) - fitnessLoss));
        } else {
            player.fitness = Math.min(100, (player.fitness || 80) + 20);
        }
        
        player.isInjured = isInjured;

        // 8. Évolution attributs
        if (matchesInMonth > 0) this.updateHiddenAttributes(player, blockSummary);

        return { results, isInjured, summary: { ...blockSummary, finance: financeReport } };
    },

    updateHiddenAttributes(player, blockSummary) {
        // ... (votre logique d'évolution existante)
    }
};
