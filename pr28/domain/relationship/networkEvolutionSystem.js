// domain/relationship/networkEvolutionSystem.js
// Fait évoluer le réseau personnel du joueur indépendamment de l'héritage familial.
// Les relations créent des opportunités mais ne garantissent jamais un résultat sportif ou un transfert.

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export const CONTACT_STATUS = Object.freeze({
    ACTIVE: 'active',
    DISTANT: 'distant',
    BROKEN: 'broken',
    ALLY: 'ally',
    RIVAL: 'rival'
});

export class NetworkEvolutionSystem {
    ensure(career) {
        career.socialContext ||= {};
        career.socialContext.personalNetwork ||= [];
        return career.socialContext.personalNetwork;
    }

    addContact({ career, contact, source = 'career' }) {
        const network = this.ensure(career);
        const existing = network.find(item => item.id === contact.id);
        if (existing) {
            existing.strength = clamp(Number(existing.strength ?? 20) + 5);
            existing.lastInteractionAt = new Date().toISOString();
            return existing;
        }

        const entry = {
            id: contact.id,
            role: contact.role || 'contact',
            source,
            strength: clamp(Number(contact.strength ?? 25)),
            trust: clamp(Number(contact.trust ?? 50)),
            status: CONTACT_STATUS.ACTIVE,
            createdAt: new Date().toISOString(),
            lastInteractionAt: new Date().toISOString(),
            history: []
        };
        network.push(entry);
        return entry;
    }

    interact({ career, contactId, impact = {}, event = 'interaction' }) {
        const network = this.ensure(career);
        const contact = network.find(item => item.id === contactId);
        if (!contact) return null;

        contact.strength = clamp(Number(contact.strength ?? 0) + Number(impact.strength ?? 0));
        contact.trust = clamp(Number(contact.trust ?? 50) + Number(impact.trust ?? 0));
        contact.lastInteractionAt = new Date().toISOString();
        contact.history ||= [];
        contact.history.push({ event, impact: { ...impact }, at: contact.lastInteractionAt });

        if (contact.trust >= 80 && contact.strength >= 70) contact.status = CONTACT_STATUS.ALLY;
        if (contact.trust <= 20) contact.status = CONTACT_STATUS.RIVAL;
        return contact;
    }

    decay({ career, daysElapsed = 30 }) {
        const network = this.ensure(career);
        const decay = Math.min(10, Math.max(0, Number(daysElapsed) / 30));

        for (const contact of network) {
            if (contact.status === CONTACT_STATUS.BROKEN) continue;
            contact.strength = clamp(Number(contact.strength ?? 0) - decay);
            if (contact.strength < 20) contact.status = CONTACT_STATUS.DISTANT;
        }

        career.socialContext.personalNetwork = network.filter(contact => contact.strength > 5);
        return career.socialContext.personalNetwork;
    }

    getOpportunities({ career, context = {} }) {
        const network = this.ensure(career);
        const need = clamp(Number(context.clubNeed ?? 0));
        return network
            .filter(contact => contact.status !== CONTACT_STATUS.BROKEN)
            .filter(contact => Number(contact.strength ?? 0) >= 50 && Number(contact.trust ?? 0) >= 45)
            .map(contact => ({
                contactId: contact.id,
                role: contact.role,
                opportunityScore: Math.round(clamp(Number(contact.strength ?? 0) * 0.55 + Number(contact.trust ?? 0) * 0.25 + need * 0.20)),
                guaranteed: false
            }))
            .sort((a, b) => b.opportunityScore - a.opportunityScore);
    }
}

export default NetworkEvolutionSystem;
