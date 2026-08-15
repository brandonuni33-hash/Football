// domain/scouting/scoutingSystem.js
// Scouting joueur en deux phases : formation (14-17) et carrière (18+).
// Le système ne connaît ni l'UI ni le GameEngine.

import { EventBus } from '../../core/eventBus.js';
import { EVENTS } from '../../core/events.js';

const YOUTH_MAX_AGE = 18;
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));

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
        if (!club) return false;
        const prestige = Number(club.prestige ?? club.reputation ?? 0);
        const strength = Number(club.strength ?? club.overall ?? 0);
        return club.isTopClub === true || prestige >= 5 || strength >= 85;
    }

    generateSeasonNeeds(state, clubs = []) {
        const scouting = this.ensureState(state);
        const season = state?.calendar?.currentSeasonYear ?? state?.season ?? new Date().getFullYear();
        const profiles = ['technical', 'physical', 'defensive', 'creative', 'versatile', 'finisher', 'goalkeeper'];
        scouting.clubNeeds = {};

        clubs.forEach(club => {
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
        const clubId = club.id || club.name;
        const existing = scouting.observations.find(item => item.clubId === clubId && item.status === 'watching');
        if (existing) return existing;

        const observation = {
            id: `obs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            playerId: player.id,
            clubId,
            scoutId: scout.id || null,
            phase,
            context,
            startedAt: Date.now(),
            visibility: phase === 'youth' ? 'indirect' : 'visible',
            confidence: this.calculateConfidence(player, scout),
            status: 'watching'
        };
        scouting.observations.push(observation);
        EventBus.emit(EVENTS.SCOUTING_OBSERVATION_STARTED, {
            state,
            playerId: player.id,
            playerAge: Number(player.age),
            clubId: observation.clubId,
            scoutId: observation.scoutId,
            phase,
            visibility: observation.visibility,
            observation
        });
        return observation;
    }

    completeObservation(state, observationId, { performance = null } = {}) {
        const scouting = this.ensureState(state);
        const observation = scouting.observations.find(item => item.id === observationId);
        if (!observation) return null;
        observation.status = 'completed';
        observation.completedAt = Date.now();
        observation.performance = performance;
        observation.confidence = Math.min(100, observation.confidence + (performance ? 8 : 0));

        EventBus.emit(EVENTS.SCOUTING_OBSERVATION_COMPLETED, {
            state,
            playerId: observation.playerId,
            playerAge: Number(state?.player?.age),
            clubId: observation.clubId,
            phase: observation.phase,
            observation
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
        const score = Math.round(clamp(base + (Math.random() * 16 - 8)));
        if (score < 55) return null;

        const directOfferAllowed = phase === 'senior';
        const interest = {
            id: `scouting_interest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
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
        return interest;
    }

    canOfferYouthContract(player, club) {
        if (!player || !club) return false;
        const age = Number(player.age);
        if (age >= 18) return true;
        if (age < 16) return false;
        if (!this.isTopClub(club)) return true;
        // Pour les clubs d'élite, une approche directe avant 18 ans reste exceptionnelle.
        return Math.random() < 0.025;
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
        const attributes = player?.attributes || {};
        const value = (...keys) => {
            for (const key of keys) {
                const candidate = player?.[key] ?? attributes?.[key];
                if (Number.isFinite(Number(candidate))) return Number(candidate);
            }
            return null;
        };
        const map = {
            technical: value('technical', 'technique', 'controle', 'dribble', 'passe'),
            physical: value('physical', 'physique', 'puissance', 'endurance'),
            defensive: value('defense', 'defensive', 'placement'),
            creative: value('passing', 'creativity', 'passe', 'vision'),
            versatile: value('overall'),
            finisher: value('shooting', 'tir', 'finition'),
            goalkeeper: player.position === 'GK' || player.position === 'G' ? value('overall', 'defense') : 30
        };
        return clamp(map[profile] ?? player.overall ?? 50);
    }

    hash(value) {
        let hash = 0;
        for (let i = 0; i < value.length; i += 1) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
        return Math.abs(hash);
    }
}

export default ScoutingSystem;
