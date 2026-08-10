// application/gameApplication.js
// Façade applicative : point d'entrée entre l'UI et le domaine.
// Les commandes migrées sont enregistrées ici ; le bridge garde un fallback
// contrôlé vers GameEngine pour les fonctionnalités non migrées.

import { CommandBus } from '../core/commandBus.js';
import { LegacyGameBridge } from './legacyGameBridge.js';
import { NotificationSystem } from './notificationSystem.js';
import { registerCareerHandlers } from './handlers/careerHandlers.js';

export class GameApplication {
    constructor({ engine = null, state = null, registry = null } = {}) {
        this.engine = engine;
        this.state = state || engine?.state || null;
        this.registry = registry;
        this.bridge = engine ? new LegacyGameBridge(engine, registry) : null;
        this.notifications = null;
        this.unregisterHandlers = [];
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

        this.started = true;
    }

    stop() {
        this.unregisterHandlers.forEach((unsubscribe) => unsubscribe?.());
        this.unregisterHandlers = [];
        this.notifications?.stop();
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
            state: this.state,
            registry: this.registry
        });
    }
}

export default GameApplication;
