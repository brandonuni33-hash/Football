// core/commandBus.js
// Bus de commandes applicatives.
// Une commande exprime une intention : "fais ceci".
// Le handler est responsable de la logique et peut ensuite publier des événements.

class CommandBusImpl {
    constructor() {
        this.handlers = new Map();
    }

    register(commandName, handler) {
        if (!commandName || typeof commandName !== 'string') {
            throw new TypeError('CommandBus.register requires a non-empty command name');
        }

        if (typeof handler !== 'function') {
            throw new TypeError(`CommandBus.register('${commandName}') requires a function`);
        }

        if (this.handlers.has(commandName)) {
            throw new Error(`Command handler already registered: ${commandName}`);
        }

        this.handlers.set(commandName, handler);

        return () => this.unregister(commandName);
    }

    unregister(commandName) {
        this.handlers.delete(commandName);
    }

    async dispatch(commandName, payload = undefined, context = {}) {
        const handler = this.handlers.get(commandName);

        if (!handler) {
            throw new Error(`No command handler registered for: ${commandName}`);
        }

        return handler(payload, context);
    }

    has(commandName) {
        return this.handlers.has(commandName);
    }

    clear() {
        this.handlers.clear();
    }
}

export const CommandBus = new CommandBusImpl();
export default CommandBus;
