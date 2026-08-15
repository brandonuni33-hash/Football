// Transforme les faits résolus des domaines en contrat narratif immuable.

export const NARRATIVE_CERTAINTIES = Object.freeze(['confirmed', 'reported', 'rumor']);
export const NARRATIVE_VISIBILITIES = Object.freeze(['public', 'player', 'hidden']);

const isRecord = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

function clonePlain(value) {
    if (Array.isArray(value)) return value.map(clonePlain);
    if (!isRecord(value)) return value;
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, clonePlain(value[key])]));
}

export function freezeNarrativeValue(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(freezeNarrativeValue);
    return Object.freeze(value);
}

export function stableNarrativeSerialize(value) {
    return JSON.stringify(clonePlain(value));
}

export function narrativeHash(value) {
    const input = typeof value === 'string' ? value : stableNarrativeSerialize(value);
    let hash = 2166136261;
    for (let index = 0; index < input.length; index++) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
}

export function stableNarrativeId(prefix, value) {
    const safePrefix = String(prefix || 'narrative').toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
    return `${safePrefix}_${narrativeHash(value)}`;
}

function requiredString(value, field) {
    const normalized = String(value || '').trim();
    if (!normalized) throw new TypeError(`NarrativeFact.${field} est obligatoire.`);
    return normalized;
}

function stringList(values) {
    return [...new Set((Array.isArray(values) ? values : [])
        .map(value => String(value || '').trim())
        .filter(Boolean))].sort();
}

export class NarrativeFactNormalizer {
    normalize(rawFact = {}) {
        if (!isRecord(rawFact)) throw new TypeError('NarrativeFact doit être un objet.');
        const type = requiredString(rawFact.type, 'type');
        const source = requiredString(rawFact.source, 'source');
        const occurredAt = requiredString(rawFact.occurredAt, 'occurredAt');
        const dedupeKey = requiredString(rawFact.dedupeKey, 'dedupeKey');
        const certainty = NARRATIVE_CERTAINTIES.includes(rawFact.certainty) ? rawFact.certainty : 'confirmed';
        const visibility = NARRATIVE_VISIBILITIES.includes(rawFact.visibility) ? rawFact.visibility : 'player';
        const id = String(rawFact.id || stableNarrativeId('fact', { type, source, dedupeKey })).trim();

        return freezeNarrativeValue({
            id,
            type,
            source,
            occurredAt,
            subjectId: rawFact.subjectId === null || rawFact.subjectId === undefined
                ? null
                : String(rawFact.subjectId),
            actorIds: stringList(rawFact.actorIds),
            metrics: clonePlain(isRecord(rawFact.metrics) ? rawFact.metrics : {}),
            outcome: clonePlain(isRecord(rawFact.outcome) ? rawFact.outcome : {}),
            certainty,
            visibility,
            tags: stringList(rawFact.tags),
            dedupeKey,
            payload: clonePlain(isRecord(rawFact.payload) ? rawFact.payload : {})
        });
    }

    normalizeAll(rawFacts = []) {
        return (Array.isArray(rawFacts) ? rawFacts : []).map(fact => this.normalize(fact));
    }
}

export default NarrativeFactNormalizer;
