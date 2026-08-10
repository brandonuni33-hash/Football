// awardsIntegration.js
// Branche le système de récompenses et transforme les performances collectives
// (championnat + coupe nationale) en palmarès permanent.
import { GameEngine } from './gameEngine.js';
import { AwardsSystem } from './awardsSystem.js';
import { StateManager } from './state.js';

const originalStartCareer = GameEngine.prototype.startCareer;
const originalArchiveAndResetSeason = GameEngine.prototype.archiveAndResetSeason;

function ensureClubPalmares(state) {
    state.career ||= {};
    state.career.palmares ||= {};
    const p = state.career.palmares;
    p.leagueTitles ||= 0;
    p.nationalCups ||= 0;
    p.europeanTitles ||= 0;
    p.internationalTitles ||= 0;
    p.individualAwards ||= 0;
    state.career.clubAchievements ||= [];
}

function captureLeagueAchievement(state, seasonLabel) {
    const player = state?.player;
    const playerClubId = player?.clubId;
    if (!player || !playerClubId || !state?.world?.leagues) return null;

    // Lecture AVANT la remise à zéro des tableaux de la nouvelle saison.
    for (const league of Object.values(state.world.leagues)) {
        const table = Array.isArray(league?.table) ? league.table : [];
        const ranked = [...table]
            .sort((a, b) => Number(b.points || 0) - Number(a.points || 0)
                || Number(b.goalDifference || 0) - Number(a.goalDifference || 0)
                || Number(b.goalsFor || 0) - Number(a.goalsFor || 0))
            .map((row, index) => ({ ...row, rank: index + 1 }));
        const playerRow = ranked.find(row => row.clubId === playerClubId);
        if (!playerRow) continue;

        return {
            type: playerRow.rank === 1 ? 'league_title' : 'league_rank',
            season: seasonLabel,
            leagueId: league.id,
            leagueName: league.name,
            club: player.club,
            clubId: playerClubId,
            rank: playerRow.rank,
            points: Number(playerRow.points || 0)
        };
    }
    return null;
}

function captureCupAchievements(state, seasonLabel, cupHistory) {
    const player = state?.player;
    const playerClubId = player?.clubId;
    if (!player || !playerClubId) return [];

    return (cupHistory || [])
        .filter(cup => cup?.seasonYear === state.calendar?.currentSeasonYear)
        .filter(cup => cup?.winnerId === playerClubId || cup?.champion === player.club)
        .map(cup => ({
            type: 'national_cup',
            season: seasonLabel,
            cupId: cup.id,
            cupName: cup.name,
            club: player.club,
            clubId: playerClubId
        }));
}

GameEngine.prototype.startCareer = function (...args) {
    const result = originalStartCareer.apply(this, args);
    AwardsSystem.ensure(this.state);
    ensureClubPalmares(this.state);
    StateManager.save(this.state);
    return result;
};

GameEngine.prototype.archiveAndResetSeason = function (...args) {
    if (!this.state?.player) return originalArchiveAndResetSeason.apply(this, args);

    const player = this.state.player;
    const season = {
        seasonLabel: `${this.state.calendar.currentSeasonYear}/${Number(this.state.calendar.currentSeasonYear) + 1}`,
        club: player.club,
        age: Number(player.age),
        overall: Number(player.overall),
        clubPrestige: Number(player.clubPrestige || player.youthClubData?.prestige || 40),
        matches: Number(player.stats?.matchesPlayed || 0),
        goals: Number(player.stats?.goals || 0),
        assists: Number(player.stats?.assists || 0),
        averageRating: Number(player.stats?.averageRating || 0)
    };

    ensureClubPalmares(this.state);

    // Les classements de la saison sont encore disponibles ici.
    const leagueAchievement = captureLeagueAchievement(this.state, season.seasonLabel);

    // Le moteur original finalise les coupes puis remet les statistiques à zéro.
    const result = originalArchiveAndResetSeason.apply(this, args);
    const cupHistory = this.state.career?.lastCupHistory || [];
    const cupAchievements = captureCupAchievements(this.state, season.seasonLabel, cupHistory);

    if (leagueAchievement) {
        this.state.career.clubAchievements.push(leagueAchievement);
        if (leagueAchievement.type === 'league_title') {
            this.state.career.palmares.leagueTitles += 1;
        }
    }

    for (const achievement of cupAchievements) {
        this.state.career.clubAchievements.push(achievement);
        this.state.career.palmares.nationalCups += 1;
    }

    this.state.career.lastClubAchievementReport = {
        season: season.seasonLabel,
        league: leagueAchievement,
        cups: cupAchievements,
        trophiesWon: (leagueAchievement?.type === 'league_title' ? 1 : 0) + cupAchievements.length
    };

    // Calcul individuel après la finalisation collective, avec le snapshot de saison.
    const restore = {
        age: player.age,
        club: player.club,
        overall: player.overall,
        clubPrestige: player.clubPrestige
    };

    player.age = season.age;
    player.club = season.club;
    player.overall = season.overall;
    player.clubPrestige = season.clubPrestige;

    try {
        AwardsSystem.finalizeSeason(this.state, season, cupHistory);
    } finally {
        player.age = restore.age;
        player.club = restore.club;
        player.overall = restore.overall;
        if (restore.clubPrestige === undefined) delete player.clubPrestige;
        else player.clubPrestige = restore.clubPrestige;
    }

    StateManager.save(this.state);
    return result;
};

export { AwardsSystem };
