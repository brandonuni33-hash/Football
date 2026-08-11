// domain/career/seasonSystem.js
// Gestion de la clôture d'une saison.
import { EventBus } from '../../core/eventBus.js';
import { EVENTS } from '../../core/events.js';

export class SeasonSystem {
    constructor({ playerLogic, potentialSystem, careerSystem, cupSystem, worldSystem, awardsSystem } = {}) {
        this.playerLogic = playerLogic;
        this.potentialSystem = potentialSystem;
        this.careerSystem = careerSystem;
        this.cupSystem = cupSystem;
        this.worldSystem = worldSystem;
        this.awardsSystem = awardsSystem;
    }

    finalize(state) {
        const player = state?.player;
        const calendar = state?.calendar;
        if (!player || !calendar) return null;
        const currentYear = calendar.currentSeasonYear;
        const seasonLabel = `${currentYear}/${currentYear + 1}`;
        EventBus.emit(EVENTS.SEASON_COMPLETED, { state, season: seasonLabel, playerId: player.id });
        state.career ||= {};
        state.career.seasonHistory ||= [];
        const season = {
            seasonLabel,
            club: player.club,
            overall: player.overall,
            age: player.age,
            clubPrestige: Number(player.clubPrestige || player.youthClubData?.prestige || 40),
            matches: player.stats?.matchesPlayed || 0,
            goals: player.stats?.goals || 0,
            assists: player.stats?.assists || 0,
            averageRating: player.stats?.averageRating || 0
        };
        state.career.seasonHistory.push(season);
        const potentialReport = this.potentialSystem?.finalizeSeason?.(player, season);
        this.potentialSystem?.advanceAge?.(player);
        if (Number(player.age) >= 18 && player.isYouthPlayer) {
            player.isYouthPlayer = false;
            this.worldSystem?.normalizeCareerClub?.(player);
        }
        this.careerSystem?.refreshStage?.(player);
        this.playerLogic?.ensure?.(player);
        player.canRetire = player.age >= 34;
        player.careerEnded = player.age >= 42;
        state.career.lastPotentialReport = potentialReport;
        state.career.lastCupHistory = this.cupSystem?.finalizeSeason?.(state);
        const awardsReport = this.awardsSystem?.finalizeSeason?.(state, season, state.career.lastCupHistory || []);
        state.career.lastAwardsReport = awardsReport;
        this.resetSeasonStats(player);
        if (state.social?.coachData && player.club !== state.social.youthClubName) state.social.coachData.hasLeftClub = true;
        EventBus.emit(EVENTS.SEASON_STARTED, { state, season: `${currentYear + 1}/${currentYear + 2}`, playerId: player.id });
        return { seasonLabel, potentialReport, cupHistory: state.career.lastCupHistory, awardsReport };
    }

    resetSeasonStats(player) {
        player.stats ||= {};
        player.stats.matchesPlayed = 0;
        player.stats.goals = 0;
        player.stats.assists = 0;
        player.stats.successfulPasses = 0;
        player.stats.tackles = 0;
        player.stats.yellowCards = 0;
        player.stats.averageRating = 0;
        player.fitness = Math.min(100, (player.fitness || 60) + 20);
        player.isInjured = false;
        player.injuryDuration = 0;
    }
}

export default SeasonSystem;
