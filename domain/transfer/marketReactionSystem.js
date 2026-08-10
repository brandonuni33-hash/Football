// domain/transfer/marketReactionSystem.js
// Les clubs réagissent aux mouvements connus du marché.
// Aucun rendu UI et aucune connaissance de la présentation.

import { EventBus } from '../../core/eventBus.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export class MarketReactionSystem {
    constructor({ eventBus = EventBus } = {}) {
        this.eventBus = eventBus;
    }

    react(state, market, { playerId, clubId, action = 'interest' } = {}) {
        const clubs = market?.clubs || [];
        const source = clubs.find(club => club.id === clubId);
        if (!source) return [];

        state.marketReactions ||= [];
        const reactions = [];

        for (const club of clubs) {
            if (!club?.id || club.id === clubId) continue;

            const rivalry = this.#rivalry(source, club);
            const visibility = clamp(Number(club.reputation ?? club.prestige ?? 50) * 0.5 + Number(club.budgetPower ?? 50) * 0.2 + rivalry * 0.3);
            const reactionChance = clamp(visibility * 0.35 + Number(market.temperatureScore ?? 50) * 0.35 + rivalry * 0.30);

            if (reactionChance < 62) continue;

            const reaction = {
                id: `market_reaction_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                playerId,
                sourceClubId: clubId,
                reactingClubId: club.id,
                action,
                intensity: Math.round(reactionChance),
                reason: rivalry >= 70 ? 'competitive_response' : 'market_awareness',
                createdAt: new Date().toISOString()
            };

            state.marketReactions.push(reaction);
            reactions.push(reaction);
            this.eventBus.emit('market.reaction.created', { state, reaction });
        }

        return reactions;
    }

    #rivalry(a, b) {
        const aLevel = Number(a?.reputation ?? a?.prestige ?? 50);
        const bLevel = Number(b?.reputation ?? b?.prestige ?? 50);
        const distance = Math.abs(aLevel - bLevel);
        return clamp(90 - distance * 1.5);
    }
}

export default MarketReactionSystem;
