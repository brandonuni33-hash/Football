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
    CareerView
} from './views/index.js';

const MIGRATED_APPS = new Set(['career', 'social', 'training', 'transfers']);

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
            career: new CareerView({ ui, gateway })
        };
        this.presentationHandlers = [];
        this.installed = false;
    }

    install() {
        if (this.installed) return this;
        this.ui.views = this.views;
        this.ui.gateway = this.gateway;
        this.ui.presentationEvents = [];

        const legacyRenderSpecificAppContent = this.ui.renderSpecificAppContent?.bind(this.ui);
        this.ui.__legacyRenderSpecificAppContent = legacyRenderSpecificAppContent;
        this.ui.viewCoordinator = this;

        this.ui.renderSpecificAppContent = () => {
            const viewMap = { social: 'media', transfers: 'transfer', training: 'training', career: 'career' };
            const viewName = viewMap[this.ui.activeApp];
            if (MIGRATED_APPS.has(this.ui.activeApp) && this.views[viewName]) {
                return this.views[viewName].render(this.gateway.state);
            }
            return legacyRenderSpecificAppContent?.() || '';
        };

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
        }

        this.ui.destroyViewCoordinator = () => this.destroy();
        this.installed = true;
        return this;
    }

    renderDashboard(state = this.gateway.state) { return this.views.dashboard.render(state); }
    renderEvent(event) { return this.views.event.render(event); }
    renderCoach(event) { return this.views.coach.render(event); }
    renderMedia(state = this.gateway.state) { return this.views.media.render(state); }
    renderTransfer(offer = this.gateway.state?.pendingTransferOffer) { return this.views.transfer.render(offer); }
    renderTraining(state = this.gateway.state) { return this.views.training.render(state); }
    renderCareer(state = this.gateway.state) { return this.views.career.render(state); }

    bind(viewName, root, payload) {
        this.views[viewName]?.bind?.(root, payload);
    }

    destroy() {
        this.presentationHandlers.forEach((remove) => remove());
        this.presentationHandlers.length = 0;
        this.installed = false;
    }
}

export default ViewCoordinator;
