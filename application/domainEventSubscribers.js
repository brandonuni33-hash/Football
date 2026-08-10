// application/domainEventSubscribers.js
// Adaptateurs temporaires : ils traduisent les faits du domaine en mises à jour
// applicatives. Les domaines restent ignorants de l'UI et des notifications.

import { EventBus } from '../core/eventBus.js';
import { EVENTS } from '../core/events.js';

export function registerDomainEventSubscribers({ state, registry } = {}) {
    const unsubscribers = [];

    unsubscribers.push(
        EventBus.on(EVENTS.TRANSFER_COMPLETED, ({ state: eventState, newClub } = {}) => {
            const target = eventState || state;
            if (!target?.player || !newClub) return;
            target.player.lastTransferAt = Date.now();
        }),
        EventBus.on(EVENTS.RELATIONSHIP_CONFLICT, ({ state: eventState, relation } = {}) => {
            const target = eventState || state;
            if (!target) return;
            target.social ||= {};
            target.social.lastRelationshipConflict = {
                relation: relation || null,
                at: Date.now()
            };
        }),
        EventBus.on(EVENTS.RELATIONSHIP_ADVICE, ({ state: eventState, advice } = {}) => {
            const target = eventState || state;
            if (!target) return;
            target.social ||= {};
            target.social.lastRelationshipAdvice = advice || null;
        }),
        EventBus.on(EVENTS.SEASON_STARTED, ({ state: eventState, season } = {}) => {
            const target = eventState || state;
            if (target) target.lastSeasonStarted = season || target.season;
        }),
        EventBus.on(EVENTS.SEASON_COMPLETED, ({ state: eventState, season } = {}) => {
            const target = eventState || state;
            if (target) target.lastSeasonCompleted = season || target.season;
        })
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe?.());
}

export default registerDomainEventSubscribers;
