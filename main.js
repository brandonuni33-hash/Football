// main.js
import { GameEngine } from './gameEngine.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Initialisation du Football Career Simulator...");
    
    try {
        // 1. Instancie le moteur de jeu
        window.game = new GameEngine();
        
        // 2. Démarre l'interface utilisateur
        if (window.game.ui && typeof window.game.ui.init === 'function') {
            window.game.ui.init();
        } else {
            throw new Error("La méthode 'init' est introuvable dans UserInterface (ui.js).");
        }
    } catch (error) {
        console.error("Erreur critique au démarrage :", error);
        // Affiche l'erreur directement sur l'écran noir pour ne plus deviner
        document.body.innerHTML = `
            <div style="background: #7f1d1d; color: #f87171; padding: 20px; font-family: monospace; border-radius: 8px; margin: 20px;">
                <h3 style="margin-top:0;">💥 Erreur critique de chargement</h3>
                <p><strong>Message :</strong> ${error.message}</p>
                <p><em>Vérifie la console (F12) pour plus de détails.</em></p>
            </div>
        `;
    }
});
