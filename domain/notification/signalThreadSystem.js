// domain/notification/signalThreadSystem.js
// Regroupe les signaux en histoires persistantes de carrière.

export class SignalThreadSystem {
    constructor({ state = null } = {}) {
        this.state = state;
    }

    setState(state) { this.state = state; }

    getThread(threadId, state = this.state) {
        return state?.notifications?.threads?.find(thread => thread.id === threadId) || null;
    }

    getSignals(threadId, state = this.state) {
        const thread = this.getThread(threadId, state);
        if (!thread) return [];
        const ids = new Set(thread.signalIds || []);
        return (state.notifications.signals || [])
            .filter(signal => ids.has(signal.id))
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    summarize(threadId, state = this.state) {
        const thread = this.getThread(threadId, state);
        const signals = this.getSignals(threadId, state);
        if (!thread || !signals.length) return null;

        const latest = signals[signals.length - 1];
        const unread = signals.filter(signal => !signal.read && !signal.archived).length;
        const actionable = signals.filter(signal => signal.actionable && !signal.archived).length;

        return {
            id: thread.id,
            category: thread.category,
            title: latest.title || thread.title,
            createdAt: thread.createdAt,
            updatedAt: latest.createdAt,
            signalCount: signals.length,
            unreadCount: unread,
            actionableCount: actionable,
            latest,
            status: actionable > 0 ? 'action_required' : 'active'
        };
    }

    listActive(state = this.state) {
        return (state?.notifications?.threads || [])
            .map(thread => this.summarize(thread.id, state))
            .filter(Boolean)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    markThreadRead(threadId, state = this.state) {
        const signals = this.getSignals(threadId, state);
        let changed = 0;
        signals.forEach(signal => {
            if (!signal.read) {
                signal.read = true;
                changed += 1;
            }
        });
        if (state?.notifications) {
            state.notifications.unreadCount = Math.max(0, (state.notifications.unreadCount || 0) - changed);
        }
        return changed;
    }
}

export default SignalThreadSystem;
