// events.js
import { StateManager } from './state.js';

export const EventEngine = {
    // Structure prête pour injecter des scénarios par la suite
    checkTriggers: () => {
        const state = StateManager.get();
        // Logique d'événements hebdomadaires ou saisonniers
    }
};
