// cupSystem.js
// Phase 2D — Coupes nationales réellement intégrées au calendrier et au match.
import { WorldSystem } from './worldSystem.js';

const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));

export const COUNTRIES = {
    France: { id: 'COUPE_FR', name: 'Coupe de France', shortName: 'CDF', leagueIds: ['FR_L1', 'FR_L2'] },
    Angleterre: { id: 'COUPE_EN', name: 'FA Cup', shortName: 'FA Cup', leagueIds: ['EN_PL', 'EN_CH'] },
    Espagne: { id: 'COUPE_ES', name: 'Copa del Rey', shortName: 'Copa', leagueIds: ['ES_LA', 'ES_SD'] },
    Italie: { id: 'COUPE_IT', name: 'Coppa Italia', shortName: 'Coppa', leagueIds: ['IT_A', 'IT_B'] },
    Allemagne: { id: 'COUPE_DE', name: 'DFB-Pokal', shortName: 'Pokal', leagueIds: ['DE_B1', 'DE_B2'] }
};

const ROUND_MONTHS = [9, 10, 1, 3, 5];
const shuffle = (array, random = Math.random) => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};

function seededRandom(seed) {
    let value = (seed >>> 0) || 1;
    return () => {
        value += 0x6D2B79F5;
        let t = value;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function hashSeed(input) {
    let h = 2166136261;
    const text = String(input);
    for (let i = 0; i < text.length; i += 1) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function getStrength(club) {
    if (!club) return 50;
    return Number(club.strength || 50) + Number(club.prestige || 0) * 0.35;
}

function roundName(clubCount) {
    const names = {
        64: '32es de finale',
        32: '16es de finale',
        16: '8es de finale',
        8: 'Quarts de finale',
        4: 'Demi-finales',
        2: 'Finale'
    };
    return names[clubCount] || `${Math.ceil(clubCount / 2)}es de finale`;
}

function createMatch(home, away, round, seasonYear, index, month) {
    return {
        id: `cup-${seasonYear}-${round}-${index + 1}-${home.id}-${away.id}`,
        type: 'cup',
        competitionType: 'national_cup',
        competitionId: null,
        competitionName: null,
        round,
        month,
        seasonYear,
        homeClubId: home.id,
        awayClubId: away.id,
        homeClub: home.name,
        awayClub: away.name,
        venue: 'Domicile',
        importance: round === 'Finale' ? 'major' : round === 'Demi-finales' ? 'important' : 'normal',
        playable: true,
        played: false
    };
}

function simulateGoals(home, away, random = Math.random) {
    const diff = getStrength(home) - getStrength(away);
    const homeLambda = clamp(1.25 + diff / 45, 0.35, 2.8);
    const awayLambda = clamp(1.05 - diff / 55, 0.25, 2.4);
    const poissonish = lambda => {
        let goals = 0;
        const attempts = Math.max(1, Math.round(lambda * 3));
        for (let i = 0; i < attempts; i += 1) {
            if (random() < lambda / attempts) goals += 1;
        }
        return Math.min(5, goals);
    };
    return { homeGoals: poissonish(homeLambda), awayGoals: poissonish(awayLambda) };
}

function resolveMatch(home, away, random = Math.random, forcedScore = null) {
    let homeGoals = forcedScore?.homeGoals;
    let awayGoals = forcedScore?.awayGoals;
    let wentToExtraTime = false;
    let wentToPenalties = false;

    if (homeGoals == null || awayGoals == null) ({ homeGoals, awayGoals } = simulateGoals(home, away, random));

    if (homeGoals === awayGoals) {
        wentToExtraTime = true;
        homeGoals += random() < 0.48 ? 1 : 0;
        awayGoals += random() < 0.45 ? 1 : 0;
    }

    let winner;
    if (homeGoals > awayGoals) winner = home;
    else if (awayGoals > homeGoals) winner = away;
    else {
        wentToPenalties = true;
        const chance = clamp(0.5 + (getStrength(home) - getStrength(away)) / 250, 0.35, 0.65);
        winner = random() < chance ? home : away;
    }

    return { homeClubId: home.id, awayClubId: away.id, homeGoals, awayGoals, winnerClubId: winner.id, wentToExtraTime, wentToPenalties };
}

function getActiveIds(cup) {
    return (cup.qualifiedClubIds || []).filter(id => !(cup.eliminatedClubIds || []).includes(id));
}

function buildRound(cup, ids) {
    const clubs = ids.map(id => WorldSystem.getClub(id)).filter(Boolean);
    if (clubs.length <= 1) return { matches: [], byes: clubs.map(c => c.id), round: 'Finale' };

    // On réduit au prochain tableau de puissance de deux : les clubs les plus faibles
    // jouent le tour préliminaire et les plus forts bénéficient d'un tour de repos.
    const target = 2 ** Math.floor(Math.log2(clubs.length));
    const matchClubCount = clubs.length === target
        ? clubs.length
        : Math.max(2, (clubs.length - target) * 2);
    const ordered = [...clubs].sort((a, b) => getStrength(b) - getStrength(a));
    const byeClubs = ordered.slice(0, clubs.length - matchClubCount);
    const drawPool = shuffle(
        ordered.slice(clubs.length - matchClubCount),
        seededRandom(hashSeed(`${cup.seasonYear}|${cup.id}|${cup.roundIndex}`))
    );
    const matchesCount = drawPool.length / 2;
    const month = ROUND_MONTHS[Math.min(cup.roundIndex, ROUND_MONTHS.length - 1)];
    const round = roundName(Math.max(2, target));
    const matches = [];

    for (let i = 0; i < drawPool.length; i += 2) {
        const home = drawPool[i];
        const away = drawPool[i + 1];
        const match = createMatch(home, away, round, cup.seasonYear, i / 2, month);
        match.competitionId = cup.id;
        match.competitionName = cup.name;
        match.opponent = home.id === cup.playerClubId ? away.name : home.name;
        match.venue = home.id === cup.playerClubId ? 'Domicile' : 'Extérieur';
        matches.push(match);
    }

    if (matchesCount === 1 && target === 2) matches[0].importance = 'major';
    return { matches, byes: byeClubs.map(c => c.id), round };
}

function countryForPlayer(state) {
    return state?.player?.clubCountry || state?.player?.country || 'France';
}

export const CupSystem = {
    COUNTRIES,

    ensure(state) {
        state.cups ||= {};
        const seasonYear = Number(state.calendar?.currentSeasonYear) || new Date().getFullYear();

        for (const country of Object.keys(COUNTRIES)) {
            const def = COUNTRIES[country];
            const clubs = def.leagueIds.flatMap(id => WorldSystem.getClubs(id));
            const existing = state.cups[def.id];

            if (!existing || Number(existing.seasonYear) !== seasonYear) {
                state.cups[def.id] = {
                    id: def.id,
                    name: def.name,
                    shortName: def.shortName,
                    country,
                    seasonYear,
                    status: 'active',
                    roundIndex: 0,
                    currentRound: null,
                    roundMonth: null,
                    qualifiedClubIds: clubs.map(c => c.id),
                    eliminatedClubIds: [],
                    matches: [],
                    history: [],
                    finalistIds: [],
                    winnerId: null,
                    champion: null,
                    playerClubId: state.player?.clubId || WorldSystem.getClub(state.player?.club)?.id || null
                };
            }
        }

        return state.cups;
    },

    getCup(state, country = countryForPlayer(state)) {
        this.ensure(state);
        const def = COUNTRIES[country];
        return def ? state.cups[def.id] || null : null;
    },

    prepareRound(state, country = countryForPlayer(state)) {
        const cup = this.getCup(state, country);
        if (!cup || cup.status === 'finished' || cup.matches.length) return cup?.matches || [];

        cup.playerClubId = state.player?.clubId || WorldSystem.getClub(state.player?.club)?.id || null;
        const ids = getActiveIds(cup);

        if (ids.length <= 1) {
            cup.status = 'finished';
            cup.winnerId = ids[0] || null;
            cup.champion = WorldSystem.getClub(ids[0])?.name || null;
            return [];
        }

        const built = buildRound(cup, ids);
        cup.currentRound = built.round;
        cup.roundMonth = ROUND_MONTHS[Math.min(cup.roundIndex, ROUND_MONTHS.length - 1)];
        cup.matches = built.matches;
        cup.byeClubIds = built.byes;
        cup.pendingWinnerIds = [...built.byes];

        if (built.matches.length === 0) this._finishRound(state, country, cup.pendingWinnerIds);
        return cup.matches;
    },

    getPlayerMatch(state, country = countryForPlayer(state)) {
        const playerClubId = state.player?.clubId || WorldSystem.getClub(state.player?.club)?.id;
        if (!playerClubId) return null;

        const cup = this.getCup(state, country);
        if (!cup || cup.status === 'finished') return null;
        if (!cup.matches.length) this.prepareRound(state, country);

        return cup.matches.find(
            m => !m.played && (m.homeClubId === playerClubId || m.awayClubId === playerClubId)
        ) || null;
    },

    getPlayerFixtures(state) {
        const country = countryForPlayer(state);
        const cup = this.getCup(state, country);
        if (!cup || cup.status === 'finished') return [];

        const currentMonth = Number(state.calendar?.currentMonth) || 8;
        const match = this.getPlayerMatch(state, country);
        if (!match || Number(match.month) !== currentMonth) return [];
        return [match];
    },

    resolvePlayerMatch(state, match, performance = {}) {
        if (!match || match.played) return match?.result || null;

        const country = countryForPlayer(state);
        const cup = this.getCup(state, country);
        if (!cup) return null;

        const home = WorldSystem.getClub(match.homeClubId);
        const away = WorldSystem.getClub(match.awayClubId);
        if (!home || !away) return null;

        const playerClubId = state.player?.clubId || home.id;
        const playerIsHome = home.id === playerClubId;
        const rating = Number(performance.rating || 6);
        const playerGoals = Math.max(0, Number(performance.goals || 0));
        const playerAssists = Math.max(0, Number(performance.assists || 0));
        const base = simulateGoals(home, away);
        const impact = clamp((rating - 6) * 0.22 + playerAssists * 0.08, -0.5, 1.1);

        let playerScore = playerIsHome ? base.homeGoals : base.awayGoals;
        playerScore = Math.max(0, Math.round(playerScore + impact));
        playerScore = Math.min(5, Math.max(playerScore, Math.min(3, playerGoals)));

        const opponentScore = playerIsHome ? base.awayGoals : base.homeGoals;
        const forced = playerIsHome
            ? { homeGoals: playerScore, awayGoals: opponentScore }
            : { homeGoals: opponentScore, awayGoals: playerScore };

        const result = resolveMatch(home, away, Math.random, forced);
        this._recordMatch(cup, match, result);
        this._finishRoundIfReady(state, country);
        return result;
    },

    simulateCurrentRound(state, country = countryForPlayer(state)) {
        const cup = this.getCup(state, country);
        if (!cup || cup.status === 'finished') return null;

        // Important : ne jamais préparer automatiquement le tour suivant ici.
        // Le prochain tour doit attendre son mois prévu dans ROUND_MONTHS.
        if (!cup.matches.length) return cup;

        const playerClubId = state.player?.clubId || WorldSystem.getClub(state.player?.club)?.id;
        const playerMatch = cup.matches.find(
            m => !m.played && (m.homeClubId === playerClubId || m.awayClubId === playerClubId)
        );

        for (const match of [...cup.matches]) {
            if (match.played || match.id === playerMatch?.id) continue;
            const home = WorldSystem.getClub(match.homeClubId);
            const away = WorldSystem.getClub(match.awayClubId);
            if (!home || !away) continue;
            this._recordMatch(cup, match, resolveMatch(home, away));
        }

        this._finishRoundIfReady(state, country);
        return cup;
    },

    _recordMatch(cup, match, result) {
        match.played = true;
        match.homeGoals = result.homeGoals;
        match.awayGoals = result.awayGoals;
        match.winnerClubId = result.winnerClubId;
        match.wentToExtraTime = result.wentToExtraTime;
        match.wentToPenalties = result.wentToPenalties;
        match.result = result;
        cup.history.push({ ...match });

        cup.pendingWinnerIds ||= [];
        cup.eliminatedClubIds ||= [];
        if (result.winnerClubId && !cup.pendingWinnerIds.includes(result.winnerClubId)) {
            cup.pendingWinnerIds.push(result.winnerClubId);
        }

        const loserId = result.winnerClubId === match.homeClubId ? match.awayClubId : match.homeClubId;
        if (!cup.eliminatedClubIds.includes(loserId)) cup.eliminatedClubIds.push(loserId);
    },

    _finishRoundIfReady(state, country) {
        const cup = this.getCup(state, country);
        if (!cup || cup.matches.some(m => !m.played)) return false;

        const winners = [...new Set(cup.pendingWinnerIds || [])];
        this._finishRound(state, country, winners);
        return true;
    },

    _finishRound(state, country, winners) {
        const cup = this.getCup(state, country);
        if (!cup) return null;

        cup.qualifiedClubIds = [...new Set(winners)];
        cup.matches = [];
        cup.pendingWinnerIds = [];

        if (cup.qualifiedClubIds.length <= 1) {
            cup.status = 'finished';
            cup.winnerId = cup.qualifiedClubIds[0] || null;
            cup.champion = WorldSystem.getClub(cup.winnerId)?.name || null;
            cup.currentRound = 'Finale';
            cup.roundMonth = 5;
            return cup;
        }

        cup.roundIndex += 1;
        cup.currentRound = null;
        cup.roundMonth = null;
        if (cup.qualifiedClubIds.length === 2) cup.finalistIds = [...cup.qualifiedClubIds];
        return cup;
    },

    getSummary(state, country = countryForPlayer(state)) {
        const cup = this.getCup(state, country);
        if (!cup) return null;

        const playerClubId = state.player?.clubId || WorldSystem.getClub(state.player?.club)?.id;
        return {
            id: cup.id,
            name: cup.name,
            country: cup.country,
            round: cup.currentRound,
            roundMonth: cup.roundMonth,
            status: cup.status,
            champion: cup.champion,
            winnerId: cup.winnerId,
            playerStillIn: cup.status !== 'finished' && cup.qualifiedClubIds.includes(playerClubId),
            history: cup.history.length
        };
    },

    finalizeSeason(state) {
        this.ensure(state);
        state.cupHistory ||= [];

        for (const cup of Object.values(state.cups)) {
            state.cupHistory.push({
                id: cup.id,
                name: cup.name,
                country: cup.country,
                seasonYear: cup.seasonYear,
                champion: cup.champion,
                winnerId: cup.winnerId,
                history: cup.history
            });
        }

        state.cups = {};
        return state.cupHistory;
    }
};

export default CupSystem;