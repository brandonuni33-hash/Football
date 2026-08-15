// application/gameApplication.js
// Façade applicative : point d'entrée unique entre l'UI et le domaine.

import { CommandBus } from '../core/commandBus.js';
import NotificationSystem from '../domain/notification/notificationSystem.js';
import { registerCareerHandlers } from './handlers/careerHandlers.js';
import { registerGameplayHandlers } from './handlers/gameplayHandlers.js';
import { registerApplicationEventSubscribers } from './eventSubscribers.js';
import { registerDomainEventSubscribers } from './domainEventSubscribers.js';

export class GameApplication {
    constructor({ engine = null, state = null, registry = null } = {}) {
        this.engine = engine;
        this.state = state || engine?.state || null;
        this.registry = registry;
        this.notifications = null;
        this.unregisterHandlers = [];
        this.unsubscribeEvents = null;
        this.unsubscribeDomainEvents = null;
        this.started = false;
    }

    start() {
        if (this.started) return;

        this.state = this.engine?.state || this.state || null;
        this.unregisterHandlers.push(
            ...registerCareerHandlers({ application: this, registry: this.registry }),
            ...registerGameplayHandlers({ application: this, registry: this.registry, engine: this.engine })
        );

        this.startNotifications();

        this.unsubscribeEvents = registerApplicationEventSubscribers({ registry: this.registry, state: this.state });
        this.unsubscribeDomainEvents = registerDomainEventSubscribers({ registry: this.registry, state: this.state });
        this.started = true;
    }

    startNotifications() {
        if (!this.state || this.notifications) return;
        this.notifications = new NotificationSystem({ state: this.state });
        this.notifications.start();
    }

    stop() {
        this.unregisterHandlers.forEach((unsubscribe) => unsubscribe?.());
        this.unregisterHandlers = [];
        this.notifications?.stop();
        this.notifications = null;
        this.unsubscribeEvents?.();
        this.unsubscribeEvents = null;
        this.unsubscribeDomainEvents?.();
        this.unsubscribeDomainEvents = null;
        this.started = false;
    }

    registerCommand(commandName, handler) {
        return CommandBus.register(commandName, handler);
    }

    dispatch(commandName, payload = undefined, context = {}) {
        if (!this.started) this.start();
        return CommandBus.dispatch(commandName, payload, {
            ...context,
            engine: this.engine,
            state: this.engine?.state || this.state,
            registry: this.registry
        });
    }
}

export default GameApplication;
