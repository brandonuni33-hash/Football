// matchBlock.js
// Moteur des rencontres jouées dans un bloc.
// Un bloc peut désormais ouvrir une vraie rencontre interactive :
// contexte -> moments clés -> décisions -> résultat final.

import { EconomyManager } from './economy.js';
import { TrainingManager } from './entrainement.js';
import { PlayerLogic } from './player.js';
import { ConsequenceSystem } from './consequenceSystem.js';
import { PotentialSystem } from './potentialSystem.js';
import { CompetitionSystem } from './competitionSystem.js';
import { CupSystem } from './cupSystem.js';
import { MatchChoiceManager } from './matchChoices.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;

function positionGroup(position) {
    const p = String(position || '').toUpperCase();
    if (['GK', 'GB', 'G'].includes(p)) return 'goalkeeper';
    if (['DC', 'CB', 'DD', 'RB', 'DG', 'LB', 'D'].includes(p)) return 'defender';
    if (['MC', 'CM', 'MOC', 'CAM', 'MD', 'MG', 'M'].includes(p)) return 'midfielder';
    return 'attacker';
}

function opponentName(match) { return match?.opponent || match?.awayClub || match?.homeClub || 'Adversaire'; }
function isHomeMatch(match) { return typeof match?.home === 'boolean' ? match.home : typeof match?.isHome === 'boolean' ? match.isHome : true; }
function competitionLabel(match) { return match?.competitionName || match?.competition || match?.competitionId || match?.competitionType || 'Match'; }
function matchType(match) {
    const phase = String(match?.phase || '').toLowerCase();
    const round = String(match?.round || match?.europeanRound || '').toLowerCase();
    if (phase.includes('final') || round.includes('final') || match?.importance === 'final') return 'final';
    if (match?.rival || match?.isDerby || String(match?.type || '').toLowerCase().includes('rival')) return 'rival';
    return 'classic';
}
function importanceFor(match) {
    const type = matchType(match);
    if (type === 'final') return 'exceptional';
    if (type === 'rival' || match?.importance === 'high' || match?.importance === 'important') return 'important';
    return 'normal';
}
function decisionCount(match) {
    const importance = importanceFor(match);
    if (importance === 'exceptional') return 4;
    if (importance === 'important') return 3;
    return 2;
}
function decisionMoments(match) {
    const count = decisionCount(match);
    const base = count === 4 ? [15, 34, 62, 82] : count === 3 ? [24, 55, 76] : [31, 68];
    return base.slice(0, count);
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
    const tackles = group === 'goalkeeper' ? 0 : Math.max(0, Math.floor(2 + Math.random() * 7 + duelChance * 8 + number(player.attributes?.defense) * .035));
    const cleanSheet = group === 'goalkeeper' && opponentGoals === 0;
    return { matchIndex, competitionId: scheduledMatch?.competitionId || null, competitionType: scheduledMatch?.competitionType || scheduledMatch?.type || null, competitionName: competitionLabel(scheduledMatch), phase: scheduledMatch?.phase || null, round: scheduledMatch?.round || scheduledMatch?.europeanRound || null, opponent, home, venue: scheduledMatch?.venue || null, score: { home: home ? teamGoals : opponentGoals, away: home ? opponentGoals : teamGoals }, teamGoals, opponentGoals, result: teamGoals > opponentGoals ? 'win' : teamGoals < opponentGoals ? 'loss' : 'draw', rating, goals: actualGoals, assists: actualAssists, tackles, cleanSheet, played: true };
}

function interactiveChoice(match, player, moment, index, previous = []) {
    const type = matchType(match);
    const dilemma = MatchChoiceManager.getMatchDilemma(type, opponentName(match));
    const templates = dilemma?.choices || [];
    const fallback = [
        { text: 'Prendre l’initiative', impacts: { ratingBonus: .16, goalChance: .035, fatigueRisk: 3 } },
        { text: 'Jouer simple et sécuriser', impacts: { ratingBonus: .08, passAccuracy: .08, fatigueRisk: -1 } },
        { text: 'Chercher le duel', impacts: { ratingBonus: .04, duelBonus: .10, cardRisk: .06, fatigueRisk: 2 } },
        { text: 'Rester patient', impacts: { ratingBonus: .03, assistChance: .04, fatigueRisk: -2 } }
    ];
    const choices = templates.length >= 2 ? templates.slice(0, 4).map(c => ({ text: c.text || c.texte || c.label, impacts: c.impacts || {} })) : fallback;
    const phase = moment <= 30 ? 'Début de match' : moment <= 60 ? 'Seconde période' : 'Fin de match';
    const context = previous.length ? 'Le match a évolué. Ta dernière décision a changé la dynamique.' : 'Le match commence et le contexte est encore ouvert.';
    return {
        id: `match-${Date.now()}-${index}`,
        minute: moment,
        phase,
        type,
        title: dilemma?.title || `Moment clé · ${moment}'`,
        description: `${context} ${dilemma?.description || `Face à ${opponentName(match)}, comment abordes-tu cette situation ?`}`,
        choices
    };
}

export const MatchBlockManager = {
    // ─────────────────────────────────────────────────────────────
    // NOUVEAU : vraie session de match, sans avancer le calendrier.
    // ─────────────────────────────────────────────────────────────
    startInteractiveMatch(state, scheduledMatch, matchIndex = 0) {
        if (!state?.player) throw new Error('Impossible de démarrer un match sans joueur.');
        const player = state.player;
        const moments = decisionMoments(scheduledMatch);
        const session = {
            id: `match-session-${Date.now()}-${matchIndex}`,
            matchIndex,
            match: scheduledMatch,
            type: matchType(scheduledMatch),
            importance: importanceFor(scheduledMatch),
            opponent: opponentName(scheduledMatch),
            home: isHomeMatch(scheduledMatch),
            competition: competitionLabel(scheduledMatch),
            moments,
            currentMoment: 0,
            decisions: [],
            events: [],
            score: { home: 0, away: 0 },
            playerRatingBase: 6.2 + (number(player.overall) - 50) * .035,
            modifiers: { rating: 0, goal: 0, assist: 0, duel: 0, fatigue: 0, cards: 0 },
            startedAt: Date.now(),
            finished: false
        };
        session.decision = interactiveChoice(scheduledMatch, player, moments[0], 0);
        return session;
    },

    resolveInteractiveDecision(state, session, choiceIndex) {
        if (!state?.player || !session || session.finished) throw new Error('Session de match invalide.');
        const decision = session.decision;
        const choice = decision?.choices?.[Number(choiceIndex)];
        if (!choice) throw new Error('Choix de match invalide.');
        const impacts = choice.impacts || {};
        const bonuses = impacts.matchBonuses || impacts;
        session.decisions.push({ minute: decision.minute, phase: decision.phase, choice: choice.text, impacts: bonuses });
        session.modifiers.rating += number(bonuses.ratingBonus ?? bonuses.ratingBoost) + number(bonuses.passAccuracy) * .20 + number(bonuses.teamBoost) * .35;
        session.modifiers.goal += number(bonuses.goalChance) + number(bonuses.counterAttack) * .20;
        session.modifiers.assist += number(bonuses.assistChance) + number(bonuses.counterAttack) * .08;
        session.modifiers.duel += number(bonuses.duelBonus);
        session.modifiers.fatigue += number(bonuses.fatigueRisk);
        session.modifiers.cards += number(bonuses.cardRisk);

        // Conséquence cachée : on enregistre l'impact, mais l'UI n'affiche pas les chiffres.
        const roll = Math.random();
        if (roll < .13 + Math.max(0, session.modifiers.goal) * .20) {
            session.events.push({ minute: decision.minute, icon: '⚡', text: 'Ton choix crée une occasion dangereuse.' });
            session.score[session.home ? 'home' : 'away'] += Math.random() < .38 ? 1 : 0;
        } else if (roll < .25) {
            session.events.push({ minute: decision.minute, icon: '🎯', text: 'Ton équipe prend progressivement le contrôle.' });
        } else if (roll < .34) {
            session.events.push({ minute: decision.minute, icon: '🛡️', text: 'Tu fermes bien ton espace.' });
        }

        session.currentMoment += 1;
        if (session.currentMoment < session.moments.length) {
            const minute = session.moments[session.currentMoment];
            session.decision = interactiveChoice(session.match, state.player, minute, session.currentMoment, session.decisions);
            return { finished: false, session, decision: session.decision, event: session.events.at(-1) || null };
        }

        const group = positionGroup(state.player.position || state.player.positionId);
        const opponentStrength = number(session.match?.opponentStrength ?? session.match?.opponentOverall ?? 50) || 50;
        const rating = Number(clamp(session.playerRatingBase + session.modifiers.rating + (Math.random() - .5) * 1.1, 4, 10).toFixed(1));
        const goalChance = clamp(.04 + (number(state.player.attributes?.tir ?? 40) + number(state.player.attributes?.dribble ?? 40)) / 200 * .16 + session.modifiers.goal, .01, .75);
        const assistChance = clamp(.06 + number(state.player.attributes?.passe ?? 40) / 99 * .18 + session.modifiers.assist, .01, .75);
        const opponentGoals = Math.min(5, Math.max(0, Math.floor(Math.random() * Math.max(1, 1.0 + opponentStrength / 60))));
        let teamGoals = session.score[session.home ? 'home' : 'away'];
        if (teamGoals === 0) teamGoals = buildScore({ player: state.player, rating, group, goalChance, opponentStrength });
        const result = {
            matchIndex: session.matchIndex,
            competitionId: session.match?.competitionId || null,
            competitionType: session.match?.competitionType || session.match?.type || null,
            competitionName: session.competition,
            phase: session.match?.phase || null,
            round: session.match?.round || null,
            opponent: session.opponent,
            home: session.home,
            venue: session.match?.venue || null,
            score: { home: session.home ? teamGoals : opponentGoals, away: session.home ? opponentGoals : teamGoals },
            teamGoals, opponentGoals,
            result: teamGoals > opponentGoals ? 'win' : teamGoals < opponentGoals ? 'loss' : 'draw',
            rating,
            goals: Math.random() < goalChance ? 1 : 0,
            assists: Math.random() < assistChance && teamGoals > 0 ? 1 : 0,
            tackles: group === 'goalkeeper' ? 0 : Math.max(1, Math.floor(2 + Math.random() * 6 + session.modifiers.duel * 8)),
            cleanSheet: group === 'goalkeeper' && opponentGoals === 0,
            played: true,
            decisions: session.decisions,
            events: session.events
        };
        session.result = result;
        session.score = result.score;
        session.finished = true;
        session.decision = null;
        return { finished: true, session, result, events: session.events };
    },

    // Applique les statistiques d'un match interactif terminé.
    commitInteractiveResult(state, result) {
        const player = state?.player;
        if (!player || !result) return null;
        const s = player.stats || (player.stats = {});
        const previousMatches = number(s.matchesPlayed);
        const totalMatches = previousMatches + 1;
        s.matchesPlayed = totalMatches;
        s.goals = number(s.goals) + number(result.goals);
        s.assists = number(s.assists) + number(result.assists);
        s.tackles = number(s.tackles) + number(result.tackles);
        s.yellowCards = number(s.yellowCards);
        if (result.cleanSheet) s.cleanSheets = number(s.cleanSheets) + 1;
        s.averageRating = Number((((number(s.averageRating) * previousMatches) + number(result.rating)) / totalMatches).toFixed(1));
        player.morale = clamp(number(player.morale ?? 50) + (result.rating >= 7 ? 2 : result.rating < 5.5 ? -2 : 0), 0, 100);
        player.fitness = clamp(number(player.fitness ?? 80) - 3, 0, 100);
        PotentialSystem.recordMatch(player, { rating: result.rating, goals: result.goals, assists: result.assists, tackles: result.tackles, matchesPlayed: 1 }, 1);
        PlayerLogic.applyProgression(player, { xp: Math.round(70 + result.rating * 40 + result.goals * 90 + result.assists * 60), type: 'match' });
        return result;
    },

    simulateBlock(state, trainingFocus = 'TECHNIQUE', userMatchChoice = null) {
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
            duelBonusChance += number(bonuses.duelBonus); choiceFatigueExtra += number(bonuses.fatigueRisk); choiceCardRiskExtra += number(bonuses.cardRisk);
        }
        matchRatingBonus += ConsequenceSystem.getTemporaryModifier(player, 'matchPerformance');
        duelBonusChance += ConsequenceSystem.getTemporaryModifier(player, 'duelBonus'); goalBonusChance += ConsequenceSystem.getTemporaryModifier(player, 'goalChance'); assistBonusChance += ConsequenceSystem.getTemporaryModifier(player, 'assistChance'); choiceFatigueExtra += ConsequenceSystem.getTemporaryModifier(player, 'fatigueRisk'); choiceCardRiskExtra += ConsequenceSystem.getTemporaryModifier(player, 'cardRisk');
        const hidden = player.hidden || {}; const injuryProneness = clamp(number(hidden.injuryProneness ?? 10), 1, 20); const fatigueMultiplier = number(player.fitness ?? 80) < 50 || trainingFocus === 'PHYSIQUE' ? 1.6 : 1; const injuryChance = matchesInBlock > 0 ? injuryProneness * .35 * fatigueMultiplier * number(trainingEffect?.injuryRisk || 1) + choiceFatigueExtra * .35 : 0; const isInjured = matchesInBlock > 0 && Math.random() * 100 < injuryChance;
        const baseOvr = number(player.overall) || 40; const fitnessFactor = (number(player.fitness ?? 80) - 50) / 100; const consistency = clamp(number(hidden.consistency ?? 12), 1, 20); const volatility = 1.8 - (consistency / 20) * .9;
        const results = scheduledMatches.map((scheduledMatch, matchIndex) => { const randomForm = (Math.random() - .5) * volatility; const rating = Number(clamp(5.4 + (baseOvr - 40) * .055 + fitnessFactor * .8 + randomForm + matchRatingBonus, 4, 10).toFixed(1)); const attackingFactor = (number(player.attributes?.tir ?? 40) + number(player.attributes?.dribble ?? 40)) / 200; return buildMatchResult({ player, scheduledMatch, matchIndex, rating, group, goalChance: clamp(.04 + attackingFactor * .16 + goalBonusChance, .01, .75), assistChance: clamp(.06 + number(player.attributes?.passe ?? 40) / 99 * .18 + assistBonusChance, .01, .75), duelChance: duelBonusChance }); });
        const totalGoals = results.reduce((sum, m) => sum + m.goals, 0), totalAssists = results.reduce((sum, m) => sum + m.assists, 0), totalTackles = results.reduce((sum, m) => sum + m.tackles, 0), cleanSheets = results.reduce((sum, m) => sum + (m.cleanSheet ? 1 : 0), 0), avgRating = matchesInBlock ? Number((results.reduce((sum, m) => sum + m.rating, 0) / matchesInBlock).toFixed(1)) : 0;
        const passes = matchesInBlock ? Math.max(0, Math.floor(15 + Math.random() * 35 + number(player.attributes?.passe ?? 40) * .12)) : 0; const yellowCards = matchesInBlock ? results.reduce(sum => sum, 0) + results.reduce(sum => sum + (Math.random() < clamp(.04 + choiceCardRiskExtra, 0, .6) ? 1 : 0), 0) : 0;
        const summary = { rating: avgRating, goals: totalGoals, assists: totalAssists, passes, tackles: totalTackles, cleanSheets, yellowCards, matchesPlayed: matchesInBlock, injured: isInjured };
        if (player.stats && matchesInBlock > 0) { const previousMatches = number(player.stats.matchesPlayed); const totalMatches = previousMatches + matchesInBlock; player.stats.matchesPlayed = totalMatches; player.stats.goals = number(player.stats.goals) + totalGoals; player.stats.assists = number(player.stats.assists) + totalAssists; player.stats.successfulPasses = number(player.stats.successfulPasses) + passes; player.stats.tackles = number(player.stats.tackles) + totalTackles; player.stats.yellowCards = number(player.stats.yellowCards) + yellowCards; if (group === 'goalkeeper') player.stats.cleanSheets = number(player.stats.cleanSheets) + cleanSheets; player.stats.averageRating = Number((((number(player.stats.averageRating) * previousMatches) + (avgRating * matchesInBlock)) / totalMatches).toFixed(1)); }
        const financeReport = EconomyManager.processBlockFinances(state, summary); if (matchesInBlock > 0) { player.morale = clamp(number(player.morale ?? 50) + (avgRating >= 7 ? 5 : -3), 0, 100); player.fitness = clamp(number(player.fitness ?? 80) - (matchesInBlock * 2 + Math.max(0, choiceFatigueExtra)), 0, 100); } else player.fitness = clamp(number(player.fitness ?? 80) + 20, 0, 100);
        player.isInjured = isInjured; if (isInjured) { player.injuryDuration = Math.max(1, Math.floor(Math.random() * 3) + 1); player.morale = clamp(number(player.morale ?? 50) - 15, 0, 100); }
        PotentialSystem.recordMatch(player, summary, matchesInBlock); const xpMatch = matchesInBlock ? Math.round(matchesInBlock * 70 + avgRating * 55 + totalGoals * 90 + totalAssists * 60) : 0; const progressionResult = PlayerLogic.applyProgression(player, { xp: xpMatch, type: 'match' }); this.updateHiddenAttributes(player, summary); const expiredEffects = ConsequenceSystem.advanceMatch(player);
        let cupResult = null; const cupMatchIndex = scheduledMatches.findIndex(match => match.competitionType === 'national_cup'); const cupMatch = cupMatchIndex >= 0 ? scheduledMatches[cupMatchIndex] : null; if (cupMatch) { cupResult = CupSystem.resolvePlayerMatch(state, cupMatch, results[cupMatchIndex] || {}); CupSystem.simulateCurrentRound(state); } else { const cup = CupSystem.getCup(state); if (cup && cup.status === 'active' && Number(cup.roundMonth) === Number(calendar.currentMonth) && cup.matches?.length) CupSystem.simulateCurrentRound(state); }
        const europeanStatus = CompetitionSystem.recordEuropeanResults(state, scheduledMatches, results);
        return { results, isInjured, summary: { ...summary, blockPlan, scheduledMatches, matchResults: results, xpGained: xpMatch, finance: financeReport, progression: progressionResult, choiceConsequences: choiceConsequenceResult, expiredEffects, cupResult, cup: CupSystem.getSummary(state), european: europeanStatus } };
    },

    updateHiddenAttributes(player, summary) {
        player.hidden ||= { consistency: 12, bigMatchPlayer: 12, injuryProneness: 10 };
        if (summary.rating >= 7 && Math.random() < .35) player.hidden.consistency = clamp(number(player.hidden.consistency) + 1, 1, 20);
        else if (summary.rating < 5.5 && Math.random() < .25) player.hidden.consistency = clamp(number(player.hidden.consistency) - 1, 1, 20);
        if ((summary.goals > 0 || summary.rating >= 8) && Math.random() < .25) player.hidden.bigMatchPlayer = clamp(number(player.hidden.bigMatchPlayer) + 1, 1, 20);
        if (player.isInjured) player.hidden.injuryProneness = clamp(number(player.hidden.injuryProneness) + 1, 1, 20);
    }
};
