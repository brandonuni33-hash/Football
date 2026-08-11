// Compose les observations du monde déjà visibles par le joueur.

import { stableNarrativeId } from './narrativeFactNormalizer.js';

function observation(fact, evaluation) {
    const payload = fact.payload || {};
    const category = payload.category || fact.source || 'career';
    return {
        id: stableNarrativeId('observation', fact.id),
        key: `${fact.id}:world-observation`,
        kind: 'world-observation',
        category,
        title: payload.title || 'Le monde réagit',
        text: payload.text || 'Quelque chose évolue autour de ta carrière.',
        importance: evaluation?.importance || payload.importance || 'normal',
        factId: fact.id,
        occurredAt: fact.occurredAt,
        delay: 900,
        emphasis: ['important', 'major', 'exceptional'].includes(evaluation?.importance || payload.importance)
    };
}

export class NarrativeWorldBeatComposer {
    compose({ facts = [], evaluations = [] } = {}) {
        const evaluationById = new Map(evaluations.map(item => [item.factId, item]));
        const worldFacts = facts.filter(fact => fact.type !== 'match.completed');
        const ranked = [...worldFacts].sort((left, right) =>
            (evaluationById.get(right.id)?.score || 0) - (evaluationById.get(left.id)?.score || 0));
        const allObservations = ranked.map(fact => observation(fact, evaluationById.get(fact.id)));
        const passiveBeats = allObservations.slice(0, 3);
        const journalEntries = [...allObservations].reverse().map(item => ({
            id: stableNarrativeId('journal', item.factId),
            type: 'narrative.observation',
            category: item.category,
            title: item.title,
            text: item.text,
            importance: item.importance,
            sourceFactId: item.factId,
            occurredAt: item.occurredAt
        }));
        if (!passiveBeats.length) return { primaryScene: null, passiveBeats, journalEntries };
        const first = passiveBeats[0];
        return {
            primaryScene: {
                id: stableNarrativeId('narrative_world', passiveBeats.map(item => item.factId)),
                type: 'world.update',
                importance: first.importance,
                tone: 'reflection',
                title: 'Le monde continue de bouger',
                subtitle: `${worldFacts.length} évolution${worldFacts.length > 1 ? 's' : ''} autour de ta carrière`,
                matches: [],
                beats: passiveBeats,
                sourceFactIds: ranked.map(fact => fact.id),
                facts: { factCount: worldFacts.length, categories: [...new Set(allObservations.map(item => item.category))] }
            },
            passiveBeats,
            journalEntries
        };
    }
}

export default NarrativeWorldBeatComposer;
