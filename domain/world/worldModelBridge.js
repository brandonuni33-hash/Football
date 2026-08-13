// domain/world/worldModelBridge.js
// Pont de migration : ajoute le nouveau modèle au monde existant sans remplacer WorldSystem.

import { CLUB_DATABASE } from './worldCatalog.js';
import { createClubWorldProfile, createWorldModelState } from './worldModel.js';
import { buildWorldActivationPlan, applyWorldActivationPlan } from './worldActivationPolicy.js';

export function ensureWorldModelV1(state, { clubs = CLUB_DATABASE, reason = 'ensure' } = {}) {
    if (!state) return null;
    state.world ||= {};
    state.world.model = createWorldModelState(state.world.model);
    state.world.clubProfiles ||= {};

    for (const club of clubs) {
        if (!club?.id) continue;
        state.world.clubProfiles[club.id] = createClubWorldProfile(club);
    }

    const playerClubId = state.player?.clubId || null;
    const playerLeagueId = state.player?.leagueId || (playerClubId ? state.world.clubProfiles[playerClubId]?.leagueId : null);
    const relevantClubIds = [
        ...(state.world.model.relevantClubIds || []),
        ...(state.transferInterests || []).map(interest => interest?.clubId),
        state.pendingTransferOffer?.clubId,
        state.pendingTransferOffer?.fromClubId
    ].filter(Boolean);

    const plan = buildWorldActivationPlan({
        playerClubId,
        playerLeagueId,
        clubs,
        relevantClubIds
    });
    applyWorldActivationPlan(state.world.model, plan, reason);
    return state.world.model;
}

export function registerWorldPlayer(state, playerRecord) {
    const model = ensureWorldModelV1(state, { reason: 'register_player' });
    if (!model || !playerRecord?.id) return null;
    model.players[String(playerRecord.id)] = playerRecord;
    const depth = playerRecord.clubId ? model.clubDepth[playerRecord.clubId] : null;
    if (depth && playerRecord.detail) {
        playerRecord.detail.depth = depth;
        playerRecord.detail.materialized = depth !== 'GLOBAL';
    }
    return playerRecord;
}

export const WorldModelBridge = Object.freeze({
    ensure: ensureWorldModelV1,
    registerPlayer: registerWorldPlayer
});

export default WorldModelBridge;
