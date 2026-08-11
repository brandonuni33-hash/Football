// domain/match/interactiveMatchController.js
// Gestion complète d'une session de match interactif.

import { PlayerLogic } from '../../player.js';
import { PotentialSystem } from '../player/potentialSystem.js';
import { MatchChoiceManager } from './matchChoiceManager.js';
import { clamp, number, positionGroup, opponentName, isHomeMatch, competitionLabel, matchType, importanceFor, decisionMoments, buildScore } from './matchHelpers.js';

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
    const choices = templates.length >= 2
        ? templates.slice(0, 4).map(c => ({ text: c.text || c.texte || c.label, impacts: c.impacts || {} }))
        : fallback;
    const phase = moment <= 30 ? 'Début de match' : moment <= 60 ? 'Seconde période' : 'Fin de match';
    const context = previous.length ? 'Le match a évolué. Ta dernière décision a changé la dynamique.' : 'Le match commence et le contexte est encore ouvert.';
    return { id: `match-${Date.now()}-${index}`, minute: moment, phase, type, title: dilemma?.title || `Moment clé · ${moment}'`, description: `${context} ${dilemma?.description || `Face à ${opponentName(match)}, comment abordes-tu cette situation ?`}`, choices };
}

function startInteractiveMatch(state, scheduledMatch, matchIndex = 0) {
    if (!state?.player) throw new Error('Impossible de démarrer un match sans joueur.');
    const player = state.player, moments = decisionMoments(scheduledMatch);
    const session = { id: `match-session-${Date.now()}-${matchIndex}`, matchIndex, match: scheduledMatch, type: matchType(scheduledMatch), importance: importanceFor(scheduledMatch), opponent: opponentName(scheduledMatch), home: isHomeMatch(scheduledMatch), competition: competitionLabel(scheduledMatch), moments, currentMoment: 0, decisions: [], events: [], score: { home: 0, away: 0 }, playerRatingBase: 6.2 + (number(player.overall) - 50) * .035, modifiers: { rating: 0, goal: 0, assist: 0, duel: 0, fatigue: 0, cards: 0 }, startedAt: Date.now(), finished: false };
    session.decision = interactiveChoice(scheduledMatch, player, moments[0], 0);
    return session;
}

function resolveInteractiveDecision(state, session, choiceIndex) {
    if (!state?.player || !session || session.finished) throw new Error('Session de match invalide.');
    const decision = session.decision, choice = decision?.choices?.[Number(choiceIndex)];
    if (!choice) throw new Error('Choix de match invalide.');
    const impacts = choice.impacts || {}, bonuses = impacts.matchBonuses || impacts;
    session.decisions.push({ minute: decision.minute, phase: decision.phase, choice: choice.text, impacts: bonuses });
    session.modifiers.rating += number(bonuses.ratingBonus ?? bonuses.ratingBoost) + number(bonuses.passAccuracy) * .20 + number(bonuses.teamBoost) * .35;
    session.modifiers.goal += number(bonuses.goalChance) + number(bonuses.counterAttack) * .20;
    session.modifiers.assist += number(bonuses.assistChance) + number(bonuses.counterAttack) * .08;
    session.modifiers.duel += number(bonuses.duelBonus); session.modifiers.fatigue += number(bonuses.fatigueRisk); session.modifiers.cards += number(bonuses.cardRisk);
    const roll = Math.random();
    if (roll < .13 + Math.max(0, session.modifiers.goal) * .20) { session.events.push({ minute: decision.minute, icon: '⚡', text: 'Ton choix crée une occasion dangereuse.' }); session.score[session.home ? 'home' : 'away'] += Math.random() < .38 ? 1 : 0; }
    else if (roll < .25) session.events.push({ minute: decision.minute, icon: '🎯', text: 'Ton équipe prend progressivement le contrôle.' });
    else if (roll < .34) session.events.push({ minute: decision.minute, icon: '🛡️', text: 'Tu fermes bien ton espace.' });
    session.currentMoment += 1;
    if (session.currentMoment < session.moments.length) { const minute = session.moments[session.currentMoment]; session.decision = interactiveChoice(session.match, state.player, minute, session.currentMoment, session.decisions); return { finished: false, session, decision: session.decision, event: session.events.at(-1) || null }; }
    const group = positionGroup(state.player.position || state.player.positionId), opponentStrength = number(session.match?.opponentStrength ?? session.match?.opponentOverall ?? 50) || 50;
    const rating = Number(clamp(session.playerRatingBase + session.modifiers.rating + (Math.random() - .5) * 1.1, 4, 10).toFixed(1));
    const goalChance = clamp(.04 + (number(state.player.attributes?.tir ?? 40) + number(state.player.attributes?.dribble ?? 40)) / 200 * .16 + session.modifiers.goal, .01, .75);
    const assistChance = clamp(.06 + number(state.player.attributes?.passe ?? 40) / 99 * .18 + session.modifiers.assist, .01, .75);
    const opponentGoals = Math.min(5, Math.max(0, Math.floor(Math.random() * Math.max(1, 1.0 + opponentStrength / 60))));
    let teamGoals = session.score[session.home ? 'home' : 'away'];
    if (teamGoals === 0) teamGoals = buildScore({ player: state.player, rating, group, goalChance, opponentStrength });
    const result = { matchIndex: session.matchIndex, competitionId: session.match?.competitionId || null, competitionType: session.match?.competitionType || session.match?.type || null, competitionName: session.competition, phase: session.match?.phase || null, round: session.match?.round || null, opponent: session.opponent, home: session.home, venue: session.match?.venue || null, score: { home: session.home ? teamGoals : opponentGoals, away: session.home ? opponentGoals : teamGoals }, teamGoals, opponentGoals, result: teamGoals > opponentGoals ? 'win' : teamGoals < opponentGoals ? 'loss' : 'draw', rating, goals: Math.random() < goalChance ? 1 : 0, assists: Math.random() < assistChance && teamGoals > 0 ? 1 : 0, tackles: group === 'goalkeeper' ? 0 : Math.max(1, Math.floor(2 + Math.random() * 6 + session.modifiers.duel * 8)), cleanSheet: group === 'goalkeeper' && opponentGoals === 0, played: true, decisions: session.decisions, events: session.events };
    session.result = result; session.score = result.score; session.finished = true; session.decision = null;
    return { finished: true, session, result, events: session.events };
}

function commitInteractiveResult(state, result) {
    const player = state?.player; if (!player || !result) return null;
    const s = player.stats || (player.stats = {}), previousMatches = number(s.matchesPlayed), totalMatches = previousMatches + 1;
    s.matchesPlayed = totalMatches; s.goals = number(s.goals) + number(result.goals); s.assists = number(s.assists) + number(result.assists); s.tackles = number(s.tackles) + number(result.tackles); s.yellowCards = number(s.yellowCards); if (result.cleanSheet) s.cleanSheets = number(s.cleanSheets) + 1;
    s.averageRating = Number((((number(s.averageRating) * previousMatches) + number(result.rating)) / totalMatches).toFixed(1));
    player.morale = clamp(number(player.morale ?? 50) + (result.rating >= 7 ? 2 : result.rating < 5.5 ? -2 : 0), 0, 100); player.fitness = clamp(number(player.fitness ?? 80) - 3, 0, 100);
    PotentialSystem.recordMatch(player, { rating: result.rating, goals: result.goals, assists: result.assists, tackles: result.tackles, matchesPlayed: 1 }, 1);
    PlayerLogic.applyProgression(player, { xp: Math.round(70 + result.rating * 40 + result.goals * 90 + result.assists * 60), type: 'match' });
    return result;
}

export const InteractiveMatchController = { startInteractiveMatch, resolveInteractiveDecision, commitInteractiveResult };
export default InteractiveMatchController;
