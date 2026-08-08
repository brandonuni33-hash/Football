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
        this.state = {
            player: {
                firstname: selectedData.firstname,
                lastname: selectedData.lastname,
                position: selectedData.position,
                club: selectedData.youthClub.name,
                salary: selectedData.youthClub.salary,
                morale: 80,
                fitness: 90,
                isInjured: false,
                // Attributs cachés initialisés
                attributes: {
                    consistency: Math.floor(Math.random() * 8) + 8,
                    bigMatchPlayer: Math.floor(Math.random() * 8) + 8,
                    injuryProneness: Math.floor(Math.random() * 10) + 6
                }
            },
            career: {
                balance: 1500 // Solde de départ
            },
            seasonPhase: 'pre_season'
        };

        console.log("Carrière lancée avec succès !", this.state);
        
        // Ici, tu pourras basculer vers l'affichage du Dashboard principal du jeu
        // this.renderDashboard();
    }

    /**
     * Permet de simuler un bloc de 4 matchs depuis le dashboard
     */
    playBlock() {
        if (!this.state) return;

        if (this.state.player.isInjured) {
            alert("Impossible de jouer, votre joueur est blessé !");
            return;
        }

        // Appel du gestionnaire de bloc de matchs
        const report = MatchBlockManager.simulateBlock(this.state);
        
        console.log("Rapport du bloc de 4 matchs :", report);
        return report;
    }
}

// Lancement automatique du jeu au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameEngine();
});
