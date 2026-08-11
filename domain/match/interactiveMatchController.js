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
    const choices = templates.length >= 2 ? templates.slice(0, 4).map(c => ({ text: c.text || c.texte || c.label, impacts: c.impacts || {} })) : fallback;
    const phase = moment <= 30 ? 'Début de match' : moment <= 60 ? 'Seconde période' : 'Fin de match';
    const context = previous.length ? 'Le match a évolué. Ta dernière décision a changé la dynamique.' : 'Le match commence et le contexte est encore ouvert.';
    return { id: `match-${Date.now()}-${index}`, minute: moment, phase, context, type, competition: competitionLabel(match), choices };
}

export function createInteractiveMatchSession(match, player) {
    const moments = decisionMoments(match);
    return { match, playerId: player?.id || null, currentIndex: 0, moments: moments.map((moment, index) => interactiveChoice(match, player, moment, index)), choices: [], results: [], score: { home: 0, away: 0 }, completed: false, home: isHomeMatch(match, player), positionGroup: positionGroup(player?.position || player?.positionId), importance: importanceFor(match) };
}

export function resolveInteractiveChoice(session, choiceIndex) {
    if (!session || session.completed) return null;
    const moment = session.moments[session.currentIndex];
    if (!moment?.choices?.[choiceIndex]) return null;
    const choice = moment.choices[choiceIndex];
    session.choices.push({ moment: moment.minute, choiceIndex, text: choice.text, impacts: choice.impacts || {} });
    session.currentIndex += 1;
    if (session.currentIndex >= session.moments.length) session.completed = true;
    return { choice, nextIndex: session.currentIndex, completed: session.completed };
}

export function finalizeInteractiveMatch(session) {
    if (!session) return null;
    const impacts = session.choices.map(item => item.impacts || {});
    const ratingBonus = impacts.reduce((sum, item) => sum + number(item.ratingBonus) + number(item.matchBonuses?.ratingBonus), 0);
    const goalChance = impacts.reduce((sum, item) => sum + number(item.goalChance) + number(item.matchBonuses?.goalChance), 0);
    const assistChance = impacts.reduce((sum, item) => sum + number(item.assistChance) + number(item.matchBonuses?.assistChance), 0);
    const duelBonus = impacts.reduce((sum, item) => sum + number(item.duelBonus) + number(item.matchBonuses?.duelBonus), 0);
    const fatigueRisk = impacts.reduce((sum, item) => sum + number(item.fatigueRisk) + number(item.matchBonuses?.fatigueRisk), 0);
    const result = buildScore(session.match, session.player || {}, { ratingBonus, goalChance, assistChance, duelBonus, fatigueRisk });
    session.results = [result];
    return { ...result, choiceCount: session.choices.length, choices: session.choices };
}

export default { createInteractiveMatchSession, resolveInteractiveChoice, finalizeInteractiveMatch };
