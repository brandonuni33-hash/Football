// domain/transfer/transferSystem.js
// Façade de migration pour les opérations de transfert du joueur.
// La logique historique reste dans TransferMarket/GameEngine tant que la
// migration complète n'est pas terminée.

export class TransferSystem {
    constructor({ transferMarket, careerSystem, playerLogic, stateManager } = {}) {
        Object.assign(this, { transferMarket, careerSystem, playerLogic, stateManager });
    }

    generateOffer(state) {
        const player = state?.player;
        if (!player || player.isInjured) return null;
        if (player.age < 22) return this.careerSystem.recruitmentOffer(player);
        return Math.random() < 0.08
            ? this.transferMarket.generateTransferOffer(player)
            : null;
    }

    accept(state) {
        const offer = state?.pendingTransferOffer;
        if (!offer) return null;
        const result = this.transferMarket.acceptTransferOffer?.(state, offer);
        state.pendingTransferOffer = null;
        this.playerLogic.syncProgressionFromCanonical(state.player);
        this.stateManager.save(state);
        return result;
    }

    reject(state) {
        const offer = state?.pendingTransferOffer;
        if (!offer) return null;
        const result = this.transferMarket.rejectTransferOffer?.(state, offer) ?? offer;
        state.pendingTransferOffer = null;
        this.stateManager.save(state);
        return result;
    }
}

export default TransferSystem;
