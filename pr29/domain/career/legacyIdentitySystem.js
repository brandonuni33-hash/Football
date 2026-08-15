// domain/career/legacyIdentitySystem.js
// Suit la transition entre « fils de » et identité propre.
// N'accorde aucun bonus sportif direct.

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export class LegacyIdentitySystem {
    evaluate({ career, context = {} }) {
        const social = career?.socialContext;
        if (!social?.familyLegacy) return null;

        const age = Number(career.age ?? 14);
        const performance = clamp(Number(context.performance ?? 50));
        const mediaExposure = clamp(Number(context.mediaExposure ?? 0));
        const achievements = clamp(Number(context.achievements ?? 0));
        const pressure = clamp(Number(social.legacyPressure ?? social.familyLegacy.expectationPressure ?? 0));

        const ownIdentity = clamp(
            age * 2.2 +
            performance * 0.35 +
            achievements * 0.25 -
            pressure * 0.12
        );

        const fatherReference = clamp(
            100 - ownIdentity +
            mediaExposure * 0.15 +
            pressure * 0.10
        );

        const phase = ownIdentity >= 80
            ? 'independent'
            : ownIdentity >= 60
                ? 'emerging'
                : age <= 18
                    ? 'son_of_legacy'
                    : 'defined_by_legacy';

        return {
            ownIdentity: Math.round(ownIdentity),
            fatherReference: Math.round(fatherReference),
            phase
        };
    }

    apply({ career, context = {} }) {
        const result = this.evaluate({ career, context });
        if (!result) return null;

        career.socialContext.identity = result;
        career.legacyHistory ||= [];
        career.legacyHistory.push({
            type: 'identity_evolution',
            ...result,
            createdAt: new Date().toISOString()
        });

        return result;
    }
}

export default LegacyIdentitySystem;
