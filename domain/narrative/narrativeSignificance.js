// Mesure l'importance narrative sans modifier le fait ni les règles métier.

export const NARRATIVE_IMPORTANCE = Object.freeze({ low: 0, normal: 1, important: 2, major: 3, exceptional: 4 });
const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;

export function importanceOfFact(fact = {}) {
    const payload = fact.payload || {};
    const fixture = payload.fixture || {};
    const explicit = String(payload.importance || fixture.importance || '').toLowerCase();
    if (NARRATIVE_IMPORTANCE[explicit] !== undefined) return explicit;
    const phase = `${payload.phase || fixture.phase || ''} ${payload.round || fixture.round || ''}`.toLowerCase();
    if (phase.includes('final')) return 'exceptional';
    if (fixture.isDerby || fixture.rival || fixture.rivalry) return 'major';
    return 'normal';
}

export function impactScore(fact = {}) {
    const metrics = fact.metrics || {};
    if (metrics.playerPlayed === false) return -100;
    return n(metrics.goals) * 4 + n(metrics.assists) * 3 + Math.max(-2, n(metrics.rating) - 6) * 1.5;
}

export function impactLevel(fact = {}) {
    const metrics = fact.metrics || {};
    if (metrics.playerPlayed === false) return 'unused';
    const goals = n(metrics.goals), assists = n(metrics.assists), rating = n(metrics.rating);
    if (goals >= 2 || goals + assists >= 2 || rating >= 8.2) return 'decisive';
    if (goals + assists >= 1 || rating >= 7.5) return 'strong';
    if (rating >= 6) return 'present';
    return 'difficult';
}

export class NarrativeSignificance {
    evaluate(fact = {}) {
        const metrics = fact.metrics || {};
        const importance = importanceOfFact(fact);
        const importanceScore = NARRATIVE_IMPORTANCE[importance] || 0;
        const decisive = n(metrics.goals) * 3 + n(metrics.assists) * 2;
        const resultWeight = fact.outcome?.result === 'win' ? 2 : fact.outcome?.result === 'loss' ? 1 : 0;
        const interactive = metrics.interactive ? 1.5 : 0;
        const appearance = metrics.playerPlayed === false ? -8 : 0;
        const reasons = [importance];
        if (n(metrics.goals) + n(metrics.assists) >= 2) reasons.push('decisive-contribution');
        if (n(metrics.rating) >= 8.2) reasons.push('elite-rating');
        if (metrics.interactive) reasons.push('interactive');
        return Object.freeze({
            factId: fact.id,
            score: importanceScore * 10 + decisive + Math.max(0, n(metrics.rating) - 6) + resultWeight + interactive + appearance,
            impactScore: impactScore(fact),
            impactLevel: impactLevel(fact),
            importance,
            reasons: Object.freeze(reasons)
        });
    }

    evaluateAll(facts = []) {
        return facts.map(fact => this.evaluate(fact));
    }
}

export default NarrativeSignificance;
