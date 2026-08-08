// main.js
import { GameEngine } from './gameEngine.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Initialisation du Football Career Simulator...");
    
    // Instancie le vrai moteur de jeu (qui gère lui-même l'interface au démarrage)
    window.game = new GameEngine();
});
