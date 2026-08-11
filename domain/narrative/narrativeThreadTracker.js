// Suit les histoires concrètes et persistantes. Ces fils ne sont pas les threads de notifications.

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;

export class NarrativeThreadTracker {
    track({ facts = [], evaluations = [] } = {}) {
        const appearances = facts.filter(fact => fact.metrics?.playerPlayed !== false);
        if (!appearances.length) return [];
        const decisive = evaluations.filter(item => item.impactLevel === 'decisive').length;
        const difficult = evaluations.filter(item => item.impactLevel === 'difficult').length;
        const goals = appearances.reduce((sum, fact) => sum + n(fact.metrics?.goals), 0);
        const assists = appearances.reduce((sum, fact) => sum + n(fact.metrics?.assists), 0);
        const averageRating = appearances.reduce((sum, fact) => sum + n(fact.metrics?.rating), 0) / appearances.length;
        const phase = decisive || goals + assists >= 2
            ? 'rising'
            : difficult || averageRating < 5.8 ? 'struggling' : 'steady';
        const momentumDelta = phase === 'rising' ? 2 : phase === 'struggling' ? -2 : 0;

        return [{
            threadId: 'player-form',
            action: 'upsert',
            type: 'form',
            status: 'active',
            phase,
            momentumDelta,
            evidenceFactIds: facts.map(fact => fact.id),
            lastOccurredAt: facts.at(-1)?.occurredAt || null,
            summary: { appearances: appearances.length, goals, assists, averageRating: Number(averageRating.toFixed(1)) }
        }];
    }
}

export default NarrativeThreadTracker;
