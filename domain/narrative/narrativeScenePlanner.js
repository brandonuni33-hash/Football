// Classe les faits et limite chaque traitement à une seule scène principale.

export class NarrativeScenePlanner {
    plan({ facts = [], evaluations = [], arcs = [] } = {}) {
        if (!facts.length) return { primary: null, passive: [] };
        const evaluationById = new Map(evaluations.map(item => [item.factId, item]));
        const appearances = facts.filter(fact => fact.metrics?.playerPlayed !== false);
        const candidates = appearances.length ? appearances : facts;
        const featuredFact = [...candidates].sort((left, right) =>
            (evaluationById.get(right.id)?.score || 0) - (evaluationById.get(left.id)?.score || 0))[0] || null;
        const impactFact = [...appearances].sort((left, right) =>
            (evaluationById.get(right.id)?.impactScore || -100) - (evaluationById.get(left.id)?.impactScore || -100))[0] || null;
        if (!featuredFact) return { primary: null, passive: [] };

        return {
            primary: {
                featuredFact,
                impactFact,
                facts: [...facts].sort((left, right) =>
                    Number(left.metrics?.matchIndex ?? 0) - Number(right.metrics?.matchIndex ?? 0)),
                evaluation: evaluationById.get(featuredFact.id) || null,
                evaluations: evaluationById,
                arc: arcs[0] || null
            },
            passive: []
        };
    }
}

export default NarrativeScenePlanner;
