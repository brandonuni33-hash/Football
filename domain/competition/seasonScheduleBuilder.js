// domain/competition/seasonScheduleBuilder.js
// Construction pure des calendriers saisonniers.

import { WorldSystem } from '../../worldSystem.js';
import {
    COMPETITIONS,
    SEASON_MONTHS,
    MONTH_INFO
} from './competitionCatalog.js';

function hashSeed(input) {
    let h = 2166136261;
    for (let i = 0; i < String(input).length; i += 1) {
        h ^= String(input).charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

export function createSeededRandom(seed) {
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
    const raw = normalized.map(item => ({ ...item, exact: total * item.weight }));
    for (const item of raw) {
        result[item.month] = Math.floor(item.exact);
        assigned += result[item.month];
    }
    raw.sort((a, b) => {
        const fraction = (b.exact - Math.floor(b.exact)) - (a.exact - Math.floor(a.exact));
        if (fraction !== 0) return fraction;
        return random() - 0.5;
    });
    for (let i = 0; i < total - assigned; i += 1) {
        result[raw[i % raw.length].month] += 1;
    }
    return result;
}

function createMatch({ competition, month, index, seasonYear, random, importance = 'normal' }) {
    const monthInfo = MONTH_INFO[month];
    const isHome = random() >= 0.5;
    return {
        id: `${seasonYear}-${month}-${competition.id}-${index + 1}`,
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
    return { category, totalLeagueMatches: total, matches, extras: [] };
}

function buildSeniorSchedule(player, seasonYear, random, competition) {
    const leagueWeights = {
        8: .08, 9: .10, 10: .11, 11: .10, 12: .07,
        1: .10, 2: .11, 3: .10, 4: .12, 5: .11
    };
    const monthly = distributeExact(competition.matches, leagueWeights, random);
    const matches = [];
    const clubs = WorldSystem.getClubs(competition.id);
    const playerClub = WorldSystem.getClub(player?.clubId || player?.club);
    const opponents = clubs.filter(c => !playerClub || c.id !== playerClub.id);
    let opponentCursor = 0;
    for (const month of SEASON_MONTHS) {
        for (let i = 0; i < monthly[month]; i += 1) {
            const opponent = opponents.length ? opponents[opponentCursor++ % opponents.length] : null;
            const match = createMatch({
                competition,
                month,
                index: matches.length,
                seasonYear,
                random,
                importance: importanceFor(month, i, monthly[month], random)
            });
            match.leagueId = competition.id;
            match.playerClubId = playerClub?.id || player?.clubId || null;
            match.opponent = opponent?.name || 'Adversaire de championnat';
            match.opponentClubId = opponent?.id || null;
            match.homeClubId = match.venue === 'Domicile' ? match.playerClubId : match.opponentClubId;
            match.awayClubId = match.venue === 'Domicile' ? match.opponentClubId : match.playerClubId;
            matches.push(match);
        }
    }
    const extras = [];
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
    return { category: 'Senior', totalLeagueMatches: competition.matches, matches: [...matches, ...extras], extras };
}

export function createSeasonSchedule(player, seasonYear, getSeniorCompetition) {
    const seed = hashSeed(`${seasonYear}|${player?.club || ''}|${player?.country || ''}|${player?.age || 14}|${player?.position || ''}`);
    const random = createSeededRandom(seed);
    const age = Number(player?.age) || 14;
    if (age < 18) {
        const youth = buildYouthSchedule(player, seasonYear, random);
        return { seed, category: youth.category, matches: youth.matches };
    }
    const competition = getSeniorCompetition(player);
    const senior = buildSeniorSchedule(player, seasonYear, random, competition);
    return { seed, category: senior.category, matches: senior.matches };
}

export function sortMatches(matches) {
    const order = new Map(SEASON_MONTHS.map((month, index) => [month, index]));
    return [...matches].sort((a, b) => {
        const monthDiff = (order.get(a.month) ?? 99) - (order.get(b.month) ?? 99);
        if (monthDiff !== 0) return monthDiff;
        if (a.type !== b.type) return a.type === 'league' ? -1 : 1;
        return String(a.id).localeCompare(String(b.id));
    });
}
