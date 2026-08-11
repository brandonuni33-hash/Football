// domain/match/blockMatchSimulator.js
// Simulation des matchs d'un bloc saisonnier.

import { EconomyManager } from '../../economy.js';
import { TrainingManager } from '../../entrainement.js';
import { PlayerLogic } from '../../player.js';
import { ConsequenceSystem } from '../../consequenceSystem.js';
import { PotentialSystem } from '../player/potentialSystem.js';
import { CompetitionSystem } from '../competition/competitionSystem.js';
import CupSystem from '../competition/cupSystem.js';
import { clamp, number, positionGroup, buildMatchResult } from './matchHelpers.js';

export function updateHiddenAttributes(player, summary) {
    player.hidden ||= { consistency: 12, bigMatchPlayer: 12, injuryProneness: 10 };
    if (summary.rating >= 7 && Math.random() < .35) player.hidden.consistency = clamp(number(player.hidden.consistency) + 1, 1, 20);
    else if (summary.rating < 5.5 && Math.random() < .25) player.hidden.consistency = clamp(number(player.hidden.consistency) - 1, 1, 20);
    if ((summary.goals > 0 || summary.rating >= 8) && Math.random() < .25) player.hidden.bigMatchPlayer = clamp(number(player.hidden.bigMatchPlayer) + 1, 1, 20);
    if (player.isInjured) player.hidden.injuryProneness = clamp(number(player.hidden.injuryProneness) + 1, 1, 20);
}

export function simulateBlock(state, trainingFocus = 'TECHNIQUE', userMatchChoice = null) {
    const player = state.player;
    const calendar = state.calendar;
    if (!player) throw new Error('Impossible de simuler un bloc sans joueur.');
    const trainingEffect = TrainingManager.getEffect(trainingFocus);
    const blockPlan = CompetitionSystem.getBlockPlan(state);
    const scheduledMatches = Array.isArray(blockPlan?.scheduledMatches) ? blockPlan.scheduledMatches : [];
    const matchesInBlock = scheduledMatches.length;
    const group = positionGroup(player.position || player.positionId);
    let choiceFatigueExtra = 0, choiceCardRiskExtra = 0, matchRatingBonus = number(trainingEffect?.ratingBonus), goalBonusChance = 0, assistBonusChance = 0, duelBonusChance = 0, choiceConsequenceResult = null;

    if (userMatchChoice) {
        choiceConsequenceResult = ConsequenceSystem.applyMatchChoice(player, userMatchChoice);
        PlayerLogic.syncProgressionFromCanonical(player);
        const bonuses = userMatchChoice.impacts?.matchBonuses || {};
        matchRatingBonus += number(bonuses.ratingBonus ?? bonuses.ratingBoost) + number(bonuses.passAccuracy) * .20 + number(bonuses.teamBoost) * .35;
        goalBonusChance += number(bonuses.goalChance) + number(bonuses.counterAttack) * .20;
        assistBonusChance += number(bonuses.assistChance) + number(bonuses.counterAttack) * .08;
        duelBonusChance += number(bonuses.duelBonus);
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
    const injuryChance = matchesInBlock > 0 ? injuryProneness * .35 * fatigueMultiplier * number(trainingEffect?.injuryRisk || 1) + choiceFatigueExtra * .35 : 0;
    const isInjured = matchesInBlock > 0 && Math.random() * 100 < injuryChance;
    const baseOvr = number(player.overall) || 40;
    const fitnessFactor = (number(player.fitness ?? 80) - 50) / 100;
    const consistency = clamp(number(hidden.consistency ?? 12), 1, 20);
    const volatility = 1.8 - (consistency / 20) * .9;

    const results = scheduledMatches.map((scheduledMatch, matchIndex) => {
        const randomForm = (Math.random() - .5) * volatility;
        const rating = Number(clamp(5.4 + (baseOvr - 40) * .055 + fitnessFactor * .8 + randomForm + matchRatingBonus, 4, 10).toFixed(1));
        const attackingFactor = (number(player.attributes?.tir ?? 40) + number(player.attributes?.dribble ?? 40)) / 200;
        return buildMatchResult({ player, scheduledMatch, matchIndex, rating, group, goalChance: clamp(.04 + attackingFactor * .16 + goalBonusChance, .01, .75), assistChance: clamp(.06 + number(player.attributes?.passe ?? 40) / 99 * .18 + assistBonusChance, .01, .75), duelChance: duelBonusChance });
    });

    const totalGoals = results.reduce((sum, match) => sum + match.goals, 0);
    const totalAssists = results.reduce((sum, match) => sum + match.assists, 0);
    const totalTackles = results.reduce((sum, match) => sum + match.tackles, 0);
    const cleanSheets = results.reduce((sum, match) => sum + (match.cleanSheet ? 1 : 0), 0);
    const avgRating = matchesInBlock ? Number((results.reduce((sum, match) => sum + match.rating, 0) / matchesInBlock).toFixed(1)) : 0;
    const passes = matchesInBlock ? Math.max(0, Math.floor(15 + Math.random() * 35 + number(player.attributes?.passe ?? 40) * .12)) : 0;
    const yellowCards = matchesInBlock ? results.reduce((sum, match) => sum + (Math.random() < clamp(.04 + choiceCardRiskExtra, 0, .6) ? 1 : 0), 0) : 0;
    const summary = { rating: avgRating, goals: totalGoals, assists: totalAssists, passes, tackles: totalTackles, cleanSheets, yellowCards, matchesPlayed: matchesInBlock, injured: isInjured };

    if (player.stats && matchesInBlock > 0) {
        const previousMatches = number(player.stats.matchesPlayed), totalMatches = previousMatches + matchesInBlock;
        player.stats.matchesPlayed = totalMatches;
        player.stats.goals = number(player.stats.goals) + totalGoals;
        player.stats.assists = number(player.stats.assists) + totalAssists;
        player.stats.successfulPasses = number(player.stats.successfulPasses) + passes;
        player.stats.tackles = number(player.stats.tackles) + totalTackles;
        player.stats.yellowCards = number(player.stats.yellowCards) + yellowCards;
        if (group === 'goalkeeper') player.stats.cleanSheets = number(player.stats.cleanSheets) + cleanSheets;
        player.stats.averageRating = Number((((number(player.stats.averageRating) * previousMatches) + (avgRating * matchesInBlock)) / totalMatches).toFixed(1));
    }
    const financeReport = EconomyManager.processBlockFinances(state, summary);
    if (matchesInBlock > 0) { player.morale = clamp(number(player.morale ?? 50) + (avgRating >= 7 ? 5 : -3), 0, 100); player.fitness = clamp(number(player.fitness ?? 80) - (matchesInBlock * 2 + Math.max(0, choiceFatigueExtra)), 0, 100); }
    else player.fitness = clamp(number(player.fitness ?? 80) + 20, 0, 100);
    player.isInjured = isInjured;
    if (isInjured) { player.injuryDuration = Math.max(1, Math.floor(Math.random() * 3) + 1); player.morale = clamp(number(player.morale ?? 50) - 15, 0, 100); }
    PotentialSystem.recordMatch(player, summary, matchesInBlock);
    const xpMatch = matchesInBlock ? Math.round(matchesInBlock * 70 + avgRating * 55 + totalGoals * 90 + totalAssists * 60) : 0;
    const progressionResult = PlayerLogic.applyProgression(player, { xp: xpMatch, type: 'match' });
    updateHiddenAttributes(player, summary);
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
    const europeanStatus = CompetitionSystem.recordEuropeanResults(state, scheduledMatches, results);
    return { results, isInjured, summary: { ...summary, blockPlan, scheduledMatches, matchResults: results, xpGained: xpMatch, finance: financeReport, progression: progressionResult, choiceConsequences: choiceConsequenceResult, expiredEffects, cupResult, cup: CupSystem.getSummary(state), european: europeanStatus } };
}

export const BlockMatchSimulator = { simulateBlock, updateHiddenAttributes };
export default BlockMatchSimulator;
