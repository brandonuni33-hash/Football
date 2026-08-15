// domain/transfer/marketCompetitionSystem.js
// Classe les clubs concurrents autour d'un joueur et simule les forces du marché.

import ClubNeedSystem from './clubNeedSystem.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
const scaleFive = value => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 50;
    return numeric <= 5 ? numeric * 20 : numeric;
};

export class MarketCompetitionSystem {
    constructor({ clubNeeds = new ClubNeedSystem() } = {}) {
        this.clubNeeds = clubNeeds;
    }

    rank(state, clubs = [], player = {}, { limit = 8 } = {}) {
        return clubs
            .map(club => {
                const need = this.clubNeeds.get(state, club?.id);
                if (!need) return null;
                const fit = this.clubNeeds.scorePlayer(need, player);
                const budgetPower = clamp(club?.budgetPower ?? club?.budget ?? scaleFive(club?.finances));
                const sportingPull = clamp(scaleFive(club?.reputation ?? club?.prestige));
                const urgency = need.urgency;
                const marketHeat = clamp(urgency * 0.45 + fit * 0.30 + budgetPower * 0.15 + sportingPull * 0.10);
                return {
                    clubId: club.id,
                    fit,
                    urgency,
                    budgetPower,
                    sportingPull,
                    marketHeat: Math.round(marketHeat),
                    likelihood: this.#likelihood(marketHeat, player?.age)
                };
            })
            .filter(Boolean)
            .sort((a, b) => b.marketHeat - a.marketHeat)
            .slice(0, limit);
    }

    chooseDiscoveryPath(entry, { scouted = false, recommended = false } = {}) {
        if (scouted) return { path: 'scouting', multiplier: 1.2 };
        if (recommended) return { path: 'recommendation', multiplier: 1.1 };
        if (entry.marketHeat >= 80) return { path: 'opportunistic', multiplier: 1.0 };
        return { path: 'low_visibility', multiplier: 0.65 };
    }

    #likelihood(heat, age = 18) {
        let score = heat;
        if (Number(age) < 18) score *= 0.58;
        if (Number(age) < 16) score *= 0.45;
        return Math.round(clamp(score));
    }
}

export default MarketCompetitionSystem;
