// domain/transfer/transferSystem.js
// Orchestration métier des offres de transfert du joueur.
// La génération reste fournie par TransferMarket pendant la migration.

import { EventBus } from '../../core/eventBus.js';
import { EVENTS } from '../../core/events.js';

export class TransferSystem {
    constructor({ transferMarket, careerSystem, playerLogic, stateManager, worldSystem } = {}) {
        Object.assign(this, { transferMarket, careerSystem, playerLogic, stateManager, worldSystem });
    }

    generateOffer(state) {
        const player = state?.player;
        if (!player || player.isInjured) return null;
        if (player.age < 22) return this.careerSystem.recruitmentOffer(player);
        return Math.random() < 0.08 ? this.transferMarket.generateTransferOffer(player) : null;
    }

    accept(state) {
        const offer = state?.pendingTransferOffer;
        if (!offer || !state.player) return null;

        const player = state.player;
        const oldClub = player.club;
        const newClub = this.worldSystem?.getClub?.(offer.club);

        player.club = offer.club;
        player.clubId = newClub?.id || player.clubId || null;
        player.clubCountry = newClub?.country || offer.pays || player.clubCountry;
        player.clubLevel = newClub?.tier || player.clubLevel || 1;
        player.leagueId = newClub?.leagueId || player.leagueId;
        player.clubPrestige = newClub?.prestige || offer.reputationClub || player.clubPrestige;
        player.centerStars = newClub?.centerStars || player.centerStars;
        player.salary = Number(offer.salaireHebdo) || player.salary || 0;

        if (state.social?.coachData) {
            state.social.coachData.hasLeftClub = true;
            state.social.coachData.previousClub = oldClub;
        }

        state.pendingTransferOffer = null;
        this.playerLogic.ensure(player);
        this.stateManager.save(state);

        const result = { accepted: true, oldClub, newClub: offer.club, salary: player.salary };
        EventBus.emit(EVENTS.TRANSFER_OFFER_ACCEPTED, { ...result, playerId: player.id });
        EventBus.emit(EVENTS.TRANSFER_COMPLETED, { ...result, playerId: player.id });
        return result;
    }

    reject(state) {
        const offer = state?.pendingTransferOffer;
        if (!offer) return false;
        state.pendingTransferOffer = null;
        this.stateManager.save(state);
        EventBus.emit(EVENTS.TRANSFER_OFFER_REJECTED, { playerId: state.player?.id, club: offer.club });
        return true;
    }
}

export default TransferSystem;
