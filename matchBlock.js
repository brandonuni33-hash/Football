// matchBlock.js
import { EconomyManager } from './economy.js';
import { TrainingManager } from './entrainement.js';
import { PlayerLogic } from './player.js';
import { ConsequenceSystem } from './consequenceSystem.js';
import { PotentialSystem } from './potentialSystem.js';
import { CompetitionSystem } from './competitionSystem.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const MatchBlockManager = {
    simulateBlock(state, trainingFocus = 'TECHNIQUE', userMatchChoice = null) {
        const player = state.player;
        const calendar = state.calendar;

        if (!player) throw new Error('Impossible de simuler un bloc sans joueur.');

        const trainingEffect = TrainingManager.getEffect(trainingFocus);

        // Le calendrier décide du volume réel : formation, senior ou intersaison.
        const blockPlan = CompetitionSystem.getBlockPlan(state);
        const scheduledMatches = blockPlan.scheduledMatches || [];
        const matchesInMonth = scheduledMatches.length;

        let choiceFatigueExtra = 0;
        let choiceCardRiskExtra = 0;
        let matchRatingBonus = trainingEffect.ratingBonus || 0;
        let goalBonusChance = 0;
        let assistBonusChance = 0;
        let duelBonusChance = 0;

        let choiceConsequenceResult = null;

        if (userMatchChoice) {
            choiceConsequenceResult =
                ConsequenceSystem.applyMatchChoice(
                    player,
                    userMatchChoice
                );

            PlayerLogic.syncProgressionFromCanonical(player);

            const b = userMatchChoice.impacts?.matchBonuses || {};

            matchRatingBonus += b.ratingBonus ?? b.ratingBoost ?? 0;
            goalBonusChance += b.goalChance || 0;
            assistBonusChance += b.assistChance || 0;
            duelBonusChance += b.duelBonus || 0;
            // Anciens bonus tactiques désormais réellement consommés.
            matchRatingBonus += (b.passAccuracy || 0) * 0.20;
            matchRatingBonus += (b.teamBoost || 0) * 0.35;
            goalBonusChance += (b.counterAttack || 0) * 0.20;
            assistBonusChance += (b.counterAttack || 0) * 0.08;
            choiceFatigueExtra += b.fatigueRisk || 0;
            choiceCardRiskExtra += b.cardRisk || 0;

            // Les effets temporaires issus du nouveau système peuvent
            // modifier la performance du bloc actuel.
            matchRatingBonus +=
                ConsequenceSystem.getTemporaryModifier(
                    player,
                    'matchPerformance'
                );

            duelBonusChance +=
                ConsequenceSystem.getTemporaryModifier(
                    player,
                    'duelBonus'
                );

            goalBonusChance +=
                ConsequenceSystem.getTemporaryModifier(
                    player,
                    'goalChance'
                );

            assistBonusChance +=
                ConsequenceSystem.getTemporaryModifier(
                    player,
                    'assistChance'
                );

            choiceFatigueExtra +=
                ConsequenceSystem.getTemporaryModifier(
                    player,
                    'fatigueRisk'
                );

            choiceCardRiskExtra +=
                ConsequenceSystem.getTemporaryModifier(
                    player,
                    'cardRisk'
                );
        }

        // Risque de blessure : injuryProneness est bien un RISQUE.
        // Les bonus temporaires provenant d'un événement ou du coach
        // restent actifs pendant les matchs suivants.
        if (!userMatchChoice) {
            matchRatingBonus +=
                ConsequenceSystem.getTemporaryModifier(player, 'matchPerformance');

            duelBonusChance +=
                ConsequenceSystem.getTemporaryModifier(player, 'duelBonus');

            goalBonusChance +=
                ConsequenceSystem.getTemporaryModifier(player, 'goalChance');

            assistBonusChance +=
                ConsequenceSystem.getTemporaryModifier(player, 'assistChance');

            choiceFatigueExtra +=
                ConsequenceSystem.getTemporaryModifier(player, 'fatigueRisk');

            choiceCardRiskExtra +=
                ConsequenceSystem.getTemporaryModifier(player, 'cardRisk');
        }

        const hidden = player.hidden || {};
        const injuryProneness = clamp(hidden.injuryProneness ?? 10, 1, 20);
        const baseInjuryRisk = injuryProneness * 0.35;
        const fatigueMultiplier =
            (player.fitness ?? 80) < 50 || trainingFocus === 'PHYSIQUE' ? 1.6 : 1;

        let injuryChance =
            matchesInMonth > 0
                ? baseInjuryRisk * fatigueMultiplier * (trainingEffect.injuryRisk || 1)
                : 0;

        injuryChance += choiceFatigueExtra * 0.35;

        const isInjured =
            matchesInMonth > 0 &&
            Math.random() * 100 < injuryChance;

        const baseOvr = player.overall || 40;
        const fitnessFactor = ((player.fitness ?? 80) - 50) / 100;
        const consistency = clamp(hidden.consistency ?? 12, 1, 20);
        const volatility = 1.8 - (consistency / 20) * 0.9;

        const results = Array.from({ length: matchesInMonth }, () => {
            const randomForm = (Math.random() - 0.5) * volatility;
            const baseRating =
                5.4 +
                (baseOvr - 40) * 0.055 +
                fitnessFactor * 0.8 +
                randomForm +
                matchRatingBonus;

            const attackingFactor =
                ((player.attributes?.tir || 40) + (player.attributes?.dribble || 40)) / 200;

            const goalsProbability =
                clamp(0.04 + attackingFactor * 0.16 + goalBonusChance, 0.01, 0.75);

            const assistsProbability =
                clamp(0.06 + ((player.attributes?.passe || 40) / 99) * 0.18 + assistBonusChance, 0.01, 0.75);

            const rating = Number(clamp(baseRating, 4, 10).toFixed(1));

            return {
                rating,
                goals: Math.random() < goalsProbability ? 1 : 0,
                assists: Math.random() < assistsProbability ? 1 : 0
            };
        });

        const totalGoals = results.reduce((sum, match) => sum + match.goals, 0);
        const totalAssists = results.reduce((sum, match) => sum + match.assists, 0);
        const avgRating = matchesInMonth
            ? Number((results.reduce((sum, match) => sum + match.rating, 0) / matchesInMonth).toFixed(1))
            : 0;

        const passes = matchesInMonth
            ? Math.max(0, Math.floor(15 + Math.random() * 35 + (player.attributes?.passe || 40) * 0.12))
            : 0;

        const tackles = matchesInMonth
            ? Math.max(0, Math.floor(2 + Math.random() * 8 + duelBonusChance * 10 + (player.attributes?.defense || 40) * 0.05))
            : 0;

        const yellowCards = matchesInMonth
            ? Array.from({ length: matchesInMonth }, () =>
                Math.random() < clamp(0.04 + choiceCardRiskExtra, 0, 0.6) ? 1 : 0
            ).reduce((a, b) => a + b, 0)
            : 0;

        const summary = {
            rating: avgRating,
            goals: totalGoals,
            assists: totalAssists,
            passes,
            tackles,
            yellowCards,
            // Le potentiel vivant doit connaître les blessures du bloc.
            injured: isInjured
        };

        if (player.stats && matchesInMonth > 0) {
            const previousMatches = player.stats.matchesPlayed || 0;
            const totalMatches = previousMatches + matchesInMonth;

            player.stats.matchesPlayed = totalMatches;
            player.stats.goals = (player.stats.goals || 0) + totalGoals;
            player.stats.assists = (player.stats.assists || 0) + totalAssists;
            player.stats.successfulPasses = (player.stats.successfulPasses || 0) + passes;
            player.stats.tackles = (player.stats.tackles || 0) + tackles;
            player.stats.yellowCards = (player.stats.yellowCards || 0) + yellowCards;

            const previousAverage = player.stats.averageRating || 0;
            player.stats.averageRating = Number(
                (((previousAverage * previousMatches) + (avgRating * matchesInMonth)) / totalMatches).toFixed(1)
            );
        }

        const financeReport = EconomyManager.processBlockFinances(state, summary);

        // La forme d'entraînement a déjà été retirée par TrainingManager.
        // Ici on ne retire que la fatigue liée aux matchs.
        if (matchesInMonth > 0) {
            const moraleImpact = avgRating >= 7 ? 5 : -3;
            player.morale = clamp((player.morale ?? 50) + moraleImpact, 0, 100);

            const matchFatigue =
                matchesInMonth * 2 +
                Math.max(0, choiceFatigueExtra);

            player.fitness = clamp(
                (player.fitness ?? 80) - matchFatigue,
                0,
                100
            );
        } else {
            player.fitness = clamp((player.fitness ?? 80) + 20, 0, 100);
        }

        player.isInjured = isInjured;
        if (isInjured) {
            player.injuryDuration = Math.max(1, Math.floor(Math.random() * 3) + 1);
            player.morale = clamp((player.morale ?? 50) - 15, 0, 100);
        }

        // Le moteur de potentiel accumule la qualité de la période ; le potentiel
        // lui-même ne changera qu'au bilan de saison.
        PotentialSystem.recordMatch(player, summary, matchesInMonth);

        // XP de match : performance réelle, puis synchronisation avec le système de progression.
        const xpMatch = matchesInMonth
            ? Math.round(matchesInMonth * 70 + avgRating * 55 + totalGoals * 90 + totalAssists * 60)
            : 0;

        const progressionResult = PlayerLogic.applyProgression(player, {
            xp: xpMatch,
            type: 'match'
        });

        // Améliorations cachées.
        this.updateHiddenAttributes(player, summary);

        // Un bloc de matchs consomme une unité de durée des effets actifs.
        const expiredEffects =
            ConsequenceSystem.advanceMatch(player);

        return {
            results,
            isInjured,
            summary: {
                ...summary,
                blockPlan,
                scheduledMatches,
                xpGained: xpMatch,
                finance: financeReport,
                progression: progressionResult,
                choiceConsequences: choiceConsequenceResult,
                expiredEffects
            }
        };
    },

    updateHiddenAttributes(player, summary) {
        player.hidden ||= {
            consistency: 12,
            bigMatchPlayer: 12,
            injuryProneness: 10
        };

        if (summary.rating >= 7 && Math.random() < 0.35) {
            player.hidden.consistency = clamp(player.hidden.consistency + 1, 1, 20);
        } else if (summary.rating < 5.5 && Math.random() < 0.25) {
            player.hidden.consistency = clamp(player.hidden.consistency - 1, 1, 20);
        }

        if (
            (summary.goals > 0 || summary.rating >= 8) &&
            Math.random() < 0.25
        ) {
            player.hidden.bigMatchPlayer = clamp(player.hidden.bigMatchPlayer + 1, 1, 20);
        }

        // Un joueur qui se blesse souvent voit son indicateur augmenter.
        if (player.isInjured) {
            player.hidden.injuryProneness = clamp(
                player.hidden.injuryProneness + 1,
                1,
                20
            );
        }
    }
};
