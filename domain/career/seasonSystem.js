// domain/career/seasonSystem.js
// Gestion de la clôture d'une saison.
// Les dépendances métier sont injectées : aucune dépendance vers l'UI ou la persistance.

import { EventBus } from '../../core/eventBus.js';
import { EVENTS } from '../../core/events.js';

export class SeasonSystem {
    constructor({ playerLogic, potentialSystem, careerSystem, cupSystem, worldSystem } = {}) {
        this.playerLogic = playerLogic;
        this.potentialSystem = potentialSystem;
        this.careerSystem = careerSystem;
        this.cupSystem = cupSystem;
        this.worldSystem = worldSystem;
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
        state.career.seasonHistory.push({
            seasonLabel,
            club: player.club,
            overall: player.overall,
            age: player.age,
            matches: player.stats?.matchesPlayed || 0,
            goals: player.stats?.goals || 0,
            assists: player.stats?.assists || 0,
            averageRating: player.stats?.averageRating || 0
        });

        const potentialReport = this.potentialSystem?.finalizeSeason?.(player, {
            seasonLabel,
            overall: player.overall,
            matches: player.stats?.matchesPlayed || 0,
            goals: player.stats?.goals || 0,
            assists: player.stats?.assists || 0,
            averageRating: player.stats?.averageRating || 0
        });

        // La progression canonique appartient désormais au playerSystem.
        // Ici on ne fait qu'appliquer une éventuelle progression de fin de saison.
        this.playerLogic?.applyProgression?.(player, {
            rating: player.stats?.averageRating || 0,
            goals: player.stats?.goals || 0,
            assists: player.stats?.assists || 0,
            type: 'finSaison',
            ageTick: false
        });

        this.potentialSystem?.advanceAge?.(player);

        if (Number(player.age) >= 18 && player.isYouthPlayer) {
            player.isYouthPlayer = false;
            this.worldSystem?.normalizeCareerClub?.(player);
        }

        this.careerSystem?.refreshStage?.(player);
        player.canRetire = player.age >= 34;
        player.careerEnded = player.age >= 42;

        state.career.lastPotentialReport = potentialReport;
        state.career.lastCupHistory = this.cupSystem?.finalizeSeason?.(state);
        this.resetSeasonStats(player);

        if (state.social?.coachData && player.club !== state.social.youthClubName) {
            state.social.coachData.hasLeftClub = true;
        }

        EventBus.emit(EVENTS.SEASON_STARTED, {
            state,
            season: `${currentYear + 1}/${currentYear + 2}`,
            playerId: player.id
        });

        return {
            seasonLabel,
            potentialReport,
            cupHistory: state.career.lastCupHistory
        };
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
