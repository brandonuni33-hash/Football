// application/gameApplication.js
// Façade applicative : point d'entrée entre l'UI et le domaine.
// Les commandes migrées sont enregistrées ici ; le bridge garde un fallback
// contrôlé vers GameEngine pour les fonctionnalités non migrées.

import { CommandBus } from '../core/commandBus.js';
import { LegacyGameBridge } from './legacyGameBridge.js';
import { NotificationSystem } from './notificationSystem.js';
import { registerCareerHandlers } from './handlers/careerHandlers.js';
import { registerApplicationEventSubscribers } from './eventSubscribers.js';

export class GameApplication {
    constructor({ engine = null, state = null, registry = null } = {}) {
        this.engine = engine;
        this.state = state || engine?.state || null;
        this.registry = registry;
        this.bridge = engine ? new LegacyGameBridge(engine, registry) : null;
        this.notifications = null;
        this.unregisterHandlers = [];
        this.unsubscribeEvents = null;
        this.started = false;
    }

    start() {
        if (this.started) return;

        this.bridge?.start();
        this.unregisterHandlers.push(
            ...registerCareerHandlers({ application: this, registry: this.registry })
        );

        if (this.state) {
            this.notifications = new NotificationSystem({ state: this.state });
            this.notifications.start();
        }

        this.unsubscribeEvents = registerApplicationEventSubscribers({
            registry: this.registry,
            state: this.state
        });

        this.started = true;
    }

    stop() {
        this.unregisterHandlers.forEach((unsubscribe) => unsubscribe?.());
        this.unregisterHandlers = [];
        this.notifications?.stop();
        this.unsubscribeEvents?.();
        this.unsubscribeEvents = null;
        this.bridge?.stop();
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
