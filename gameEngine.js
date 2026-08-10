// gameEngine.js
// Shell de compatibilité historique.
//
// Les workflows métier sont désormais délégués par application/engineFacade.js
// vers les systèmes de domaine. GameEngine ne doit plus contenir de règles de
// carrière, match, calendrier, transfert ou interaction.

import { UserInterface } from './ui.js';
import { StateManager } from './state.js';

export class GameEngine {
    constructor() {
        this.state = StateManager.load();
        this.ui = new UserInterface(this);
    }
}

export default GameEngine;
