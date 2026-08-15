// application/handlers/trainingHandlers.js
// Adaptateurs de commandes UI -> domaine. Aucun rendu UI ici.

import { COMMANDS } from '../../core/commands.js';

export function registerTrainingHandlers({ application, trainingSystem, stateManager, state }) {
    application.registerCommand(COMMANDS.SET_TRAINING_FOCUS, ({ focus } = {}) => {
        if (!trainingSystem?.isValidFocus(focus)) return false;
        state.trainingFocus = focus;
        stateManager?.save?.(state);
        return true;
    });
}

export default registerTrainingHandlers;
