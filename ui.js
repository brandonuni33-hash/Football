// ui.js
// Façade UI historique conservée pour compatibilité avec application/gameEngine.js.
// Le rendu dashboard, les applications, la création et les modales vivent désormais dans ui/.

import { installCoreStyles } from './ui/coreStyles.js';
import { installNotificationStyles } from './ui/notificationStyles.js';
import CreationController from './ui/creationController.js';
import PlayerCreationFlowController from './ui/playerCreationFlowController.js';
import ModalController from './ui/modalController.js';
import BlockResultController from './ui/blockResultController.js';

export class UserInterface {
    constructor(gameEngine) {
        this.engine = gameEngine;
        this.gateway = null;
        this.currentStep = 1;
        this.activeApp = 'home';
        this.selectedData = {};
        this.randomYouthClubs = [];
        installCoreStyles();
        installNotificationStyles();
        this.creationController = new CreationController(this);
        this.playerCreationFlowController = new PlayerCreationFlowController(this);
        this.modalController = new ModalController(this);
        this.blockResultController = new BlockResultController(this, this.modalController);
        this.initDOM();
    }

    init() { this.render(); }

    initDOM() {
        let app = document.getElementById('app');
        if (!app) {
            app = document.createElement('div');
            app.id = 'app';
            document.body?.appendChild(app);
        }
        window.UI = this;
        return app;
    }

    render() {
        if (this.gateway?.state?.player || this.engine?.state) {
            return this.viewCoordinator?.renderDashboard?.(this.gateway?.state || this.engine?.state) || '';
        }
        const app = this.initDOM();
        return this.playerCreationFlowController.render();
    }

    renderDashboard(state = this.gateway?.state || this.engine?.state) {
        return this.viewCoordinator?.renderDashboard?.(state) || '';
    }

    renderActiveApp() {
        return this.viewCoordinator?.renderActiveApp?.() || this.renderDashboard();
    }

    renderSpecificAppContent() {
        return this.viewCoordinator?.renderAppContent?.(this.activeApp) || '';
    }

    isStepValid() { return this.creationController.isValid(); }
    bindStepEvents() { return this.creationController.bind(); }

    handleBlockResult(result) { return this.blockResultController.handleBlockResult(result); }
    handlePostInteraction() { return this.blockResultController.handlePostInteraction(); }

    afficherMessageModal(title, description) { return this.modalController.afficherMessageModal(title, description); }
    afficherModaleEvent(event, callback) { return this.modalController.afficherModaleEvent(event, callback); }
    afficherModaleCoach(event, callback) { return this.modalController.afficherModaleCoach(event, callback); }
    afficherModaleTransfer(offer) { return this.modalController.afficherModaleTransfer(offer); }
    afficherModaleConsequences(result, callback) { return this.modalController.afficherModaleConsequences(result, callback); }
    afficherModaleMatchDilemma(dilemma, callback) { return this.modalController.afficherModaleMatchDilemma(dilemma, callback); }
}

export default UserInterface;
