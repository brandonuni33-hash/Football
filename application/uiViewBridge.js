// application/uiViewBridge.js
// Pont de migration : branche les vues spécialisées sans réécrire ui.js d'un bloc.

import {
    DashboardView,
    EventView,
    CoachView,
    MediaView,
    TransferView,
    TrainingView,
    CareerView
} from '../ui/views/index.js';

export function installUIViewBridge(ui, gateway) {
    if (!ui || !gateway || ui.__viewBridgeInstalled) return ui;

    const legacyRenderSpecificAppContent = ui.renderSpecificAppContent?.bind(ui);
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
    ui.viewCoordinator = {
        renderDashboard(state = gateway.state) {
            // Le shell historique du dashboard contient encore la navigation,
            // les widgets et les contrôles de compatibilité. On le conserve
            // jusqu'à ce que DashboardView puisse le remplacer intégralement.
            return ui.__legacyRenderDashboard?.(state);
        },
        renderEvent(event) {
            return views.event.render(event);
        },
        renderCoach(event) {
            return views.coach.render(event);
        },
        renderMedia(state = gateway.state) {
            return views.media.render(state);
        },
        renderTransfer(state = gateway.state) {
            return views.transfer.render(state);
        },
        renderTraining(state = gateway.state) {
            return views.training.render(state);
        },
        renderCareer(state = gateway.state) {
            return views.career.render(state);
        }
    };

    ui.__legacyRenderDashboard = ui.renderDashboard?.bind(ui);
    ui.__legacyRenderSpecificAppContent = legacyRenderSpecificAppContent;

    // Migration sûre : seuls les écrans dont le contrat est déjà stabilisé
    // passent par les nouvelles vues. Le shell principal reste historique.
    ui.renderSpecificAppContent = function renderSpecificAppContent() {
        const state = gateway.state;
        const viewMap = {
            social: 'media',
            transfers: 'transfer',
            training: 'training',
            career: 'career'
        };
        const viewName = viewMap[this.activeApp];
        if (viewName && views[viewName]) {
            return views[viewName].render(state);
        }
        return legacyRenderSpecificAppContent?.() || '';
    };

    // Ces méthodes deviennent les points de montage des événements quand
    // l'UI historique doit afficher un événement sans connaître son domaine.
    ui.renderDomainEvent = (event) => views.event.render(event);
    ui.renderCoachEvent = (event) => views.coach.render(event);
    ui.renderMediaPanel = (state = gateway.state) => views.media.render(state);

    ui.__viewBridgeInstalled = true;
    return ui;
}

export default installUIViewBridge;
