// main.js
import { StateManager } from './state.js';
import { UserInterface } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Initialisation du Football Career Simulator (Modularisé)...");
    StateManager.load();
    
    // Instanciation de l'interface utilisateur
    const ui = new UserInterface();
});
