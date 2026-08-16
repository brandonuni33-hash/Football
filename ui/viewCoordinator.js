// ui/viewCoordinator.js
// Coordinateur unique de présentation. Les vues historiques restent disponibles mais sortent du parcours principal.

import {
    DashboardView, EventView, CoachView, MediaView, TransferView, TrainingView,
    CareerView, FamilyView, MessagesView, BankView, StatsView, SettingsView,
    LifeView, PlayerView
} from './views/index.js';

const APP_VIEWS = {
    life: 'life', player: 'player', settings: 'settings',
    // Routes historiques conservées pour compatibilité et accès secondaire éventuel.
    career: 'career', social: 'media', messages: 'messages', bank: 'bank',
    stats: 'stats', training: 'training', transfers: 'transfer', family: 'family'
};

const SPACE_TITLES = {
    life: 'Vie', player: 'Joueur', settings: 'Réglages',
    career: 'Carrière', social: 'Médias', messages: 'Vestiaire', bank: 'Banque',
    stats: 'Statistiques', training: 'Entraînement', transfers: 'Mercato', family: 'Famille'
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
        const narrativePresenter = gateway.application?.registry?.narrativePresenter || null;
        this.views = {
            dashboard: new DashboardView({ ui, gateway, narrativePresenter }),
            life: new LifeView({ ui, gateway }),
            player: new PlayerView({ ui, gateway }),
            event: new EventView({ ui, gateway }), coach: new CoachView({ ui, gateway }),
            media: new MediaView({ ui, gateway }), transfer: new TransferView({ ui, gateway }),
            training: new TrainingView({ ui, gateway }), career: new CareerView({ ui, gateway, narrativePresenter }),
            family: new FamilyView({ ui, gateway }), messages: new MessagesView({ ui, gateway }),
            bank: new BankView({ ui, gateway }), stats: new StatsView({ ui, gateway }),
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

    getTrainingFocusTypes() { return this.gateway.application?.registry?.trainingSystem?.getFocusTypes?.() || {}; }

    renderDashboard(state = this.gateway.state) {
        if (!state?.player) return '';
        return (this.ui.activeApp && this.ui.activeApp !== 'home') ? this.renderActiveApp() : this.renderHome(state);
    }

    renderHome(state = this.gateway.state) {
        if (!state?.player) return '';
        this.ui.activeApp = 'home';
        const root = this.ui.initDOM();
        root.innerHTML = this.views.dashboard.render(state);
        this.views.dashboard.bind(root);
        return root.innerHTML;
    }

    renderAppContent(appName) {
        const viewName = APP_VIEWS[appName];
        const view = viewName ? this.views[viewName] : null;
        return view ? view.render(this.gateway.state, this.getTrainingFocusTypes()) : '';
    }

    renderActiveApp() {
        const appName = this.ui.activeApp || 'home';
        if (appName === 'home') return this.renderHome();
        const viewName = APP_VIEWS[appName];
        const view = viewName ? this.views[viewName] : null;
        if (!view) return this.renderHome();

        const root = this.ui.initDOM();
        const title = SPACE_TITLES[appName] || appName;
        root.innerHTML = `
            <div class="phone-frame" data-space="${escapeHtml(appName)}">
                <div class="phone-status-bar"><span>STREET TO PRO</span><strong>${escapeHtml(title)}</strong><span></span></div>
                <div class="phone-app-view" style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
                    <div class="app-header-bar" style="padding:11px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border-glass);background:rgba(8,13,21,.94);">
                        <button id="back-home-btn" type="button" style="border:0;background:transparent;color:#b8c8d7;font-weight:800;">‹ Carrière</button>
                        <strong style="font-size:.82rem;">${escapeHtml(title)}</strong>
                        <span style="width:64px;"></span>
                    </div>
                    <div id="app-content-body" class="app-content-body" style="background:#05070b;">${view.render(this.gateway.state, this.getTrainingFocusTypes())}</div>
                    <nav aria-label="Espaces" style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;padding:8px 10px calc(8px + env(safe-area-inset-bottom,0px));border-top:1px solid rgba(255,255,255,.08);background:#080d15;">
                        <button type="button" data-space-route="home" style="border:0;background:transparent;color:${appName === 'home' ? '#fff' : '#8595a7'};padding:8px;font-size:.68rem;font-weight:800;">Carrière</button>
                        <button type="button" data-space-route="life" style="border:0;background:transparent;color:${appName === 'life' ? '#fff' : '#8595a7'};padding:8px;font-size:.68rem;font-weight:800;">Vie</button>
                        <button type="button" data-space-route="player" style="border:0;background:transparent;color:${appName === 'player' ? '#fff' : '#8595a7'};padding:8px;font-size:.68rem;font-weight:800;">Joueur</button>
                    </nav>
                </div>
            </div>
        `;
        root.querySelector('#back-home-btn')?.addEventListener('click', () => this.renderHome());
        root.querySelectorAll('[data-space-route]').forEach(button => button.addEventListener('click', () => {
            this.ui.activeApp = button.dataset.spaceRoute;
            if (this.ui.activeApp === 'home') this.renderHome();
            else this.renderActiveApp();
        }));
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

        if (!notification.read) {
            const notificationSystem = this.gateway.application?.registry?.notificationSystem;
            let markedRead = false;
            if (!Array.isArray(notificationState) && typeof notificationSystem?.markRead === 'function') {
                markedRead = notificationSystem.markRead(this.gateway.state, notification.id);
            } else {
                // Compatibilité défensive pour un état legacy ou un gateway de test sans domaine monté.
                notification.read = true;
                if (notificationState && !Array.isArray(notificationState)) {
                    notificationState.unreadCount = Math.max(0, Number(notificationState.unreadCount || 0) - 1);
                }
                markedRead = true;
            }
            if (markedRead) this.gateway.saveCareer?.();
        }

        const type = String(notification.type || notification.category || '').toLowerCase();
        if (/media|média|social|family|famille|coach|relationship/.test(type)) {
            this.ui.activeApp = 'life';
            this.renderActiveApp();
            return notification;
        }
        if (/transfer|mercato|scout/.test(type)) {
            this.renderHome();
            return notification;
        }

        const title = escapeHtml(notification.title || 'Actualité');
        const message = escapeHtml(notification.body || notification.message || notification.description || '');
        const overlay = document.createElement('div');
        overlay.className = 'event-modal-overlay';
        overlay.dataset.notificationModal = 'true';
        overlay.innerHTML = `<div class="event-modal-card" role="dialog" aria-modal="true" aria-label="${title}"><h2 class="event-modal-title">${title}</h2><p class="event-modal-desc">${message}</p><button type="button" class="btn-event-choice" data-close-notification>Fermer</button></div>`;
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
