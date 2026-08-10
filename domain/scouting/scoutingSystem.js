// domain/scouting/scoutingSystem.js
// Scouting joueur en deux phases : formation (14-18) et carrière (18+).
// Le système ne connaît ni l'UI ni le GameEngine.

import { EventBus } from '../../core/eventBus.js';
import { EVENTS } from '../../core/events.js';

const YOUTH_MAX_AGE = 18;
const TOP_CLUB_TIER = 1;

export class ScoutingSystem {
    constructor({ worldSystem } = {}) {
        this.worldSystem = worldSystem;
    }

    ensureState(state) {
        state.scouting ||= {};
        state.scouting.observations ||= [];
        state.scouting.interests ||= [];
        state.scouting.shortlist ||= [];
        state.scouting.clubNeeds ||= {};
        return state.scouting;
    }

    getPhase(player) {
        const age = Number(player?.age ?? 0);
        return age < YOUTH_MAX_AGE ? 'youth' : 'senior';
    }

    isTopClub(club) {
        return Number(club?.tier ?? club?.level ?? 99) <= TOP_CLUB_TIER;
    }

    generateSeasonNeeds(state, clubs = []) {
        const scouting = this.ensureState(state);
        const season = state?.calendar?.currentSeasonYear ?? state?.season ?? new Date().getFullYear();
        const profiles = ['technical', 'physical', 'defensive', 'creative', 'versatile', 'finisher', 'goalkeeper'];
        scouting.clubNeeds = {};

        clubs.forEach((club) => {
            const seed = this.hash(`${season}:${club.id || club.name}`);
            const profile = profiles[seed % profiles.length];
            const urgency = 35 + (seed % 66);
            scouting.clubNeeds[club.id || club.name] = {
                season,
                clubId: club.id || null,
                profile,
                urgency,
                agePreference: seed % 3 === 0 ? 'young' : seed % 3 === 1 ? 'prime' : 'any'
            };
        });

        return scouting.clubNeeds;
    }

    observe(state, { club, scout = {}, context = 'match' } = {}) {
        const player = state?.player;
        if (!player || !club) return null;
        const scouting = this.ensureState(state);
        const phase = this.getPhase(player);
        const observation = {
            id: `obs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            playerId: player.id,
            clubId: club.id || club.name,
            scoutId: scout.id || null,
            phase,
            context,
            startedAt: Date.now(),
            visibility: 'player-informed',
            confidence: this.calculateConfidence(player, scout),
            status: 'watching'
        };
        scouting.observations.push(observation);
        EventBus.emit(EVENTS.SCOUTING_OBSERVATION_STARTED, {
            state, playerId: player.id, clubId: observation.clubId,
            scoutId: observation.scoutId, phase, observation
        });
        return observation;
    }

    completeObservation(state, observationId, { performance = null } = {}) {
        const scouting = this.ensureState(state);
        const observation = scouting.observations.find((item) => item.id === observationId);
        if (!observation) return null;
        observation.status = 'completed';
        observation.completedAt = Date.now();
        observation.performance = performance;
        observation.confidence = Math.min(100, observation.confidence + (performance ? 8 : 0));

        EventBus.emit(EVENTS.SCOUTING_OBSERVATION_COMPLETED, {
            state, playerId: observation.playerId, clubId: observation.clubId,
            phase: observation.phase, observation
        });
        return observation;
    }

    evaluateInterest(state, club, { scoutQuality = 50 } = {}) {
        const player = state?.player;
        if (!player || !club) return null;
        const phase = this.getPhase(player);
        const need = this.ensureState(state).clubNeeds[club.id || club.name];
        const fit = this.profileFit(player, need?.profile);
        const ageFit = need?.agePreference === 'young' ? Math.max(0, 100 - Number(player.age) * 4) : 70;
        const base = (fit * 0.5) + (ageFit * 0.15) + (Number(scoutQuality) * 0.2) + (Number(player.overall || 50) * 0.15);
        const score = Math.round(Math.max(0, Math.min(100, base + (Math.random() * 16 - 8))));
        if (score < 55) return null;

        // Les top clubs ne sautent presque jamais directement sur un 14-17 ans.
        const directOfferAllowed = phase === 'senior' || Number(player.age) >= 18;
        const interest = {
            id: `interest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            playerId: player.id,
            clubId: club.id || club.name,
            phase,
            score,
            status: 'monitoring',
            directOfferAllowed,
            nextStep: phase === 'youth' ? 'additional_observation' : 'contact_player'
        };

        this.ensureState(state).interests.push(interest);
        EventBus.emit(EVENTS.SCOUTING_INTEREST_CREATED, { state, playerId: player.id, clubId: interest.clubId, phase, interest });

        if (directOfferAllowed || !this.isTopClub(club)) return interest;
        return interest;
    }

    canOfferYouthContract(player, club) {
        if (!player || !club) return false;
        const age = Number(player.age);
        if (age >= 18) return true;
        if (!this.isTopClub(club)) return age >= 16;
        // 14-17 ans : même avec un gros potentiel, un top club doit d'abord
        // accumuler des observations. Les offres directes restent exceptionnelles.
        return age >= 16 && Math.random() < 0.025;
    }

    createTrialOrContractInterest(state, club, interest) {
        const player = state?.player;
        if (!player || !club || !interest) return null;
        if (!this.canOfferYouthContract(player, club)) return null;

        const offer = {
            id: `trial_${Date.now()}`,
            playerId: player.id,
            clubId: club.id || club.name,
            type: Number(player.age) < 18 ? 'academy_trial' : 'contract_interest',
            phase: this.getPhase(player),
            status: 'pending'
        };
        interest.status = 'offer';
        interest.offerId = offer.id;
        EventBus.emit(EVENTS.SCOUTING_TRIAL_OFFERED, { state, playerId: player.id, clubId: offer.clubId, offer });
        return offer;
    }

    addToShortlist(state, clubId) {
        const scouting = this.ensureState(state);
        if (!clubId || scouting.shortlist.includes(clubId)) return false;
        scouting.shortlist.push(clubId);
        return true;
    }

    calculateConfidence(player, scout) {
        const visibility = Number(scout?.quality ?? scout?.rating ?? 50);
        const agePenalty = Math.max(0, 18 - Number(player?.age ?? 18)) * 2;
        return Math.round(Math.max(20, Math.min(95, visibility - agePenalty + 25)));
    }

    profileFit(player, profile) {
        if (!profile) return 60;
        const map = {
            technical: player.technical ?? player.technique,
            physical: player.physical,
            defensive: player.defense ?? player.defensive,
            creative: player.passing ?? player.creativity,
            versatile: player.overall,
            finisher: player.shooting,
            goalkeeper: player.position === 'GK' ? player.overall : 30
        };
        return Number(map[profile] ?? player.overall ?? 50);
    }

    hash(value) {
        let hash = 0;
        for (let i = 0; i < value.length; i += 1) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
        return Math.abs(hash);
    }
}

export default ScoutingSystem;
