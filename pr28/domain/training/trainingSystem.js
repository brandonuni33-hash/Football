// domain/training/trainingSystem.js
// Façade de domaine pour la migration progressive du système d'entraînement.
// Les règles historiques restent dans entrainement.js tant qu'elles n'ont pas
// été extraites et testées indépendamment.

export class TrainingSystem {
    constructor(trainingManager) {
        if (!trainingManager) {
            throw new Error('TrainingSystem requires a training manager');
        }
        this.legacy = trainingManager;
    }

    apply(player, focus) {
        return this.legacy.applyTraining(player, focus);
    }

    isValidFocus(focus) {
        return Boolean(this.legacy.FOCUS_TYPES?.[focus]);
    }

    getFocusTypes() {
        return { ...(this.legacy.FOCUS_TYPES || {}) };
    }
}

export default TrainingSystem;
