// domain/world/worldActivationPolicy.js
// Détermine la profondeur de simulation sans simuler ni raconter quoi que ce soit.

import { SIMULATION_DEPTH } from './worldModel.js';

const unique = values => [...new Set((values || []).filter(Boolean).map(String))];

export function buildWorldActivationPlan({ playerClubId = null, playerLeagueId = null, clubs = [], relevantClubIds = [], directOpponentClubIds = [], interestedClubIds = [] } = {}) {
    const bubble = new Set();
    const active = new Set();

    if (playerClubId) bubble.add(String(playerClubId));

    for (const club of clubs) {
        if (!club?.id) continue;
        if (playerLeagueId && club.leagueId === playerLeagueId) active.add(String(club.id));
    }

    for (const id of unique([...relevantClubIds, ...directOpponentClubIds, ...interestedClubIds])) active.add(id);
    for (const id of bubble) active.delete(id);

    const clubDepth = {};
    for (const club of clubs) {
        if (!club?.id) continue;
        const id = String(club.id);
        clubDepth[id] = bubble.has(id)
            ? SIMULATION_DEPTH.BUBBLE
            : active.has(id)
                ? SIMULATION_DEPTH.ACTIVE
                : SIMULATION_DEPTH.GLOBAL;
    }

    return {
        bubbleClubIds: [...bubble],
        activeClubIds: [...active],
        globalClubIds: Object.entries(clubDepth).filter(([, depth]) => depth === SIMULATION_DEPTH.GLOBAL).map(([id]) => id),
        clubDepth
    };
}

export function applyWorldActivationPlan(worldModelState, plan, reason = 'career_context') {
    if (!worldModelState || !plan) return worldModelState;
    worldModelState.clubDepth = { ...(plan.clubDepth || {}) };
    worldModelState.relevantClubIds = unique([...(plan.bubbleClubIds || []), ...(plan.activeClubIds || [])]);
    worldModelState.lastActivationReason = String(reason || 'career_context');

    for (const player of Object.values(worldModelState.players || {})) {
        const clubDepth = player?.clubId ? worldModelState.clubDepth[player.clubId] : null;
        if (!player?.detail || !clubDepth) continue;
        player.detail.depth = clubDepth;
        player.detail.materialized = clubDepth !== SIMULATION_DEPTH.GLOBAL;
    }
    return worldModelState;
}

export const WorldActivationPolicy = Object.freeze({
    buildPlan: buildWorldActivationPlan,
    applyPlan: applyWorldActivationPlan
});

export default WorldActivationPolicy;
