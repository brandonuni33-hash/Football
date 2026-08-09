// main.js
import { GameEngine } from './gameEngine.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("⚡ Démarrage de Street to Pro (v106)...");

    try {
        // Initialisation globale du moteur de jeu
        window.game = new GameEngine();

        // Lancement de l'interface utilisateur via le moteur
        if (window.game.ui && typeof window.game.ui.init === 'function') {
            window.game.ui.init();
        } else {
            console.error("Erreur : L'interface utilisateur n'a pas pu être initialisée.");
        }
    } catch (error) {
        console.error("Erreur critique lors du chargement du jeu :", error);
    }
});
