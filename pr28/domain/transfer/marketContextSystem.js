// domain/transfer/marketContextSystem.js
// Décrit le contexte du marché pour une saison donnée.
// Ne suppose pas l'existence d'une base mondiale de joueurs.

import ClubNeedSystem from './clubNeedSystem.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export class MarketContextSystem {
    constructor({ clubNeeds = new ClubNeedSystem() } = {}) {
        this.clubNeeds = clubNeeds;
    }

    buildSeason(state, clubs = []) {
        const season = state?.season ?? state?.career?.season ?? 1;
        const needs = this.clubNeeds.ensureSeason(state, clubs);
        const entries = Object.values(needs).filter(item => item.season === season);

        const averageUrgency = entries.length
            ? Math.round(entries.reduce((sum, item) => sum + item.urgency, 0) / entries.length)
            : 0;

        return {
            season,
            generatedAt: new Date().toISOString(),
            needs,
            marketTemperature: this.#temperature(averageUrgency),
            activePositions: [...new Set(entries.filter(item => item.urgency >= 65).map(item => item.position))],
            summary: this.#summary(entries)
        };
    }

    compatibility(state, club, player) {
        const need = this.clubNeeds.get(state, club?.id);
        if (!need) return { score: 0, reason: 'no_need' };
        const score = this.clubNeeds.scorePlayer(need, player);
        return {
            score,
            need,
            reason: score >= 75 ? 'strong_fit' : score >= 55 ? 'possible_fit' : 'weak_fit'
        };
    }

    #temperature(urgency) {
        if (urgency >= 78) return 'hot';
        if (urgency >= 55) return 'active';
        if (urgency >= 35) return 'calm';
        return 'quiet';
    }

    #summary(entries) {
        return entries
            .sort((a, b) => b.urgency - a.urgency)
            .slice(0, 5)
            .map(item => ({ clubId: item.clubId, position: item.position, urgency: item.urgency, type: item.type }));
    }
}

export default MarketContextSystem;
