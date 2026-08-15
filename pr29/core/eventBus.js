// core/eventBus.js
// Bus d'événements applicatifs/domaines.
// Un événement décrit un fait qui vient de se produire.
// Les systèmes publient des faits sans connaître leurs consommateurs.

class EventBusImpl {
    constructor() {
        this.listeners = new Map();
    }

    on(eventName, handler) {
        this.#assertEventName(eventName);
        if (typeof handler !== 'function') {
            throw new TypeError(`EventBus.on('${eventName}') requires a function`);
        }

        if (!this.listeners.has(eventName)) this.listeners.set(eventName, new Set());
        const handlers = this.listeners.get(eventName);
        handlers.add(handler);
        return () => this.off(eventName, handler);
    }

    once(eventName, handler) {
        this.#assertEventName(eventName);
        let unsubscribe;
        const wrappedHandler = (payload) => {
            unsubscribe?.();
            return handler(payload);
        };
        unsubscribe = this.on(eventName, wrappedHandler);
        return unsubscribe;
    }

    off(eventName, handler) {
        this.#assertEventName(eventName);
        const handlers = this.listeners.get(eventName);
        if (!handlers) return false;
        const removed = handlers.delete(handler);
        if (handlers.size === 0) this.listeners.delete(eventName);
        return removed;
    }

    emit(eventName, payload = undefined) {
        this.#assertEventName(eventName);
        const handlers = this.listeners.get(eventName);
        if (!handlers?.size) return { delivered: 0, errors: [] };

        const errors = [];
        let delivered = 0;
        [...handlers].forEach((handler) => {
            try {
                handler(payload);
                delivered += 1;
            } catch (error) {
                errors.push(error);
                // Un subscriber ne doit pas interrompre les autres réactions à un fait métier.
                console.error(`[EventBus] subscriber failed for '${eventName}'`, error);
            }
        });

        return { delivered, errors };
    }

    clear(eventName = null) {
        if (eventName === null) {
            this.listeners.clear();
            return;
        }
        this.#assertEventName(eventName);
        this.listeners.delete(eventName);
    }

    listenerCount(eventName = null) {
        if (eventName === null) {
            return [...this.listeners.values()].reduce((total, handlers) => total + handlers.size, 0);
        }
        this.#assertEventName(eventName);
        return this.listeners.get(eventName)?.size || 0;
    }

    #assertEventName(eventName) {
        if (typeof eventName !== 'string' || !eventName.trim()) {
            throw new TypeError('EventBus requires a non-empty event name');
        }
    }
}

export const EventBus = new EventBusImpl();
export default EventBus;
