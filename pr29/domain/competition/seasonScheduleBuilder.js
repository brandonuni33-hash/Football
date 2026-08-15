// domain/competition/seasonScheduleBuilder.js
// Construction déterministe des calendriers jeunesse et senior.

import { WorldSystem } from '../world/worldSystem.js';
import { SEASON_MONTHS, MONTH_INFO } from './competitionCatalog.js';
import { buildYouthTournamentFixtures } from './youthTournamentSystem.js';

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
    const raw = SEASON_MONTHS.map(month => ({ month, weight: Math.max(0.001, Number(weights[month] || 0.1)) })).map(item => ({ ...item, exact: total * item.weight }));
    let assigned = 0;
    raw.forEach(item => { result[item.month] = Math.floor(item.exact); assigned += result[item.month]; });
    raw.sort((a, b) => { const fraction = (b.exact - Math.floor(b.exact)) - (a.exact - Math.floor(a.exact)); return fraction || random() - 0.5; });
    for (let i = 0; i < total - assigned; i += 1) result[raw[i % raw.length].month] += 1;
    return result;
}

function createMatch({ competition, month, index, seasonYear, random, importance = 'normal' }) {
    const info = MONTH_INFO[month], home = random() >= 0.5;
    return { id: `${seasonYear}-${month}-${competition.id}-${index + 1}`, competitionId: competition.id, competitionName: competition.name, type: competition.type, competitionType: competition.type, month, monthLabel: info?.label || `Mois ${month}`, seasonYear, matchday: index + 1, venue: home ? 'Domicile' : 'Extérieur', home, opponent: competition.type === 'league' ? 'Adversaire de championnat' : competition.name, importance, status: 'scheduled', played: false };
}
function importanceFor(month, index, total, random) { if (month === 5) return 'major'; if (index === total - 1 && total >= 30) return 'important'; if (random() < 0.12) return 'important'; return 'normal'; }

function youthCategory(age) {
    const value = Number(age) || 14;
    if (value <= 15) return 'U15';
    if (value === 16) return 'U16';
    return 'U17';
}

function youthCompetition(country, category) {
    const names = {
        France: `Championnat National ${category}`,
        Angleterre: `${category} Premier League Academy`,
        Espagne: `División de Honor ${category}`,
        Italie: `Campionato ${category}`,
        Allemagne: `${category} Nachwuchsliga`
    };
    const code = String(country || 'INT').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4) || 'INT';
    return { id: `YOUTH_${code}_${category}`, name: names[country] || `Championnat ${category} - ${country || 'International'}`, type: 'youth' };
}

function cleanYouthBaseName(name = '') {
    return String(name)
        .replace(/\s*\([^)]*\)\s*$/g, '')
        .replace(/\s+(U1[5-9]|Youth|Academy|Juvenil(?:\s+[AB])?|Primavera|Juniors?)\s*$/i, '')
        .trim();
}

function decorateYouthTournamentFixtures(player, fixtures, seasonYear) {
    return fixtures.map((match, index) => ({
        ...match,
        seasonYear,
        youthCategory: match.competitionId === 'U20_WORLD_CUP' ? 'U20' : 'U19',
        playerClubId: match.competitionId === 'YOUTH_LEAGUE' ? (player?.clubId || null) : null,
        nationalTeam: match.competitionId === 'U20_WORLD_CUP' ? (player?.country || player?.nationality || null) : null,
        home: index % 2 === 0,
        venue: index % 2 === 0 ? 'Domicile' : 'Extérieur',
        opponentStrength: match.competitionId === 'U20_WORLD_CUP' ? 74 : 68
    }));
}

function buildYouthSchedule(player, seasonYear, random) {
    const age = Number(player?.age) || 14;
    const category = youthCategory(age);
    const totals = { U15: 22, U16: 26, U17: 30 };
    const total = totals[category] || 22;
    const country = player?.clubCountry || player?.youthClubData?.country || player?.country || 'France';
    const competition = youthCompetition(country, category);
    const ownBaseName = cleanYouthBaseName(player?.youthClubName || player?.club || '');
    const countryClubs = (WorldSystem.CLUB_DATABASE || [])
        .filter(club => club.country === country)
        .filter(club => !ownBaseName || !cleanYouthBaseName(club.name).toLowerCase().includes(ownBaseName.toLowerCase()) && !ownBaseName.toLowerCase().includes(cleanYouthBaseName(club.name).toLowerCase()));
    const opponents = countryClubs.length ? countryClubs : (WorldSystem.CLUB_DATABASE || []).filter(club => club.country === 'France');
    const monthly = distributeExact(total, { 8: .09, 9: .10, 10: .11, 11: .11, 12: .08, 1: .09, 2: .11, 3: .11, 4: .11, 5: .09 }, random);
    const matches = [];
    let cursor = Math.floor(random() * Math.max(1, opponents.length));

    for (const month of SEASON_MONTHS) {
        for (let i = 0; i < monthly[month]; i += 1) {
            const opponentClub = opponents.length ? opponents[cursor++ % opponents.length] : null;
            const match = createMatch({ competition, month, index: matches.length, seasonYear, random, importance: importanceFor(month, i, monthly[month], random) });
            match.leagueId = competition.id;
            match.youthCategory = category;
            match.playerClubId = player?.clubId || null;
            match.opponentClubId = opponentClub?.id || null;
            match.opponent = opponentClub ? `${cleanYouthBaseName(opponentClub.name)} ${category}` : `Équipe ${category}`;
            match.opponentStrength = opponentClub ? Math.round(38 + Number(opponentClub.strength || 60) * .35) : 58;
            match.homeClubId = match.venue === 'Domicile' ? match.playerClubId : match.opponentClubId;
            match.awayClubId = match.venue === 'Domicile' ? match.opponentClubId : match.playerClubId;
            // Un match de championnat jeunes peut finir nul : aucune prolongation, aucun tir au but.
            match.knockout = false; match.requiresWinner = false; match.extraTime = false; match.penalties = false;
            matches.push(match);
        }
    }
    const extras = decorateYouthTournamentFixtures(player, buildYouthTournamentFixtures(player, seasonYear), seasonYear);
    return { category, totalLeagueMatches: total, matches: [...matches, ...extras], extras };
}

function buildSeniorSchedule(player, seasonYear, random, competition, buildEuropeanLeague, getEuropeanQualification) {
    const monthly = distributeExact(competition.matches, { 8: .08, 9: .10, 10: .11, 11: .10, 12: .07, 1: .10, 2: .11, 3: .10, 4: .12, 5: .11 }, random), clubs = WorldSystem.getClubs(competition.id), playerClub = WorldSystem.getClub(player?.clubId || player?.club), opponents = clubs.filter(c => !playerClub || c.id !== playerClub.id); let cursor = 0; const matches = [];
    for (const month of SEASON_MONTHS) for (let i = 0; i < monthly[month]; i += 1) { const opponent = opponents.length ? opponents[cursor++ % opponents.length] : null; const match = createMatch({ competition, month, index: matches.length, seasonYear, random, importance: importanceFor(month, i, monthly[month], random) }); match.leagueId = competition.id; match.playerClubId = playerClub?.id || player?.clubId || null; match.opponent = opponent?.name || 'Adversaire de championnat'; match.opponentClubId = opponent?.id || null; match.opponentStrength = opponent?.strength || null; match.homeClubId = match.venue === 'Domicile' ? match.playerClubId : match.opponentClubId; match.awayClubId = match.venue === 'Domicile' ? match.opponentClubId : match.playerClubId; match.knockout=false;match.requiresWinner=false;match.extraTime=false;match.penalties=false;matches.push(match); }
    const qualification = getEuropeanQualification(player, competition); player.inEurope = qualification.championsLeague || qualification.europaLeague; player.europeanCompetition = qualification.championsLeague ? 'CHAMPIONS_LEAGUE' : qualification.europaLeague ? 'EUROPA_LEAGUE' : null; player.europeanRank = qualification.rank; const european = buildEuropeanLeague(player, seasonYear, random, qualification); const youthExtras=decorateYouthTournamentFixtures(player,buildYouthTournamentFixtures(player,seasonYear),seasonYear); const extras=[...european,...youthExtras]; return { category: 'Senior', totalLeagueMatches: competition.matches, matches: [...matches, ...extras], extras, europeanQualification: qualification };
}

export function createSeasonSchedule(player, seasonYear, getSeniorCompetition, buildEuropeanLeague, getEuropeanQualification) {
    const seed = hashSeed(`${seasonYear}|${player?.club || ''}|${player?.country || ''}|${player?.age || 14}|${player?.position || ''}`), random = seededRandom(seed), age = Number(player?.age) || 14;
    if (age < 18) { const youth = buildYouthSchedule(player, seasonYear, random); return { seed, category: youth.category, matches: youth.matches }; }
    const competition = getSeniorCompetition(player), senior = buildSeniorSchedule(player, seasonYear, random, competition, buildEuropeanLeague, getEuropeanQualification); return { seed, category: senior.category, matches: senior.matches };
}
export function sortMatches(matches) { const order = new Map([6,7,...SEASON_MONTHS].map((month, index) => [month, index])); return [...matches].sort((a, b) => { const monthDiff = (order.get(a.month) ?? 99) - (order.get(b.month) ?? 99); if (monthDiff !== 0) return monthDiff; if (a.type !== b.type) return a.type === 'league' || a.type === 'youth' ? -1 : 1; return String(a.id).localeCompare(String(b.id)); }); }
