// application/eventSubscribers.js
// Pont unique entre les événements applicatifs et les consommateurs UI.
// Le domaine ne connaît jamais le DOM.

import { EventBus } from '../core/eventBus.js';
import { EVENTS } from '../core/events.js';

function publishToPresentation(eventName, payload) {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    window.dispatchEvent(new CustomEvent(`game:${eventName}`, { detail: payload }));
}

export function registerApplicationEventSubscribers({ state } = {}) {
    const unsubscribers = [];
    const presentationEvents = [
        EVENTS.GAME_BLOCK_COMPLETED,
        EVENTS.CAREER_STAGE_CHANGED,
        EVENTS.RELATIONSHIP_CHANGED,
        EVENTS.RELATIONSHIP_ADVICE,
        EVENTS.TRANSFER_COMPLETED,
        EVENTS.MEDIA_POST_CREATED,
        EVENTS.MEDIA_DILEMMA_CREATED,
        EVENTS.MEDIA_DILEMMA_RESOLVED,
        EVENTS.SEASON_STARTED,
        EVENTS.SEASON_COMPLETED,
        EVENTS.PLAYER_RECOVERED,
        EVENTS.CAREER_ENDED
    ];

    presentationEvents.forEach((eventName) => {
        unsubscribers.push(EventBus.on(eventName, (payload = {}) => {
            const targetState = payload.state || state;
            if (eventName === EVENTS.GAME_BLOCK_COMPLETED && targetState) {
                targetState.lastBlockEventAt = Date.now();
            }
            if (eventName === EVENTS.CAREER_STAGE_CHANGED && targetState?.player && payload.stage) {
                targetState.player.lastCareerStageEvent = payload.stage;
            }
            publishToPresentation(eventName, payload);
        }));
    });

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe?.());
}

export default registerApplicationEventSubscribers;
