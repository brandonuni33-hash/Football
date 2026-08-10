// awardsIntegration.js
// Branche le système de récompenses sans modifier le flux principal du moteur.
import { GameEngine } from './gameEngine.js';
import { AwardsSystem } from './awardsSystem.js';
import { StateManager } from './state.js';

const originalStartCareer = GameEngine.prototype.startCareer;
const originalArchiveAndResetSeason = GameEngine.prototype.archiveAndResetSeason;

GameEngine.prototype.startCareer = function (...args) {
    const result = originalStartCareer.apply(this, args);
    AwardsSystem.ensure(this.state);
    StateManager.save(this.state);
    return result;
};

GameEngine.prototype.archiveAndResetSeason = function (...args) {
    if (!this.state?.player) return originalArchiveAndResetSeason.apply(this, args);

    // Snapshot avant le vieillissement et la remise à zéro des statistiques.
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

    const result = originalArchiveAndResetSeason.apply(this, args);

    // L'archive originale a maintenant terminé la Coupe et vidé les stats.
    // On restaure temporairement les éléments de contexte nécessaires au calcul.
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
        AwardsSystem.finalizeSeason(
            this.state,
            season,
            this.state.career?.lastCupHistory || []
        );
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
