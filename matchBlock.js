// matchBlock.js
import { EconomyManager } from './economy.js';
import { TrainingManager } from './entrainement.js';
import { PlayerLogic } from './player.js';
import { ConsequenceSystem } from './consequenceSystem.js';
import { PotentialSystem } from './potentialSystem.js';
import { CompetitionSystem } from './competitionSystem.js';
import { CupSystem } from './cupSystem.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const MatchBlockManager = {
    simulateBlock(state, trainingFocus = 'TECHNIQUE', userMatchChoice = null) {
        const player = state.player;
        const calendar = state.calendar;
        if (!player) throw new Error('Impossible de simuler un bloc sans joueur.');
        const trainingEffect = TrainingManager.getEffect(trainingFocus);
        const blockPlan = CompetitionSystem.getBlockPlan(state);
        const scheduledMatches = blockPlan.scheduledMatches || [];
        const matchesInMonth = scheduledMatches.length;
        let choiceFatigueExtra = 0, choiceCardRiskExtra = 0;
        let matchRatingBonus = trainingEffect.ratingBonus || 0;
        let goalBonusChance = 0, assistBonusChance = 0, duelBonusChance = 0;
        let choiceConsequenceResult = null;

        if (userMatchChoice) {
            choiceConsequenceResult = ConsequenceSystem.applyMatchChoice(player, userMatchChoice);
            PlayerLogic.syncProgressionFromCanonical(player);
            const b = userMatchChoice.impacts?.matchBonuses || {};
            matchRatingBonus += b.ratingBonus ?? b.ratingBoost ?? 0;
            goalBonusChance += b.goalChance || 0;
            assistBonusChance += b.assistChance || 0;
            duelBonusChance += b.duelBonus || 0;
            matchRatingBonus += (b.passAccuracy || 0) * .20;
            matchRatingBonus += (b.teamBoost || 0) * .35;
            goalBonusChance += (b.counterAttack || 0) * .20;
            assistBonusChance += (b.counterAttack || 0) * .08;
            choiceFatigueExtra += b.fatigueRisk || 0;
            choiceCardRiskExtra += b.cardRisk || 0;
            matchRatingBonus += ConsequenceSystem.getTemporaryModifier(player, 'matchPerformance');
            duelBonusChance += ConsequenceSystem.getTemporaryModifier(player, 'duelBonus');
            goalBonusChance += ConsequenceSystem.getTemporaryModifier(player, 'goalChance');
            assistBonusChance += ConsequenceSystem.getTemporaryModifier(player, 'assistChance');
            choiceFatigueExtra += ConsequenceSystem.getTemporaryModifier(player, 'fatigueRisk');
            choiceCardRiskExtra += ConsequenceSystem.getTemporaryModifier(player, 'cardRisk');
        } else {
            matchRatingBonus += ConsequenceSystem.getTemporaryModifier(player, 'matchPerformance');
            duelBonusChance += ConsequenceSystem.getTemporaryModifier(player, 'duelBonus');
            goalBonusChance += ConsequenceSystem.getTemporaryModifier(player, 'goalChance');
            assistBonusChance += ConsequenceSystem.getTemporaryModifier(player, 'assistChance');
            choiceFatigueExtra += ConsequenceSystem.getTemporaryModifier(player, 'fatigueRisk');
            choiceCardRiskExtra += ConsequenceSystem.getTemporaryModifier(player, 'cardRisk');
        }

        const hidden = player.hidden || {};
        const injuryProneness = clamp(hidden.injuryProneness ?? 10, 1, 20);
        const fatigueMultiplier = (player.fitness ?? 80) < 50 || trainingFocus === 'PHYSIQUE' ? 1.6 : 1;
        let injuryChance = matchesInMonth > 0 ? injuryProneness * .35 * fatigueMultiplier * (trainingEffect.injuryRisk || 1) : 0;
        injuryChance += choiceFatigueExtra * .35;
        const isInjured = matchesInMonth > 0 && Math.random() * 100 < injuryChance;
        const baseOvr = player.overall || 40;
        const fitnessFactor = ((player.fitness ?? 80) - 50) / 100;
        const consistency = clamp(hidden.consistency ?? 12, 1, 20);
        const volatility = 1.8 - (consistency / 20) * .9;

        const results = Array.from({ length: matchesInMonth }, (_, matchIndex) => {
            const scheduledMatch = scheduledMatches[matchIndex] || null;
            const randomForm = (Math.random() - .5) * volatility;
            const baseRating = 5.4 + (baseOvr - 40) * .055 + fitnessFactor * .8 + randomForm + matchRatingBonus;
            const attackingFactor = ((player.attributes?.tir || 40) + (player.attributes?.dribble || 40)) / 200;
            const goalsProbability = clamp(.04 + attackingFactor * .16 + goalBonusChance, .01, .75);
            const assistsProbability = clamp(.06 + ((player.attributes?.passe || 40) / 99) * .18 + assistBonusChance, .01, .75);
            const rating = Number(clamp(baseRating, 4, 10).toFixed(1));
            return {
                matchIndex,
                competitionId: scheduledMatch?.competitionId || null,
                competitionType: scheduledMatch?.competitionType || scheduledMatch?.type || null,
                phase: scheduledMatch?.phase || null,
                round: scheduledMatch?.round || scheduledMatch?.europeanRound || null,
                opponent: scheduledMatch?.opponent || scheduledMatch?.awayClub || scheduledMatch?.homeClub || null,
                rating,
                goals: Math.random() < goalsProbability ? 1 : 0,
                assists: Math.random() < assistsProbability ? 1 : 0
            };
        });

        const totalGoals = results.reduce((sum, match) => sum + match.goals, 0);
        const totalAssists = results.reduce((sum, match) => sum + match.assists, 0);
        const avgRating = matchesInMonth ? Number((results.reduce((sum, match) => sum + match.rating, 0) / matchesInMonth).toFixed(1)) : 0;
        const passes = matchesInMonth ? Math.max(0, Math.floor(15 + Math.random() * 35 + (player.attributes?.passe || 40) * .12)) : 0;
        const tackles = matchesInMonth ? Math.max(0, Math.floor(2 + Math.random() * 8 + duelBonusChance * 10 + (player.attributes?.defense || 40) * .05)) : 0;
        const yellowCards = matchesInMonth ? Array.from({ length: matchesInMonth }, () => Math.random() < clamp(.04 + choiceCardRiskExtra, 0, .6) ? 1 : 0).reduce((a,b) => a+b, 0) : 0;
        const summary = { rating: avgRating, goals: totalGoals, assists: totalAssists, passes, tackles, yellowCards, injured: isInjured };

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
            player.stats.averageRating = Number((((previousAverage * previousMatches) + (avgRating * matchesInMonth)) / totalMatches).toFixed(1));
        }

        const financeReport = EconomyManager.processBlockFinances(state, summary);
        if (matchesInMonth > 0) {
            player.morale = clamp((player.morale ?? 50) + (avgRating >= 7 ? 5 : -3), 0, 100);
            player.fitness = clamp((player.fitness ?? 80) - (matchesInMonth * 2 + Math.max(0, choiceFatigueExtra)), 0, 100);
        } else {
            player.fitness = clamp((player.fitness ?? 80) + 20, 0, 100);
        }
        player.isInjured = isInjured;
        if (isInjured) {
            player.injuryDuration = Math.max(1, Math.floor(Math.random() * 3) + 1);
            player.morale = clamp((player.morale ?? 50) - 15, 0, 100);
        }

        PotentialSystem.recordMatch(player, summary, matchesInMonth);
        const xpMatch = matchesInMonth ? Math.round(matchesInMonth * 70 + avgRating * 55 + totalGoals * 90 + totalAssists * 60) : 0;
        const progressionResult = PlayerLogic.applyProgression(player, { xp: xpMatch, type: 'match' });
        this.updateHiddenAttributes(player, summary);
        const expiredEffects = ConsequenceSystem.advanceMatch(player);

        let cupResult = null;
        const cupMatchIndex = scheduledMatches.findIndex(match => match.competitionType === 'national_cup');
        const cupMatch = cupMatchIndex >= 0 ? scheduledMatches[cupMatchIndex] : null;
        if (cupMatch) {
            cupResult = CupSystem.resolvePlayerMatch(state, cupMatch, results[cupMatchIndex] || {});
            CupSystem.simulateCurrentRound(state);
        } else {
            const cup = CupSystem.getCup(state);
            if (cup && cup.status === 'active' && Number(cup.roundMonth) === Number(calendar.currentMonth) && cup.matches?.length) CupSystem.simulateCurrentRound(state);
        }

        // Les résultats du bloc alimentent maintenant la phase de ligue
        // européenne puis les barrages, huitièmes, quarts, demies et finale.
        const europeanStatus = CompetitionSystem.recordEuropeanResults(state, scheduledMatches, results);

        return {
            results,
            isInjured,
            summary: {
                ...summary,
                blockPlan,
                scheduledMatches,
                matchResults: results,
                xpGained: xpMatch,
                finance: financeReport,
                progression: progressionResult,
                choiceConsequences: choiceConsequenceResult,
                expiredEffects,
                cupResult,
                cup: CupSystem.getSummary(state),
                european: europeanStatus
            }
        };
    },

    updateHiddenAttributes(player, summary) {
        player.hidden ||= { consistency: 12, bigMatchPlayer: 12, injuryProneness: 10 };
        if (summary.rating >= 7 && Math.random() < .35) player.hidden.consistency = clamp(player.hidden.consistency + 1, 1, 20);
        else if (summary.rating < 5.5 && Math.random() < .25) player.hidden.consistency = clamp(player.hidden.consistency - 1, 1, 20);
        if ((summary.goals > 0 || summary.rating >= 8) && Math.random() < .25) player.hidden.bigMatchPlayer = clamp(player.hidden.bigMatchPlayer + 1, 1, 20);
        if (player.isInjured) player.hidden.injuryProneness = clamp(player.hidden.injuryProneness + 1, 1, 20);
    }
};
