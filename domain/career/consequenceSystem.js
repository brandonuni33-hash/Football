// domain/career/consequenceSystem.js
// Les choix créent des conséquences différées et partiellement cachées.
// Le joueur ne reçoit pas la totalité des effets au moment du choix.

const clamp = (value, min = -100, max = 100) => Math.max(min, Math.min(max, value));

export class ConsequenceSystem {
    apply({ state, choiceId, source = 'choice', effects = [], context = {} }) {
        state.consequences ||= [];
        const applied = [];

        for (const effect of effects) {
            const magnitude = this.#resolveMagnitude(effect, context);
            const consequence = {
                id: `consequence_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                choiceId,
                source,
                target: effect.target,
                type: effect.type || 'modifier',
                magnitude,
                visibility: effect.visibility || 'hidden',
                delay: effect.delay || 'deferred',
                trigger: effect.trigger || null,
                createdAt: new Date().toISOString(),
                resolved: false
            };

            state.consequences.push(consequence);
            applied.push(consequence);
        }

        return applied;
    }

    resolvePending({ state, trigger, context = {} }) {
        const pending = (state?.consequences || []).filter(item => !item.resolved && item.trigger === trigger);
        const resolved = [];

        for (const consequence of pending) {
            consequence.resolved = true;
            consequence.resolvedAt = new Date().toISOString();
            consequence.result = this.#resolveResult(consequence, context);
            resolved.push(consequence);
        }

        return resolved;
    }

    #resolveMagnitude(effect, context) {
        const base = Number(effect.magnitude ?? 0);
        const volatility = Number(effect.volatility ?? 0);
        const contextFactor = Number(context.factor ?? 0);
        const variance = volatility ? (Math.random() * 2 - 1) * volatility : 0;
        return Math.round(clamp(base + contextFactor + variance));
    }

    #resolveResult(consequence, context) {
        return {
            target: consequence.target,
            type: consequence.type,
            magnitude: consequence.magnitude,
            context: context.summary || null
        };
    }
}

export default ConsequenceSystem;
