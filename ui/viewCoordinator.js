// ui/viewCoordinator.js
// Coordinateur unique de présentation. Les vues UI sont assemblées ici.

import {
    DashboardView,
    EventView,
    CoachView,
    MediaView,
    TransferView,
    TrainingView,
    CareerView,
    FamilyView,
    MessagesView,
    BankView,
    StatsView,
    SettingsView
} from './views/index.js';

const APP_VIEWS = {
    career: 'career', social: 'media', messages: 'messages', bank: 'bank',
    stats: 'stats', training: 'training', transfers: 'transfer', settings: 'settings', family: 'family'
};

const PRESENTATION_EVENTS = [
    'game:game.block.completed', 'game:relationship.changed', 'game:relationship.advice',
    'game:media.post.created', 'game:media.dilemma.created', 'game:media.dilemma.resolved',
    'game:transfer.completed', 'game:career.season.started', 'game:career.season.completed',
    'game:player.recovered', 'game:career.ended'
];

const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

export class ViewCoordinator {
    constructor({ ui, gateway } = {}) {
        if (!ui || !gateway) throw new Error('ViewCoordinator requires ui and gateway.');
        this.ui = ui;
        this.gateway = gateway;
        this.views = {
            dashboard: new DashboardView({ ui, gateway }),
            event: new EventView({ ui, gateway }),
            coach: new CoachView({ ui, gateway }),
            media: new MediaView({ ui, gateway }),
            transfer: new TransferView({ ui, gateway }),
            training: new TrainingView({ ui, gateway }),
            career: new CareerView({ ui, gateway }),
            family: new FamilyView({ ui, gateway }),
            messages: new MessagesView({ ui, gateway }),
            bank: new BankView({ ui, gateway }),
            stats: new StatsView({ ui, gateway }),
            settings: new SettingsView({ ui, gateway })
        };
        this.presentationHandlers = [];
        this.installed = false;
    }

    install() {
        if (this.installed) return this;
        this.ui.views = this.views;
        this.ui.gateway = this.gateway;
        this.ui.viewCoordinator = this;
        this.ui.presentationEvents = [];
        this.ui.openNotification = id => this.openNotification(id);
        this.ui.renderDashboard = state => this.renderDashboard(state);
        this.ui.renderSpecificAppContent = () => this.renderAppContent(this.ui.activeApp);
        this.ui.renderDomainEvent = event => this.renderEvent(event);
        this.ui.renderCoachEvent = event => this.renderCoach(event);
        this.ui.renderMediaPanel = state => this.renderMedia(state);

        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            for (const eventName of PRESENTATION_EVENTS) {
                const handler = event => {
                    const detail = event?.detail || {};
                    this.ui.presentationEvents.push({ name: eventName, detail, at: Date.now() });
                    if (this.ui.presentationEvents.length > 50) this.ui.presentationEvents.shift();
                    this.ui.onPresentationEvent?.(eventName, detail);
                };
                window.addEventListener(eventName, handler);
                this.presentationHandlers.push(() => window.removeEventListener(eventName, handler));
            }
        }

        this.ui.destroyViewCoordinator = () => this.destroy();
        this.installed = true;
        return this;
    }

    getTrainingFocusTypes() {
        return this.gateway.application?.registry?.trainingSystem?.getFocusTypes?.() || {};
    }

    renderDashboard(state = this.gateway.state) {
        if (!state?.player) return '';
        const app = this.ui.initDOM();
        app.innerHTML = this.views.dashboard.render(state);
        this.views.dashboard.bind(app);
        return app.innerHTML;
    }

    renderAppContent(appName) {
        const viewName = APP_VIEWS[appName];
        const view = viewName ? this.views[viewName] : null;
        if (!view) return '';
        return view.render(this.gateway.state, this.getTrainingFocusTypes());
    }

    renderActiveApp() {
        const appName = this.ui.activeApp || 'home';
        if (appName === 'home') return this.renderDashboard();
        const viewName = APP_VIEWS[appName];
        const view = viewName ? this.views[viewName] : null;
        if (!view) return this.renderDashboard();

        const root = this.ui.initDOM();
        root.innerHTML = `
            <div class="phone-frame">
                <div class="phone-status-bar"><span>9:41</span><span>⚡ Street to Pro</span><span>🔋 100%</span></div>
                <div class="phone-app-view" style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
                    <div class="app-header-bar" style="padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border-glass);background:rgba(15,23,42,.85);">
                        <button class="btn-back-home" id="back-home-btn" type="button">⬅️ Accueil</button>
                        <span class="app-title-header">${appName}</span>
                        <span style="width:60px;"></span>
                    </div>
                    <div id="app-content-body" class="app-content-body">${view.render(this.gateway.state, this.getTrainingFocusTypes())}</div>
                </div>
            </div>
        `;
        root.querySelector('#back-home-btn')?.addEventListener('click', () => {
            this.ui.activeApp = 'home';
            this.renderDashboard();
        });
        view.bind?.(root.querySelector('#app-content-body'), this.gateway.state);
        return root.innerHTML;
    }

    renderEvent(event) { return this.views.event.render(event); }
    renderCoach(event) { return this.views.coach.render(event); }
    renderMedia(state = this.gateway.state) { return this.views.media.render(state); }
    renderTransfer(offer = this.gateway.state?.pendingTransferOffer) { return this.views.transfer.render(offer); }
    renderTraining(state = this.gateway.state) { return this.views.training.render(state, this.getTrainingFocusTypes()); }
    renderCareer(state = this.gateway.state) { return this.views.career.render(state); }
    renderFamily(state = this.gateway.state) { return this.views.family.render(state); }
    bind(viewName, root, payload) { this.views[viewName]?.bind?.(root, payload); }

    openNotification(id) {
        const notificationState = this.gateway.state?.notifications;
        const notifications = Array.isArray(notificationState) ? notificationState : (notificationState?.signals || []);
        const notification = notifications.find(item => String(item?.id) === String(id));
        if (!notification) return null;
        const wasUnread = !notification.read;
        notification.read = true;
        notification.readAt = new Date().toISOString();
        if (wasUnread && notificationState && !Array.isArray(notificationState)) notificationState.unreadCount = Math.max(0, Number(notificationState.unreadCount || 0) - 1);

        const type = String(notification.type || notification.category || '').toLowerCase();
        const app = type.includes('transfer') || type.includes('mercato') ? 'transfers'
            : type.includes('media') ? 'social'
            : type.includes('family') || type.includes('famille') || type.includes('birth') || type.includes('naissance') || type.includes('child') ? 'family' : null;
        if (app) {
            this.ui.activeApp = app;
            this.renderActiveApp();
            return notification;
        }

        const title = escapeHtml(notification.title || 'Notification');
        const message = escapeHtml(notification.body || notification.message || notification.description || '');
        const category = escapeHtml(notification.category || notification.type || 'INFORMATION');
        const overlay = document.createElement('div');
        overlay.className = 'event-modal-overlay';
        overlay.dataset.notificationModal = 'true';
        overlay.innerHTML = `<div class="event-modal-card" role="dialog" aria-modal="true" aria-label="${title}"><div class="event-modal-category">${category}</div><h2 class="event-modal-title">${title}</h2><p class="event-modal-desc">${message}</p><button type="button" class="btn-event-choice" data-close-notification>Fermer</button></div>`;
        (document.getElementById('app') || document.body).appendChild(overlay);
        overlay.querySelector('[data-close-notification]')?.addEventListener('click', () => overlay.remove());
        return notification;
    }

    destroy() {
        this.presentationHandlers.forEach(remove => remove());
        this.presentationHandlers.length = 0;
        this.installed = false;
    }
}

export default ViewCoordinator;
