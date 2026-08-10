// application/notificationSystem.js
// Couche applicative qui transforme les faits métier en notifications UI.
// Aucun système métier ne doit dépendre directement de l'interface.

import { EventBus } from '../core/eventBus.js';

const DEFAULT_PRIORITY = 'normal';

export class NotificationSystem {
    constructor({ state }) {
        this.state = state;
        this.unsubscribers = [];
    }

    start() {
        this.stop();

        this.unsubscribers.push(
            EventBus.on('scouting.observation.started', (payload) => {
                this.push({
                    type: 'scouting',
                    priority: 'normal',
                    title: 'Observation',
                    message: payload?.message || 'Un recruteur observe ton match.'
                });
            }),
            EventBus.on('transfer.offer.created', (payload) => {
                this.push({
                    type: 'transfer',
                    priority: 'high',
                    title: 'Nouvelle offre',
                    message: payload?.message || 'Un club vient de transmettre une offre.'
                });
            }),
            EventBus.on('loan.proposal.created', (payload) => {
                this.push({
                    type: 'loan',
                    priority: 'high',
                    title: 'Proposition de prêt',
                    message: payload?.message || 'Une proposition de prêt est disponible.'
                });
            }),
            EventBus.on('agent.interest.created', (payload) => {
                this.push({
                    type: 'agent',
                    priority: 'normal',
                    title: 'Un agent s’intéresse à toi',
                    message: payload?.message || 'Un agent souhaite entrer en contact.'
                });
            })
        );
    }

    stop() {
        this.unsubscribers.forEach((unsubscribe) => unsubscribe?.());
        this.unsubscribers = [];
    }

    push({ type = 'system', priority = DEFAULT_PRIORITY, title, message }) {
        if (!this.state) return null;

        this.state.notifications ||= [];

        const notification = {
            id: `notification_${Date.now()}_${this.state.notifications.length}`,
            type,
            priority,
            title: title || 'Information',
            message: message || '',
            read: false,
            createdAt: Date.now()
        };

        this.state.notifications.push(notification);
        return notification;
    }
}

export default NotificationSystem;
