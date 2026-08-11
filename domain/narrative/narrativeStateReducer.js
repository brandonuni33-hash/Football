// Seul écrivain du state narratif. Il ne touche ni au joueur, ni au monde, ni à careerMemory.

import { NARRATIVE_STATE_LIMITS, normalizeNarrativeState } from '../../state/narrativeState.js';

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function uniqueTail(values, limit) {
    return [...new Set(values.filter(Boolean).map(String))].slice(-limit);
}

function applyThreadTransitions(current, transitions = []) {
    const storyThreads = { ...current };
    for (const transition of transitions) {
        const id = String(transition?.threadId || '').trim();
        if (!id) continue;
        if (transition.action === 'close') {
            if (storyThreads[id]) storyThreads[id] = { ...storyThreads[id], status: 'closed', closedReason: transition.reason || null };
            continue;
        }
        const previous = storyThreads[id] || { id, type: transition.type || 'story', momentum: 0, evidenceFactIds: [] };
        storyThreads[id] = {
            ...previous,
            id,
            type: transition.type || previous.type || 'story',
            status: transition.status || previous.status || 'active',
            phase: transition.phase || previous.phase || 'steady',
            momentum: clamp(n(previous.momentum) + n(transition.momentumDelta), -10, 10),
            evidenceFactIds: uniqueTail([
                ...(previous.evidenceFactIds || []), ...(transition.evidenceFactIds || [])
            ], NARRATIVE_STATE_LIMITS.threadEvidence),
            lastOccurredAt: transition.lastOccurredAt || previous.lastOccurredAt || null,
            summary: transition.summary || previous.summary || null
        };
    }
    return storyThreads;
}

export class NarrativeStateReducer {
    apply(state, { facts = [], output = {} } = {}) {
        if (!state || typeof state !== 'object') return null;
        const current = normalizeNarrativeState(state.narrativeState);
        const processed = new Set(current.processedFactIds);
        const freshFacts = facts.filter(fact => fact?.id && !processed.has(fact.id));
        if (!freshFacts.length) {
            state.narrativeState = current;
            return current;
        }

        const callbacks = [...current.callbacks];
        const callbackIds = new Set(callbacks.map(callback => callback.id));
        for (const command of output.callbackCommands || []) {
            if (!command?.id || callbackIds.has(command.id)) continue;
            callbackIds.add(command.id);
            callbacks.push({ ...command });
        }

        const scene = output.primaryScene || null;
        const sceneFactId = scene?.sourceFactIds?.[0] || null;
        const importance = String(scene?.importance || 'normal');
        const isMajor = ['important', 'major', 'exceptional'].includes(importance);
        const beatKeys = scene?.beats?.map(beat => beat.key).filter(Boolean) || [];
        const cooldowns = { ...current.cooldowns };
        if (sceneFactId) cooldowns[`scene:${scene.type}`] = sceneFactId;

        state.narrativeState = normalizeNarrativeState({
            ...current,
            processedFactIds: [...current.processedFactIds, ...freshFacts.map(fact => fact.id)],
            storyThreads: applyThreadTransitions(current.storyThreads, output.threadTransitions),
            callbacks,
            cooldowns,
            recentBeatKeys: [...current.recentBeatKeys, ...beatKeys],
            pacing: {
                lastSceneFactId: sceneFactId || current.pacing.lastSceneFactId,
                lastMajorSceneFactId: isMajor && sceneFactId ? sceneFactId : current.pacing.lastMajorSceneFactId,
                sceneCount: current.pacing.sceneCount + (scene ? 1 : 0),
                quietBlocks: scene ? 0 : current.pacing.quietBlocks + 1
            }
        });
        return state.narrativeState;
    }
}

export default NarrativeStateReducer;
