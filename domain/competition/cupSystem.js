// domain/competition/cupSystem.js
// Gestion des coupes nationales : tirages, tours, résultats et historique.

import { WorldSystem } from '../../worldSystem.js';
import { COUNTRIES, ROUND_PLAN } from './cupCatalog.js';

const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));

function hashSeed(input) {
    let h = 2166136261;
    for (const c of String(input)) {
        h ^= c.charCodeAt(0);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function rng(seed) {
    let value = seed >>> 0;
    return () => {
        value += 0x6D2B79F5;
        let t = value;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function shuffle(items, random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function strength(club) {
    return Number(club?.strength || 50) + Number(club?.prestige || 0) * 0.35;
}

function playerClubId(state) {
    return state?.player?.clubId || WorldSystem.getClub(state?.player?.club)?.id || null;
}

function countryForPlayer(state) {
    return state?.player?.clubCountry || state?.player?.country || 'France';
}

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
    const homeLambda = clamp(1.25 + diff / 45, .3, 2.8);
    const awayLambda = clamp(1.05 - diff / 55, .25, 2.4);
    const poisson = lambda => {
        let goals = 0;
        const attempts = Math.max(1, Math.round(lambda * 3));
        for (let i = 0; i < attempts; i += 1) if (random() < lambda / attempts) goals += 1;
        return Math.min(5, goals);
    };
    return { homeGoals: poisson(homeLambda), awayGoals: poisson(awayLambda) };
}

function resolve(home, away, random = Math.random, forced = null) {
    let homeGoals = forced?.homeGoals;
    let awayGoals = forced?.awayGoals;
    let extra = false;
    let penalties = false;
    if (homeGoals == null || awayGoals == null) ({ homeGoals, awayGoals } = simulateGoals(home, away, random));
    if (homeGoals === awayGoals) {
        extra = true;
        homeGoals += random() < .48 ? 1 : 0;
        awayGoals += random() < .45 ? 1 : 0;
    }
    let winner;
    if (homeGoals > awayGoals) winner = home;
    else if (awayGoals > homeGoals) winner = away;
    else {
        penalties = true;
        winner = random() < clamp(.5 + (strength(home) - strength(away)) / 250, .35, .65) ? home : away;
    }
    return { homeClubId: home.id, awayClubId: away.id, homeGoals, awayGoals, winnerClubId: winner.id, wentToExtraTime: extra, wentToPenalties: penalties };
}

function createFixture(home, away, cup, round, month, index) {
    const playerId = cup.playerClubId;
    const isHome = home.id === playerId || (away.id !== playerId && index % 2 === 0);
    const host = isHome ? home : away;
    const visitor = isHome ? away : home;
    return {
        id: `cup-${cup.seasonYear}-${cup.id}-${cup.roundIndex}-${index}-${host.id}-${visitor.id}`,
        type: 'cup',
        competitionType: 'national_cup',
        competitionId: cup.id,
        competitionName: cup.name,
        round,
        month,
        seasonYear: cup.seasonYear,
        matchday: index + 1,
        homeClubId: host.id,
        awayClubId: visitor.id,
        homeClub: host.name,
        awayClub: visitor.name,
        opponent: host.id === playerId ? visitor.name : host.name,
        venue: host.id === playerId ? 'Domicile' : 'Extérieur',
        importance: round === 'Finale' ? 'major' : round === 'Demi-finales' ? 'important' : 'normal',
        playable: true,
        played: false
    };
}

function buildRound(cup, ids) {
    const clubs = ids.map(id => WorldSystem.getClub(id)).filter(Boolean);
    if (clubs.length <= 1) return { matches: [], byes: clubs.map(club => club.id), round: 'Finale', month: 5 };
    const planIndex = planIndexForCount(clubs.length);
    const plan = ROUND_PLAN[planIndex];
    const target = planIndex === 0 ? 32 : clubs.length;
    const ordered = [...clubs].sort((a, b) => strength(b) - strength(a));
    const random = rng(hashSeed(`${cup.seasonYear}|${cup.id}|${cup.roundIndex}|${clubs.length}`));
    let drawPool = ordered;
    let byes = [];
    if (clubs.length > target) {
        const matchClubCount = (clubs.length - target) * 2;
        byes = ordered.slice(0, clubs.length - matchClubCount).map(club => club.id);
        drawPool = ordered.slice(clubs.length - matchClubCount);
    }
    drawPool = shuffle(drawPool, random);
    const matches = [];
    for (let i = 0; i < drawPool.length; i += 2) matches.push(createFixture(drawPool[i], drawPool[i + 1], cup, plan.round, plan.month, i / 2));
    return { matches, byes, round: plan.round, month: plan.month };
}

export const CupSystem = {
    COUNTRIES,

    ensure(state) {
        state.cups ||= {};
        const year = Number(state.calendar?.currentSeasonYear) || new Date().getFullYear();
        for (const country of Object.keys(COUNTRIES)) {
            const definition = COUNTRIES[country];
            const clubs = definition.leagueIds.flatMap(id => WorldSystem.getClubs(id));
            const old = state.cups[definition.id];
            if (!old || Number(old.seasonYear) !== year) {
                state.cups[definition.id] = {
                    id: definition.id,
                    name: definition.name,
                    shortName: definition.shortName,
                    country,
                    seasonYear: year,
                    status: 'active',
                    roundIndex: 0,
                    currentRound: null,
                    roundMonth: 9,
                    qualifiedClubIds: clubs.map(club => club.id),
                    eliminatedClubIds: [],
                    matches: [],
                    history: [],
                    finalistIds: [],
                    winnerId: null,
                    champion: null,
                    playerClubId: playerClubId(state)
                };
            }
        }
        return state.cups;
    },

    getCup(state, country = countryForPlayer(state)) {
        this.ensure(state);
        const definition = COUNTRIES[country];
        return definition ? state.cups[definition.id] || null : null;
    },

    prepareRound(state, country = countryForPlayer(state)) {
        const cup = this.getCup(state, country);
        if (!cup || cup.status === 'finished' || cup.matches.length) return cup?.matches || [];
        cup.playerClubId = playerClubId(state);
        const ids = [...new Set(cup.qualifiedClubIds || [])];
        if (ids.length <= 1) {
            cup.status = 'finished';
            cup.winnerId = ids[0] || null;
            cup.champion = WorldSystem.getClub(cup.winnerId)?.name || null;
            return [];
        }
        const built = buildRound(cup, ids);
        cup.currentRound = built.round;
        cup.roundMonth = built.month;
        cup.matches = built.matches;
        cup.byeClubIds = built.byes;
        cup.pendingWinnerIds = [...built.byes];
        return cup.matches;
    },

    getPlayerMatch(state, country = countryForPlayer(state)) {
        const cup = this.getCup(state, country);
        const playerId = playerClubId(state);
        const month = Number(state.calendar?.currentMonth) || 8;
        if (!cup || cup.status === 'finished' || !playerId) return null;
        if (!cup.matches.length && (!Number(cup.roundMonth) || month >= Number(cup.roundMonth))) this.prepareRound(state, country);
        return cup.matches.find(match => !match.played && (match.homeClubId === playerId || match.awayClubId === playerId)) || null;
    },

    getPlayerFixtures(state) {
        const country = countryForPlayer(state);
        const month = Number(state.calendar?.currentMonth) || 8;
        const cup = this.getCup(state, country);
        if (!cup || cup.status === 'finished') return [];
        const fixture = this.getPlayerMatch(state, country);
        return fixture && Number(fixture.month) === month ? [fixture] : [];
    },

    resolvePlayerMatch(state, fixture, performance = {}) {
        if (!fixture || fixture.played) return fixture?.result || null;
        const cup = this.getCup(state, countryForPlayer(state));
        const home = WorldSystem.getClub(fixture.homeClubId);
        const away = WorldSystem.getClub(fixture.awayClubId);
        if (!cup || !home || !away) return null;
        const playerId = playerClubId(state);
        const homePlayer = home.id === playerId;
        const rating = Number(performance.rating || 6);
        const goals = Math.max(0, Number(performance.goals || 0));
        const assists = Math.max(0, Number(performance.assists || 0));
        const base = simulateGoals(home, away);
        let playerScore = homePlayer ? base.homeGoals : base.awayGoals;
        playerScore = Math.min(5, Math.max(0, Math.max(
            Math.round(playerScore + clamp((rating - 6) * .22 + assists * .08, -.5, 1.1)),
            Math.min(3, goals)
        )));
        const opponentScore = homePlayer ? base.awayGoals : base.homeGoals;
        const forced = homePlayer ? { homeGoals: playerScore, awayGoals: opponentScore } : { homeGoals: opponentScore, awayGoals: playerScore };
        const result = resolve(home, away, Math.random, forced);
        this._record(cup, fixture, result);
        this._finishRoundIfReady(cup);
        return result;
    },

    simulateCurrentRound(state, country = countryForPlayer(state)) {
        const cup = this.getCup(state, country);
        if (!cup || cup.status === 'finished' || !cup.matches.length) return cup || null;
        const playerId = playerClubId(state);
        for (const fixture of [...cup.matches]) {
            if (fixture.played || fixture.homeClubId === playerId || fixture.awayClubId === playerId) continue;
            const home = WorldSystem.getClub(fixture.homeClubId);
            const away = WorldSystem.getClub(fixture.awayClubId);
            if (home && away) this._record(cup, fixture, resolve(home, away));
        }
        this._finishRoundIfReady(cup);
        return cup;
    },

    _record(cup, fixture, result) {
        fixture.played = true;
        fixture.homeGoals = result.homeGoals;
        fixture.awayGoals = result.awayGoals;
        fixture.winnerClubId = result.winnerClubId;
        fixture.wentToExtraTime = result.wentToExtraTime;
        fixture.wentToPenalties = result.wentToPenalties;
        fixture.result = result;
        cup.history.push({ ...fixture });
        cup.pendingWinnerIds ||= [];
        if (!cup.pendingWinnerIds.includes(result.winnerClubId)) cup.pendingWinnerIds.push(result.winnerClubId);
        cup.eliminatedClubIds ||= [];
        const loser = result.winnerClubId === fixture.homeClubId ? fixture.awayClubId : fixture.homeClubId;
        if (!cup.eliminatedClubIds.includes(loser)) cup.eliminatedClubIds.push(loser);
    },

    _finishRoundIfReady(cup) {
        if (!cup || cup.matches.some(match => !match.played)) return false;
        const winners = [...new Set(cup.pendingWinnerIds || [])];
        cup.qualifiedClubIds = winners;
        cup.matches = [];
        cup.pendingWinnerIds = [];
        if (winners.length <= 1) {
            cup.status = 'finished';
            cup.winnerId = winners[0] || null;
            cup.champion = WorldSystem.getClub(cup.winnerId)?.name || null;
            cup.currentRound = 'Finale';
            cup.roundMonth = 5;
            return true;
        }
        cup.roundIndex = planIndexForCount(winners.length);
        cup.currentRound = null;
        cup.roundMonth = ROUND_PLAN[cup.roundIndex].month;
        if (winners.length === 2) cup.finalistIds = winners;
        return true;
    },

    getSummary(state, country = countryForPlayer(state)) {
        const cup = this.getCup(state, country);
        const playerId = playerClubId(state);
        if (!cup) return null;
        return {
            id: cup.id,
            name: cup.name,
            country: cup.country,
            round: cup.currentRound,
            roundMonth: cup.roundMonth,
            status: cup.status,
            champion: cup.champion,
            winnerId: cup.winnerId,
            playerStillIn: cup.status !== 'finished' && cup.qualifiedClubIds.includes(playerId),
            history: cup.history.length,
            finalists: cup.finalistIds || []
        };
    },

    finalizeSeason(state) {
        this.ensure(state);
        state.cupHistory ||= [];
        for (const cup of Object.values(state.cups)) {
            state.cupHistory.push({ id: cup.id, name: cup.name, country: cup.country, seasonYear: cup.seasonYear, champion: cup.champion, winnerId: cup.winnerId, history: cup.history });
        }
        state.cups = {};
        return state.cupHistory;
    }
};

export default CupSystem;
