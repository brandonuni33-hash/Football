// competitionSystem.js
// Calendrier de carrière : formation -> senior. Les compétitions réelles
// seront enrichies ensuite avec les effectifs et classements.

const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));

export const COMPETITIONS = {
    FR_L1: { id: 'FR_L1', name: 'Ligue 1', country: 'France', level: 1, type: 'league', matches: 34 },
    FR_L2: { id: 'FR_L2', name: 'Ligue 2', country: 'France', level: 2, type: 'league', matches: 34 },
    EN_PL: { id: 'EN_PL', name: 'Premier League', country: 'Angleterre', level: 1, type: 'league', matches: 38 },
    EN_CH: { id: 'EN_CH', name: 'Championship', country: 'Angleterre', level: 2, type: 'league', matches: 46 },
    ES_LA: { id: 'ES_LA', name: 'La Liga', country: 'Espagne', level: 1, type: 'league', matches: 38 },
    ES_SD: { id: 'ES_SD', name: 'Segunda División', country: 'Espagne', level: 2, type: 'league', matches: 42 },
    IT_A: { id: 'IT_A', name: 'Serie A', country: 'Italie', level: 1, type: 'league', matches: 38 },
    IT_B: { id: 'IT_B', name: 'Serie B', country: 'Italie', level: 2, type: 'league', matches: 38 },
    DE_B1: { id: 'DE_B1', name: 'Bundesliga', country: 'Allemagne', level: 1, type: 'league', matches: 34 },
    DE_B2: { id: 'DE_B2', name: '2. Bundesliga', country: 'Allemagne', level: 2, type: 'league', matches: 34 },
    NATIONAL_CUP: { id: 'NATIONAL_CUP', name: 'Coupe nationale', type: 'cup', matches: 1 },
    CHAMPIONS_LEAGUE: { id: 'CHAMPIONS_LEAGUE', name: 'Ligue des Champions', type: 'continental', matches: 1 },
    EURO: { id: 'EURO', name: 'Euro', type: 'international', matches: 1 },
    WORLD_CUP: { id: 'WORLD_CUP', name: 'Coupe du Monde', type: 'international', matches: 1 }
};

const MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12];
const ACTIVE_MONTHS = [8,9,10,11,12,1,2,3,4,5];

function seasonLabel(year) { return `${year}/${year + 1}`; }
function monthlyDistribution(total) {
    const weights = { 8: .09, 9: .10, 10: .11, 11: .10, 12: .07, 1: .10, 2: .11, 3: .10, 4: .12, 5: .10 };
    const result = Object.fromEntries(ACTIVE_MONTHS.map(m => [m, 0]));
    let remaining = total;
    const ordered = [...ACTIVE_MONTHS].sort((a,b) => weights[b] - weights[a]);
    for (const month of ordered) {
        const slots = Math.max(0, Math.round(total * weights[month]));
        const add = Math.min(slots, remaining);
        result[month] += add;
        remaining -= add;
    }
    let i = 0;
    while (remaining > 0) { result[ordered[i % ordered.length]] += 1; remaining--; i++; }
    return result;
}

export const CompetitionSystem = {
    getSeniorCompetition(player) {
        const country = player?.clubCountry || player?.country || 'France';
        const level = Number(player?.clubLevel || 1);
        const map = {
            France: level === 2 ? COMPETITIONS.FR_L2 : COMPETITIONS.FR_L1,
            Angleterre: level === 2 ? COMPETITIONS.EN_CH : COMPETITIONS.EN_PL,
            Espagne: level === 2 ? COMPETITIONS.ES_SD : COMPETITIONS.ES_LA,
            Italie: level === 2 ? COMPETITIONS.IT_B : COMPETITIONS.IT_A,
            Allemagne: level === 2 ? COMPETITIONS.DE_B2 : COMPETITIONS.DE_B1
        };
        return map[country] || COMPETITIONS.FR_L1;
    },

    getYouthCategory(age) {
        if (age <= 15) return 'U15';
        if (age === 16) return 'U16';
        if (age === 17) return 'U17/U19';
        return null;
    },

    getBlockPlan(state) {
        const player = state?.player || {};
        const age = Number(player.age) || 14;
        const month = Number(state?.calendar?.currentMonth) || 8;
        const season = Number(state?.calendar?.currentSeasonYear) || new Date().getFullYear();
        const youth = this.getYouthCategory(age);

        if (!ACTIVE_MONTHS.includes(month)) {
            return {
                type: 'offseason', month, season, seasonLabel: seasonLabel(season),
                matches: 0,
                activities: month === 7 ? ['repos', 'mercato', 'programme_individuel'] : ['bilan', 'selection_internationale', 'repos'],
                importance: 'none'
            };
        }

        if (age < 18) {
            const youthTotal = youth === 'U15' ? 22 : youth === 'U16' ? 26 : 30;
            const distribution = monthlyDistribution(youthTotal);
            const count = distribution[month] || 0;
            return {
                type: 'youth', category: youth, month, season, seasonLabel: seasonLabel(season),
                matches: count,
                competition: `${youth} Formation`,
                activities: count ? ['match_jeunes', 'entrainement'] : ['entrainement', 'evenement_formation'],
                importance: count >= 3 ? 'normal' : 'low'
            };
        }

        const comp = this.getSeniorCompetition(player);
        const distribution = monthlyDistribution(comp.matches);
        let count = distribution[month] || 0;
        if (month === 12) count = Math.max(1, count - 1);
        const competitions = [{ ...comp, count }];
        if ([9,10,11,2,3,4].includes(month) && Math.random() < .35) competitions.push({ ...COMPETITIONS.NATIONAL_CUP, count: 1 });
        if ([9,10,11,2,3,4,5].includes(month) && player.inEurope && Math.random() < .30) competitions.push({ ...COMPETITIONS.CHAMPIONS_LEAGUE, count: 1 });
        const total = competitions.reduce((sum, c) => sum + c.count, 0);
        return {
            type: 'senior', month, season, seasonLabel: seasonLabel(season),
            matches: total,
            competitions,
            activities: total ? ['match', 'entrainement'] : ['entrainement', 'evenement'],
            importance: total >= 5 ? 'high' : total >= 3 ? 'normal' : 'low'
        };
    },

    getBlockMode(plan) {
        if (plan.type === 'offseason') return 'career_activity';
        if (!plan.matches) return 'career_activity';
        if (plan.importance === 'high') return 'mixed';
        return 'simulation';
    },

    getSeasonSkeleton(player, year) {
        return MONTHS.map(month => this.getBlockPlan({ player, calendar: { currentMonth: month, currentSeasonYear: year } }));
    }
};

export default CompetitionSystem;
