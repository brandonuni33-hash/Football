// domain/match/interactiveMatchController.js
// Propriétaire unique de la session de match jouable.
import { PlayerLogic } from '../../player.js';
import { PotentialSystem } from '../player/potentialSystem.js';
import { ConsequenceSystem } from '../decision/consequenceSystem.js';
import { MatchChoiceManager } from './matchChoiceManager.js';
import { clamp, number, positionGroup, opponentName, isHomeMatch, competitionLabel, matchType, importanceFor, decisionMoments, buildScore, reconcilePlayerContributions } from './matchHelpers.js';

const CONSEQUENCE_MAP = { technique: 'attributes.controle', physique: 'attributes.puissance', vitesse: 'attributes.vitesse', defense: 'attributes.defense', mental: 'mental', charisme: 'reputation', discipline: 'discipline', relationCoach: 'relationCoach', vestiaire: 'vestiaire' };

function choiceConsequences(choice = {}) {
    const source = choice.consequences || {};
    const permanent = { ...(source.permanent || {}), ...(source.emotional || {}) };
    for (const [key, value] of Object.entries(choice.impacts?.stats || {})) {
        const target = CONSEQUENCE_MAP[key];
        if (target && Number.isFinite(Number(value)) && permanent[target] === undefined) permanent[target] = Number(value);
    }
    if (!Object.keys(permanent).length && !Array.isArray(source.temporary) && !Array.isArray(source.effects)) return null;
    return { ...source, permanent, temporary: [...(source.temporary || []), ...(source.effects || [])] };
}

function buildDecision(match, moment, index, previous = []) {
    const dilemma = MatchChoiceManager.getMatchDilemma(matchType(match), opponentName(match));
    const configured = dilemma?.choices || [];
    const fallback = [
        { text: 'Prendre l’initiative', impacts: { ratingBonus: .16, goalChance: .035, fatigueRisk: 3 } },
        { text: 'Jouer simple et sécuriser', impacts: { ratingBonus: .08, passAccuracy: .08, fatigueRisk: -1 } },
        { text: 'Chercher le duel', impacts: { ratingBonus: .04, duelBonus: .10, cardRisk: .06, fatigueRisk: 2 } },
        { text: 'Rester patient', impacts: { ratingBonus: .03, assistChance: .04, fatigueRisk: -2 } }
    ];
    const choices = (configured.length >= 2 ? configured : fallback).slice(0, 4).map(choice => ({ ...choice, text: choice.text || choice.texte || choice.label || 'Choisir', consequences: choiceConsequences(choice) }));
    return { id: `decision-${Date.now()}-${index}`, minute: moment, phase: moment < 45 ? 'Première période' : 'Seconde période', title: dilemma?.title || `Moment clé · ${moment}'`, description: `${previous.length ? 'La dynamique du match a changé après ta décision précédente. ' : ''}${dilemma?.description || `Face à ${opponentName(match)}, quelle attitude adoptes-tu ?`}`, choices };
}

function playableDecisionMoments(match) {
    const all = decisionMoments(match);
    const selection = match?.playerSelection;
    const minutes = Math.max(1, number(match?.minutes ?? selection?.minutes ?? 90));
    if (selection?.started !== false || minutes >= 55) return all;
    const entryMinute = Math.max(45, 90 - minutes);
    const afterEntry = all.filter(moment => Number(moment) >= entryMinute);
    if (afterEntry.length) return afterEntry.slice(-2);
    return [Math.min(86, entryMinute + 8)];
}

export function startInteractiveMatch(state, scheduledMatch, matchIndex = 0) {
    if (!state?.player) throw new Error('Impossible de démarrer un match sans joueur.');
    const moments = playableDecisionMoments(scheduledMatch);
    const session = { id: `match-session-${Date.now()}-${matchIndex}`, matchIndex, match: scheduledMatch, type: matchType(scheduledMatch), importance: importanceFor(scheduledMatch), opponent: opponentName(scheduledMatch), home: isHomeMatch(scheduledMatch), competition: competitionLabel(scheduledMatch), moments, currentMoment: 0, decisions: [], events: [], score: { home: 0, away: 0 }, modifiers: { rating: 0, goal: 0, assist: 0, duel: 0, fatigue: 0, cards: 0 }, playerRatingBase: 6.2 + (number(state.player.overall) - 50) * .035, finished: false };
    session.decision = buildDecision(scheduledMatch, moments[0], 0);
    return session;
}

export function resolveInteractiveDecision(state, session, choiceIndex) {
    if (!state?.player || !session || session.finished) throw new Error('Session de match invalide.');
    const decision = session.decision;
    const choice = decision?.choices?.[Number(choiceIndex)];
    if (!choice) throw new Error('Choix de match invalide.');
    const consequence = choice.consequences ? ConsequenceSystem.applyToState(state, { ...choice, impacts: {}, consequences: choice.consequences }, { source: 'Match' }) : null;
    const impacts = choice.impacts || {};
    session.decisions.push({ minute: decision.minute, phase: decision.phase, choice: choice.text, consequence: consequence?.queued || 0 });
    session.modifiers.rating += number(impacts.ratingBonus ?? impacts.ratingBoost) + number(impacts.passAccuracy) * .20;
    session.modifiers.goal += number(impacts.goalChance) + number(impacts.counterAttack) * .20;
    session.modifiers.assist += number(impacts.assistChance) + number(impacts.counterAttack) * .08;
    session.modifiers.duel += number(impacts.duelBonus);
    session.modifiers.fatigue += number(impacts.fatigueRisk);
    session.modifiers.cards += number(impacts.cardRisk);
    const roll = Math.random();
    if (roll < .18 + session.modifiers.goal * .25) session.events.push({ minute: decision.minute, icon: '⚡', text: 'Ton choix crée une situation dangereuse.' });
    else if (roll < .35) session.events.push({ minute: decision.minute, icon: '🎯', text: 'Ton équipe gagne du terrain.' });
    else session.events.push({ minute: decision.minute, icon: '🧠', text: consequence?.responseText || 'Tu assumes ton choix et le match continue.' });

    session.currentMoment += 1;
    if (session.currentMoment < session.moments.length) {
        session.decision = buildDecision(session.match, session.moments[session.currentMoment], session.currentMoment, session.decisions);
        return { finished: false, session, decision: session.decision, event: session.events.at(-1) };
    }

    const player = state.player;
    const group = positionGroup(player.position);
    const opponentStrength = number(session.match?.opponentStrength ?? session.match?.opponentOverall ?? 50) || 50;
    const rating = Number(clamp(session.playerRatingBase + session.modifiers.rating + (Math.random() - .5) * 1.1, 4, 10).toFixed(1));
    const goalChance = clamp(.04 + number(player.attributes?.tir ?? 40) / 99 * .16 + session.modifiers.goal, .01, .75);
    const assistChance = clamp(.06 + number(player.attributes?.passe ?? 40) / 99 * .18 + session.modifiers.assist, .01, .75);
    let generatedTeamGoals = session.score[session.home ? 'home' : 'away'];
    if (generatedTeamGoals === 0) generatedTeamGoals = buildScore({ player, rating, group, goalChance, opponentStrength });
    const opponentGoals = Math.min(6, Math.max(0, Math.floor(Math.random() * Math.max(1, 1 + opponentStrength / 60))));
    const selection = session.match?.playerSelection || { started: true, appearance: 'starter', minutes: 90 };
    const contributions = reconcilePlayerContributions(
        generatedTeamGoals,
        Math.random() < goalChance ? 1 : 0,
        Math.random() < assistChance ? 1 : 0
    );
    const teamGoals = contributions.teamGoals;
    const result = { matchIndex: session.matchIndex, fixture: session.match, competitionId: session.match?.competitionId || null, competitionType: session.match?.competitionType || session.match?.type || null, competitionName: session.competition, phase: session.match?.phase || null, round: session.match?.round || session.match?.europeanRound || null, type: session.type, importance: session.importance, opponent: session.opponent, opponentStrength, home: session.home, venue: session.match?.venue || null, score: { home: session.home ? teamGoals : opponentGoals, away: session.home ? opponentGoals : teamGoals }, teamGoals, opponentGoals, result: teamGoals > opponentGoals ? 'win' : teamGoals < opponentGoals ? 'loss' : 'draw', rating, goals: contributions.goals, assists: contributions.assists, tackles: group === 'goalkeeper' ? 0 : Math.max(1, Math.floor(2 + Math.random() * 6 + session.modifiers.duel * 8)), cleanSheet: group === 'goalkeeper' && opponentGoals === 0, played: true, playerPlayed: true, appearance: selection.appearance || (selection.started === false ? 'substitute' : 'starter'), started: selection.started !== false, minutesPlayed: number(session.match?.minutes ?? selection.minutes ?? 90) || 90, decisions: session.decisions, events: session.events };
    session.result = result;
    session.finished = true;
    session.decision = null;
    return { finished: true, session, result, events: session.events };
}

export function commitInteractiveResult(state, result) {
    const player = state?.player;
    if (!player || !result) return null;
    player.stats ||= {};
    const previous = number(player.stats.matchesPlayed);
    const total = previous + 1;
    player.stats.matchesPlayed = total;
    player.stats.starts = number(player.stats.starts) + (result.started === false ? 0 : 1);
    player.stats.subAppearances = number(player.stats.subAppearances) + (result.started === false ? 1 : 0);
    player.stats.minutesPlayed = number(player.stats.minutesPlayed) + number(result.minutesPlayed || 90);
    player.stats.goals = number(player.stats.goals) + number(result.goals);
    player.stats.assists = number(player.stats.assists) + number(result.assists);
    player.stats.tackles = number(player.stats.tackles) + number(result.tackles);
    if (result.cleanSheet) player.stats.cleanSheets = number(player.stats.cleanSheets) + 1;
    player.stats.averageRating = Number((((number(player.stats.averageRating) * previous) + number(result.rating)) / total).toFixed(1));
    player.morale = clamp(number(player.morale ?? 50) + (result.rating >= 7 ? 2 : result.rating < 5.5 ? -2 : 0), 0, 100);
    player.fitness = clamp(number(player.fitness ?? 80) - Math.max(1, Math.round(number(result.minutesPlayed || 90) / 30)), 0, 100);
    PotentialSystem.recordMatch(player, { rating: result.rating }, 1);
    PlayerLogic.applyProgression(player, { xp: Math.round(70 + result.rating * 40 + result.goals * 90 + result.assists * 60), type: 'match' });
    return result;
}

export const InteractiveMatchController = Object.freeze({ startInteractiveMatch, resolveInteractiveDecision, commitInteractiveResult });
export default InteractiveMatchController;
