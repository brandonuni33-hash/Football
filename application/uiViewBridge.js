// application/uiViewBridge.js
// Pont de migration entre l'UI historique et les nouvelles vues.
// Le shell/navigation reste historique pendant que les applications migrent.

import {
    DashboardView,
    EventView,
    CoachView,
    MediaView,
    TransferView,
    TrainingView,
    CareerView
} from '../ui/views/index.js';

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

export function installUIViewBridge(ui, gateway) {
    if (!ui || !gateway || ui.__viewBridgeInstalled) return ui;

    const legacyRenderSpecificAppContent = ui.renderSpecificAppContent?.bind(ui);
    const legacyRenderDashboard = ui.renderDashboard?.bind(ui);

    const views = {
        dashboard: new DashboardView({ ui, gateway }),
        event: new EventView({ ui, gateway }),
        coach: new CoachView({ ui, gateway }),
        media: new MediaView({ ui, gateway }),
        transfer: new TransferView({ ui, gateway }),
        training: new TrainingView({ ui, gateway }),
        career: new CareerView({ ui, gateway })
    };

    ui.views = views;
    ui.__legacyRenderDashboard = legacyRenderDashboard;
    ui.__legacyRenderSpecificAppContent = legacyRenderSpecificAppContent;
    ui.presentationEvents = [];

    ui.viewCoordinator = {
        renderDashboard(state = gateway.state) {
            return ui.__legacyRenderDashboard?.(state);
        },
        renderEvent(event) { return views.event.render(event); },
        renderCoach(event) { return views.coach.render(event); },
        renderMedia(state = gateway.state) { return views.media.render(state); },
        renderTransfer(state = gateway.state) { return views.transfer.render(state); },
        renderTraining(state = gateway.state) { return views.training.render(state); },
        renderCareer(state = gateway.state) { return views.career.render(state); }
    };

    ui.renderSpecificAppContent = function renderSpecificAppContent() {
        const viewMap = {
            social: 'media',
            transfers: 'transfer',
            training: 'training',
            career: 'career'
        };
        const viewName = viewMap[this.activeApp];
        if (MIGRATED_APPS.has(this.activeApp) && views[viewName]) {
            return views[viewName].render(gateway.state);
        }
        return legacyRenderSpecificAppContent?.() || '';
    };

    ui.renderDomainEvent = (event) => views.event.render(event);
    ui.renderCoachEvent = (event) => views.coach.render(event);
    ui.renderMediaPanel = (state = gateway.state) => views.media.render(state);

    // Le domaine publie via EventBus -> application -> CustomEvent browser.
    // L'UI écoute ici, sans jamais importer EventBus directement.
    const presentationHandlers = [];
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        PRESENTATION_EVENTS.forEach((eventName) => {
            const handler = (event) => {
                const detail = event?.detail || {};
                ui.presentationEvents.push({ name: eventName, detail, at: Date.now() });
                if (ui.presentationEvents.length > 50) ui.presentationEvents.shift();

                // Hook volontairement générique : le shell historique peut décider
                // quand remonter/repeindre le DOM sans coupler le domaine à celui-ci.
                ui.onPresentationEvent?.(eventName, detail);
            };
            window.addEventListener(eventName, handler);
            presentationHandlers.push(() => window.removeEventListener(eventName, handler));
        });
    }

    ui.destroyViewBridge = () => {
        presentationHandlers.forEach((remove) => remove());
        presentationHandlers.length = 0;
        ui.__viewBridgeInstalled = false;
    };

    ui.__viewBridgeInstalled = true;
    return ui;
}

export default installUIViewBridge;
