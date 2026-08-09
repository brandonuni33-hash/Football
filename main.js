// main.js
import { GameEngine } from './gameEngine.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Initialisation du Football Career Simulator...");
    
    // 1. Instancie le moteur de jeu
    window.game = new GameEngine();
    
    // 2. Lance l'affichage de l'interface
    if (window.game.ui && typeof window.game.ui.init === 'function') {
        window.game.ui.init();
    }
});
