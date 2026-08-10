// domain/career/careerLifecycleSystem.js
// Cycle de vie terminal de carrière. Aucune dépendance à l'UI.

export class CareerLifecycleSystem {
    constructor({ stateManager, playerLogic } = {}) {
        Object.assign(this, { stateManager, playerLogic });
    }

    retire(state) {
        if (!state?.player) return null;

        const player = state.player;
        if (Number(player.age) < 34) {
            return {
                retired: false,
                reason: 'Retraite disponible à partir de 34 ans.'
            };
        }

        player.retired = true;
        player.careerEnded = true;
        this.stateManager.save(state);

        return {
            retired: true,
            age: player.age,
            overall: player.overall,
            potential: player.potential
        };
    }

    reset() {
        this.stateManager.clear();
        return null;
    }
}

export default CareerLifecycleSystem;
