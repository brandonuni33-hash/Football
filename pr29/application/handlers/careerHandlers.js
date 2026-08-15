// application/handlers/careerHandlers.js
// Handlers applicatifs : l'UI envoie des intentions, l'application délègue
// au domaine sans connaître les implémentations historiques.

import { COMMANDS } from '../../core/commands.js';

export function registerCareerHandlers({ application, registry }) {
    const unregister = [];
    const career = registry?.careerApplication;

    if (!career) return unregister;

    unregister.push(application.registerCommand(COMMANDS.START_GAME, (payload, context) => {
        const state = career.create(payload || {});
        context.state = state;
        return state;
    }));

    return unregister;
}

export default registerCareerHandlers;
