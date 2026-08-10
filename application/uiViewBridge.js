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

    ui.viewCoordinator = {
        renderDashboard(state = gateway.state) {
            // Le shell historique est conservé pendant la migration.
            return ui.__legacyRenderDashboard?.(state);
        },
        renderEvent(event) { return views.event.render(event); },
        renderCoach(event) { return views.coach.render(event); },
        renderMedia(state = gateway.state) { return views.media.render(state); },
        renderTransfer(state = gateway.state) { return views.transfer.render(state); },
        renderTraining(state = gateway.state) { return views.training.render(state); },
        renderCareer(state = gateway.state) { return views.career.render(state); }
    };

    // Le renderer d'applications devient le point de bascule central :
    // le shell reste identique, seul le contenu métier change.
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

    // Points d'entrée pour les futurs rendus pilotés par EventBus.
    ui.renderDomainEvent = (event) => views.event.render(event);
    ui.renderCoachEvent = (event) => views.coach.render(event);
    ui.renderMediaPanel = (state = gateway.state) => views.media.render(state);

    ui.__viewBridgeInstalled = true;
    return ui;
}

export default installUIViewBridge;
