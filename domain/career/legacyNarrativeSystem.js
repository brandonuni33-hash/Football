// domain/career/legacyNarrativeSystem.js
// Convertit l'héritage familial en signaux narratifs sans gérer l'affichage UI.

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export class LegacyNarrativeSystem {
    evaluate({ career, context = {} }) {
        const legacy = career?.socialContext?.familyLegacy;
        if (!legacy) return null;

        const pressure = clamp(Number(career.socialContext.legacyPressure ?? legacy.expectationPressure ?? 0));
        const confidence = clamp(Number(career.socialContext.socialConfidence ?? 45));
        const access = clamp(Number(career.socialContext.inheritedAccess ?? legacy.accessBonus ?? 0));
        const performance = clamp(Number(context.performance ?? 50));
        const publicExposure = clamp(Number(context.mediaExposure ?? 0));

        const signals = [];
        if (pressure >= 70 && performance < 45) {
            signals.push({ type: 'family_comparison', intensity: Math.round((pressure + publicExposure) / 2), tone: 'pressure' });
        }
        if (pressure >= 55 && performance >= 75) {
            signals.push({ type: 'family_name_validation', intensity: Math.round((performance + confidence) / 2), tone: 'positive' });
        }
        if (access >= 55 && context.socialOpportunity) {
            signals.push({ type: 'inherited_network_opened_door', intensity: access, tone: 'opportunity' });
        }
        if (confidence >= 75 && pressure <= 35) {
            signals.push({ type: 'own_identity_emerging', intensity: confidence, tone: 'identity' });
        }
        return signals;
    }
}

export default LegacyNarrativeSystem;
