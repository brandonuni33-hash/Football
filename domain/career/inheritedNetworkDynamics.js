// domain/career/inheritedNetworkDynamics.js
// Fait évoluer le poids du réseau hérité vers le réseau personnel.
// Aucun effet direct sur le potentiel ou les performances sportives.

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export class InheritedNetworkDynamics {
    tick({ career, context = {} }) {
        if (!career?.socialContext) return null;

        const age = Number(career.age ?? 14);
        const years = Math.max(0, age - 14);
        const activity = clamp(Number(context.personalNetworkActivity ?? 50));
        const success = clamp(Number(context.careerSuccess ?? 50));
        const meetings = clamp(Number(context.personalContacts ?? 0));
        const media = clamp(Number(context.mediaExposure ?? 0));

        // Le réseau du parent reste utile mais perd naturellement du poids avec l'âge.
        const ageShift = years * 7;
        const parentWeight = clamp(100 - ageShift - activity * 0.08);
        const personalWeight = clamp(100 - parentWeight);

        const inherited = career.socialContext.inheritedNetwork || {
            people: [],
            clubs: [],
            socialCapital: 0
        };
        const childhood = career.socialContext.childhoodNetwork || [];
        const personal = career.socialContext.personalNetwork || [];

        // Les rencontres personnelles créent de vrais contacts persistants.
        const contactGrowth = Math.max(0, Math.round(
            activity * 0.04 +
            success * 0.025 +
            meetings * 0.08 +
            media * 0.015
        ));

        for (let i = 0; i < contactGrowth; i += 1) {
            personal.push({
                id: `personal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                source: 'career_activity',
                strength: clamp(20 + success * 0.15),
                createdAt: new Date().toISOString()
            });
        }

        career.socialContext.personalNetwork = personal.slice(-100);

        const inheritedCapital = clamp(
            Number(inherited.socialCapital ?? 0) * parentWeight / 100
        );
        const personalCapital = clamp(
            personal.length * 2 + childhood.length + meetings * 0.5
        );

        const independentIdentity = clamp(
            personalCapital * 0.55 +
            success * 0.25 +
            activity * 0.10 +
            media * 0.10
        );

        career.socialContext.networkBalance = {
            inheritedWeight: Math.round(parentWeight),
            personalWeight: Math.round(personalWeight),
            inheritedCapital: Math.round(inheritedCapital),
            personalCapital: Math.round(personalCapital),
            independentIdentity: Math.round(independentIdentity)
        };

        career.socialContext.networkIdentity =
            personalWeight >= 75 && independentIdentity >= 60 ? 'personal_dominant' :
            personalWeight >= 45 ? 'transitioning' :
            'family_influenced';

        return career.socialContext.networkBalance;
    }
}

export default InheritedNetworkDynamics;
