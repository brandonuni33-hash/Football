// application/gameApplication.js
// Façade applicative : point d'entrée entre l'UI et le domaine.
//
// Pendant la migration, cette couche peut encore piloter le GameEngine
// historique via LegacyGameBridge. Elle deviendra progressivement le seul
// point d'entrée des commandes de l'interface.

import { CommandBus } from '../core/commandBus.js';
import { LegacyGameBridge } from './legacyGameBridge.js';
import { NotificationSystem } from './notificationSystem.js';

export class GameApplication {
    constructor({ engine = null, state = null } = {}) {
        this.engine = engine;
        this.state = state || engine?.state || null;
        this.bridge = engine ? new LegacyGameBridge(engine) : null;
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
            state: this.state
        });
    }
}

export default GameApplication;
