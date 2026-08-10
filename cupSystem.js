// cupSystem.js
// ============================================================
// STREET TO PRO — PHASE 2D
// Coupes nationales
// ============================================================
//
// Principe :
// - une coupe nationale par pays
// - élimination directe
// - tirage aléatoire
// - les clubs des deux premières divisions participent
// - les tours sont générés progressivement
// - prolongation / tirs au but
// - finale = match majeur
// - le système ne modifie pas le championnat
//
// ============================================================

import { WorldSystem } from './worldSystem.js';

const clamp = (value, min, max) =>
    Math.min(max, Math.max(min, Number(value) || 0));

const COUNTRIES = {
    France: {
        id: 'COUPE_FR',
        name: 'Coupe de France',
        shortName: 'CDF',
        leagueIds: ['FR_L1', 'FR_L2']
    },

    Angleterre: {
        id: 'COUPE_EN',
        name: 'FA Cup',
        shortName: 'FA Cup',
        leagueIds: ['EN_PL', 'EN_CH']
    },

    Espagne: {
        id: 'COUPE_ES',
        name: 'Copa del Rey',
        shortName: 'Copa',
        leagueIds: ['ES_LA', 'ES_SD']
    },

    Italie: {
        id: 'COUPE_IT',
        name: 'Coppa Italia',
        shortName: 'Coppa',
        leagueIds: ['IT_A', 'IT_B']
    },

    Allemagne: {
        id: 'COUPE_DE',
        name: 'DFB-Pokal',
        shortName: 'Pokal',
        leagueIds: ['DE_B1', 'DE_B2']
    }
};

const ROUND_NAMES = {
    64: '64es de finale',
    32: '32es de finale',
    16: '16es de finale',
    8: 'Quarts de finale',
    4: 'Demi-finales',
    2: 'Finale'
};

function shuffle(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] =
            [result[j], result[i]];
    }

    return result;
}

function getStrength(club) {
    if (!club) return 50;

    return (
        Number(club.strength || 50) +
        Number(club.prestige || 0) * 0.35
    );
}

function simulateGoals(home, away) {
    const homeStrength = getStrength(home);
    const awayStrength = getStrength(away);

    const homeAdvantage = 3;

    const homeScore =
        clamp(
            Math.floor(
                Math.random() *
                (1.3 + Math.max(0, homeStrength + homeAdvantage - awayStrength) / 35)
            ),
            0,
            5
        );

    const awayScore =
        clamp(
            Math.floor(
                Math.random() *
                (1.2 + Math.max(0, awayStrength - homeStrength) / 35)
            ),
            0,
            5
        );

    return {
        homeGoals: homeScore,
        awayGoals: awayScore
    };
}

function resolveKnockoutMatch(home, away) {
    let { homeGoals, awayGoals } =
        simulateGoals(home, away);

    let wentToExtraTime = false;
    let wentToPenalties = false;

    if (homeGoals === awayGoals) {
        wentToExtraTime = true;

        const extraHome =
            Math.random() < 0.50 ? 1 : 0;

        const extraAway =
            Math.random() < 0.45 ? 1 : 0;

        homeGoals += extraHome;
        awayGoals += extraAway;
    }

    let winner;

    if (homeGoals > awayGoals) {
        winner = home;
    } else if (awayGoals > homeGoals) {
        winner = away;
    } else {
        wentToPenalties = true;

        const homePenaltyChance =
            clamp(
                0.50 +
                (getStrength(home) - getStrength(away)) / 250,
                0.35,
                0.65
            );

        winner =
            Math.random() < homePenaltyChance
                ? home
                : away;
    }

    return {
        homeClubId: home.id,
        awayClubId: away.id,

        homeGoals,
        awayGoals,

        winnerClubId: winner.id,

        wentToExtraTime,
        wentToPenalties
    };
}

function createMatch(home, away, round, final = false) {
    return {
        id:
            `cup-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 9)}`,

        type: final
            ? 'final'
            : 'cup',

        competitionType: 'national_cup',

        round,

        homeClubId: home.id,
        awayClubId: away.id,

        homeClub: home.name,
        awayClub: away.name,

        importance:
            final
                ? 'majeur'
                : round === 'Demi-finales'
                    ? 'important'
                    : 'normal',

        playable: true
    };
}

function createInitialCupClubs(country) {
    const competition = COUNTRIES[country];

    if (!competition) return [];

    return competition.leagueIds
        .flatMap(leagueId =>
            WorldSystem.getClubs(leagueId)
        );
}

function resetCup(cup, clubs) {
    cup.status = 'active';

    cup.currentRound = null;

    cup.qualifiedClubIds = clubs.map(
        club => club.id
    );

    cup.eliminatedClubIds = [];

    cup.matches = [];

    cup.history = [];

    cup.finalistIds = [];

    cup.winnerId = null;

    cup.champion = null;
}

function buildRound(cup, clubIds) {
    const clubs = clubIds
        .map(id => WorldSystem.getClub(id))
        .filter(Boolean);

    if (clubs.length < 2) {
        return [];
    }

    const shuffled = shuffle(clubs);

    const roundName =
        ROUND_NAMES[shuffled.length] ||
        `${shuffled.length} clubs`;

    const matches = [];

    for (
        let i = 0;
        i < shuffled.length;
        i += 2
    ) {
        const home = shuffled[i];
        const away = shuffled[i + 1];

        if (!away) continue;

        matches.push(
            createMatch(
                home,
                away,
                roundName,
                shuffled.length === 2
            )
        );
    }

    cup.currentRound = roundName;

    return matches;
}

function playRound(cup) {
    const matches = cup.matches.filter(
        match => !match.played
    );

    const winners = [];

    for (const match of matches) {
        const home =
            WorldSystem.getClub(
                match.homeClubId
            );

        const away =
            WorldSystem.getClub(
                match.awayClubId
            );

        if (!home || !away) continue;

        const result =
            resolveKnockoutMatch(
                home,
                away
            );

        match.played = true;

        match.result = result;

        match.winnerClubId =
            result.winnerClubId;

        match.homeGoals =
            result.homeGoals;

        match.awayGoals =
            result.awayGoals;

        match.wentToExtraTime =
            result.wentToExtraTime;

        match.wentToPenalties =
            result.wentToPenalties;

        winners.push(
            result.winnerClubId
        );

        const loserId =
            result.winnerClubId === home.id
                ? away.id
                : home.id;

        cup.eliminatedClubIds.push(
            loserId
        );
    }

    cup.history.push(
        ...matches
    );

    cup.matches = [];

    return winners;
}

export const CupSystem = {

    COUNTRIES,

    /**
     * Initialise les cinq coupes nationales.
     */
    ensure(state) {
        state.cups ||= {};

        for (const country of Object.keys(COUNTRIES)) {
            const definition =
                COUNTRIES[country];

            if (!state.cups[definition.id]) {
                const clubs =
                    createInitialCupClubs(
                        country
                    );

                const cup = {
                    id: definition.id,
                    name: definition.name,
                    shortName: definition.shortName,
                    country,

                    seasonYear:
                        Number(
                            state.calendar?.currentSeasonYear
                        ) || 2026,

                    status: 'active',

                    currentRound: null,

                    qualifiedClubIds:
                        clubs.map(
                            club => club.id
                        ),

                    eliminatedClubIds: [],

                    finalistIds: [],

                    winnerId: null,

                    champion: null,

                    matches: [],

                    history: []
                };

                state.cups[
                    definition.id
                ] = cup;
            }
        }

        return state.cups;
    },

    /**
     * Retourne la coupe d'un pays.
     */
    getCup(state, country) {
        this.ensure(state);

        const definition =
            COUNTRIES[country];

        if (!definition) return null;

        return state.cups[
            definition.id
        ] || null;
    },

    /**
     * Prépare un nouveau tour.
     */
    prepareRound(state, country) {
        const cup =
            this.getCup(
                state,
                country
            );

        if (!cup) return [];

        if (
            cup.status === 'finished' ||
            cup.winnerId
        ) {
            return [];
        }

        const activeIds =
            cup.qualifiedClubIds
                .filter(
                    id =>
                        !cup.eliminatedClubIds
                            .includes(id)
                );

        const matches =
            buildRound(
                cup,
                activeIds
            );

        cup.matches = matches;

        return matches;
    },

    /**
     * Simule le tour courant.
     */
    simulateRound(state, country) {
        const cup =
            this.getCup(
                state,
                country
            );

        if (!cup) return null;

        if (!cup.matches.length) {
            this.prepareRound(
                state,
                country
            );
        }

        const winners =
            playRound(cup);

        if (winners.length === 1) {
            const champion =
                WorldSystem.getClub(
                    winners[0]
                );

            cup.winnerId =
                winners[0];

            cup.champion =
                champion?.name || null;

            cup.status =
                'finished';

            cup.finalistIds =
                cup.finalistIds.length
                    ? cup.finalistIds
                    : winners;

            return {
                finished: true,
                winnerId: cup.winnerId,
                champion: cup.champion
            };
        }

        cup.qualifiedClubIds =
            winners;

        if (winners.length === 2) {
            cup.finalistIds =
                [...winners];
        }

        return {
            finished: false,
            currentRound:
                cup.currentRound,
            winners
        };
    },

    /**
     * Vérifie si le joueur est encore dans la coupe.
     */
    playerStillInCup(state, country) {
        const player =
            state.player;

        if (!player) return false;

        const club =
            WorldSystem.getClub(
                player.clubId ||
                player.club
            );

        if (!club) return false;

        const cup =
            this.getCup(
                state,
                country
            );

        if (!cup) return false;

        if (cup.status === 'finished') {
            return cup.winnerId === club.id;
        }

        return cup.qualifiedClubIds
            .includes(club.id);
    },

    /**
     * Trouve la prochaine rencontre du joueur.
     */
    getPlayerMatch(state, country) {
        const player =
            state.player;

        const club =
            WorldSystem.getClub(
                player?.clubId ||
                player?.club
            );

        if (!club) return null;

        const cup =
            this.getCup(
                state,
                country
            );

        if (!cup) return null;

        const match =
            cup.matches.find(
                item =>
                    !item.played &&
                    (
                        item.homeClubId === club.id ||
                        item.awayClubId === club.id
                    )
            );

        return match || null;
    },

    /**
     * Retourne un résumé propre pour l'UI.
     */
    getSummary(state, country) {
        const cup =
            this.getCup(
                state,
                country
            );

        if (!cup) return null;

        return {
            id: cup.id,
            name: cup.name,
            country: cup.country,
            round: cup.currentRound,
            status: cup.status,
            champion: cup.champion,
            playerStillIn:
                this.playerStillInCup(
                    state,
                    country
                )
        };
    },

    /**
     * Fin de saison : les coupes sont archivées.
     */
    finalizeSeason(state) {
        this.ensure(state);

        state.cupHistory ||= [];

        for (const cup of Object.values(
            state.cups
        )) {
            state.cupHistory.push({
                id: cup.id,
                name: cup.name,
                country: cup.country,
                seasonYear: cup.seasonYear,
                champion: cup.champion,
                winnerId: cup.winnerId
            });
        }

        state.cups = {};

        return state.cupHistory;
    }
};

export default CupSystem;
