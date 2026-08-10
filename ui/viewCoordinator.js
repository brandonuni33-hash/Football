// ui/viewCoordinator.js
// Coordinateur unique de présentation.
// Les vues sont créées ici et l'UI historique reste le shell DOM.

import {
    DashboardView,
    EventView,
    CoachView,
    MediaView,
    TransferView,
    TrainingView,
    CareerView,
    FamilyView
} from './views/index.js';

const MIGRATED_APPS = new Set(['career', 'social', 'training', 'transfers', 'family']);

const PRESENTATION_EVENTS = [
    'game:game.block.completed',
    'game:relationship.changed',
    'game:relationship.advice',
    'game:media.post.created',
    'game:media.dilemma.created',
    'game:media.dilemma.resolved',
    'game:transfer.completed',
    'game:career.season.started',
    'game:career.season.completed',
    'game:player.recovered',
    'game:career.ended'
];

const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

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
            family: new FamilyView({ ui, gateway })
        };
        this.presentationHandlers = [];
        this.installed = false;
        this.delegatedClickHandler = null;
    }

    install() {
        if (this.installed) return this;
        this.ui.views = this.views;
        this.ui.gateway = this.gateway;
        this.ui.presentationEvents = [];

        const legacyRenderSpecificAppContent = this.ui.renderSpecificAppContent?.bind(this.ui);
        this.ui.__legacyRenderSpecificAppContent = legacyRenderSpecificAppContent;
        this.ui.viewCoordinator = this;
        this.ui.openNotification = (id) => this.openNotification(id);

        this.ui.renderSpecificAppContent = () => {
            const viewMap = { social: 'media', transfers: 'transfer', training: 'training', career: 'career', family: 'family' };
            const viewName = viewMap[this.ui.activeApp];
            if (MIGRATED_APPS.has(this.ui.activeApp) && this.views[viewName]) {
                return this.views[viewName].render(this.gateway.state, this.getTrainingFocusTypes());
            }
            return legacyRenderSpecificAppContent?.() || '';
        };

        const legacyRender = this.ui.render?.bind(this.ui);
        if (legacyRender) {
            this.ui.render = () => {
                const result = legacyRender();
                this.ensureFamilyShortcut();
                return result;
            };
        }

        this.ui.renderDomainEvent = (event) => this.renderEvent(event);
        this.ui.renderCoachEvent = (event) => this.renderCoach(event);
        this.ui.renderMediaPanel = (state = this.gateway.state) => this.renderMedia(state);

        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            PRESENTATION_EVENTS.forEach((eventName) => {
                const handler = (event) => {
                    const detail = event?.detail || {};
                    this.ui.presentationEvents.push({ name: eventName, detail, at: Date.now() });
                    if (this.ui.presentationEvents.length > 50) this.ui.presentationEvents.shift();
                    this.ui.onPresentationEvent?.(eventName, detail);
                };
                window.addEventListener(eventName, handler);
                this.presentationHandlers.push(() => window.removeEventListener(eventName, handler));
            });

            this.delegatedClickHandler = (event) => this.handleDelegatedClick(event);
            window.addEventListener('click', this.delegatedClickHandler);
            this.presentationHandlers.push(() => window.removeEventListener('click', this.delegatedClickHandler));
        }

        this.ui.destroyViewCoordinator = () => this.destroy();
        this.installed = true;
        return this;
    }

    ensureFamilyShortcut() {
        if (this.ui.activeApp !== 'home') return;
        const grid = document.querySelector('.apps-grid');
        if (!grid || grid.querySelector('[data-app="family"]')) return;

        const button = document.createElement('button');
        button.className = 'app-icon';
        button.dataset.app = 'family';
        button.type = 'button';
        button.innerHTML = `
            <div class="app-logo" style="background: linear-gradient(135deg, #be185d, #ec4899);">👨‍👩‍👦</div>
            <span class="app-label">Famille</span>
        `;
        button.addEventListener('click', () => {
            this.ui.activeApp = 'family';
            this.ui.render();
        });
        grid.appendChild(button);
    }

    getTrainingFocusTypes() {
        return this.gateway.application?.registry?.trainingSystem?.getFocusTypes?.() || {};
    }

    openNotification(id) {
        const notificationState = this.gateway.state?.notifications;
        const notifications = Array.isArray(notificationState)
            ? notificationState
            : (notificationState?.signals || []);
        const notification = notifications.find(item => String(item?.id) === String(id));
        if (!notification) return null;

        const wasUnread = !notification.read;
        notification.read = true;
        notification.readAt = new Date().toISOString();
        if (wasUnread && notificationState && !Array.isArray(notificationState)) {
            notificationState.unreadCount = Math.max(0, Number(notificationState.unreadCount || 0) - 1);
        }

        const type = String(notification.type || notification.category || '').toLowerCase();
        const app = type.includes('transfer') || type.includes('mercato') ? 'transfers'
            : type.includes('media') ? 'social'
            : type.includes('family') || type.includes('famille') || type.includes('birth') || type.includes('naissance') || type.includes('child') ? 'family'
            : null;

        if (app && this.ui) {
            this.ui.activeApp = app;
            this.ui.render?.();
            return notification;
        }

        const title = escapeHtml(notification.title || 'Notification');
        const message = escapeHtml(notification.body || notification.message || notification.description || '');
        const category = escapeHtml(notification.category || notification.type || 'INFORMATION');
        const overlay = document.createElement('div');
        overlay.className = 'event-modal-overlay';
        overlay.dataset.notificationModal = 'true';
        overlay.innerHTML = `
            <div class="event-modal-card" role="dialog" aria-modal="true" aria-label="${title}">
                <div class="event-modal-category">${category}</div>
                <h2 class="event-modal-title">${title}</h2>
                <p class="event-modal-desc">${message}</p>
                <button type="button" class="btn-event-choice" data-close-notification>Fermer</button>
            </div>
        `;
        const root = document.getElementById('app');
        (root || document.body).appendChild(overlay);
        overlay.querySelector('[data-close-notification]')?.addEventListener('click', () => overlay.remove());
        return notification;
    }

    handleDelegatedClick(event) {
        const target = event?.target?.closest?.('[data-event-choice],[data-coach-choice],[data-media-choice],[data-transfer-action],[data-training-focus],[data-career-action],[data-notification-id],[data-family-action]');
        if (!target) return;

        if (target.dataset.notificationId !== undefined) {
            event.preventDefault();
            this.openNotification(target.dataset.notificationId);
            return;
        }

        if (target.dataset.familyAction === 'simulate') {
            event.preventDefault();
            const result = this.gateway.simulateChildTo14(target.dataset.childId);
            this.ui.render?.();
            this.ui.afficherMessageModal?.('⏩ Simulation terminée', result ? 'Votre enfant a atteint l’âge requis pour commencer sa carrière.' : 'La simulation n’a pas pu être effectuée.');
            return;
        }

        if (target.dataset.familyAction === 'start') {
            event.preventDefault();
            const result = this.gateway.startSuccessorCareer(target.dataset.childId);
            if (result) {
                this.ui.activeApp = 'career';
                this.ui.render?.();
            } else {
                this.ui.afficherMessageModal?.('🔒 Seconde génération', 'Votre fils n’est pas encore éligible pour commencer sa carrière.');
            }
            return;
        }

        if (target.dataset.eventChoice !== undefined) {
            event.preventDefault();
            const result = this.gateway.resolveEventChoice(Number(target.dataset.eventChoice));
            this.ui.handleBlockResult?.(result);
            return;
        }

        if (target.dataset.coachChoice !== undefined) {
            event.preventDefault();
            const result = this.gateway.resolveCoachChoice(Number(target.dataset.coachChoice));
            this.ui.handleBlockResult?.(result);
            return;
        }

        if (target.dataset.mediaChoice !== undefined) {
            event.preventDefault();
            const result = this.gateway.resolveMediaDilemma(Number(target.dataset.mediaChoice));
            this.ui.handleBlockResult?.(result);
            return;
        }

        if (target.dataset.transferAction === 'accept') {
            event.preventDefault();
            const result = this.gateway.acceptTransferOffer();
            this.ui.handleBlockResult?.(result);
            return;
        }

        if (target.dataset.transferAction === 'reject') {
            event.preventDefault();
            this.gateway.rejectTransferOffer();
            this.ui.renderDashboard?.();
            return;
        }

        if (target.dataset.trainingFocus !== undefined) {
            event.preventDefault();
            this.gateway.setTrainingFocus(target.dataset.trainingFocus);
            this.ui.renderDashboard?.();
            return;
        }

        if (target.dataset.careerAction === 'retire') {
            event.preventDefault();
            const result = this.gateway.retireCareer();
            this.ui.handleBlockResult?.(result);
        }
    }

    renderDashboard(state = this.gateway.state) { return this.views.dashboard.render(state); }
    renderEvent(event) { return this.views.event.render(event); }
    renderCoach(event) { return this.views.coach.render(event); }
    renderMedia(state = this.gateway.state) { return this.views.media.render(state); }
    renderTransfer(offer = this.gateway.state?.pendingTransferOffer) { return this.views.transfer.render(offer); }
    renderTraining(state = this.gateway.state) { return this.views.training.render(state, this.getTrainingFocusTypes()); }
    renderCareer(state = this.gateway.state) { return this.views.career.render(state); }
    renderFamily(state = this.gateway.state) { return this.views.family.render(state); }

    bind(viewName, root, payload) {
        this.views[viewName]?.bind?.(root, payload);
    }

    destroy() {
        this.presentationHandlers.forEach((remove) => remove());
        this.presentationHandlers.length = 0;
        this.delegatedClickHandler = null;
        this.installed = false;
    }
}

export default ViewCoordinator;
