// domain/career/familyLegacyDynamics.js
// Transforme l'héritage familial en expérience vécue pendant la carrière du fils.
// L'héritage n'accorde jamais de bonus sportif direct.

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export class FamilyLegacyDynamics {
    apply({ career, event = {}, context = {} }) {
        if (!career?.socialContext?.familyLegacy) return null;

        const legacy = career.socialContext.familyLegacy;
        const pressure = Number(legacy.expectationPressure ?? 0);
        const access = Number(legacy.accessBonus ?? 0);
        const comparisonRisk = Number(legacy.comparisonRisk ?? 0);
        const performance = Number(context.performance ?? 50);
        const mediaExposure = Number(context.mediaExposure ?? 0);

        let pressureDelta = 0;
        let confidenceDelta = 0;
        let accessDelta = 0;

        if (event.type === 'public_debut' && performance < 45) {
            pressureDelta += Math.round(pressure * 0.15);
        }
        if (event.type === 'public_debut' && performance >= 75) {
            confidenceDelta += Math.round((100 - pressure) * 0.08);
        }
        if (event.type === 'media_comparison') {
            pressureDelta += Math.round(comparisonRisk * 0.12 + mediaExposure * 0.08);
        }
        if (event.type === 'network_contact') {
            accessDelta += Math.round(access * 0.10);
        }
        if (event.type === 'achievement') {
            pressureDelta -= Math.round(pressure * 0.05);
            confidenceDelta += 3;
        }

        const social = career.socialContext;
        social.legacyPressure = clamp(Number(social.legacyPressure ?? pressure) + pressureDelta);
        social.socialConfidence = clamp(Number(social.socialConfidence ?? 45) + confidenceDelta);
        social.inheritedAccess = clamp(Number(social.inheritedAccess ?? access) + accessDelta);

        career.legacyHistory ||= [];
        career.legacyHistory.push({
            event: event.type || 'unknown',
            pressureDelta,
            confidenceDelta,
            accessDelta,
            createdAt: new Date().toISOString()
        });

        return {
            pressure: social.legacyPressure,
            confidence: social.socialConfidence,
            access: social.inheritedAccess
        };
    }
}

export default FamilyLegacyDynamics;
