// gameEngine.js
import { UserInterface } from './ui.js';
import { MatchBlockManager } from './matchBlock.js';
import { EconomyManager } from './economy.js';

export class GameEngine {
    constructor() {
        this.state = null;
        // Lance l'interface utilisateur au démarrage
        this.ui = new UserInterface(this);
    }

    /**
     * Appelé par l'UI à la fin de l'étape 5 pour lancer la carrière
     */
    startCareer(selectedData) {
        // Détermination d'une note générale de départ (OVR) et d'un potentiel selon le club jeune
        const initialOvr = 60;
        const potentialOvr = initialOvr + Math.floor(Math.random() * 15) + 10; // Entre 75 et 85 de potentiel

        this.state = {
            player: {
                firstname: selectedData.firstname,
                lastname: selectedData.lastname,
                position: selectedData.position,
                age: 16,
                club: selectedData.youthClub.name,
                salary: selectedData.youthClub.salary,
                overall: initialOvr,
                fame: 10,
                morale: 80,
                fitness: 90,
                isInjured: false,
                
                // 1. Enrichissement de l'état du joueur (Stats & Potentiel)
                stats: {
                    matchesPlayed: 0,
                    goals: 0,
                    assists: 0,
                    successfulPasses: 0,
                    tackles: 0,
                    averageRating: 0.0
                },
                potential: potentialOvr,

                // Attributs cachés initialisés
                attributes: {
                    consistency: Math.floor(Math.random() * 8) + 8,
                    bigMatchPlayer: Math.floor(Math.random() * 8) + 8,
                    injuryProneness: Math.floor(Math.random() * 10) + 6
                }
            },
            career: {
                balance: selectedData.youthClub.signingBonus || 1500 // Solde de départ
            },
            seasonPhase: 'pre_season'
        };

        console.log("Carrière lancée avec succès et statistiques initialisées !", this.state);
        
        // Basculement vers l'affichage du Dashboard principal (à créer selon ton UI)
        // this.renderDashboard();
    }

    /**
     * Permet de simuler un bloc de 4 matchs et de mettre à jour les statistiques
     */
    playBlock() {
        if (!this.state) return;

        if (this.state.player.isInjured) {
            alert("Impossible de jouer, votre joueur est blessé !");
            return;
        }

        // Appel du gestionnaire de bloc de matchs
        const report = MatchBlockManager.simulateBlock(this.state);
        
        // Exemple de génération aléatoire complémentaire pour alimenter les passes et tacles du bloc
        const blockPasses = Math.floor(Math.random() * 40) + 20;
        const blockTackles = Math.floor(Math.random() * 12) + 3;

        // Mise à jour des statistiques globales de la saison
        const stats = this.state.player.stats;
        stats.matchesPlayed += 4;
        stats.goals += report.summary.goals;
        stats.assists += report.summary.assists;
        stats.successfulPasses += blockPasses;
        stats.tackles += blockTackles;

        // Recalcul de la note moyenne globale de la saison
        const totalMatches = stats.matchesPlayed;
        stats.averageRating = parseFloat(((stats.averageRating * (totalMatches - 4) + (report.summary.rating * 4)) / totalMatches).toFixed(1));

        console.log("Rapport du bloc et stats mises à jour :", report, stats);
        return report;
    }
}

// Lancement automatique du jeu au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameEngine();
});
