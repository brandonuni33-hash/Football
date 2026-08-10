// matchBlock.js
// Moteur des rencontres jouées dans un bloc.
// Chaque rencontre programmée est résolue séparément afin de pouvoir afficher
// ensuite une vraie expérience de match : adversaire, score, note et statistiques.

import { EconomyManager } from './economy.js';
import { TrainingManager } from './entrainement.js';
import { PlayerLogic } from './player.js';
import { ConsequenceSystem } from './consequenceSystem.js';
import { PotentialSystem } from './potentialSystem.js';
import { CompetitionSystem } from './competitionSystem.js';
import { CupSystem } from './cupSystem.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;

function positionGroup(position) {
    const p = String(position || '').toUpperCase();
    if (['GK', 'GB', 'G'].includes(p)) return 'goalkeeper';
    if (['DC', 'CB', 'DD', 'RB', 'DG', 'LB', 'D'].includes(p)) return 'defender';
    if (['MC', 'CM', 'MOC', 'CAM', 'MD', 'MG', 'M'].includes(p)) return 'midfielder';
    return 'attacker';
}

function opponentName(match) {
    return match?.opponent || match?.awayClub || match?.homeClub || 'Adversaire';
}

function isHomeMatch(match) {
    if (typeof match?.home === 'boolean') return match.home;
    if (typeof match?.isHome === 'boolean') return match.isHome;
    return true;
}

function competitionLabel(match) {
    return match?.competitionName || match?.competition || match?.competitionId || match?.competitionType || 'Match';
}

function buildScore({ player, rating, group, goalChance, opponentStrength = 50 }) {
    const quality = clamp((number(player.overall) - opponentStrength) / 100, -0.45, 0.45);
    const playerInfluence = clamp((rating - 5.5) / 8, -0.2, 0.55);
    const base = group === 'goalkeeper' ? 0.9 : 1.05;
    const lambda = clamp(base + quality * 1.1 + playerInfluence + goalChance * 0.7 + Math.random() * 0.45, 0.15, 2.9);
    return Math.min(6, Math.floor(-Math.log(Math.max(0.0001, Math.random())) * lambda));
}

function buildMatchResult({ player, scheduledMatch, matchIndex, rating, group, goalChance, assistChance, duelChance }) {
    const home = isHomeMatch(scheduledMatch);
    const opponent = opponentName(scheduledMatch);
    const opponentStrength = number(scheduledMatch?.opponentStrength ?? scheduledMatch?.opponentOverall ?? 50) || 50;
    const teamGoals = buildScore({ player, rating, group, goalChance, opponentStrength });
    const opponentGoals = Math.min(6, Math.floor(Math.random() * Math.max(1, 1.1 + opponentStrength / 55)));
    const playerGoal = Math.random() < clamp(goalChance, 0.01, 0.75) ? 1 : 0;
    const playerAssist = Math.random() < clamp(assistChance, 0.01, 0.75) ? 1 : 0;
    const actualGoals = Math.max(playerGoal, teamGoals > 0 && playerGoal ? 1 : 0);
    const actualAssists = Math.min(playerAssist, Math.max(0, teamGoals));
    const tackles = group === 'goalkeeper'
        ? 0
        : Math.max(0, Math.floor(2 + Math.random() * 7 + duelChance * 8 + number(player.attributes?.defense) * .035));
    const cleanSheet = group === 'goalkeeper' && opponentGoals === 0;

    return {
        matchIndex,
        competitionId: scheduledMatch?.competitionId || null,
        competitionType: scheduledMatch?.competitionType || scheduledMatch?.type || null,
        competitionName: competitionLabel(scheduledMatch),
        phase: scheduledMatch?.phase || null,
        round: scheduledMatch?.round || scheduledMatch?.europeanRound || null,
        opponent,
        home,
        venue: scheduledMatch?.venue || null,
        score: { home: home ? teamGoals : opponentGoals, away: home ? opponentGoals : teamGoals },
        teamGoals,
        opponentGoals,
        result: teamGoals > opponentGoals ? 'win' : teamGoals < opponentGoals ? 'loss' : 'draw',
        rating,
        goals: actualGoals,
        assists: actualAssists,
        tackles,
        cleanSheet,
        played: true
    };
}

export const MatchBlockManager = {
    simulateBlock(state, trainingFocus = 'TECHNIQUE', userMatchChoice = null) {
        const player = state.player;
        const calendar = state.calendar;
        if (!player) throw new Error('Impossible de simuler un bloc sans joueur.');

        const trainingEffect = TrainingManager.getEffect(trainingFocus);
        const blockPlan = CompetitionSystem.getBlockPlan(state);
        const scheduledMatches = Array.isArray(blockPlan?.scheduledMatches) ? blockPlan.scheduledMatches : [];
        const matchesInBlock = scheduledMatches.length;
        const group = positionGroup(player.position || player.positionId);

        let choiceFatigueExtra = 0;
        let choiceCardRiskExtra = 0;
        let matchRatingBonus = number(trainingEffect?.ratingBonus);
        let goalBonusChance = 0;
        let assistBonusChance = 0;
        let duelBonusChance = 0;
        let choiceConsequenceResult = null;

        if (userMatchChoice) {
            choiceConsequenceResult = ConsequenceSystem.applyMatchChoice(player, userMatchChoice);
            PlayerLogic.syncProgressionFromCanonical(player);
            const bonuses = userMatchChoice.impacts?.matchBonuses || {};
            matchRatingBonus += number(bonuses.ratingBonus ?? bonuses.ratingBoost);
            goalBonusChance += number(bonuses.goalChance);
            assistBonusChance += number(bonuses.assistChance);
            duelBonusChance += number(bonuses.duelBonus);
            matchRatingBonus += number(bonuses.passAccuracy) * .20;
            matchRatingBonus += number(bonuses.teamBoost) * .35;
            goalBonusChance += number(bonuses.counterAttack) * .20;
            assistBonusChance += number(bonuses.counterAttack) * .08;
            choiceFatigueExtra += number(bonuses.fatigueRisk);
            choiceCardRiskExtra += number(bonuses.cardRisk);
        }

        matchRatingBonus += ConsequenceSystem.getTemporaryModifier(player, 'matchPerformance');
        duelBonusChance += ConsequenceSystem.getTemporaryModifier(player, 'duelBonus');
        goalBonusChance += ConsequenceSystem.getTemporaryModifier(player, 'goalChance');
        assistBonusChance += ConsequenceSystem.getTemporaryModifier(player, 'assistChance');
        choiceFatigueExtra += ConsequenceSystem.getTemporaryModifier(player, 'fatigueRisk');
        choiceCardRiskExtra += ConsequenceSystem.getTemporaryModifier(player, 'cardRisk');

        const hidden = player.hidden || {};
        const injuryProneness = clamp(number(hidden.injuryProneness ?? 10), 1, 20);
        const fatigueMultiplier = number(player.fitness ?? 80) < 50 || trainingFocus === 'PHYSIQUE' ? 1.6 : 1;
        const injuryChance = matchesInBlock > 0
            ? injuryProneness * .35 * fatigueMultiplier * number(trainingEffect?.injuryRisk || 1) + choiceFatigueExtra * .35
            : 0;
        const isInjured = matchesInBlock > 0 && Math.random() * 100 < injuryChance;

        const baseOvr = number(player.overall) || 40;
        const fitnessFactor = (number(player.fitness ?? 80) - 50) / 100;
        const consistency = clamp(number(hidden.consistency ?? 12), 1, 20);
        const volatility = 1.8 - (consistency / 20) * .9;
        const opponentBase = number(player.overall) || 50;

        const results = scheduledMatches.map((scheduledMatch, matchIndex) => {
            const randomForm = (Math.random() - .5) * volatility;
            const baseRating = 5.4 + (baseOvr - 40) * .055 + fitnessFactor * .8 + randomForm + matchRatingBonus;
            const rating = Number(clamp(baseRating, 4, 10).toFixed(1));
            const attackingFactor = (number(player.attributes?.tir ?? 40) + number(player.attributes?.dribble ?? 40)) / 200;
            const goalsProbability = clamp(.04 + attackingFactor * .16 + goalBonusChance, .01, .75);
            const assistsProbability = clamp(.06 + (number(player.attributes?.passe ?? 40) / 99) * .18 + assistBonusChance, .01, .75);
            return buildMatchResult({
                player,
                scheduledMatch,
                matchIndex,
                rating,
                group,
                goalChance: goalsProbability,
                assistChance: assistsProbability,
                duelChance: duelBonusChance
            });
        });

        const totalGoals = results.reduce((sum, match) => sum + match.goals, 0);
        const totalAssists = results.reduce((sum, match) => sum + match.assists, 0);
        const totalTackles = results.reduce((sum, match) => sum + match.tackles, 0);
        const cleanSheets = results.reduce((sum, match) => sum + (match.cleanSheet ? 1 : 0), 0);
        const avgRating = matchesInBlock
            ? Number((results.reduce((sum, match) => sum + match.rating, 0) / matchesInBlock).toFixed(1))
            : 0;
        const passes = matchesInBlock
            ? Math.max(0, Math.floor(15 + Math.random() * 35 + number(player.attributes?.passe ?? 40) * .12))
            : 0;
        const yellowCards = matchesInBlock
            ? results.reduce(() => 0, 0) + results.reduce((sum) => sum + (Math.random() < clamp(.04 + choiceCardRiskExtra, 0, .6) ? 1 : 0), 0)
            : 0;

        const summary = {
            rating: avgRating,
            goals: totalGoals,
            assists: totalAssists,
            passes,
            tackles: totalTackles,
            cleanSheets,
            yellowCards,
            matchesPlayed: matchesInBlock,
            injured: isInjured
        };

        if (player.stats && matchesInBlock > 0) {
            const previousMatches = number(player.stats.matchesPlayed);
            const totalMatches = previousMatches + matchesInBlock;
            player.stats.matchesPlayed = totalMatches;
            player.stats.goals = number(player.stats.goals) + totalGoals;
            player.stats.assists = number(player.stats.assists) + totalAssists;
            player.stats.successfulPasses = number(player.stats.successfulPasses) + passes;
            player.stats.tackles = number(player.stats.tackles) + totalTackles;
            player.stats.yellowCards = number(player.stats.yellowCards) + yellowCards;
            if (group === 'goalkeeper') player.stats.cleanSheets = number(player.stats.cleanSheets) + cleanSheets;
            const previousAverage = number(player.stats.averageRating);
            player.stats.averageRating = Number((((previousAverage * previousMatches) + (avgRating * matchesInBlock)) / totalMatches).toFixed(1));
        }

        const financeReport = EconomyManager.processBlockFinances(state, summary);

        if (matchesInBlock > 0) {
            player.morale = clamp(number(player.morale ?? 50) + (avgRating >= 7 ? 5 : -3), 0, 100);
            player.fitness = clamp(number(player.fitness ?? 80) - (matchesInBlock * 2 + Math.max(0, choiceFatigueExtra)), 0, 100);
        } else {
            player.fitness = clamp(number(player.fitness ?? 80) + 20, 0, 100);
        }

        player.isInjured = isInjured;
        if (isInjured) {
            player.injuryDuration = Math.max(1, Math.floor(Math.random() * 3) + 1);
            player.morale = clamp(number(player.morale ?? 50) - 15, 0, 100);
        }

        PotentialSystem.recordMatch(player, summary, matchesInBlock);
        const xpMatch = matchesInBlock
            ? Math.round(matchesInBlock * 70 + avgRating * 55 + totalGoals * 90 + totalAssists * 60)
            : 0;
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
            if (cup && cup.status === 'active' && Number(cup.roundMonth) === Number(calendar.currentMonth) && cup.matches?.length) {
                CupSystem.simulateCurrentRound(state);
            }
        }

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
        if (summary.rating >= 7 && Math.random() < .35) player.hidden.consistency = clamp(number(player.hidden.consistency) + 1, 1, 20);
        else if (summary.rating < 5.5 && Math.random() < .25) player.hidden.consistency = clamp(number(player.hidden.consistency) - 1, 1, 20);
        if ((summary.goals > 0 || summary.rating >= 8) && Math.random() < .25) player.hidden.bigMatchPlayer = clamp(number(player.hidden.bigMatchPlayer) + 1, 1, 20);
        if (player.isInjured) player.hidden.injuryProneness = clamp(number(player.hidden.injuryProneness) + 1, 1, 20);
    }
};
