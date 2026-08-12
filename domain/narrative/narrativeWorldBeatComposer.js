// Compose les observations du monde déjà visibles par le joueur.

import { stableNarrativeId } from './narrativeFactNormalizer.js';

const n = value => Number.isFinite(Number(value)) ? Number(value) : null;

function sentence(text) {
    const value = String(text || '').trim();
    if (!value) return '';
    return /[.!?…]$/.test(value) ? value : `${value}.`;
}

function coachRelationshipText(coach = {}) {
    const relation = n(coach.relation);
    const name = coach.name || 'le coach';
    const opinion = String(coach.opinion || '').toLowerCase();

    if (coach.isFormative && relation !== null && relation >= 72) {
        return `${name} n’est plus seulement un entraîneur dans ton parcours. Il t’a connu assez tôt pour que son regard compte autrement que celui des autres.`;
    }
    if (relation !== null && relation >= 82) {
        return `Entre ${name} et toi, la confiance s’est construite avec le temps. Ses mots ont désormais le poids d’une relation qui dépasse la simple hiérarchie.`;
    }
    if (relation !== null && relation <= 28) {
        return `Entre ${name} et toi, la confiance est devenue fragile. Dans cette période, une phrase de travers peut laisser plus de traces qu’elle ne devrait.`;
    }
    if (opinion.includes('fâch') || opinion.includes('déçu')) {
        return `${name} ne te regarde plus tout à fait de la même manière. Tu sens que les prochains actes compteront davantage que les explications.`;
    }
    if (relation !== null && relation >= 60) {
        return `Le lien avec ${name} est solide, sans être acquis. C’est précisément pour cela que cet échange mérite ton attention.`;
    }
    return null;
}

function playerMindsetText(player = {}) {
    const mindset = player.mindset || {};
    const morale = n(mindset.morale);
    const fitness = n(mindset.fitness);

    if (morale !== null && morale <= 32) {
        return `Tu le ressens plus fortement que tu ne voudrais l’admettre : dans ton état actuel, ce rendez-vous te travaille déjà.`;
    }
    if (fitness !== null && fitness <= 58) {
        return `La fatigue n’aide pas à prendre de la distance. Tu sais que cet échange arrive à un moment où chaque détail pèse un peu plus.`;
    }
    if (morale !== null && morale >= 78) {
        return `Tu abordes l’échange avec confiance, mais sans l’impression d’avoir quoi que ce soit d’acquis.`;
    }
    return null;
}

function coachObservation(fact, evaluation, context) {
    const payload = fact.payload || {};
    const coach = context?.relationships?.coach || {};
    const parts = [sentence(payload.text)];
    const relationship = coachRelationshipText(coach);
    const mindset = playerMindsetText(context?.player);
    if (relationship) parts.push(relationship);
    if (mindset) parts.push(mindset);

    return {
        id: stableNarrativeId('observation', fact.id),
        key: `${fact.id}:world-observation`,
        kind: 'world-observation',
        category: 'coach',
        title: payload.title || (coach.name ? `${coach.name} veut te parler` : 'Le coach veut te parler'),
        text: parts.filter(Boolean).join(' '),
        importance: evaluation?.importance || payload.importance || 'normal',
        factId: fact.id,
        occurredAt: fact.occurredAt,
        delay: 900,
        emphasis: ['important', 'major', 'exceptional'].includes(evaluation?.importance || payload.importance)
    };
}

function observation(fact, evaluation, context) {
    if (fact.type === 'coach.interaction.created') return coachObservation(fact, evaluation, context);

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
    compose({ facts = [], evaluations = [], context = {} } = {}) {
        const evaluationById = new Map(evaluations.map(item => [item.factId, item]));
        const worldFacts = facts.filter(fact => fact.type !== 'match.completed');
        const ranked = [...worldFacts].sort((left, right) =>
            (evaluationById.get(right.id)?.score || 0) - (evaluationById.get(left.id)?.score || 0));
        const allObservations = ranked.map(fact => observation(fact, evaluationById.get(fact.id), context));
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
                title: first.category === 'coach' ? first.title : 'Le monde continue de bouger',
                subtitle: first.category === 'coach'
                    ? 'Un échange qui peut compter dans la relation'
                    : `${worldFacts.length} évolution${worldFacts.length > 1 ? 's' : ''} autour de ta carrière`,
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
