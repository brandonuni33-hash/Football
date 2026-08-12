// domain/match/interactiveMatchController.js
// Propriétaire unique de la session et de la machine de phases du match jouable.

import { PlayerLogic } from '../../player.js';
import { PotentialSystem } from '../player/potentialSystem.js';
import { ConsequenceSystem } from '../decision/consequenceSystem.js';
import { MatchChoiceManager } from './matchChoiceManager.js';
import {
    clamp, number, positionGroup, opponentName, isHomeMatch, competitionLabel,
    matchType, importanceFor, buildScore, reconcilePlayerContributions
} from './matchHelpers.js';
import {
    buildPreMatchStep, buildKickoffStep, buildDecisionStep, buildConsequenceStep,
    buildContinuationStep, createUnexpectedContext, buildUnexpectedStep,
    buildFullTimeStep, buildFinalWhistleStep, buildPostMatchReactions, buildReactionsStep
} from './interactiveMatchNarrative.js';

const FLOW_VERSION = 2;
const CONSEQUENCE_MAP = {
    technique: 'attributes.controle', physique: 'attributes.puissance', vitesse: 'attributes.vitesse',
    defense: 'attributes.defense', mental: 'mental', charisme: 'reputation', discipline: 'discipline',
    relationCoach: 'relationCoach', vestiaire: 'vestiaire'
};

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

function mechanicalImpacts(choice = {}) {
    const impacts = choice.impacts || {};
    // Les choix historiques rangent leurs effets de match dans `matchBonuses`.
    // Ils sont normalisés ici une seule fois avant d'être appliqués à la session.
    return { ...(impacts.matchBonuses || {}), ...impacts };
}

function decisionDescription(session, moment, index, fallback) {
    if (index === 0) {
        return `À la ${moment}e minute, une première brèche apparaît face à ${session.opponent}. ${fallback || 'Comment veux-tu peser sur cette séquence ?'}`;
    }
    const context = session.unexpectedContext?.text || 'Le rapport de force a changé depuis ta première décision.';
    return `${context} À la ${moment}e minute, tu dois maintenant adapter ton jeu.`;
}

function buildDecision(session, moment, index) {
    const dilemma = MatchChoiceManager.getMatchDilemma(session.type, session.opponent);
    const configured = dilemma?.choices || [];
    const fallback = [
        { text: 'Prendre l’initiative', impacts: { ratingBonus: .16, goalChance: .05, fatigueRisk: 3 } },
        { text: 'Jouer simple et sécuriser', impacts: { ratingBonus: .08, passAccuracy: .08, fatigueRisk: -1 } },
        { text: 'Chercher le duel', impacts: { ratingBonus: .04, duelBonus: .10, cardRisk: .06, fatigueRisk: 2 } },
        { text: 'Rester patient', impacts: { ratingBonus: .03, assistChance: .05, fatigueRisk: -2 } }
    ];
    const choices = (configured.length >= 2 ? configured : fallback).slice(0, 4).map(choice => ({
        ...choice,
        text: choice.text || choice.texte || choice.label || 'Choisir',
        impacts: mechanicalImpacts(choice),
        consequences: choiceConsequences(choice)
    }));
    return {
        id: `${session.id}:decision:${index + 1}`,
        minute: moment,
        phase: moment < 45 ? 'Première période' : 'Seconde période',
        title: index === 0 ? `${moment}' · La première occasion de peser` : `${moment}' · Le match bascule`,
        description: decisionDescription(session, moment, index, dilemma?.description),
        choices
    };
}

function playableDecisionMoments(match) {
    const selection = match?.playerSelection;
    const minutes = Math.max(1, number(match?.minutes ?? selection?.minutes ?? 90));
    if (selection?.started !== false) return importanceFor(match) === 'exceptional' ? [24, 74] : [31, 68];
    const entryMinute = Math.max(45, 90 - minutes);
    const first = Math.min(84, entryMinute + Math.max(3, Math.round(minutes * .28)));
    return [first, Math.min(88, Math.max(first + 4, entryMinute + Math.round(minutes * .72)))];
}

function playerTeamScore(session) {
    return number(session.score[session.home ? 'home' : 'away']);
}

function opponentScore(session) {
    return number(session.score[session.home ? 'away' : 'home']);
}

function setPlayerTeamScore(session, value) {
    session.score[session.home ? 'home' : 'away'] = Math.max(0, Math.floor(number(value)));
}

function setOpponentScore(session, value) {
    session.score[session.home ? 'away' : 'home'] = Math.max(0, Math.floor(number(value)));
}

function applyEffects(session, effects = {}) {
    session.modifiers.rating += number(effects.ratingBonus ?? effects.rating);
    session.modifiers.goal += number(effects.goalChance ?? effects.goal) + number(effects.counterAttack) * .20;
    session.modifiers.assist += number(effects.assistChance ?? effects.assist) + number(effects.counterAttack) * .08;
    session.modifiers.duel += number(effects.duelBonus ?? effects.duel);
    session.modifiers.fatigue += number(effects.fatigueRisk ?? effects.fatigue);
    session.modifiers.cards += number(effects.cardRisk ?? effects.cards);
    session.modifiers.opponentThreat += number(effects.opponentThreat);
    session.modifiers.rating += number(effects.passAccuracy) * .20 + number(effects.teamBoost) * .18;
}

function resolveChoice(state, session, choiceIndex, decisionIndex) {
    const decision = session.decision;
    const choice = decision?.choices?.[Number(choiceIndex)];
    if (!choice) throw new Error('Choix de match invalide.');
    const consequence = choice.consequences
        ? ConsequenceSystem.applyToState(state, { ...choice, impacts: {}, consequences: choice.consequences }, { source: 'Match' })
        : null;
    applyEffects(session, choice.impacts || {});
    const roll = Math.random();
    let event;
    if (roll < clamp(.16 + number(choice.impacts?.goalChance) * 1.6, .12, .58)) {
        event = { title: 'La défense recule', icon: '⚡', text: 'Ton initiative crée une situation dangereuse et oblige le bloc adverse à se désorganiser.' };
    } else if (roll < .42 + number(choice.impacts?.passAccuracy)) {
        event = { title: 'Ton équipe gagne du terrain', icon: '🎯', text: 'Ta décision donne de l’air au collectif et déplace le rapport de force.' };
    } else if (number(choice.impacts?.duelBonus) > 0) {
        event = { title: 'Le duel donne le ton', icon: '🛡️', text: 'Tu imposes ton choix dans l’impact. Le match devient plus physique autour de toi.' };
    } else {
        event = { title: 'Le match absorbe ton choix', icon: '🧠', text: consequence?.responseText || 'Tu assumes ta décision et te replaces pendant que l’action continue.' };
    }
    event = { ...event, minute: decision.minute, decisionIndex, choice: choice.text };
    session.decisions.push({ minute: decision.minute, phase: decision.phase, choice: choice.text, consequence: consequence?.queued || 0, event: event.text });
    session.events.push(event);
    return event;
}

function simulateMiddlePhase(session) {
    const teamChance = clamp(.30 + session.modifiers.goal + session.modifiers.assist * .35, .12, .72);
    const opponentChance = clamp(.28 + session.modifiers.opponentThreat - session.modifiers.duel * .22, .08, .68);
    if (Math.random() < teamChance) setPlayerTeamScore(session, playerTeamScore(session) + 1);
    if (Math.random() < opponentChance) setOpponentScore(session, opponentScore(session) + 1);
}

function generatedContribution(chance, max) {
    let total = 0;
    for (let index = 0; index < max; index++) {
        if (Math.random() < clamp(chance * (1 - index * .18), .01, .72)) total += 1;
    }
    return total;
}

function finalizeResult(state, session) {
    const player = state.player;
    const group = positionGroup(player.position);
    const opponentStrength = number(session.match?.opponentStrength ?? session.match?.opponentOverall ?? 50) || 50;
    const rating = Number(clamp(session.playerRatingBase + session.modifiers.rating + (Math.random() - .5) * 1.05, 4, 10).toFixed(1));
    const goalChance = clamp(.04 + number(player.attributes?.tir ?? 40) / 99 * .16 + session.modifiers.goal, .01, .72);
    const assistChance = clamp(.06 + number(player.attributes?.passe ?? 40) / 99 * .18 + session.modifiers.assist, .01, .68);
    const generatedTeamGoals = Math.max(playerTeamScore(session), buildScore({ player, rating, group, goalChance, opponentStrength }));
    const generatedOpponentGoals = Math.max(opponentScore(session), Math.floor(Math.random() * Math.max(1, 1 + opponentStrength / 58 + session.modifiers.opponentThreat)));
    const rawGoals = group === 'goalkeeper' ? 0 : generatedContribution(goalChance, group === 'attacker' ? 4 : 2);
    const rawAssists = generatedContribution(assistChance, 2);
    const contributions = reconcilePlayerContributions(generatedTeamGoals, rawGoals, rawAssists);
    const selection = session.match?.playerSelection || { started: true, appearance: 'starter', minutes: 90 };
    const teamGoals = contributions.teamGoals;
    const opponentGoals = Math.min(6, Math.max(0, generatedOpponentGoals));
    const yellowCards = Math.random() < clamp(session.modifiers.cards, 0, .72) ? 1 : 0;
    const fatigueCost = clamp(Math.round(session.modifiers.fatigue), -3, 8);
    setPlayerTeamScore(session, teamGoals);
    setOpponentScore(session, opponentGoals);
    return {
        matchIndex: session.matchIndex, fixture: session.match,
        competitionId: session.match?.competitionId || null,
        competitionType: session.match?.competitionType || session.match?.type || null,
        competitionName: session.competition, phase: session.match?.phase || null,
        round: session.match?.round || session.match?.europeanRound || null,
        type: session.type, importance: session.importance, opponent: session.opponent,
        opponentStrength, home: session.home, venue: session.match?.venue || null,
        score: { ...session.score }, teamGoals, opponentGoals,
        result: teamGoals > opponentGoals ? 'win' : teamGoals < opponentGoals ? 'loss' : 'draw',
        rating, goals: contributions.goals, assists: contributions.assists,
        tackles: group === 'goalkeeper' ? 0 : Math.max(1, Math.floor(2 + Math.random() * 6 + session.modifiers.duel * 8)),
        yellowCards, fatigueCost,
        cleanSheet: group === 'goalkeeper' && opponentGoals === 0,
        played: true, playerPlayed: true,
        appearance: selection.appearance || (selection.started === false ? 'substitute' : 'starter'),
        started: selection.started !== false,
        minutesPlayed: number(session.match?.minutes ?? selection.minutes ?? 90) || 90,
        decisions: [...session.decisions], events: [...session.events], interactiveFlowVersion: FLOW_VERSION
    };
}

function migrateActiveSession(session) {
    if (session.flowVersion) return session;
    session.flowVersion = FLOW_VERSION;
    session.team ||= 'Ton équipe';
    session.modifiers ||= { rating: 0, goal: 0, assist: 0, duel: 0, fatigue: 0, cards: 0, opponentThreat: 0 };
    session.modifiers.opponentThreat ||= 0;
    session.stage = session.decision ? (number(session.currentMoment) > 0 ? 'moment_2' : 'moment_1') : 'pre_match';
    session.step = session.decision ? buildDecisionStep(session, session.decision, session.stage === 'moment_1' ? 0 : 1) : buildPreMatchStep(session);
    return session;
}

export function startInteractiveMatch(state, scheduledMatch, matchIndex = 0) {
    if (!state?.player) throw new Error('Impossible de démarrer un match sans joueur.');
    const moments = playableDecisionMoments(scheduledMatch);
    const session = {
        id: `match-session-${Date.now()}-${matchIndex}`, flowVersion: FLOW_VERSION,
        matchIndex, match: scheduledMatch, type: matchType(scheduledMatch), importance: importanceFor(scheduledMatch),
        team: state.player.club || 'Ton équipe', opponent: opponentName(scheduledMatch),
        home: isHomeMatch(scheduledMatch), competition: competitionLabel(scheduledMatch),
        moments, currentMoment: 0, decisions: [], events: [], score: { home: 0, away: 0 },
        modifiers: { rating: 0, goal: 0, assist: 0, duel: 0, fatigue: 0, cards: 0, opponentThreat: 0 },
        playerRatingBase: 6.2 + (number(state.player.overall) - 50) * .035,
        stage: 'pre_match', step: null, decision: null, result: null, reactions: [], finished: false
    };
    session.step = buildPreMatchStep(session);
    return session;
}

export function advanceInteractiveMatch(state, activeSession, action = {}) {
    if (!state?.player || !activeSession || activeSession.finished) throw new Error('Session de match invalide.');
    const session = migrateActiveSession(activeSession);
    const choiceIndex = typeof action === 'number' ? action : action?.choiceIndex;

    if (session.step?.kind === 'decision' && (choiceIndex === null || choiceIndex === undefined || !Number.isInteger(Number(choiceIndex)))) {
        return { finished: false, session, step: session.step, decision: session.decision, event: session.events.at(-1) || null };
    }

    if (session.stage === 'pre_match') {
        session.stage = 'kickoff';
        session.step = buildKickoffStep(session);
    } else if (session.stage === 'kickoff') {
        session.stage = 'moment_1';
        session.decision = buildDecision(session, session.moments[0], 0);
        session.step = buildDecisionStep(session, session.decision, 0);
    } else if (session.stage === 'moment_1') {
        const event = resolveChoice(state, session, choiceIndex, 0);
        session.currentMoment = 1;
        session.stage = 'consequence_1';
        session.step = buildConsequenceStep(session, event, 0);
    } else if (session.stage === 'consequence_1') {
        simulateMiddlePhase(session);
        session.stage = 'match_continues';
        session.step = buildContinuationStep(session);
    } else if (session.stage === 'match_continues') {
        session.unexpectedContext = createUnexpectedContext(session);
        applyEffects(session, session.unexpectedContext.effects);
        session.stage = 'unexpected_event';
        session.step = buildUnexpectedStep(session, session.unexpectedContext);
    } else if (session.stage === 'unexpected_event') {
        session.stage = 'moment_2';
        session.decision = buildDecision(session, session.moments[1], 1);
        session.step = buildDecisionStep(session, session.decision, 1);
    } else if (session.stage === 'moment_2') {
        resolveChoice(state, session, choiceIndex, 1);
        session.result = finalizeResult(state, session);
        session.result.postMatchReactions = buildPostMatchReactions(state, session, session.result);
        session.stage = 'full_time_sequence';
        session.decision = null;
        session.step = buildFullTimeStep(session, session.result);
    } else if (session.stage === 'full_time_sequence') {
        session.stage = 'final_whistle';
        session.step = buildFinalWhistleStep(session, session.result);
    } else if (session.stage === 'final_whistle') {
        session.reactions = session.result?.postMatchReactions || buildPostMatchReactions(state, session, session.result);
        session.stage = 'reactions';
        session.step = buildReactionsStep(session, session.reactions);
    } else if (session.stage === 'reactions') {
        session.stage = 'complete';
        session.step = null;
        session.finished = true;
        return { finished: true, session, result: session.result, events: session.events };
    } else {
        throw new Error(`Phase de match inconnue : ${session.stage}`);
    }
    return { finished: false, session, step: session.step, decision: session.step?.kind === 'decision' ? session.decision : null, event: session.events.at(-1) || null };
}

export function resolveInteractiveDecision(state, session, choiceIndex) {
    return advanceInteractiveMatch(state, session, { choiceIndex });
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
    player.stats.yellowCards = number(player.stats.yellowCards) + number(result.yellowCards);
    if (result.cleanSheet) player.stats.cleanSheets = number(player.stats.cleanSheets) + 1;
    player.stats.averageRating = Number((((number(player.stats.averageRating) * previous) + number(result.rating)) / total).toFixed(1));
    player.morale = clamp(number(player.morale ?? 50) + (result.rating >= 7 ? 2 : result.rating < 5.5 ? -2 : 0), 0, 100);
    const fitnessCost = Math.max(1, Math.round(number(result.minutesPlayed || 90) / 30) + number(result.fatigueCost));
    player.fitness = clamp(number(player.fitness ?? 80) - fitnessCost, 0, 100);
    PotentialSystem.recordMatch(player, { rating: result.rating }, 1);
    PlayerLogic.applyProgression(player, { xp: Math.round(70 + result.rating * 40 + result.goals * 90 + result.assists * 60), type: 'match' });
    return result;
}

export const InteractiveMatchController = Object.freeze({
    startInteractiveMatch, advanceInteractiveMatch, resolveInteractiveDecision, commitInteractiveResult
});
export default InteractiveMatchController;
