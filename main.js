// main.js
import { GameEngine } from './gameEngine.js';
import { UserInterface } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Initialisation du Football Career Simulator...");
    
    // 1. Instancie le moteur de jeu
    const engine = new GameEngine();
    window.game = engine;

    // 2. Instancie l'interface en lui passant le moteur (si ce n'est pas déjà fait dans le moteur)
    // Si ton GameEngine crée déjà son UI, commente la ligne ci-dessous pour éviter les doublons.
    if (!engine.ui) {
        engine.ui = new UserInterface(engine);
    }
    
    // 3. Lance l'affichage de l'interface en toute sécurité
    if (engine.ui && typeof engine.ui.init === 'function') {
        engine.ui.init();
    } else {
        console.error("Erreur : L'interface utilisateur (UI) n'a pas pu être initialisée.");
    }
});
