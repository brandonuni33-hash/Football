// domain/career/decisionInfluenceSystem.js
// Les personnes autour du joueur influencent une décision sans jamais la prendre à sa place.

const clamp = (value, min = -100, max = 100) => Math.max(min, Math.min(max, value));

const WEIGHTS = Object.freeze({
    agent: 0.30,
    coach: 0.20,
    family: 0.15,
    relationship: 0.15,
    sporting: 0.10,
    financial: 0.10
});

export class DecisionInfluenceSystem {
    evaluate({ decision, context = {} }) {
        const influences = {
            agent: this.#score(context.agent, decision),
            coach: this.#score(context.coach, decision),
            family: this.#score(context.family, decision),
            relationship: this.#score(context.relationship, decision),
            sporting: this.#score(context.sporting, decision),
            financial: this.#score(context.financial, decision)
        };

        const weighted = Object.entries(influences).reduce(
            (sum, [key, value]) => sum + value * WEIGHTS[key], 0
        );

        return {
            decision,
            influences,
            weightedScore: Math.round(weighted),
            pressure: Math.round(Math.abs(weighted)),
            consensus: this.#consensus(influences),
            conflict: this.#conflict(influences)
        };
    }

    applyOutcome({ state, decision, context = {}, outcome = {} }) {
        const evaluation = this.evaluate({ decision, context });
        state.decisionHistory ||= [];
        state.decisionHistory.push({
            decision,
            outcome,
            influences: evaluation.influences,
            weightedScore: evaluation.weightedScore,
            conflict: evaluation.conflict,
            createdAt: new Date().toISOString()
        });
        return evaluation;
    }

    #score(actor, decision) {
        if (!actor) return 0;
        if (typeof actor === 'number') return clamp(actor);
        const preference = actor.preferences?.[decision];
        if (typeof preference === 'number') return clamp(preference);
        return clamp(Number(actor.influence ?? 0));
    }

    #consensus(influences) {
        const values = Object.values(influences).filter(value => value !== 0);
        if (!values.length) return 'neutral';
        const positive = values.filter(value => value > 20).length;
        const negative = values.filter(value => value < -20).length;
        if (positive && negative) return 'divided';
        if (positive) return 'supportive';
        if (negative) return 'opposed';
        return 'mixed';
    }

    #conflict(influences) {
        const values = Object.values(influences);
        return values.length ? Math.round(Math.max(...values) - Math.min(...values)) : 0;
    }
}

export default DecisionInfluenceSystem;
