// domain/career/preCareerSimulationSystem.js
// Simule la vie du futur successeur avant ses 14 ans.
// Cette phase n'est pas une carrière jouable : elle prépare son identité, son réseau
// et son contexte de départ sans lui donner de progression professionnelle directe.

const START_AGE = 14;
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export class PreCareerSimulationSystem {
    simulateToStart({ state, playerId, childId, currentAge, targetAge = START_AGE, world = {} }) {
        const child = state?.family?.children?.find(item => item.id === childId);
        if (!child) return null;

        const fromAge = Number(currentAge ?? this.#ageOf(child, state));
        const toAge = Math.max(fromAge, Math.min(START_AGE, Number(targetAge)));
        if (fromAge >= toAge) return this.snapshot({ state, playerId, childId, world });

        state.preCareerSimulations ||= [];
        child.preCareer ||= {
            simulated: false,
            history: [],
            network: [],
            traits: {},
            familiarity: {}
        };

        for (let age = fromAge + 1; age <= toAge; age += 1) {
            const year = this.#simulateYear({ state, child, playerId, age, world });
            child.preCareer.history.push(year);
        }

        child.age = toAge;
        child.preCareer.simulated = toAge >= START_AGE;
        child.preCareer.simulatedToAge = toAge;
        child.preCareer.readyForCareer = toAge >= START_AGE;

        const result = this.snapshot({ state, playerId, childId, world });
        state.preCareerSimulations.push({
            childId,
            playerId,
            fromAge,
            toAge,
            completed: toAge >= START_AGE,
            result,
            createdAt: new Date().toISOString()
        });
        return result;
    }

    snapshot({ state, playerId, childId, world = {} }) {
        const child = state?.family?.children?.find(item => item.id === childId);
        if (!child) return null;
        const preCareer = child.preCareer || {};
        return {
            childId,
            parentPlayerId: playerId,
            name: child.firstName || 'Votre fils',
            age: Number(child.age ?? this.#ageOf(child, state)),
            readyForCareer: Number(child.age ?? 0) >= START_AGE,
            history: [...(preCareer.history || [])],
            network: [...(preCareer.network || [])],
            traits: { ...(preCareer.traits || {}) },
            familiarity: { ...(preCareer.familiarity || {}) }
        };
    }

    #simulateYear({ state, child, playerId, age, world }) {
        const preCareer = child.preCareer;
        const fatherNetwork = this.#fatherNetwork(state, playerId);
        const inheritedContacts = fatherNetwork.filter((_, index) => (age + index) % 3 === 0).slice(0, 3);
        const newContacts = inheritedContacts.map(contact => ({
            personId: contact.personId,
            type: 'family_connection',
            familiarity: clamp(Number(contact.strength ?? 50) * 0.5 + 20)
        }));

        for (const contact of newContacts) {
            const exists = preCareer.network.some(item => item.personId === contact.personId);
            if (!exists) preCareer.network.push(contact);
        }

        const clubIds = this.#fatherClubs(state);
        for (const clubId of clubIds.slice(0, 3)) {
            preCareer.familiarity[clubId] = clamp(Number(preCareer.familiarity[clubId] ?? 0) + 8);
        }

        // Le football peut faire partie de son enfance, sans simuler une carrière pro.
        const footballExposure = clamp(
            Number(preCareer.traits.footballExposure ?? 0) +
            (fatherNetwork.length ? 7 : 3) +
            (age >= 10 ? 4 : 2)
        );
        preCareer.traits.footballExposure = footballExposure;
        preCareer.traits.socialConfidence = clamp(Number(preCareer.traits.socialConfidence ?? 45) + (age % 2 ? 2 : 1));

        return {
            age,
            events: [
                inheritedContacts.length ? 'family_network_exposure' : 'normal_childhood',
                age >= 10 && footballExposure >= 50 ? 'football_interest_develops' : null
            ].filter(Boolean),
            networkAdded: newContacts.length,
            clubFamiliarityAdded: Math.min(3, clubIds.length)
        };
    }

    #fatherNetwork(state, playerId) {
        return (state?.relationshipNetwork || [])
            .filter(edge => edge.sourceId === playerId || edge.targetId === playerId)
            .filter(edge => Number(edge.strength ?? 0) >= 45)
            .map(edge => ({
                personId: edge.sourceId === playerId ? edge.targetId : edge.sourceId,
                strength: edge.strength,
                type: edge.type
            }));
    }

    #fatherClubs(state) {
        return [...new Set((state?.careerMemory || [])
            .filter(memory => memory.clubId)
            .map(memory => memory.clubId))];
    }

    #ageOf(child, state) {
        if (Number.isFinite(Number(child.age))) return Number(child.age);
        const birthSeason = Number(child.birthSeason);
        const currentSeason = Number(state?.season ?? state?.career?.season);
        if (Number.isFinite(birthSeason) && Number.isFinite(currentSeason)) {
            return Math.max(0, currentSeason - birthSeason);
        }
        return 0;
    }
}

export default PreCareerSimulationSystem;
