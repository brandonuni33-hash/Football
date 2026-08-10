// cupSystemV2.js
// Coupes nationales : tirage, tours, qualification, finale et historique.
import { WorldSystem } from './worldSystem.js';

const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));
const ROUND_PLAN = [
    { round: 'Tour préliminaire', month: 9 },
    { round: '16es de finale', month: 10 },
    { round: '8es de finale', month: 1 },
    { round: 'Quarts de finale', month: 3 },
    { round: 'Demi-finales', month: 4 },
    { round: 'Finale', month: 5 }
];

export const COUNTRIES = {
    France: { id: 'COUPE_FR', name: 'Coupe de France', shortName: 'CDF', leagueIds: ['FR_L1', 'FR_L2'] },
    Angleterre: { id: 'COUPE_EN', name: 'FA Cup', shortName: 'FA Cup', leagueIds: ['EN_PL', 'EN_CH'] },
    Espagne: { id: 'COUPE_ES', name: 'Copa del Rey', shortName: 'Copa', leagueIds: ['ES_LA', 'ES_SD'] },
    Italie: { id: 'COUPE_IT', name: 'Coppa Italia', shortName: 'Coppa', leagueIds: ['IT_A', 'IT_B'] },
    Allemagne: { id: 'COUPE_DE', name: 'DFB-Pokal', shortName: 'Pokal', leagueIds: ['DE_B1', 'DE_B2'] }
};

function hashSeed(input) { let h = 2166136261; for (const c of String(input)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let v = seed >>> 0; return () => { v += 0x6D2B79F5; let t = v; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffle(items, random) { const a = [...items]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function strength(club) { return Number(club?.strength || 50) + Number(club?.prestige || 0) * 0.35; }
function playerClubId(state) { return state?.player?.clubId || WorldSystem.getClub(state?.player?.club)?.id || null; }
function countryForPlayer(state) { return state?.player?.clubCountry || state?.player?.country || 'France'; }
function planIndexForCount(count) {
    if (count > 32) return 0;
    if (count === 32) return 1;
    if (count === 16) return 2;
    if (count === 8) return 3;
    if (count === 4) return 4;
    return 5;
}
function simulateGoals(home, away, random = Math.random) {
    const diff = strength(home) - strength(away);
    const h = clamp(1.25 + diff / 45, .3, 2.8);
    const a = clamp(1.05 - diff / 55, .25, 2.4);
    const poisson = lambda => { let g = 0; const attempts = Math.max(1, Math.round(lambda * 3)); for (let i = 0; i < attempts; i++) if (random() < lambda / attempts) g++; return Math.min(5, g); };
    return { homeGoals: poisson(h), awayGoals: poisson(a) };
}
function resolve(home, away, random = Math.random, forced = null) {
    let homeGoals = forced?.homeGoals, awayGoals = forced?.awayGoals, extra = false, pens = false;
    if (homeGoals == null || awayGoals == null) ({ homeGoals, awayGoals } = simulateGoals(home, away, random));
    if (homeGoals === awayGoals) { extra = true; homeGoals += random() < .48 ? 1 : 0; awayGoals += random() < .45 ? 1 : 0; }
    let winner;
    if (homeGoals > awayGoals) winner = home;
    else if (awayGoals > homeGoals) winner = away;
    else { pens = true; winner = random() < clamp(.5 + (strength(home) - strength(away)) / 250, .35, .65) ? home : away; }
    return { homeClubId: home.id, awayClubId: away.id, homeGoals, awayGoals, winnerClubId: winner.id, wentToExtraTime: extra, wentToPenalties: pens };
}
function match(home, away, cup, round, month, index) {
    const p = cup.playerClubId;
    const isHome = home.id === p || (away.id !== p && index % 2 === 0);
    const h = isHome ? home : away;
    const a = isHome ? away : home;
    return { id: `cup-${cup.seasonYear}-${cup.id}-${cup.roundIndex}-${index}-${h.id}-${a.id}`, type: 'cup', competitionType: 'national_cup', competitionId: cup.id, competitionName: cup.name, round, month, seasonYear: cup.seasonYear, matchday: index + 1, homeClubId: h.id, awayClubId: a.id, homeClub: h.name, awayClub: a.name, opponent: h.id === p ? a.name : h.name, venue: h.id === p ? 'Domicile' : 'Extérieur', importance: round === 'Finale' ? 'major' : round === 'Demi-finales' ? 'important' : 'normal', playable: true, played: false };
}
function buildRound(cup, ids) {
    const clubs = ids.map(id => WorldSystem.getClub(id)).filter(Boolean);
    if (clubs.length <= 1) return { matches: [], byes: clubs.map(c => c.id), round: 'Finale', month: 5 };
    const planIndex = planIndexForCount(clubs.length), plan = ROUND_PLAN[planIndex], target = planIndex === 0 ? 32 : clubs.length;
    const ordered = [...clubs].sort((a, b) => strength(b) - strength(a));
    const random = rng(hashSeed(`${cup.seasonYear}|${cup.id}|${cup.roundIndex}|${clubs.length}`));
    let drawPool = ordered, byes = [];
    if (clubs.length > target) { const matchClubCount = (clubs.length - target) * 2; byes = ordered.slice(0, clubs.length - matchClubCount).map(c => c.id); drawPool = ordered.slice(clubs.length - matchClubCount); }
    drawPool = shuffle(drawPool, random);
    const matches = [];
    for (let i = 0; i < drawPool.length; i += 2) matches.push(match(drawPool[i], drawPool[i + 1], cup, plan.round, plan.month, i / 2));
    return { matches, byes, round: plan.round, month: plan.month };
}

export const CupSystem = {
    COUNTRIES,
    ensure(state) {
        state.cups ||= {};
        const year = Number(state.calendar?.currentSeasonYear) || new Date().getFullYear();
        for (const country of Object.keys(COUNTRIES)) {
            const def = COUNTRIES[country], clubs = def.leagueIds.flatMap(id => WorldSystem.getClubs(id)), old = state.cups[def.id];
            if (!old || Number(old.seasonYear) !== year) state.cups[def.id] = { id: def.id, name: def.name, shortName: def.shortName, country, seasonYear: year, status: 'active', roundIndex: 0, currentRound: null, roundMonth: null, qualifiedClubIds: clubs.map(c => c.id), eliminatedClubIds: [], matches: [], history: [], finalistIds: [], winnerId: null, champion: null, playerClubId: playerClubId(state) };
        }
        return state.cups;
    },
    getCup(state, country = countryForPlayer(state)) { this.ensure(state); const def = COUNTRIES[country]; return def ? state.cups[def.id] || null : null; },
    prepareRound(state, country = countryForPlayer(state)) {
        const cup = this.getCup(state, country);
        if (!cup || cup.status === 'finished' || cup.matches.length) return cup?.matches || [];
        cup.playerClubId = playerClubId(state);
        const ids = [...new Set(cup.qualifiedClubIds || [])];
        if (ids.length <= 1) { cup.status = 'finished'; cup.winnerId = ids[0] || null; cup.champion = WorldSystem.getClub(cup.winnerId)?.name || null; return []; }
        const built = buildRound(cup, ids);
        cup.currentRound = built.round; cup.roundMonth = built.month; cup.matches = built.matches; cup.byeClubIds = built.byes; cup.pendingWinnerIds = [...built.byes];
        return cup.matches;
    },
    getPlayerMatch(state, country = countryForPlayer(state)) {
        const cup = this.getCup(state, country), pid = playerClubId(state), month = Number(state.calendar?.currentMonth) || 8;
        if (!cup || cup.status === 'finished' || !pid) return null;
        if (!cup.matches.length && Number(cup.roundMonth) === month) this.prepareRound(state, country);
        return cup.matches.find(m => !m.played && (m.homeClubId === pid || m.awayClubId === pid)) || null;
    },
    getPlayerFixtures(state) { const country = countryForPlayer(state), month = Number(state.calendar?.currentMonth) || 8, cup = this.getCup(state, country); if (!cup || cup.status === 'finished') return []; const m = this.getPlayerMatch(state, country); return m && Number(m.month) === month ? [m] : []; },
    resolvePlayerMatch(state, fixture, performance = {}) {
        if (!fixture || fixture.played) return fixture?.result || null;
        const cup = this.getCup(state, countryForPlayer(state)), home = WorldSystem.getClub(fixture.homeClubId), away = WorldSystem.getClub(fixture.awayClubId);
        if (!cup || !home || !away) return null;
        const pid = playerClubId(state), homePlayer = home.id === pid, rating = Number(performance.rating || 6), goals = Math.max(0, Number(performance.goals || 0)), assists = Math.max(0, Number(performance.assists || 0));
        const base = simulateGoals(home, away);
        let playerScore = homePlayer ? base.homeGoals : base.awayGoals;
        playerScore = Math.min(5, Math.max(0, Math.max(Math.round(playerScore + clamp((rating - 6) * .22 + assists * .08, -.5, 1.1)), Math.min(3, goals))));
        const opponentScore = homePlayer ? base.awayGoals : base.homeGoals;
        const forced = homePlayer ? { homeGoals: playerScore, awayGoals: opponentScore } : { homeGoals: opponentScore, awayGoals: playerScore };
        const result = resolve(home, away, Math.random, forced); this._record(cup, fixture, result); this._finishRoundIfReady(cup); return result;
    },
    simulateCurrentRound(state, country = countryForPlayer(state)) {
        const cup = this.getCup(state, country); if (!cup || cup.status === 'finished' || !cup.matches.length) return cup || null;
        const pid = playerClubId(state);
        for (const fixture of [...cup.matches]) { if (fixture.played || fixture.homeClubId === pid || fixture.awayClubId === pid) continue; const home = WorldSystem.getClub(fixture.homeClubId), away = WorldSystem.getClub(fixture.awayClubId); if (home && away) this._record(cup, fixture, resolve(home, away)); }
        this._finishRoundIfReady(cup); return cup;
    },
    _record(cup, fixture, result) {
        fixture.played = true; fixture.homeGoals = result.homeGoals; fixture.awayGoals = result.awayGoals; fixture.winnerClubId = result.winnerClubId; fixture.wentToExtraTime = result.wentToExtraTime; fixture.wentToPenalties = result.wentToPenalties; fixture.result = result;
        cup.history.push({ ...fixture }); cup.pendingWinnerIds ||= []; if (!cup.pendingWinnerIds.includes(result.winnerClubId)) cup.pendingWinnerIds.push(result.winnerClubId);
        cup.eliminatedClubIds ||= []; const loser = result.winnerClubId === fixture.homeClubId ? fixture.awayClubId : fixture.homeClubId; if (!cup.eliminatedClubIds.includes(loser)) cup.eliminatedClubIds.push(loser);
    },
    _finishRoundIfReady(cup) {
        if (!cup || cup.matches.some(m => !m.played)) return false;
        const winners = [...new Set(cup.pendingWinnerIds || [])]; cup.qualifiedClubIds = winners; cup.matches = []; cup.pendingWinnerIds = [];
        if (winners.length <= 1) { cup.status = 'finished'; cup.winnerId = winners[0] || null; cup.champion = WorldSystem.getClub(cup.winnerId)?.name || null; cup.currentRound = 'Finale'; cup.roundMonth = 5; return true; }
        cup.roundIndex = planIndexForCount(winners.length); cup.currentRound = null; cup.roundMonth = ROUND_PLAN[cup.roundIndex].month; if (winners.length === 2) cup.finalistIds = winners; return true;
    },
    getSummary(state, country = countryForPlayer(state)) { const cup = this.getCup(state, country), pid = playerClubId(state); if (!cup) return null; return { id: cup.id, name: cup.name, country: cup.country, round: cup.currentRound, roundMonth: cup.roundMonth, status: cup.status, champion: cup.champion, winnerId: cup.winnerId, playerStillIn: cup.status !== 'finished' && cup.qualifiedClubIds.includes(pid), history: cup.history.length, finalists: cup.finalistIds || [] }; },
    finalizeSeason(state) { this.ensure(state); state.cupHistory ||= []; for (const cup of Object.values(state.cups)) state.cupHistory.push({ id: cup.id, name: cup.name, country: cup.country, seasonYear: cup.seasonYear, champion: cup.champion, winnerId: cup.winnerId, history: cup.history }); state.cups = {}; return state.cupHistory; }
};

export default CupSystem;
