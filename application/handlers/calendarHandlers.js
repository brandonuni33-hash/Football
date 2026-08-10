// application/handlers/calendarHandlers.js
// Adaptateurs de commandes calendrier -> domaine.

import { COMMANDS } from '../../core/commands.js';

export function registerCalendarHandlers({ application, calendarSystem, state, stateManager }) {
    application.registerCommand(COMMANDS.ADVANCE_CALENDAR, () => {
        const result = calendarSystem?.advance?.(state) || null;
        if (result) stateManager?.save?.(state);
        return result;
    });
}

export default registerCalendarHandlers;
