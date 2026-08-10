// application/notificationSystem.js
// Façade applicative de compatibilité vers le système de signaux de carrière.

import DomainNotificationSystem from '../domain/notification/notificationSystem.js';

export class NotificationSystem extends DomainNotificationSystem {
    constructor({ state, eventBus } = {}) {
        super({ state, eventBus });
    }
}

export default NotificationSystem;
