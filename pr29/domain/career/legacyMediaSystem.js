// domain/career/legacyMediaSystem.js
// Transforme la réputation du père en réactions médiatiques contextuelles.
// Produit des faits/signaux, jamais de rendu UI.

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export class LegacyMediaSystem {
    evaluate({ career, context = {} }) {
        const legacy = career?.socialContext?.familyLegacy;
        if (!legacy) return [];

        const pressure = clamp(Number(career.socialContext.legacyPressure ?? legacy.expectationPressure ?? 0));
        const exposure = clamp(Number(context.mediaExposure ?? 0));
        const performance = clamp(Number(context.performance ?? 50));
        const age = Number(career.age ?? 14);
        const signals = [];

        if (age <= 18 && exposure >= 60 && pressure >= 65) {
            signals.push({
                type: 'early_family_comparison',
                intensity: Math.round((pressure + exposure) / 2),
                reason: 'young_player_high_legacy_exposure'
            });
        }
        if (performance >= 85 && pressure >= 55) {
            signals.push({
                type: 'breaks_from_fathers_shadow',
                intensity: Math.round((performance + (100 - pressure)) / 2),
                reason: 'exceptional_performance'
            });
        }
        if (performance < 40 && pressure >= 70 && exposure >= 70) {
            signals.push({
                type: 'legacy_pressure_spike',
                intensity: Math.round((pressure + exposure + (100 - performance)) / 3),
                reason: 'poor_performance_under_high_attention'
            });
        }
        return signals;
    }
}

export default LegacyMediaSystem;
