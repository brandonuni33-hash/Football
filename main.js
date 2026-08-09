// main.js
import { GameEngine } from './gameEngine.js';
import { UserInterface } from './ui.js';

console.log("main.js chargé avec succès !");

// On écoute le chargement complet au cas où
const initApp = () => {
    try {
        console.log("Initialisation du Football Career Simulator...");
        
        // 1. Instancie le moteur de jeu
        const engine = new GameEngine();
        window.game = engine;

        // 2. Instancie l'interface
        if (!engine.ui) {
            engine.ui = new UserInterface(engine);
        }
        
        // 3. Lance l'affichage
        if (engine.ui && typeof engine.ui.init === 'function') {
            engine.ui.init();
            console.log("Interface initialisée avec succès.");
        } else {
            console.error("Erreur : L'interface utilisateur (UI) n'a pas de méthode init.");
        }
    } catch (error) {
        console.error("Erreur critique dans l'initialisation du jeu :", error);
        document.getElementById('app').innerHTML = `
            <div style="padding: 20px; color: #ef4444; font-family: monospace;">
                <h3>Erreur d'exécution :</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
