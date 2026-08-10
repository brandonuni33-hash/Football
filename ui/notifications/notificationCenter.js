// ui/notifications/notificationCenter.js
// Vue légère du centre de notifications. Aucun calcul métier.

export class NotificationCenter {
    constructor({ presenter }) {
        this.presenter = presenter;
    }

    render(state, context = {}) {
        const inbox = this.presenter.getInbox(state, context);
        const threads = this.presenter.getThreads(state);
        const pending = this.presenter.getPendingDecisions(state, context);

        return {
            unreadCount: state?.notifications?.unreadCount || 0,
            pendingCount: pending.length,
            tabs: {
                activity: inbox,
                stories: threads,
                decisions: pending
            }
        };
    }
}

export default NotificationCenter;
