// main.js
import { StateManager } from './state.js';
import { UserInterface } from './ui.js';

// Moteur de jeu minimaliste pour éviter les plantages si le moteur complet n'est pas encore branché
class DummyEngine {
    startCareer(data) {
        console.log("Carrière lancée avec les données :", data);
        alert("Carrière lancée avec succès ! (Connecte ton GameEngine ici)");
        // StateManager.update({ isCreated: true, player: data });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Initialisation du Football Career Simulator...");
    
    // 1. Charger l'état
    StateManager.load();
    
    // 2. Instancier le moteur et l'interface utilisateur
    const gameEngine = new DummyEngine(); // Remplace par ton vrai GameEngine si tu en as un
    const ui = new UserInterface(gameEngine);
});
