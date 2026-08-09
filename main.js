// main.js
import { GameEngine } from './gameEngine.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Initialisation du Football Career Simulator...");
    
    // 1. Instancie le moteur de jeu
    window.game = new GameEngine();
    
    // 2. Démarre l'interface utilisateur pour afficher l'écran (ex: création de joueur ou dashboard)
    if (window.game.ui && typeof window.game.ui.init === 'function') {
        window.game.ui.init();
    } else {
        console.error("Erreur : La méthode 'init' est introuvable dans UserInterface (ui.js).");
    }
});
