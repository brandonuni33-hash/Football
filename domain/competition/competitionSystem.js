// domain/competition/competitionSystem.js
// Point d'entrée canonique du système de compétitions.

import { CupSystem } from '../../cupSystem.js';
import { COMPETITIONS, ALL_MONTHS, MONTH_INFO, seasonLabel } from './competitionCatalog.js';
import { createSeasonSchedule as buildSeasonSchedule, sortMatches } from './seasonScheduleBuilder.js';
import {
    getEuropeanQualification,
    buildEuropeanLeague,
    createEuropeanTournament,
    prepareKnockoutRoute,
    advanceEuropeanRound
} from './europeanCompetitionSystem.js';

const CompetitionSystem = {
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

    getEuropeanQualification,

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
        const generated = buildSeasonSchedule(
            player,
            seasonYear,
            this.getSeniorCompetition.bind(this),
            buildEuropeanLeague,
            getEuropeanQualification
        );
        return this.finalizeSchedule(player, seasonYear, generated.matches, generated.category, generated.seed);
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
        ordered.forEach(match => byMonth[match.month].matches.push(match));
        return {
            version: 4,
            seasonYear,
            seasonLabel: seasonLabel(seasonYear),
            generatedForAge: Number(player?.age) || 14,
            category,
            seed,
            matches: ordered,
            byMonth,
            totals: {
                allMatches: ordered.length,
                leagueMatches: ordered.filter(match => match.type === 'league').length,
                cupMatches: ordered.filter(match => match.competitionId === 'NATIONAL_CUP').length,
                europeanMatches: ordered.filter(match => ['CHAMPIONS_LEAGUE', 'EUROPA_LEAGUE'].includes(match.competitionId)).length
            }
        };
    },

    ensureSeasonSchedule(state) {
        if (!state?.player || !state?.calendar) return null;
        const year = Number(state.calendar.currentSeasonYear) || new Date().getFullYear();
        const existing = state.calendar.seasonSchedule;
        if (existing && Number(existing.seasonYear) === year && Array.isArray(existing.matches) && Number(existing.version || 0) >= 4) return existing;
        CupSystem.ensure(state);
        const schedule = this.createSeasonSchedule(state.player, year);
        state.calendar.seasonSchedule = schedule;
        state.calendar.seasonMatchCursor = 0;
        const competition = this.getSeniorCompetition(state.player);
        const qualification = getEuropeanQualification(state.player, competition);
        state.europeanTournament = Number(state.player.age) >= 18
            ? createEuropeanTournament(state.player, year, qualification, schedule.seed)
            : null;
        return schedule;
    },

    getEuropeanStatus(state) {
        const tournament = state?.europeanTournament;
        if (!tournament) return null;
        return {
            competition: tournament.competition,
            slot: tournament.slot,
            phase: tournament.phase,
            rank: tournament.rank,
            points: tournament.leaguePoints,
            played: tournament.leagueMatchesPlayed,
            qualified: tournament.qualified,
            eliminated: tournament.eliminated,
            currentRound: tournament.currentRound,
            standings: tournament.standings || [],
            history: tournament.history || []
        };
    },

    getEuropeanFixture(state) {
        const tournament = state?.europeanTournament;
        if (!tournament || tournament.eliminated) return null;
        const month = Number(state?.calendar?.currentMonth);
        if (tournament.phase === 'league_phase' && Number(tournament.leagueMatchesPlayed) >= 8) return prepareKnockoutRoute(state);
        return tournament.fixtures?.find(fixture => Number(fixture.month) === month && !fixture.played) || null;
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
                activities: month === 7 ? ['repos', 'mercato', 'programme_individuel', 'preparation_saison'] : ['bilan', 'selection_internationale', 'repos', 'recovery'],
                importance: 'none',
                mode: 'career_activity'
            };
        }
        const base = [...(monthData?.matches || []), ...CupSystem.getPlayerFixtures(state)];
        const europeanFixture = this.getEuropeanFixture(state);
        if (europeanFixture && !base.some(match => match.id === europeanFixture.id)) base.push(europeanFixture);
        const hasMajor = base.some(match => match.importance === 'major');
        const hasImportant = base.some(match => match.importance === 'important');
        return {
            type: player.age < 18 ? 'youth' : 'senior',
            category: schedule?.category || (player.age < 18 ? this.getYouthCategory(player.age) : 'Senior'),
            month,
            monthLabel: this.getMonthLabel(month),
            season: seasonYear,
            seasonLabel: seasonLabel(seasonYear),
            matches: base.length,
            scheduledMatches: base,
            competition: base[0]?.competitionName || null,
            activities: base.length ? [player.age < 18 ? 'match_jeunes' : 'match', 'entrainement'] : ['entrainement', 'evenement'],
            importance: hasMajor ? 'major' : hasImportant ? 'important' : base.length >= 4 ? 'normal' : 'low',
            mode: hasMajor ? 'major' : hasImportant ? 'mixed' : base.length ? 'simulation' : 'career_activity'
        };
    },

    recordEuropeanResults(state, scheduledMatches, matchResults) {
        const tournament = state?.europeanTournament;
        if (!tournament || tournament.eliminated || !Array.isArray(scheduledMatches)) return null;
        const european = scheduledMatches.filter(match => match?.competitionType === 'continental' && match?.phase);
        if (!european.length) return tournament;
        for (const match of european) {
            if (match.played) continue;
            const result = matchResults?.find(item => item.matchIndex === scheduledMatches.indexOf(match)) || {};
            const rating = Number(result.rating) || 6;
            const goals = Number(result.goals) || 0;
            const performancePoints = rating >= 7.5 ? 3 : rating >= 6 ? 1 : 0;
            if (match.phase === 'league_phase') {
                tournament.leagueMatchesPlayed += 1;
                tournament.leaguePoints += performancePoints;
                tournament.leagueGoalsFor += goals;
                tournament.leagueGoalsAgainst += rating < 5.5 ? 2 : 1;
                const opponentRow = tournament.standings.find(row => row.clubId === match.opponentClubId);
                if (opponentRow) {
                    opponentRow.played += 1;
                    opponentRow.points += Math.max(0, 3 - performancePoints);
                    opponentRow.goalsAgainst += goals;
                    opponentRow.goalsFor += rating < 6 ? 2 : 1;
                }
                const ownRow = tournament.standings.find(row => row.clubId === match.playerClubId);
                if (ownRow) {
                    ownRow.played += 1;
                    ownRow.points = tournament.leaguePoints;
                    ownRow.goalsFor = tournament.leagueGoalsFor;
                    ownRow.goalsAgainst = tournament.leagueGoalsAgainst;
                }
                match.played = true;
                match.status = 'played';
            } else if (match.phase === 'knockout') {
                match.played = true;
                match.status = 'played';
                const won = rating >= 6.3 || goals > 0;
                if (won) advanceEuropeanRound(state, match);
                else {
                    tournament.eliminated = true;
                    tournament.phase = 'eliminated';
                    tournament.history.push({ round: match.round, result: 'Éliminé', seasonYear: tournament.seasonYear });
                }
            }
        }
        tournament.standings.sort((a, b) => b.points - a.points || b.strength - a.strength || b.goalsFor - a.goalsFor);
        tournament.standings.forEach((row, index) => { row.rank = index + 1; });
        if (tournament.leagueMatchesPlayed >= 8 && !tournament.rank) {
            tournament.rank = tournament.standings.find(row => row.clubId === state.player.clubId)?.rank || 18;
            tournament.qualified = tournament.rank <= 24;
        }
        return tournament;
    },

    advanceEuropeanRound,

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

export { COMPETITIONS };
export default CompetitionSystem;
