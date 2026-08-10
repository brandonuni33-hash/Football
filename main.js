// main.js
import { GameEngine } from './gameEngine.js';
// Branche les compétitions internationales avant la création du moteur.
import './internationalIntegration.js';
// Branche les récompenses de carrière : Joueur de l'année, Équipe de l'année,
// Meilleur jeune et classement du Ballon d'Or.
import { AwardsSystem } from './awardsIntegration.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("⚡ Démarrage de Street to Pro (v107)...");

    try {
        // Initialisation globale du moteur de jeu
        window.game = new GameEngine();

        // Initialise/migre le palmarès même pour une ancienne sauvegarde.
        AwardsSystem.ensure(window.game.state);

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