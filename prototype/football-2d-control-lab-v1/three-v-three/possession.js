import { BALL_PHASE, RULES, TEAM } from "./constants.js";
import { getPlayer } from "./matchState.js";

export function clearPossession(state, phase = BALL_PHASE.FREE) {
  const previousOwner = state.ball.ownerId ? getPlayer(state, state.ball.ownerId) : null;
  if (previousOwner && phase === BALL_PHASE.FREE) {
    previousOwner.recentBallLossRemaining = RULES.recentBallLossDuration;
  }
  for (const player of state.players) {
    player.hasBall = false;
    if (!player.humanSlot) player.aiDecisionRemaining = Math.min(player.aiDecisionRemaining ?? 0, 0.1);
  }
  state.ball.ownerId = null;
  state.ball.phase = phase;
  state.possession = { team: null, playerId: null, duel: null };
}

export function givePossession(state, playerId, event = "possession") {
  const owner = getPlayer(state, playerId);
  if (!owner) return false;
  const previousTeam = state.lastPossessionTeam ?? state.possession.team;
  if (previousTeam && previousTeam !== owner.team) {
    state.lastPossessionLoss = { team: previousTeam, at: state.elapsed ?? 0 };
  }
  state.lastPossessionTeam = owner.team;
  for (const player of state.players) player.hasBall = player.id === playerId;
  state.ball.ownerId = playerId;
  state.ball.x = owner.x + owner.facingX * 23;
  state.ball.y = owner.y + owner.facingY * 23;
  state.ball.targetId = null;
  state.ball.phase = BALL_PHASE.CONTROLLED;
  state.ball.lastTouchId = playerId;
  state.ball.imprecisionFlagged = false;
  state.ball.vx = 0;
  state.ball.vy = 0;
  owner.defensiveBrakeRemaining = 0;
  owner.deepBrakeRemaining = 0;
  owner.recentBallLossRemaining = 0;
  owner.dribbleTouchRemaining = 0;
  owner.jockeying = false;
  owner.offBallShieldTargetId = null;
  state.possession = { team: owner.team, playerId, duel: null };
  state.possessionChangedAt = state.elapsed ?? 0;
  state.lastEvent = event;
  state.eventId += 1;
  return true;
}

export function teamDirection(team) { return team === TEAM.HOME ? 1 : -1; }
