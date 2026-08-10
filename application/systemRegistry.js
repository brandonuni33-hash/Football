// application/systemRegistry.js
// Composition root de transition. Les systèmes historiques sont construits ici
// afin que GameEngine cesse progressivement de connaître toutes leurs implémentations.

import { SocialSystem } from '../social.js';
import { MediaSystem } from '../media.js';
import { TrainingManager } from '../entrainement.js';
import { CalendarSystem } from '../domain/calendar/calendarSystem.js';
import { TrainingSystem } from '../domain/training/trainingSystem.js';

export function createSystemRegistry({ engine, worldSystem, competitionSystem, cupSystem } = {}) {
    const socialSystem = new SocialSystem(engine);
    const mediaSystem = new MediaSystem(engine);
    const trainingSystem = new TrainingSystem(TrainingManager);

    const calendarSystem = new CalendarSystem({
        worldSystem,
        competitionSystem,
        cupSystem,
        // Cette opération reste volontairement injectée : elle sera extraite
        // dans SeasonSystem lors de la prochaine phase de migration.
        seasonReset: (state) => engine?.archiveAndResetSeason?.(state)
    });

    return Object.freeze({
        socialSystem,
        mediaSystem,
        trainingSystem,
        calendarSystem
    });
}

export default createSystemRegistry;
