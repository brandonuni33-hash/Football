// domain/career/careerLifecycleSystem.js
// Encapsule les opérations de cycle de vie de carrière qui ne sont pas
// liées à la simulation d'un bloc.

export class CareerLifecycleSystem {
    constructor({ stateManager, playerLogic } = {}) {
        Object.assign(this, { stateManager, playerLogic });
    }

    retire(state, retireHandler) {
        if (!state?.player) return null;
        const result = retireHandler(state);
        this.stateManager.save(state);
        return result;
    }

    reset(resetHandler) {
        return resetHandler();
    }
}

export default CareerLifecycleSystem;
