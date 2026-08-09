// competitionSystem.js
// Phase 2A — calendrier saisonnier persistant.
// Le calendrier est généré UNE fois par saison puis conservé dans state.calendar.
// Il n'y a plus de règle "4 matchs par mois".

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
    NATIONAL_CUP: { id: 'NATIONAL_CUP', name: 'Coupe nationale', type: 'cup', matches: null },
    CHAMPIONS_LEAGUE: { id: 'CHAMPIONS_LEAGUE', name: 'Ligue des Champions', type: 'continental', matches: null },
    EURO: { id: 'EURO', name: 'Euro', type: 'international', matches: null },
    WORLD_CUP: { id: 'WORLD_CUP', name: 'Coupe du Monde', type: 'international', matches: null }
};

const SEASON_MONTHS = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5];
const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const MONTH_INFO = {
    1: { label: 'Janvier', phase: 'season', period: 'Seconde partie de saison' },
    2: { label: 'Février', phase: 'season', period: 'Seconde partie de saison' },
    3: { label: 'Mars', phase: 'season', period: 'Seconde partie de saison' },
    4: { label: 'Avril', phase: 'season', period: 'Sprint final' },
    5: { label: 'Mai', phase: 'finale', period: 'Fin des compétitions' },
    6: { label: 'Juin', phase: 'offseason', period: 'Bilan / sélections / intersaison' },
    7: { label: 'Juillet', phase: 'offseason', period: 'Repos / préparation / mercato' },
    8: { label: 'Août', phase: 'season', period: 'Pré-saison & reprise' },
    9: { label: 'Septembre', phase: 'season', period: 'Première partie de saison' },
    10: { label: 'Octobre', phase: 'season', period: 'Première partie de saison' },
    11: { label: 'Novembre', phase: 'season', period: 'Première partie de saison' },
    12: { label: 'Décembre', phase: 'season', period: 'Trêve hivernale / première partie de saison' }
};

function seasonLabel(year) {
    return `${year}/${year + 1}`;
}

function hashSeed(input) {
    let h = 2166136261;
    for (let i = 0; i < String(input).length; i += 1) {
        h ^= String(input).charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
        value += 0x6D2B79F5;
        let t = value;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function distributeExact(total, weights, random) {
    const result = Object.fromEntries(SEASON_MONTHS.map(month => [month, 0]));
    if (total <= 0) return result;

    const normalized = SEASON_MONTHS.map(month => ({
        month,
        weight: Math.max(0.001, Number(weights[month] || 0.1))
    }));

    let assigned = 0;
    const raw = normalized.map(item => ({
        ...item,
        exact: total * item.weight
    }));

    for (const item of raw) {
        result[item.month] = Math.floor(item.exact);
        assigned += result[item.month];
    }

    let remaining = total - assigned;
    raw.sort((a, b) => {
        const fraction = (b.exact - Math.floor(b.exact)) - (a.exact - Math.floor(a.exact));
        if (fraction !== 0) return fraction;
        return random() - 0.5;
    });

    for (let i = 0; i < remaining; i += 1) {
        result[raw[i % raw.length].month] += 1;
    }

    return result;
}

function createMatch({ competition, month, index, seasonYear, random, importance = 'normal' }) {
    const monthInfo = MONTH_INFO[month];
    const isHome = random() >= 0.5;
    const matchId = `${seasonYear}-${month}-${competition.id}-${index + 1}`;

    return {
        id: matchId,
        competitionId: competition.id,
        competitionName: competition.name,
        type: competition.type,
        month,
        monthLabel: monthInfo.label,
        seasonYear,
        matchday: index + 1,
        venue: isHome ? 'Domicile' : 'Extérieur',
        opponent: competition.type === 'league' ? 'Adversaire de championnat' : competition.name,
        importance,
        status: 'scheduled',
        played: false
    };
}

function importanceFor(month, index, total, random) {
    if (month === 5) return 'major';
    if (index === total - 1 && total >= 30) return 'important';
    if (random() < 0.12) return 'important';
    return 'normal';
}

function buildYouthSchedule(player, seasonYear, random) {
    const age = Number(player?.age) || 14;
    const category = age <= 15 ? 'U15' : age === 16 ? 'U16' : 'U17/U19';
    const totals = { U15: 22, U16: 26, 'U17/U19': 30 };
    const total = totals[category] || 22;
    const weights = { 8: .09, 9: .10, 10: .11, 11: .11, 12: .08, 1: .09, 2: .11, 3: .11, 4: .11, 5: .09 };
    const monthly = distributeExact(total, weights, random);
    const matches = [];

    for (const month of SEASON_MONTHS) {
        for (let i = 0; i < monthly[month]; i += 1) {
            const competition = {
                id: `YOUTH_${category.replace('/', '_')}`,
                name: `${category} Formation`,
                type: 'youth'
            };
            matches.push(createMatch({
                competition,
                month,
                index: matches.length,
                seasonYear,
                random,
                importance: importanceFor(month, i, monthly[month], random)
            }));
        }
    }

    return {
        category,
        totalLeagueMatches: total,
        matches,
        extras: []
    };
}

function buildSeniorSchedule(player, seasonYear, random, competition) {
    const leagueWeights = {
        8: .08, 9: .10, 10: .11, 11: .10, 12: .07,
        1: .10, 2: .11, 3: .10, 4: .12, 5: .11
    };
    const monthly = distributeExact(competition.matches, leagueWeights, random);
    const matches = [];

    for (const month of SEASON_MONTHS) {
        for (let i = 0; i < monthly[month]; i += 1) {
            matches.push(createMatch({
                competition,
                month,
                index: matches.length,
                seasonYear,
                random,
                importance: importanceFor(month, i, monthly[month], random)
            }));
        }
    }

    // Phase 2A : on prépare les créneaux supplémentaires sans encore créer
    // les vrais tirages/effectifs. Ces compétitions seront enrichies en 2B/2D.
    const extras = [];
    const cupChance = player?.clubLevel === 2 ? 0.55 : 0.70;
    const cupRounds = random() < cupChance ? 2 + Math.floor(random() * 4) : 0;

    for (let i = 0; i < cupRounds; i += 1) {
        const possibleMonths = [9, 10, 11, 1, 2, 3, 4, 5];
        const month = possibleMonths[Math.floor(random() * possibleMonths.length)];
        extras.push(createMatch({
            competition: COMPETITIONS.NATIONAL_CUP,
            month,
            index: i,
            seasonYear,
            random,
            importance: i >= cupRounds - 1 ? 'major' : 'important'
        }));
    }

    if (player?.inEurope) {
        const europeanMatches = 2 + Math.floor(random() * 7);
        for (let i = 0; i < europeanMatches; i += 1) {
            const possibleMonths = [9, 10, 11, 12, 2, 3, 4, 5];
            const month = possibleMonths[Math.floor(random() * possibleMonths.length)];
            extras.push(createMatch({
                competition: COMPETITIONS.CHAMPIONS_LEAGUE,
                month,
                index: i,
                seasonYear,
                random,
                importance: i >= europeanMatches - 2 ? 'major' : 'important'
            }));
        }
    }

    return {
        category: 'Senior',
        totalLeagueMatches: competition.matches,
        matches: [...matches, ...extras],
        extras
    };
}

function sortMatches(matches) {
    const order = new Map(SEASON_MONTHS.map((month, index) => [month, index]));
    return [...matches].sort((a, b) => {
        const monthDiff = (order.get(a.month) ?? 99) - (order.get(b.month) ?? 99);
        if (monthDiff !== 0) return monthDiff;
        if (a.type !== b.type) return a.type === 'league' ? -1 : 1;
        return String(a.id).localeCompare(String(b.id));
    });
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

    getPeriodName(month) {
        return MONTH_INFO[Number(month)]?.period || 'Période de carrière';
    },

    getMonthLabel(month) {
        return MONTH_INFO[Number(month)]?.label || `Mois ${month}`;
    },

    isOffSeason(month) {
        return [6, 7].includes(Number(month));
    },

    createSeasonSchedule(player, seasonYear) {
        const seed = hashSeed(`${seasonYear}|${player?.club || ''}|${player?.country || ''}|${player?.age || 14}|${player?.position || ''}`);
        const random = seededRandom(seed);
        const age = Number(player?.age) || 14;

        if (age < 18) {
            const youth = buildYouthSchedule(player, seasonYear, random);
            return this.finalizeSchedule(player, seasonYear, youth.matches, youth.category, seed);
        }

        const competition = this.getSeniorCompetition(player);
        const senior = buildSeniorSchedule(player, seasonYear, random, competition);
        return this.finalizeSchedule(player, seasonYear, senior.matches, senior.category, seed);
    },

    finalizeSchedule(player, seasonYear, matches, category, seed) {
        const ordered = sortMatches(matches);
        const byMonth = {};

        for (const month of ALL_MONTHS) {
            byMonth[month] = {
                month,
                label: this.getMonthLabel(month),
                period: this.getPeriodName(month),
                phase: MONTH_INFO[month]?.phase || 'offseason',
                matches: []
            };
        }

        ordered.forEach(match => {
            byMonth[match.month].matches.push(match);
        });

        return {
            version: 2,
            seasonYear,
            seasonLabel: seasonLabel(seasonYear),
            generatedForAge: Number(player?.age) || 14,
            category,
            seed,
            matches: ordered,
            byMonth,
            totals: {
                allMatches: ordered.length,
                leagueMatches: ordered.filter(m => m.type === 'league').length,
                cupMatches: ordered.filter(m => m.competitionId === 'NATIONAL_CUP').length,
                europeanMatches: ordered.filter(m => m.competitionId === 'CHAMPIONS_LEAGUE').length
            }
        };
    },

    ensureSeasonSchedule(state) {
        if (!state?.player || !state?.calendar) return null;
        const year = Number(state.calendar.currentSeasonYear) || new Date().getFullYear();
        const existing = state.calendar.seasonSchedule;

        if (
            existing &&
            Number(existing.seasonYear) === year &&
            Array.isArray(existing.matches)
        ) {
            return existing;
        }

        const schedule = this.createSeasonSchedule(state.player, year);
        state.calendar.seasonSchedule = schedule;
        state.calendar.seasonMatchCursor = 0;
        return schedule;
    },

    getBlockPlan(state) {
        const player = state?.player || {};
        const calendar = state?.calendar || {};
        const month = Number(calendar.currentMonth) || 8;
        const seasonYear = Number(calendar.currentSeasonYear) || new Date().getFullYear();

        const schedule = this.ensureSeasonSchedule(state);
        const monthData = schedule?.byMonth?.[month];

        if (this.isOffSeason(month)) {
            return {
                type: 'offseason',
                month,
                monthLabel: this.getMonthLabel(month),
                season: seasonYear,
                seasonLabel: seasonLabel(seasonYear),
                matches: 0,
                scheduledMatches: [],
                activities: month === 7
                    ? ['repos', 'mercato', 'programme_individuel', 'preparation_saison']
                    : ['bilan', 'selection_internationale', 'repos', 'recovery'],
                importance: 'none',
                mode: 'career_activity'
            };
        }

        const scheduledMatches = monthData?.matches || [];
        const hasMajor = scheduledMatches.some(match => match.importance === 'major');
        const hasImportant = scheduledMatches.some(match => match.importance === 'important');

        return {
            type: player.age < 18 ? 'youth' : 'senior',
            category: schedule?.category || (player.age < 18 ? this.getYouthCategory(player.age) : 'Senior'),
            month,
            monthLabel: this.getMonthLabel(month),
            season: seasonYear,
            seasonLabel: seasonLabel(seasonYear),
            matches: scheduledMatches.length,
            scheduledMatches,
            competition: scheduledMatches[0]?.competitionName || null,
            activities: scheduledMatches.length
                ? [player.age < 18 ? 'match_jeunes' : 'match', 'entrainement']
                : ['entrainement', 'evenement'],
            importance: hasMajor ? 'major' : hasImportant ? 'important' : scheduledMatches.length >= 4 ? 'normal' : 'low',
            mode: hasMajor ? 'major' : hasImportant ? 'mixed' : scheduledMatches.length ? 'simulation' : 'career_activity'
        };
    },

    getCurrentMatches(state) {
        return this.getBlockPlan(state).scheduledMatches || [];
    },

    getSeasonSkeleton(player, year) {
        const schedule = this.createSeasonSchedule(player, year);
        return ALL_MONTHS.map(month => ({
            month,
            monthLabel: this.getMonthLabel(month),
            period: this.getPeriodName(month),
            phase: MONTH_INFO[month]?.phase || 'offseason',
            matches: schedule.byMonth[month]?.matches || []
        }));
    }
};

export default CompetitionSystem;
