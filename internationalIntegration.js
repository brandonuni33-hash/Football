// internationalIntegration.js
// Branche Euro / Coupe du Monde au moteur existant sans modifier gameEngine.js.

import { InternationalSystem } from './internationalSystem.js';
import { CompetitionSystem } from './competitionSystem.js';
import { GameEngine } from './gameEngine.js';

const originalEnsure = InternationalSystem.ensure.bind(InternationalSystem);
const originalMigrate = GameEngine.prototype.migrateLoadedState;
const originalStartCareer = GameEngine.prototype.startCareer;
const originalPlayBlock = GameEngine.prototype.playBlock;
const originalAdvanceCalendar = GameEngine.prototype.advanceCalendar;

InternationalSystem.ensure = function (state) {
    if (!state?.calendar) return originalEnsure(state);
    const month = Number(state.calendar.currentMonth);
    const isInternationalWindow = month === 6 || month === 7;
    if (!isInternationalWindow) return state.international || originalEnsure(state);

    const originalYear = state.calendar.currentSeasonYear;
    state.calendar.currentSeasonYear = Number(originalYear) + 1;
    try {
        return originalEnsure(state);
    } finally {
        state.calendar.currentSeasonYear = originalYear;
    }
};

GameEngine.prototype.migrateLoadedState = function (...args) {
    const result = originalMigrate.apply(this, args);
    InternationalSystem.ensure(this.state);
    return result;
};

GameEngine.prototype.startCareer = function (...args) {
    const result = originalStartCareer.apply(this, args);
    InternationalSystem.ensure(this.state);
    return result;
};

GameEngine.prototype.advanceCalendar = function (...args) {
    const state = this.state;
    if (Number(state?.calendar?.currentMonth) === 7) {
        InternationalSystem.finalizeSeason(state);
    }

    const result = originalAdvanceCalendar.apply(this, args);
    InternationalSystem.ensure(this.state);
    return result;
};

GameEngine.prototype.playBlock = function (selectedChoice = null) {
    const state = this.state;
    const current = InternationalSystem.ensure(state)?.current;
    const fixture = current ? InternationalSystem.getPlayerFixture(state) : null;
    const playedMonth = Number(state?.calendar?.currentMonth);

    const result = originalPlayBlock.call(this, selectedChoice);

    if (fixture && Number(fixture.month) === playedMonth && current?.selected) {
        const summary = result?.report?.summary || {};
        InternationalSystem.resolvePlayerFixture(state, fixture, {
            rating: summary.rating || 6,
            goals: summary.goals || 0,
            assists: summary.assists || 0
        });

        // Le dernier match de groupes est joué en juin ; les huitièmes
        // commencent en juillet afin de ne jamais être sautés par l'avance
        // automatique du calendrier.
        const nextFixture = current.fixtures?.find(item => !item.played && item.phase === 'knockout');
        if (nextFixture && Number(nextFixture.month) === 6) nextFixture.month = 7;
    }

    InternationalSystem.ensure(state);
    return result;
};

const originalGetBlockPlan = CompetitionSystem.getBlockPlan.bind(CompetitionSystem);
CompetitionSystem.getBlockPlan = function (state) {
    const plan = originalGetBlockPlan(state);
    const fixture = InternationalSystem.getPlayerFixture(state);
    if (!fixture) return plan;

    const scheduledMatches = [...(plan?.scheduledMatches || [])];
    if (!scheduledMatches.some(match => match.id === fixture.id)) scheduledMatches.push(fixture);

    return {
        ...plan,
        type: 'international',
        matches: scheduledMatches.length,
        scheduledMatches,
        competition: fixture.competitionName,
        activities: ['selection_nationale', 'match_international'],
        importance: fixture.importance,
        mode: 'international'
    };
};

export { InternationalSystem };
