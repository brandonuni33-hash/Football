// core/eventBus.js
// Bus d'événements applicatifs/domaines.
// Un événement décrit un fait qui vient de se produire.
// Les systèmes publient des faits sans connaître leurs consommateurs.

class EventBusImpl {
    constructor() {
        this.listeners = new Map();
    }

    on(eventName, handler) {
        if (typeof handler !== 'function') {
            throw new TypeError(`EventBus.on('${eventName}') requires a function`);
        }

        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }

        const handlers = this.listeners.get(eventName);
        handlers.add(handler);

        return () => this.off(eventName, handler);
    }

    once(eventName, handler) {
        let unsubscribe;

        const wrappedHandler = (payload) => {
            unsubscribe?.();
            handler(payload);
        };

        unsubscribe = this.on(eventName, wrappedHandler);
        return unsubscribe;
    }

    off(eventName, handler) {
        const handlers = this.listeners.get(eventName);
        if (!handlers) return;

        handlers.delete(handler);
        if (handlers.size === 0) {
            this.listeners.delete(eventName);
        }
    }

    emit(eventName, payload = undefined) {
        if (!eventName || typeof eventName !== 'string') {
            throw new TypeError('EventBus.emit requires a non-empty event name');
        }

        const handlers = this.listeners.get(eventName);
        if (!handlers) return;

        // Snapshot : un handler peut s'abonner/se désabonner pendant la notification
        // sans modifier la liste parcourue pour cette émission.
        [...handlers].forEach((handler) => handler(payload));
    }

    clear(eventName = null) {
        if (eventName === null) {
            this.listeners.clear();
            return;
        }

        this.listeners.delete(eventName);
    }
}

export const EventBus = new EventBusImpl();
export default EventBus;
