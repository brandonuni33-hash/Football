// Suit les histoires concrètes et persistantes. Ces fils ne sont pas les threads de notifications.

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;

function transition(fact, threadId, type, phase, momentumDelta = 0, status = 'active') {
    return {
        threadId, action: 'upsert', type, status, phase, momentumDelta,
        evidenceFactIds: [fact.id], lastOccurredAt: fact.occurredAt,
        summary: { title: fact.payload?.title || null, category: fact.payload?.category || fact.source }
    };
}

function worldTransition(fact) {
    const identity = fact.payload?.interestId || fact.payload?.clubId || 'market';
    if (fact.type === 'transfer.offer.created') return transition(fact, `transfer:${identity}`, 'transfer', 'offer', 3);
    if (fact.type === 'transfer.contact.created') return transition(fact, `transfer:${identity}`, 'transfer', fact.outcome?.to || 'contact', 1);
    if (fact.type === 'coach.interaction.created') return transition(fact, 'coach-relationship', 'relationship', 'attention', 0);
    if (fact.type === 'media.dilemma.created') return transition(fact, 'public-image', 'media', 'under-pressure', -1);
    if (fact.type === 'media.post.created') {
        const delta = fact.outcome?.postType === 'critique' ? -1 : fact.outcome?.postType === 'media' ? 1 : 0;
        return transition(fact, 'public-image', 'media', delta < 0 ? 'challenged' : 'visible', delta);
    }
    if (fact.type === 'career.role.discovered') return transition(fact, 'career-identity', 'identity', 'defined', 2);
    if (fact.type === 'career.position.proposed') return transition(fact, 'career-identity', 'identity', 'repositioning', 1);
    if (fact.type === 'family.child-born') return transition(fact, 'family-legacy', 'family', 'new-generation', 3);
    if (fact.type === 'decision.consequence.revealed') {
        const choiceId = fact.payload?.choiceId || fact.id;
        return transition(fact, `decision:${choiceId}`, 'decision', 'resolved', 0, 'resolved');
    }
    return null;
}

export class NarrativeThreadTracker {
    track({ facts = [], evaluations = [] } = {}) {
        const transitions = facts.map(worldTransition).filter(Boolean);
        const matchFacts = facts.filter(fact => fact.type === 'match.completed');
        const appearances = matchFacts.filter(fact => fact.metrics?.playerPlayed !== false);
        if (!appearances.length) return transitions;
        const matchIds = new Set(matchFacts.map(fact => fact.id));
        const matchEvaluations = evaluations.filter(item => matchIds.has(item.factId));
        const decisive = matchEvaluations.filter(item => item.impactLevel === 'decisive').length;
        const difficult = matchEvaluations.filter(item => item.impactLevel === 'difficult').length;
        const goals = appearances.reduce((sum, fact) => sum + n(fact.metrics?.goals), 0);
        const assists = appearances.reduce((sum, fact) => sum + n(fact.metrics?.assists), 0);
        const averageRating = appearances.reduce((sum, fact) => sum + n(fact.metrics?.rating), 0) / appearances.length;
        const phase = decisive || goals + assists >= 2 ? 'rising'
            : difficult || averageRating < 5.8 ? 'struggling' : 'steady';
        transitions.unshift({
            threadId: 'player-form', action: 'upsert', type: 'form', status: 'active', phase,
            momentumDelta: phase === 'rising' ? 2 : phase === 'struggling' ? -2 : 0,
            evidenceFactIds: matchFacts.map(fact => fact.id),
            lastOccurredAt: matchFacts.at(-1)?.occurredAt || null,
            summary: { appearances: appearances.length, goals, assists, averageRating: Number(averageRating.toFixed(1)) }
        });
        return transitions;
    }
}

export default NarrativeThreadTracker;
