// domain/competition/internationalSystem.js
// Équipes nationales : Euro + Coupe du Monde.
// La logique de compétition internationale reste indépendante de l'UI.

const TOURNAMENTS = {
    EURO: { id: 'EURO', name: 'Euro', startMonth: 6, groupMonths: [6], knockoutMonths: [6, 7] },
    WORLD_CUP: { id: 'WORLD_CUP', name: 'Coupe du Monde', startMonth: 6, groupMonths: [6], knockoutMonths: [6, 7] }
};

const COUNTRIES = [
    'France', 'Angleterre', 'Espagne', 'Italie', 'Allemagne', 'Portugal', 'Pays-Bas', 'Belgique', 'Croatie', 'Brésil',
    'Argentine', 'Uruguay', 'Colombie', 'Mexique', 'États-Unis', 'Japon', 'Corée du Sud', 'Maroc', 'Sénégal', 'Suisse'
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

function tournamentForYear(year) {
    if (year % 4 === 0) return TOURNAMENTS.EURO;
    if (year % 4 === 2) return TOURNAMENTS.WORLD_CUP;
    return null;
}

function seededRandom(seed) {
    let value = Number(seed) >>> 0;
    return () => {
        value += 0x6D2B79F5;
        let t = value;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function hashSeed(input) {
    let hash = 2166136261;
    for (const char of String(input)) {
        hash ^= char.charCodeAt(0);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function teamStrength(country, player) {
    const base = {
        France: 88, Angleterre: 89, Espagne: 88, Italie: 85, Allemagne: 87,
        Portugal: 83, 'Pays-Bas': 82, Belgique: 81, Croatie: 80, Brésil: 91,
        Argentine: 92, Uruguay: 81, Colombie: 80, Mexique: 77, 'États-Unis': 74,
        Japon: 73, 'Corée du Sud': 72, Maroc: 79, Sénégal: 78, Suisse: 78
    }[country] || 72;
    const nationalityBonus = player?.country === country ? clamp((player.overall || 50) - 50, 0, 20) * 0.25 : 0;
    return base + nationalityBonus;
}

function opponentPool(country) { return COUNTRIES.filter(candidate => candidate !== country); }

function chooseUnique(pool, count, random, player) {
    return [...pool]
        .sort((a, b) => teamStrength(b, player) - teamStrength(a, player) || random() - 0.5)
        .slice(0, count);
}

function makeFixture(tournament, year, country, opponent, phase, round, month, index, random) {
    const home = random() >= 0.5;
    return {
        id: `INT-${year}-${tournament.id}-${phase}-${index + 1}`,
        competitionId: tournament.id,
        competitionName: tournament.name,
        type: 'international', phase, round, month, seasonYear: year,
        nationalTeam: country, opponent,
        venue: home ? 'Domicile' : 'Extérieur',
        homeTeam: home ? country : opponent,
        awayTeam: home ? opponent : country,
        played: false,
        status: 'scheduled',
        importance: round === 'Finale' ? 'major' : phase === 'knockout' ? 'important' : 'normal'
    };
}

function simulateResult(player, fixture) {
    const random = seededRandom(hashSeed(`${fixture.id}|${player?.overall || 50}|${player?.age || 18}`));
    const ownStrength = teamStrength(fixture.nationalTeam, player) + clamp((player?.overall || 50) - 60, -10, 20) * 0.25;
    const opponentStrength = teamStrength(fixture.opponent, player);
    const diff = ownStrength - opponentStrength;
    return {
        ownGoals: Math.min(5, Math.max(0, Math.round(1.25 + diff / 30 + (random() - 0.5) * 2))),
        opponentGoals: Math.min(5, Math.max(0, Math.round(1.1 - diff / 35 + (random() - 0.5) * 2)))
    };
}

function isPlayerEligible(player) { return !!player && Number(player.age) >= 17 && !!(player.country || player.nationality); }

export const InternationalSystem = {
    TOURNAMENTS,

    ensure(state) {
        if (!state) return null;
        state.international ||= { history: [], current: null, caps: 0, goals: 0, assists: 0, selected: false };
        const player = state.player;
        const year = Number(state.calendar?.currentSeasonYear);
        const tournament = tournamentForYear(year);

        if (!isPlayerEligible(player) || !tournament) {
            if (state.international.current?.seasonYear !== year) state.international.current = null;
            return state.international;
        }

        const current = state.international.current;
        if (current?.seasonYear === year && current.competitionId === tournament.id) return state.international;

        const country = player.country || player.nationality;
        const random = seededRandom(hashSeed(`${year}|${tournament.id}|${country}`));
        const opponents = chooseUnique(opponentPool(country), 3, random, player);
        const fixtures = opponents.map((opponent, index) => makeFixture(tournament, year, country, opponent, 'group', 'Phase de groupes', tournament.groupMonths[0], index, random));

        state.international.current = {
            competitionId: tournament.id, competitionName: tournament.name, seasonYear: year, nationalTeam: country,
            selected: Number(player.overall || 0) >= 60 || Number(player.fame || 0) >= 25,
            phase: 'group', group: { played: 0, points: 0, goalsFor: 0, goalsAgainst: 0 }, fixtures,
            history: [], qualified: false, eliminated: false, winner: false
        };
        return state.international;
    },

    getCurrent(state) { this.ensure(state); return state?.international?.current || null; },

    getPlayerFixture(state) {
        const current = this.getCurrent(state);
        if (!current || !current.selected || current.eliminated || current.winner) return null;
        const month = Number(state?.calendar?.currentMonth);
        return current.fixtures.find(fixture => !fixture.played && Number(fixture.month) === month) || null;
    },

    resolvePlayerFixture(state, fixture, performance = {}) {
        const current = this.getCurrent(state);
        if (!current || !fixture || fixture.played || current.eliminated) return null;

        const player = state.player;
        const rating = Number(performance.rating || 6);
        const goals = Math.max(0, Number(performance.goals || 0));
        const assists = Math.max(0, Number(performance.assists || 0));
        const simulated = simulateResult(player, fixture);
        const ownGoals = Math.min(5, Math.max(simulated.ownGoals, Math.min(3, goals)) + (rating >= 7.5 ? 1 : 0));
        const opponentGoals = simulated.opponentGoals;
        const win = ownGoals > opponentGoals;

        fixture.played = true;
        fixture.status = 'played';
        fixture.ownGoals = ownGoals;
        fixture.opponentGoals = opponentGoals;
        fixture.result = win ? 'Victoire' : ownGoals === opponentGoals ? 'Nul' : 'Défaite';

        current.history.push({ fixtureId: fixture.id, competitionId: current.competitionId, round: fixture.round, opponent: fixture.opponent, ownGoals, opponentGoals, rating, goals, assists, result: fixture.result });
        current.group.played += 1;
        current.group.goalsFor += ownGoals;
        current.group.goalsAgainst += opponentGoals;
        current.group.points += win ? 3 : ownGoals === opponentGoals ? 1 : 0;
        state.international.caps += 1;
        state.international.goals += goals;
        state.international.assists += assists;

        if (current.group.played >= 3) {
            current.qualified = current.group.points >= 3 || current.group.goalsFor >= 3;
            if (!current.qualified) {
                current.eliminated = true;
                current.phase = 'eliminated';
            } else {
                current.phase = 'knockout';
                const knockout = ['Huitièmes de finale', 'Quarts de finale', 'Demi-finales', 'Finale'];
                current.fixtures.push(makeFixture(
                    current.competitionId === 'EURO' ? TOURNAMENTS.EURO : TOURNAMENTS.WORLD_CUP,
                    current.seasonYear, current.nationalTeam, opponentPool(current.nationalTeam)[0], 'knockout', knockout[0], 6,
                    current.fixtures.length, seededRandom(hashSeed(`${current.seasonYear}|${current.nationalTeam}|ko`))
                ));
            }
        } else if (current.phase === 'knockout' && win) {
            const order = ['Huitièmes de finale', 'Quarts de finale', 'Demi-finales', 'Finale'];
            const index = order.indexOf(fixture.round);
            if (index >= 0 && index < order.length - 1) {
                current.fixtures.push(makeFixture(
                    current.competitionId === 'EURO' ? TOURNAMENTS.EURO : TOURNAMENTS.WORLD_CUP,
                    current.seasonYear, current.nationalTeam,
                    opponentPool(current.nationalTeam)[index + 1] || opponentPool(current.nationalTeam)[0],
                    'knockout', order[index + 1], index >= 1 ? 7 : 6, current.fixtures.length,
                    seededRandom(hashSeed(`${fixture.id}|next`))
                ));
            } else if (fixture.round === 'Finale') {
                current.winner = true;
                current.phase = 'winner';
            }
        } else if (current.phase === 'knockout' && !win) {
            current.eliminated = true;
            current.phase = 'eliminated';
        }

        return fixture;
    },

    finalizeSeason(state) {
        const current = state?.international?.current;
        if (!current) return null;
        state.international.history ||= [];
        state.international.history.push({
            competitionId: current.competitionId,
            competitionName: current.competitionName,
            seasonYear: current.seasonYear,
            nationalTeam: current.nationalTeam,
            selected: current.selected,
            phase: current.phase,
            winner: current.winner,
            caps: current.history?.length || 0,
            goals: (current.history || []).reduce((sum, item) => sum + Number(item.goals || 0), 0),
            assists: (current.history || []).reduce((sum, item) => sum + Number(item.assists || 0), 0),
            matches: current.history || []
        });
        state.international.current = null;
        return state.international.history.at(-1);
    },

    getSummary(state) {
        const current = this.getCurrent(state);
        if (!current) return null;
        return {
            competition: current.competitionName,
            nationalTeam: current.nationalTeam,
            selected: current.selected,
            phase: current.phase,
            points: current.group?.points || 0,
            played: current.group?.played || 0,
            qualified: current.qualified,
            eliminated: current.eliminated,
            winner: current.winner,
            caps: state.international?.caps || 0,
            goals: state.international?.goals || 0,
            assists: state.international?.assists || 0
        };
    }
};

export default InternationalSystem;
