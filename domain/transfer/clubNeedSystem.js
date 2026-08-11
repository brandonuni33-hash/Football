// domain/transfer/clubNeedSystem.js
// Génère des besoins de recrutement différents selon le club et la saison.
// Les besoins sont persistants pour une saison puis renouvelés à la suivante.

const POSITIONS = Object.freeze(['GK', 'CB', 'FB', 'DM', 'CM', 'AM', 'W', 'ST']);
const NEED_TYPES = Object.freeze(['young', 'prime', 'experienced', 'versatile', 'opportunistic']);

const POSITION_ALIASES = Object.freeze({
    G: 'GK', GK: 'GK',
    DC: 'CB', CB: 'CB',
    DD: 'FB', DG: 'FB', FB: 'FB',
    MDEF: 'DM', MDC: 'DM', DM: 'DM',
    MC: 'CM', CM: 'CM',
    MOC: 'AM', AM: 'AM',
    AD: 'W', AG: 'W', MD: 'W', MG: 'W', W: 'W',
    BU: 'ST', AT: 'ST', ST: 'ST'
});

function hash(input) {
    let h = 2166136261;
    for (let i = 0; i < String(input).length; i += 1) {
        h ^= String(input).charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

const rand = seed => (hash(seed) % 10000) / 10000;
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
const normalizedPosition = position => POSITION_ALIASES[String(position || '').toUpperCase()] || String(position || '').toUpperCase();

export class ClubNeedSystem {
    ensureSeason(state, clubs = []) {
        const season = Number(state?.calendar?.currentSeasonYear ?? state?.season ?? state?.career?.season ?? 1);
        state.clubTransferNeeds ||= {};

        for (const club of clubs) {
            if (!club?.id) continue;
            const existing = state.clubTransferNeeds[club.id];
            if (existing?.season === season) continue;
            state.clubTransferNeeds[club.id] = this.generate(club, season);
        }
        return state.clubTransferNeeds;
    }

    generate(club, season) {
        const seed = `${club.id}:${season}`;
        const position = POSITIONS[hash(`${seed}:position`) % POSITIONS.length];
        const type = NEED_TYPES[hash(`${seed}:type`) % NEED_TYPES.length];
        const urgency = Math.round(25 + rand(`${seed}:urgency`) * 75);
        const budgetPressure = Math.round(rand(`${seed}:budget`) * 100);
        const agePreference = type === 'young' ? 14 + Math.round(rand(`${seed}:age`) * 8)
            : type === 'prime' ? 20 + Math.round(rand(`${seed}:age`) * 7)
                : type === 'experienced' ? 27 + Math.round(rand(`${seed}:age`) * 8)
                    : 18 + Math.round(rand(`${seed}:age`) * 15);

        return {
            clubId: club.id,
            season,
            position,
            type,
            urgency,
            budgetPressure,
            preferredAge: agePreference,
            flexibility: Math.round(20 + rand(`${seed}:flex`) * 80),
            createdAt: new Date().toISOString()
        };
    }

    get(state, clubId) {
        return state?.clubTransferNeeds?.[clubId] || null;
    }

    scorePlayer(need, player = {}) {
        if (!need) return 0;
        const playerPosition = normalizedPosition(player.position);
        const positionScore = playerPosition === need.position ? 100 : need.flexibility;
        const age = Number(player.age ?? 20);
        const ageDistance = Math.abs(age - need.preferredAge);
        const ageScore = Math.max(0, 100 - ageDistance * 8);
        const form = clamp(player.form ?? player.stats?.averageRating * 12 ?? 50);
        const reputation = clamp(player.reputation ?? player.fame ?? 50);
        return Math.round(positionScore * 0.4 + ageScore * 0.2 + form * 0.2 + reputation * 0.2);
    }
}

export default ClubNeedSystem;
