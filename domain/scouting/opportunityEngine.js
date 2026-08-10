// domain/scouting/opportunityEngine.js
// Détermine si un club peut découvrir le joueur sans observation préalable.
// Cette voie complète le scouting : elle ne le remplace pas.

import { EventBus } from '../../core/eventBus.js';
import EVENTS from '../../core/events.js';

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const rand = () => Math.random();

export class OpportunityEngine {
    constructor({ eventBus = EventBus } = {}) {
        this.eventBus = eventBus;
    }

    evaluate({ player = {}, club = {}, context = {} } = {}) {
        const age = Number(player.age ?? context.age ?? 18);
        const need = clamp(Number(club.needScore ?? context.needScore ?? 0.5));
        const fit = clamp(Number(context.profileFit ?? this.#profileFit(player, club)));
        const form = clamp(Number(context.recentForm ?? 0.5));
        const reputation = clamp(Number(context.reputation ?? player.reputation ?? 0.2));
        const visibility = clamp(Number(context.visibility ?? 0.3));
        const network = clamp(Number(context.networkExposure ?? 0.2));
        const performance = clamp(Number(context.performanceSignal ?? 0.4));
        const urgency = clamp(Number(club.needUrgency ?? context.needUrgency ?? need));

        let base = 0.002;
        base += need * 0.035;
        base += fit * 0.035;
        base += form * 0.025;
        base += reputation * 0.025;
        base += visibility * 0.02;
        base += network * 0.018;
        base += performance * 0.025;
        base += urgency * 0.012;

        // 14–17 ans : découverte possible, mais l'offre directe reste fortement protégée.
        if (age < 16) base *= 0.12;
        else if (age < 18) base *= 0.28;
        else if (age < 21) base *= 0.72;

        // Un top club ne reçoit pas un bonus magique : son niveau augmente surtout la sélectivité.
        const clubLevel = clamp(Number(club.level ?? 0.5));
        if (clubLevel > 0.85 && age < 18) base *= 0.65;

        return clamp(base, 0, 0.15);
    }

    roll({ player, club, context = {} } = {}) {
        const probability = this.evaluate({ player, club, context });
        const triggered = rand() < probability;
        if (!triggered) return { triggered: false, probability };

        const discovery = this.#buildDiscovery({ player, club, context, probability });
        this.eventBus.emit(EVENTS.TRANSFER_INTEREST_CREATED, discovery);
        return { triggered: true, probability, discovery };
    }

    #buildDiscovery({ player, club, context, probability }) {
        const age = Number(player.age ?? context.age ?? 18);
        const reasons = [];
        if (context.recentForm >= 0.7) reasons.push('recent_form');
        if (context.performanceSignal >= 0.7) reasons.push('performance');
        if (context.networkExposure >= 0.7) reasons.push('network');
        if (context.profileFit >= 0.75) reasons.push('club_need');
        if (context.reputation >= 0.65) reasons.push('reputation');
        if (!reasons.length) reasons.push('market_discovery');

        return {
            state: context.state,
            playerId: player.id || context.playerId || null,
            clubId: club.id || context.clubId || null,
            source: 'opportunistic_discovery',
            discoveryType: age < 18 ? 'young_opportunity' : 'market_opportunity',
            age,
            probability,
            reasons,
            confidence: clamp(0.35 + probability * 3),
            observationRequired: false,
            directOfferEligible: age >= 18,
            createdAt: new Date().toISOString()
        };
    }

    #profileFit(player, club) {
        const wanted = club.preferredPosition;
        if (!wanted || !player.position) return 0.5;
        return wanted === player.position ? 0.9 : 0.25;
    }
}

export default OpportunityEngine;
