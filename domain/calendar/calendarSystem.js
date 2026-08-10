// domain/calendar/calendarSystem.js
// Orchestration métier du calendrier. Aucun accès à l'UI ni à localStorage.
// Les dépendances historiques sont injectées afin de permettre une migration
// progressive sans dupliquer les règles du calendrier.

export class CalendarSystem {
    constructor({ worldSystem, competitionSystem, cupSystem, seasonReset = null } = {}) {
        this.worldSystem = worldSystem;
        this.competitionSystem = competitionSystem;
        this.cupSystem = cupSystem;
        this.seasonReset = seasonReset;
    }

    advance(state) {
        if (!state?.calendar) return null;

        const calendar = state.calendar;

        if (!this.worldSystem?.isOffSeason?.(calendar.currentMonth)) {
            this.worldSystem?.simulateAllLeaguesMonth?.(
                state,
                Number(calendar.currentSeasonYear) * 100 + Number(calendar.currentMonth)
            );
        }

        calendar.currentMonth += 1;
        if (calendar.currentMonth > 12) calendar.currentMonth = 1;

        let seasonChanged = false;

        if (calendar.currentMonth === 8) {
            const divisionMovements = this.worldSystem?.finalizeSeason?.(state);
            if (state.career) state.career.lastDivisionMovements = divisionMovements;

            this.seasonReset?.(state);

            calendar.currentSeasonYear += 1;
            calendar.seasonSchedule = null;
            calendar.seasonMatchCursor = 0;

            this.worldSystem?.resetSeasonTables?.(
                state,
                calendar.currentSeasonYear
            );

            seasonChanged = true;
        }

        calendar.currentPeriod = this.competitionSystem?.getPeriodName?.(
            calendar.currentMonth
        ) || calendar.currentPeriod;

        this.competitionSystem?.ensureSeasonSchedule?.(state);

        return {
            month: calendar.currentMonth,
            year: calendar.currentSeasonYear,
            period: calendar.currentPeriod,
            seasonChanged
        };
    }

    getPeriodName(month) {
        return this.competitionSystem?.getPeriodName?.(month) || '';
    }
}

export default CalendarSystem;
