// ui/viewCoordinator.js
// Coordinateur de présentation : les vues restent pures et l'UI historique
// conserve la responsabilité du conteneur DOM pendant la migration.

import {
    DashboardView,
    EventView,
    CoachView,
    MediaView,
    TransferView,
    TrainingView,
    CareerView
} from './views/index.js';

export class ViewCoordinator {
    constructor({ ui, gateway } = {}) {
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
    }

    renderDashboard(state = this.gateway.state) {
        return this.views.dashboard.render(state);
    }

    renderEvent(event) {
        return this.views.event.render(event);
    }

    renderCoach(event) {
        return this.views.coach.render(event);
    }

    renderMedia(state = this.gateway.state) {
        return this.views.media.render(state);
    }

    renderTransfer(state = this.gateway.state) {
        return this.views.transfer.render(state);
    }

    renderTraining(state = this.gateway.state) {
        return this.views.training.render(state);
    }

    renderCareer(state = this.gateway.state) {
        return this.views.career.render(state);
    }

    bind(viewName, root, payload) {
        this.views[viewName]?.bind?.(root, payload);
    }
}

export default ViewCoordinator;
