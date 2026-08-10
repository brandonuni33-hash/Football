// gameEngine.js
// Shell de compatibilité historique.
// Le bootstrap applicatif est installé ici afin que main.js puisse rester
// compatible avec le point d'entrée historique.

import { UserInterface } from './ui.js';
import { StateManager } from './state.js';
import GameApplication from './application/gameApplication.js';
import { UIGateway } from './application/uiGateway.js';
import { createSystemRegistry } from './application/systemRegistry.js';
import { bindEngineToRegistry } from './application/engineFacade.js';
import ViewCoordinator from './ui/viewCoordinator.js';

export class GameEngine {
    constructor() {
        this.state = StateManager.load();
        this.ui = new UserInterface(this);

        this.gameSystems = createSystemRegistry({
            engine: this,
            worldSystem: this.worldSystem,
            competitionSystem: this.competitionSystem,
            cupSystem: this.cupSystem
        });

        this.socialSystem = this.gameSystems.socialSystem;
        this.mediaSystem = this.gameSystems.mediaSystem;
        this.worldSystem = this.gameSystems.seasonSystem.worldSystem;
        this.competitionSystem = this.gameSystems.calendarSystem.competitionSystem;
        this.cupSystem = this.gameSystems.seasonSystem.cupSystem;

        if (this.state?.player) {
            this.state = this.gameSystems.careerApplication.migrate(this.state);
        }

        bindEngineToRegistry(this, this.gameSystems);

        this.gameApp = new GameApplication({
            engine: this,
            registry: this.gameSystems
        });
        this.gameApp.start();

        this.gameUI = new UIGateway({
            application: this.gameApp,
            engine: this
        });
        this.ui.engine = this.gameUI;
        this.ui.gateway = this.gameUI;

        this.viewCoordinator = new ViewCoordinator({
            ui: this.ui,
            gateway: this.gameUI
        }).install();
    }
}

export default GameEngine;
