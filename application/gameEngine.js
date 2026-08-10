// application/gameEngine.js
// Bootstrap applicatif unique. Le domaine est assemblé ici ; la racine reste
// réservée au point d'entrée web et aux compatibilités encore nécessaires.

import { UserInterface } from '../ui.js';
import { StateManager } from '../state/stateManager.js';
import GameApplication from './gameApplication.js';
import { UIGateway } from './uiGateway.js';
import { createSystemRegistry } from './systemRegistry.js';
import { bindEngineToRegistry } from './engineFacade.js';
import ViewCoordinator from '../ui/viewCoordinator.js';

export class GameEngine {
    constructor() {
        this.state = StateManager.load();
        this.gameSystems = createSystemRegistry({ engine: this });
        this.socialSystem = this.gameSystems.socialSystem;
        this.mediaSystem = this.gameSystems.mediaSystem;
        this.worldSystem = this.gameSystems.seasonSystem.worldSystem;
        this.competitionSystem = this.gameSystems.calendarSystem.competitionSystem;
        this.cupSystem = this.gameSystems.seasonSystem.cupSystem;

        if (this.state?.player) {
            this.state = this.gameSystems.careerApplication.migrate(this.state);
        }

        bindEngineToRegistry(this, this.gameSystems);

        this.gameApp = new GameApplication({ engine: this, registry: this.gameSystems });
        this.gameApp.start();

        this.gameUI = new UIGateway({ application: this.gameApp, engine: this });
        this.ui = new UserInterface(this);
        this.ui.engine = this.gameUI;
        this.ui.gateway = this.gameUI;

        this.viewCoordinator = new ViewCoordinator({ ui: this.ui, gateway: this.gameUI }).install();
    }
}

export default GameEngine;
