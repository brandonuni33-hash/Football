// matchBlock.js
import { EconomyManager } from './economy.js';
import { TrainingManager } from './entrainement.js';
import { MatchChoiceManager } from './matchChoices.js'; // Import de notre gestionnaire de choix

export const MatchBlockManager = {
    simulateBlock(state, trainingFocus = 'TECHNIQUE', userMatchChoice = null) { 
        const player = state.player;
        const calendar = state.calendar;

        // 0. Récupération des effets du focus
        const trainingEffect = TrainingManager.getEffect(trainingFocus);
        
        // Détermination du nombre de matchs
        let matchesInMonth = 4;
        if (calendar.currentMonth === 12) matchesInMonth = 2;
        else if (calendar.currentMonth === 7) matchesInMonth = 0;
        
        // Initialisation attributs
        if (!player.attributes) {
            player.attributes = { consistency: 12, bigMatchPlayer: 12, injuryProneness: 10 };
        }

        const attrs = player.attributes;
        const volatility = 4.0 - (attrs.consistency / 20 * 2.5); 

        // 2. Gestion blessure
        const baseInjuryRisk = (21 - attrs.injuryProneness) * 0.15; 
        const fatigueMultiplier = ((player.fitness || 80) < 50 || trainingFocus === 'PHYSIQUE') ? 2 : 1; 
        const finalInjuryChance = matchesInMonth > 0 ? (baseInjuryRisk * fatigueMultiplier) : 0;
        const isInjured = Math.random() * 100 < finalInjuryChance;

        // 3. Simulation des matchs
        const results = Array.from({ length: matchesInMonth }, (_, index) => {
            const isLastMatchOfBlock = (index === matchesInMonth - 1);
            let matchRatingBonus = trainingEffect.ratingBonus || 0;
            let goalBonusChance = trainingEffect.goalBonus || 0;
            let assistBonusChance = trainingEffect.assistBonus || 0;

            // Si c'est le dernier match du bloc et qu'un choix tactique a été appliqué
            if (isLastMatchOfBlock && userMatchChoice && userMatchChoice.bonusMatch) {
                const b = userMatchChoice.bonusMatch;
                matchRatingBonus += b.ratingBoost || 0;
                goalBonusChance += b.goalChance || 0;
                assistBonusChance += b.assistChance || 0;
            }

            const baseRating = 6.0 + (Math.random() * volatility);
            
            return {
                rating: parseFloat(Math.min(10.0, Math.max(4.0, baseRating + matchRatingBonus)).toFixed(1)),
                goals: Math.random() > (0.85 - goalBonusChance) ? 1 : 0,
                assists: Math.random() > (0.8 - assistBonusChance) ? 1 : 0
            };
        });

        // 4. Totaux
        const totalGoals = results.reduce((acc, m) => acc + m.goals, 0);
        const totalAssists = results.reduce((acc, m) => acc + m.assists, 0);
        const avgRating = matchesInMonth > 0 ? parseFloat((results.reduce((acc, m) => acc + m.rating, 0) / matchesInMonth).toFixed(1)) : 0.0;
        const blockPasses = matchesInMonth > 0 ? Math.floor(Math.random() * 40) + 20 : 0;
        const blockTackles = matchesInMonth > 0 ? Math.floor(Math.random() * 12) + 3 : 0;

        const blockSummary = { rating: avgRating, goals: totalGoals, assists: totalAssists, passes: blockPasses, tackles: blockTackles };

        // 5. Mise à jour stats globales
        if (player.stats && matchesInMonth > 0) {
            const prevMatches = player.stats.matchesPlayed || 0;
            const newTotalMatches = prevMatches + matchesInMonth;
            player.stats.matchesPlayed = newTotalMatches;
            player.stats.goals += totalGoals;
            player.stats.assists += totalAssists;
            player.stats.successfulPasses += blockPasses;
            player.stats.tackles += blockTackles;
            const currentAvg = player.stats.averageRating || 0.0;
            player.stats.averageRating = parseFloat((((currentAvg * prevMatches) + (avgRating * matchesInMonth)) / newTotalMatches).toFixed(1));
        }

        // 6. Économie
        const financeReport = EconomyManager.processBlockFinances(state, blockSummary);

        // 7. Impact Fitness/Moral
        if (matchesInMonth > 0) {
            const moraleImpact = avgRating >= 7.0 ? 5 : -3;
            player.morale = Math.min(100, Math.max(0, (player.morale || 50) + moraleImpact));
            const fitnessLoss = (matchesInMonth * 2) + (trainingEffect.fitnessCost || 5);
            player.fitness = Math.min(100, Math.max(0, (player.fitness || 80) - fitnessLoss));
        } else {
            player.fitness = Math.min(100, (player.fitness || 80) + 20);
        }
        
        player.isInjured = isInjured;
        if (isInjured) player.morale = Math.max(0, player.morale - 15);

        // 8. Évolution attributs
        if (matchesInMonth > 0) this.updateHiddenAttributes(player, blockSummary);

        return { results, isInjured, summary: { ...blockSummary, finance: financeReport } };
    },

    updateHiddenAttributes(player, blockSummary) {
        const attrs = player.attributes;
        if (blockSummary.rating >= 7.0 && Math.random() < 0.4) attrs.consistency++;
        else if (blockSummary.rating < 5.5 && Math.random() < 0.3) attrs.consistency--;
        
        if ((blockSummary.goals > 0 || blockSummary.rating >= 8.0) && Math.random() < 0.25) attrs.bigMatchPlayer++;
        if (!player.isInjured && Math.random() < 0.15) attrs.injuryProneness++;
    }
};
