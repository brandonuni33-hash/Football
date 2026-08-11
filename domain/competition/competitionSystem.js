// domain/competition/competitionSystem.js
// Orchestration des calendriers et des blocs de compétition.

import { CupSystem } from '../../cupSystem.js';
import {
    COMPETITIONS,
    ALL_MONTHS,
    MONTH_INFO,
    seasonLabel
} from './competitionCatalog.js';
import {
    createSeasonSchedule,
    sortMatches
} from './seasonScheduleBuilder.js';

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
        const generated = createSeasonSchedule(player, seasonYear, this.getSeniorCompetition.bind(this));
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
        if (existing && Number(existing.seasonYear) === year && Array.isArray(existing.matches)) return existing;
        CupSystem.ensure(state);
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
        const scheduledMatches = [...(monthData?.matches || []), ...CupSystem.getPlayerFixtures(state)];
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
