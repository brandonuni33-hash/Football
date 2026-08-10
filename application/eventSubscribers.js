// application/eventSubscribers.js
// Les consommateurs applicatifs des événements sont regroupés ici afin que
// les domaines ne connaissent ni l'UI ni les autres systèmes applicatifs.

import { EventBus } from '../core/eventBus.js';
import { EVENTS } from '../core/events.js';

export function registerApplicationEventSubscribers({ registry, state } = {}) {
    const unsubscribers = [];

    if (registry?.notificationSystem) {
        // NotificationSystem reste responsable de ses propres abonnements.
        // Cette branche est réservée aux futurs subscribers transverses.
    }

    unsubscribers.push(
        EventBus.on(EVENTS.GAME_BLOCK_COMPLETED, ({ state: eventState } = {}) => {
            const targetState = eventState || state;
            if (targetState) {
                targetState.lastBlockEventAt = Date.now();
            }
        }),
        EventBus.on(EVENTS.CAREER_STAGE_CHANGED, ({ state: eventState, stage } = {}) => {
            const targetState = eventState || state;
            if (targetState?.player && stage) {
                targetState.player.lastCareerStageEvent = stage;
            }
        })
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe?.());
}

export default registerApplicationEventSubscribers;
