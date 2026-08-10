// application/gameApplication.js
// Façade applicative : point d'entrée entre l'UI et le domaine.
// Pendant la migration, les commandes non migrées restent compatibles avec
// le GameEngine historique via LegacyGameBridge.

import { CommandBus } from '../core/commandBus.js';
import { LegacyGameBridge } from './legacyGameBridge.js';
import { NotificationSystem } from './notificationSystem.js';

export class GameApplication {
    constructor({ engine = null, state = null, registry = null } = {}) {
        this.engine = engine;
        this.state = state || engine?.state || null;
        this.registry = registry;
        this.bridge = engine ? new LegacyGameBridge(engine, registry) : null;
        this.notifications = this.state
            ? new NotificationSystem({ state: this.state })
            : null;
        this.started = false;
    }

    start() {
        if (this.started) return;

        this.bridge?.start();
        this.notifications?.start();
        this.started = true;
    }

    stop() {
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
