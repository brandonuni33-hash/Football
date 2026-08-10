// application/notificationPresenter.js
// Transforme les signaux persistés en modèle de présentation.
// Aucun rendu DOM ici.

import SignalIntelligence from '../domain/notification/signalIntelligence.js';
import SignalThreadSystem from '../domain/notification/signalThreadSystem.js';

export class NotificationPresenter {
    constructor({ intelligence = new SignalIntelligence(), threads = new SignalThreadSystem() } = {}) {
        this.intelligence = intelligence;
        this.threads = threads;
    }

    presentSignal(signal, context = {}) {
        if (!signal) return null;
        const decision = this.intelligence.evaluate(signal, context);
        return {
            id: signal.id,
            threadId: signal.threadId,
            category: signal.category,
            title: signal.title,
            body: signal.body,
            priority: decision.level,
            channel: decision.channel,
            interrupt: decision.interrupt,
            certainty: decision.certainty,
            visibility: decision.visibility,
            actionable: signal.actionable,
            createdAt: signal.createdAt
        };
    }

    getInbox(state, context = {}) {
        const signals = state?.notifications?.signals || [];
        return signals
            .filter(signal => !signal.archived && signal.visibility !== 'hidden')
            .map(signal => this.presentSignal(signal, context))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    getThreads(state) {
        return this.threads.listActive(state);
    }

    getPendingDecisions(state, context = {}) {
        return this.getInbox(state, context)
            .filter(item => item.actionable || item.priority === 'decision' || item.priority === 'scene');
    }
}

export default NotificationPresenter;
