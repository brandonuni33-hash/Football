// domain/career/familyLegacySystem.js
// Calcule l'empreinte sociale transmise à la génération suivante.
// La réputation familiale influence l'accès social et les attentes, jamais le potentiel sportif.

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export class FamilyLegacySystem {
    evaluate({ state, parentId, world = {} }) {
        const parent = state?.players?.find(player => player.id === parentId) || state?.player;
        const reputation = clamp(Number(parent?.reputation ?? parent?.fame ?? 0));
        const achievements = clamp(Number(parent?.careerStats?.achievements ?? 0) * 8);
        const media = clamp(Number(parent?.mediaReputation ?? 0));
        const network = clamp(Number((state?.relationshipNetwork || []).filter(edge => edge.sourceId === parentId || edge.targetId === parentId).length * 5));
        const controversies = clamp(Number(parent?.controversies ?? 0) * 8);

        const legacy = clamp(
            reputation * 0.35 +
            achievements * 0.30 +
            media * 0.15 +
            network * 0.20 -
            controversies * 0.20
        );

        return {
            score: Math.round(legacy),
            tier: legacy >= 85 ? 'legendary' : legacy >= 65 ? 'renowned' : legacy >= 40 ? 'known' : 'ordinary',
            accessBonus: Math.round(clamp(legacy * 0.35)),
            expectationPressure: Math.round(clamp(legacy * 0.45)),
            comparisonRisk: Math.round(clamp(legacy * 0.30 + controversies * 0.15)),
            parentReputation: reputation
        };
    }

    buildContext({ state, parentId, childId, world = {} }) {
        const legacy = this.evaluate({ state, parentId, world });
        const context = {
            childId,
            parentId,
            legacy,
            facts: {
                inheritedNameRecognition: legacy.score >= 40,
                inheritedAccess: legacy.accessBonus,
                publicExpectations: legacy.expectationPressure,
                comparisonRisk: legacy.comparisonRisk
            }
        };

        state.familyLegacy ||= [];
        state.familyLegacy.push({ ...context, createdAt: new Date().toISOString() });
        return context;
    }
}

export default FamilyLegacySystem;
