// matchBlock.js
import { EconomyManager } from './economy.js';

export const MatchBlockManager = {
    /**
     * Simule un bloc de matchs mensuel en tenant compte des attributs cachés du joueur,
     * du calendrier réel (Août à Juillet) et met à jour ses statistiques globales de saison.
     * @param {Object} state - L'état global du joueur/carrière
     * @returns {Object} - Le rapport complet du bloc (résultats, finances, blessure, résumé)
     */
    simulateBlock(state) {
        const player = state.player;
        const calendar = state.calendar;

        // Détermination du nombre de matchs dans le mois selon le calendrier (Août -> Juillet)
        let matchesInMonth = 4; // Standard (environ 4 matchs par mois)
        
        if (calendar.currentMonth === 12) {
            matchesInMonth = 2; // Trêve hivernale / fêtes de fin d'année
        } else if (calendar.currentMonth === 7) {
            matchesInMonth = 0; // Mois de juillet = Trêve estivale / Repos total (Mercato)
        }
        
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
        const finalInjuryChance = matchesInMonth > 0 ? (baseInjuryRisk * fatigueMultiplier) : 0;
        
        const isInjured = Math.random() * 100 < finalInjuryChance;

        // 3. Simulation des matchs du mois
        const results = Array.from({ length: matchesInMonth }, () => {
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
        const avgRating = matchesInMonth > 0 ? parseFloat((results.reduce((acc, m) => acc + m.rating, 0) / matchesInMonth).toFixed(1)) : 0.0;

        // Génération de stats annexes pour le bloc (passes réussies et tacles)
        const blockPasses = matchesInMonth > 0 ? Math.floor(Math.random() * 40) + 20 : 0;
        const blockTackles = matchesInMonth > 0 ? Math.floor(Math.random() * 12) + 3 : 0;

        // Résumé pour l'évolution et les rapports
        const blockSummary = {
            rating: avgRating,
            goals: totalGoals,
            assists: totalAssists,
            passes: blockPasses,
            tackles: blockTackles
        };

        // 5. Mise à jour automatique des statistiques globales de la saison dans le state (si des matchs ont été joués)
        if (player.stats && matchesInMonth > 0) {
            const prevMatches = player.stats.matchesPlayed || 0;
            const newTotalMatches = prevMatches + matchesInMonth;

            player.stats.matchesPlayed = newTotalMatches;
            player.stats.goals += totalGoals;
            player.stats.assists += totalAssists;
            player.stats.successfulPasses += blockPasses;
            player.stats.tackles += blockTackles;

            // Recalcul de la note moyenne globale pondérée sur l'ensemble des matchs joués
            const currentAvg = player.stats.averageRating || 0.0;
            player.stats.averageRating = parseFloat(
                (((currentAvg * prevMatches) + (avgRating * matchesInMonth)) / newTotalMatches).toFixed(1)
            );
        }

        // 6. Mise à jour de l'économie (primes de fin de bloc / salaire mensuel)
        const financeReport = EconomyManager.processBlockFinances(state, blockSummary);

        // 7. Impact sur le joueur (Moral, Fitness et État de santé)
        if (matchesInMonth > 0) {
            const moraleImpact = avgRating >= 7.0 ? 5 : -3;
            player.morale = Math.min(100, Math.max(0, (player.morale || 50) + moraleImpact));
            player.fitness = Math.min(100, Math.max(0, (player.fitness || 80) - (matchesInMonth * 2)));
        } else {
            // Récupération complète pendant les mois de trêve/repos
            player.fitness = Math.min(100, (player.fitness || 80) + 20);
            player.morale = Math.min(100, (player.morale || 50) + 5);
        }
        
        player.isInjured = isInjured;
        if (isInjured) {
            player.morale = Math.max(0, player.morale - 15);
        }

        // 8. Évolution dynamique des attributs cachés
        if (matchesInMonth > 0) {
            this.updateHiddenAttributes(player, blockSummary);
        }

        // 9. Retour du rapport complet pour l'affichage dans l'UI
        return {
            results,
            isInjured,
            summary: {
                goals: totalGoals,
                assists: totalAssists,
                rating: avgRating,
                passes: blockPasses,
                tackles: blockTackles,
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
