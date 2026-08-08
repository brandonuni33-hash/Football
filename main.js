// main.js
import { StateManager } from './state.js';
import { UIRenderer } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Initialisation du Football Career Simulator...");
    
    // 1. Charger l'état depuis le localStorage
    StateManager.load();
    
    // 2. Initialiser le rendu UI
    UIRenderer.init();
});
