// main.js
import { StateManager } from './state.js';
import { UIRenderer } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Initialisation du Football Career Simulator (Modularisé)...");
    StateManager.load();
    UIRenderer.init();
});
