import { BALL_PHASE, TEAM } from "./constants.js";
import { getPlayer } from "./matchState.js";

export function clearPossession(state, phase = BALL_PHASE.FREE) {
  for (const player of state.players) player.hasBall = false;
  state.ball.ownerId = null;
  state.ball.phase = phase;
  state.possession = { team: null, playerId: null, duel: null };
}

export function givePossession(state, playerId, event = "possession") {
  const owner = getPlayer(state, playerId);
  if (!owner) return false;
  for (const player of state.players) player.hasBall = player.id === playerId;
  state.ball.ownerId = playerId;
  state.ball.targetId = null;
  state.ball.phase = BALL_PHASE.CONTROLLED;
  state.ball.lastTouchId = playerId;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.possession = { team: owner.team, playerId, duel: null };
  state.lastEvent = event;
  state.eventId += 1;
  return true;
}

export function teamDirection(team) { return team === TEAM.HOME ? 1 : -1; }