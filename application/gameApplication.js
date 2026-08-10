// application/gameApplication.js
// Façade applicative : point d'entrée entre l'UI et le domaine.
// Cette première version ne migre pas encore le moteur historique.
// Elle fournit un endroit stable pour brancher progressivement les commandes.

import { CommandBus } from '../core/commandBus.js';

export class GameApplication {
    constructor({ engine = null } = {}) {
        this.engine = engine;
        this.handlersRegistered = false;
    }

    registerCommand(commandName, handler) {
        return CommandBus.register(commandName, handler);
    }

    dispatch(commandName, payload = undefined, context = {}) {
        return CommandBus.dispatch(commandName, payload, {
            ...context,
            engine: this.engine
        });
    }
}

export default GameApplication;
