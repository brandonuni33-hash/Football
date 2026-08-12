// Couche d'intégration du Match v3.
// Elle enrichit le contrôleur canonique sans dupliquer la simulation :
// mémoire intra-match, scènes de but et rapport factuel.

import { InteractiveMatchController } from './interactiveMatchController.js';
import {
    createMatchMemory,
    recordMatchChoice,
    recordPressureMiss,
    delayedMatchEffect
} from './interactiveMatchMemory.js';
import { canonicalPlayerGoalEvents } from './goalEventResolver.js';
import { buildGoalPresentation } from './goalPresentation.js';
import { buildInteractiveMatchReport } from './interactiveMatchReport.js';

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;

function playerTeamScore(session = {}) {
    return n(session?.score?.[session.home ? 'home' : 'away']);
}

function ensureRuntime(session) {
    if (!session) return session;
    session.matchMemory ||= createMatchMemory();
    session.appliedMemoryEffects = Array.isArray(session.appliedMemoryEffects) ? session.appliedMemoryEffects : [];
    session.goalPresentationQueue = Array.isArray(session.goalPresentationQueue) ? session.goalPresentationQueue : [];
    return session;
}

function applyRuntimeEffects(session, effects = {}) {
    session.modifiers ||= { rating:0, goal:0, assist:0, duel:0, fatigue:0, cards:0, opponentThreat:0 };
    for (const key of ['rating', 'goal', 'assist', 'duel', 'fatigue', 'cards', 'opponentThreat']) {
        session.modifiers[key] = n(session.modifiers[key]) + n(effects[key]);
    }
}

function applyDelayedMemoryEffect(session, minute = null) {
    const delayed = delayedMatchEffect(session.matchMemory);
    if (!delayed || session.appliedMemoryEffects.includes(delayed.id)) return null;

    session.appliedMemoryEffects.push(delayed.id);
    applyRuntimeEffects(session, delayed.effects || {});

    const memoryEvent = {
        title: delayed.title,
        icon: '🧠',
        text: delayed.text,
        minute,
        memoryEffect: delayed.id
    };
    session.events ||= [];
    session.events.push(memoryEvent);

    if (session.step?.phase?.startsWith('consequence_')) {
        session.step = {
            ...session.step,
            text: `${session.step.text} ${delayed.text}`.trim()
        };
    }
    return memoryEvent;
}

function recordResolvedDecision(session, { choice = null, timedOut = false, minute = null } = {}) {
    ensureRuntime(session);
    const event = session.events?.findLast?.(item => item?.decisionIndex === session.currentMoment)
        || session.events?.at?.(-1)
        || {};

    if (timedOut) recordPressureMiss(session.matchMemory);
    else if (choice) {
        const enrichedEvent = {
            ...event,
            failedTechnique: Boolean(event.failedTechnique || event.title === 'Le geste ne passe pas')
        };
        recordMatchChoice(session.matchMemory, choice, enrichedEvent);
    }

    return applyDelayedMemoryEffect(session, minute);
}

function goalMinute(session) {
    const eventMinute = session.events?.slice?.().reverse?.().find(item => Number.isFinite(Number(item?.minute)))?.minute;
    if (Number.isFinite(Number(eventMinute))) return Number(eventMinute);
    const previousMoment = session.moments?.[Math.max(0, n(session.currentMoment) - 1)];
    if (Number.isFinite(Number(previousMoment))) return Number(previousMoment);
    return 90;
}

function enqueueTeamGoals(session, beforeTeamGoals) {
    ensureRuntime(session);
    const afterTeamGoals = playerTeamScore(session);
    const delta = Math.max(0, afterTeamGoals - n(beforeTeamGoals));
    if (!delta) return [];

    const latestGesture = session.events?.slice?.().reverse?.().find(item => item?.gesture)?.gesture || null;
    const minute = goalMinute(session);
    const startTeamGoals = afterTeamGoals - delta;
    const generated = [];

    for (let index = 0; index < delta; index++) {
        const teamGoals = startTeamGoals + index + 1;
        const score = session.home
            ? { home: teamGoals, away: n(session.score?.away) }
            : { home: n(session.score?.home), away: teamGoals };
        const presentation = buildGoalPresentation({
            matchId: session.id,
            scorer: 'Ton équipe',
            minute,
            score,
            gesture: latestGesture,
            celebration: latestGesture
                ? `L’action déclenche l’explosion. ${latestGesture} reste dans les regards pendant que tes coéquipiers convergent.`
                : 'Le ballon finit au fond et tout le bloc explose. Tes coéquipiers convergent pendant que le stade bascule.',
            stadiumReaction: session.home
                ? 'Les tribunes se lèvent d’un seul mouvement.'
                : 'Pendant une seconde, le stade adverse se coupe avant que les voix de ton banc n’éclatent.'
        });
        if (presentation) generated.push(presentation);
    }

    session.goalPresentationQueue.push(...generated);
    return generated;
}

function goalStep(session, presentation, index = 0) {
    return {
        id: `${session.id}:goal:${presentation.minute}:${index}`,
        phase: 'goal',
        kind: 'goal',
        label: '⚽ BUT',
        progress: Math.min(92, Math.max(15, Math.round((n(presentation.minute) / 90) * 100))),
        minute: presentation.minute,
        title: 'BUT !',
        text: `${presentation.celebration} ${presentation.stadiumReaction}`.trim(),
        team: session.team,
        opponent: session.opponent,
        competition: session.competition,
        home: session.home,
        score: { ...presentation.score },
        choices: [],
        items: [],
        timedDecision: null,
        actionLabel: 'Reprendre le match',
        goal: presentation
    };
}

function exposeNextGoal(session, resumeStep) {
    if (!session.goalPresentationQueue?.length) return false;
    session.runtimeResumeStep ||= resumeStep || session.step || null;
    const presentation = session.goalPresentationQueue.shift();
    session.step = goalStep(session, presentation, n(session.runtimeGoalSequence));
    session.runtimeGoalSequence = n(session.runtimeGoalSequence) + 1;
    return true;
}

function continueAfterGoal(session) {
    ensureRuntime(session);
    if (session.goalPresentationQueue.length) {
        const presentation = session.goalPresentationQueue.shift();
        session.step = goalStep(session, presentation, n(session.runtimeGoalSequence));
        session.runtimeGoalSequence = n(session.runtimeGoalSequence) + 1;
    } else {
        session.step = session.runtimeResumeStep || session.step;
        session.runtimeResumeStep = null;
    }
    return {
        finished: false,
        session,
        step: session.step,
        decision: session.step?.kind === 'decision' ? session.decision : null,
        event: session.events?.at?.(-1) || null
    };
}

function enrichResolvedResult(state, session) {
    if (!session?.result) return;
    session.result.goalEvents = canonicalPlayerGoalEvents(session.result, state?.player || {});
    session.result.interactiveReport = buildInteractiveMatchReport(session.result);
    session.result.matchMemory = { ...(session.matchMemory || createMatchMemory()) };
}

export function startInteractiveMatch(state, scheduledMatch, matchIndex = 0) {
    return ensureRuntime(InteractiveMatchController.startInteractiveMatch(state, scheduledMatch, matchIndex));
}

export function advanceInteractiveMatch(state, activeSession, action = {}) {
    const session = ensureRuntime(activeSession);

    // Une scène de but est une vraie étape manuelle : elle ne fait jamais avancer le moteur
    // tant que le joueur n'a pas appuyé sur « Reprendre le match ».
    if (session.step?.kind === 'goal') return continueAfterGoal(session);

    const beforeTeamGoals = playerTeamScore(session);
    const wasDecision = session.step?.kind === 'decision';
    const timedOut = Boolean(action && typeof action === 'object' && action.timedOut === true);
    const choiceIndex = typeof action === 'number' ? action : action?.choiceIndex;
    const choice = wasDecision && !timedOut && Number.isInteger(Number(choiceIndex))
        ? session.decision?.choices?.[Number(choiceIndex)] || null
        : null;
    const minute = session.decision?.minute ?? session.step?.minute ?? null;

    const result = InteractiveMatchController.advanceInteractiveMatch(state, session, action);
    const nextSession = ensureRuntime(result.session || session);

    if (wasDecision && (timedOut || choice)) {
        recordResolvedDecision(nextSession, { choice, timedOut, minute });
    }

    enqueueTeamGoals(nextSession, beforeTeamGoals);
    enrichResolvedResult(state, nextSession);

    if (!result.finished && nextSession.goalPresentationQueue.length) {
        const resumeStep = nextSession.step;
        exposeNextGoal(nextSession, resumeStep);
        return {
            ...result,
            session: nextSession,
            step: nextSession.step,
            decision: null,
            event: nextSession.events?.at?.(-1) || null
        };
    }

    return { ...result, session: nextSession, result: nextSession.result || result.result };
}

export function resolveInteractiveDecision(state, session, choiceIndex) {
    return advanceInteractiveMatch(state, session, { choiceIndex });
}

export function commitInteractiveResult(state, result) {
    return InteractiveMatchController.commitInteractiveResult(state, result);
}

export const InteractiveMatchRuntime = Object.freeze({
    startInteractiveMatch,
    advanceInteractiveMatch,
    resolveInteractiveDecision,
    commitInteractiveResult
});

export default InteractiveMatchRuntime;
