// Etat opérationnel canonique du Narrative Engine.
// Il reste distinct de careerMemory (mémoire durable) et des notifications.

export const NARRATIVE_STATE_VERSION = 2;
export const NARRATIVE_STATE_LIMITS = Object.freeze({
    processedFacts: 500,
    callbacks: 100,
    unresolvedHooks: 100,
    journalEntries: 150,
    recentBeats: 60,
    threadEvidence: 30
});

const isRecord = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function uniqueStrings(values, limit) {
    const seen = new Set();
    const output = [];
    for (const value of Array.isArray(values) ? values : []) {
        const normalized = String(value || '').trim();
        if (!normalized || seen.has(normalized)) continue;
        seen.add(normalized);
        output.push(normalized);
    }
    return output.slice(-limit);
}

function records(values, limit) {
    return (Array.isArray(values) ? values : [])
        .filter(isRecord)
        .map(value => ({ ...value }))
        .slice(-limit);
}

function storyThreads(value) {
    if (!isRecord(value)) return {};
    return Object.fromEntries(Object.entries(value)
        .filter(([id, thread]) => id && isRecord(thread))
        .map(([id, thread]) => [id, {
            ...thread,
            id: String(thread.id || id),
            evidenceFactIds: uniqueStrings(thread.evidenceFactIds, NARRATIVE_STATE_LIMITS.threadEvidence)
        }]));
}

export function normalizeNarrativeState(value = {}) {
    const current = isRecord(value) ? value : {};
    const pacing = isRecord(current.pacing) ? current.pacing : {};
    return {
        version: NARRATIVE_STATE_VERSION,
        processedFactIds: uniqueStrings(current.processedFactIds, NARRATIVE_STATE_LIMITS.processedFacts),
        storyThreads: storyThreads(current.storyThreads),
        callbacks: records(current.callbacks, NARRATIVE_STATE_LIMITS.callbacks),
        unresolvedHooks: records(current.unresolvedHooks, NARRATIVE_STATE_LIMITS.unresolvedHooks),
        journalEntries: records(current.journalEntries, NARRATIVE_STATE_LIMITS.journalEntries),
        cooldowns: isRecord(current.cooldowns) ? { ...current.cooldowns } : {},
        recentBeatKeys: uniqueStrings(current.recentBeatKeys, NARRATIVE_STATE_LIMITS.recentBeats),
        pacing: {
            lastSceneFactId: pacing.lastSceneFactId ? String(pacing.lastSceneFactId) : null,
            lastMajorSceneFactId: pacing.lastMajorSceneFactId ? String(pacing.lastMajorSceneFactId) : null,
            sceneCount: Math.max(0, finite(pacing.sceneCount)),
            quietBlocks: Math.max(0, finite(pacing.quietBlocks))
        }
    };
}

export function createNarrativeState(overrides = {}) {
    return normalizeNarrativeState(overrides);
}

export default createNarrativeState;
