// application/uiViewBridge.js
// Pont de migration : branche les nouvelles vues sans réécrire ui.js d'un bloc.

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
    ui.viewCoordinator = {
        renderDashboard(state = gateway.state) {
            const app = ui.initDOM();
            if (!state) return;

            // Le dashboard est la première vue réellement migrée.
            if (!ui.activeApp || ui.activeApp === 'home') {
                app.innerHTML = views.dashboard.render(state);
                views.dashboard.bind(app);
                return;
            }

            // Les autres applications restent temporairement sur le renderer
            // historique jusqu'à leur migration individuelle.
            legacyRenderDashboard?.();
        }
    };

    ui.__legacyRenderDashboard = legacyRenderDashboard;
    ui.renderDashboard = () => ui.viewCoordinator.renderDashboard(gateway.state);
    ui.__viewBridgeInstalled = true;

    return ui;
}

export default installUIViewBridge;
