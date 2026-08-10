// domain/career/inheritedNetworkDynamics.js
// Fait décroître progressivement la dépendance au réseau du parent.
// Le réseau personnel du joueur devient progressivement dominant.

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export class InheritedNetworkDynamics {
    tick({ career, context = {} }) {
        if (!career?.socialContext) return null;

        const age = Number(career.age ?? 14);
        const years = Math.max(0, age - 14);
        const parentWeight = clamp(100 - years * 8);
        const personalWeight = clamp(20 + years * 8);
        const activity = clamp(Number(context.personalNetworkActivity ?? 50));
        const success = clamp(Number(context.careerSuccess ?? 50));

        const inherited = career.socialContext.inheritedNetwork || { people: [], clubs: [], socialCapital: 0 };
        const childhood = career.socialContext.childhoodNetwork || [];
        const personal = career.socialContext.personalNetwork || [];

        const personalGrowth = Math.max(0, Math.round((activity * 0.06 + success * 0.04)));
        for (let i = 0; i < personalGrowth; i += 1) {
            personal.push({
                source: 'career_activity',
                createdAt: new Date().toISOString(),
                strength: 20
            });
        }

        career.socialContext.personalNetwork = personal.slice(-100);
        career.socialContext.networkBalance = {
            inheritedWeight: parentWeight,
            personalWeight: personalWeight,
            inheritedCapital: Math.round(clamp(Number(inherited.socialCapital ?? 0) * parentWeight / 100)),
            personalCapital: Math.round(clamp(personal.length * 2 + childhood.length))
        };

        career.socialContext.networkIdentity =
            personalWeight >= 75 ? 'personal_dominant' :
            personalWeight >= 50 ? 'transitioning' :
            'family_influenced';

        return career.socialContext.networkBalance;
    }
}

export default InheritedNetworkDynamics;
