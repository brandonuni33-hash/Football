// domain/career/seasonSystem.js
// Gestion de la clôture d'une saison.
import { EventBus } from '../../core/eventBus.js';
import { EVENTS } from '../../core/events.js';

function normalizePrestige(value) {
    const number = Number(value) || 0;
    return number > 5 ? number / 20 : number;
}

function chooseFirstProDestination(worldSystem, player) {
    const existing = worldSystem?.getClub?.(player?.clubId || player?.club);
    if (existing) return existing;
    const country = player?.clubCountry || player?.youthClubData?.country || player?.country || 'France';
    const targetPrestige = normalizePrestige(player?.youthClubData?.prestige || player?.clubPrestige || 40);
    const candidates = (worldSystem?.CLUB_DATABASE || []).filter(club => club?.country === country && Number(club?.tier) <= 2);
    if (!candidates.length) return null;
    return [...candidates].sort((a, b) => {
        const prestigeGap = Math.abs(Number(a.prestige || 2.5) - targetPrestige) - Math.abs(Number(b.prestige || 2.5) - targetPrestige);
        if (prestigeGap) return prestigeGap;
        const levelGap = Math.abs(Number(a.strength || 65) - Number(player?.overall || 50)) - Math.abs(Number(b.strength || 65) - Number(player?.overall || 50));
        return levelGap || Number(b.centerStars || 0) - Number(a.centerStars || 0);
    })[0] || null;
}

function firstProRole(player, club) {
    const gap = Number(player?.overall || 50) - Number(club?.strength || 68);
    if (gap >= 1) return 'Joueur important';
    if (gap >= -4) return 'Titulaire';
    if (gap >= -9) return 'Rotation';
    return 'Remplaçant';
}

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
        const potentialReport = this.potentialSystem?.finalizeSeason?.(player, season);
        this.potentialSystem?.advanceAge?.(player);
        this.careerSystem?.refreshStage?.(player);
        if (Number(player.age) >= 18 && player.isYouthPlayer) {
            player.isYouthPlayer = false;
            const destination = chooseFirstProDestination(this.worldSystem, player);
            if (destination) player.clubId = destination.id;
            const proClub = this.worldSystem?.normalizeCareerClub?.(player) || destination;
            player.contract ||= {};
            player.contract.role = firstProRole(player, proClub);
            player.squadStatus = player.contract.role;
            player.firstProSeason = Number(currentYear) + 1;
        }
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
        player.stats.starts = 0;
        player.stats.subAppearances = 0;
        player.stats.minutesPlayed = 0;
        player.stats.goals = 0;
        player.stats.assists = 0;
        player.stats.successfulPasses = 0;
        player.stats.tackles = 0;
        player.stats.interceptions = 0;
        player.stats.yellowCards = 0;
        player.stats.cleanSheets = 0;
        player.stats.averageRating = 0;
        player.fitness = Math.min(100, (player.fitness || 60) + 20);
        player.isInjured = false;
        player.injuryDuration = 0;
    }
}

export default SeasonSystem;
