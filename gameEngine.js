// gameEngine.js
// Shell de compatibilité historique.
// Les workflows métier sont délégués par application/engineFacade.js.

import { UserInterface } from './ui.js';
import { StateManager } from './state.js';

export class GameEngine {
    constructor() {
        this.state = StateManager.load();
        this.ui = new UserInterface(this);
    }
}

export default GameEngine;
