import { BALL_PHASE, RULES, clamp, distance, dot, normalize, passSpeedFromLevel } from "./constants.js";
import { getPlayer, hasPossession } from "./matchState.js";
import { clearPossession } from "./possession.js";

export function requestCall(state, playerId) {
  const player = getPlayer(state, playerId);
  if (!player || hasPossession(state, playerId) || state.possession.team !== player.team) return false;
  player.callRemaining = RULES.callDuration;
  state.lastEvent = "call";
  state.eventId += 1;
  return true;
}

export function startProtection(state, playerId) {
  const player = getPlayer(state, playerId);
  if (!player || player.protectionRemaining > 0 || player.protectionCooldown > 0) return false;
  const awaitingPass = state.ball.phase === BALL_PHASE.PASS && state.ball.targetId === playerId;
  if (!hasPossession(state, playerId) && !awaitingPass) return false;
  player.protectionRemaining = RULES.protectionDuration;
  state.lastEvent = "protection";
  state.eventId += 1;
  return true;
}

function passCandidates(state, passer) {
  return state.players.filter((entry) => entry.team === passer.team && entry.id !== passer.id && entry.recoveryRemaining <= 0);
}

export function selectPassTarget(state, passerId, intent = {}) {
  const passer = getPlayer(state, passerId);
  if (!passer) return null;
  const requestedDirection = normalize(intent.x, intent.y);
  const direction = requestedDirection.magnitude > 0.15
    ? requestedDirection
    : normalize(passer.facingX, passer.facingY);
  return passCandidates(state, passer).map((candidate) => {
    const to = normalize(candidate.x - passer.x, candidate.y - passer.y);
    const directional = direction.magnitude > 0.15 ? dot(direction, to) : 0.5;
    const called = candidate.callRemaining > 0 ? 0.55 : 0;
    const rangePenalty = Math.max(0, distance(passer, candidate) - 430) / 430;
    return { candidate, score: directional + called - rangePenalty };
  }).sort((a, b) => b.score - a.score)[0]?.candidate ?? null;
}

export function startPass(state, passerId, targetId = null, intent = {}) {
  if (!hasPossession(state, passerId)) return false;
  const passer = getPlayer(state, passerId);
  const target = targetId ? getPlayer(state, targetId) : selectPassTarget(state, passerId, intent);
  if (!passer || !target || target.team !== passer.team || distance(passer, target) > 470) return false;
  const direction = normalize(target.x - passer.x, target.y - passer.y);
  clearPossession(state, BALL_PHASE.PASS);
  state.ball.x = passer.x + direction.x * 24;
  state.ball.y = passer.y + direction.y * 24;
  const passSpeed = passSpeedFromLevel(state.passSpeedLevel);
  state.ball.vx = direction.x * passSpeed;
  state.ball.vy = direction.y * passSpeed;
  state.ball.targetId = target.id;
  state.ball.lastTouchId = passer.id;
  target.receptionRemaining = RULES.receptionWindow;
  state.lastEvent = "pass";
  state.eventId += 1;
  return true;
}

export function startShot(state, playerId, intent = {}, power = 1) {
  if (!hasPossession(state, playerId)) return false;
  const player = getPlayer(state, playerId);
  const requestedDirection = normalize(intent.x, intent.y);
  const direction = requestedDirection.magnitude > 0.15
    ? requestedDirection
    : normalize(player.facingX, player.facingY);
  clearPossession(state, BALL_PHASE.SHOT);
  state.ball.x = player.x + direction.x * 24;
  state.ball.y = player.y + direction.y * 24;
  state.ball.vx = direction.x * RULES.shotSpeed * clamp(power, 0.45, 1);
  state.ball.vy = direction.y * RULES.shotSpeed * clamp(power, 0.45, 1);
  state.ball.lastTouchId = playerId;
  state.lastEvent = "shot";
  state.eventId += 1;
  return true;
}

export function startTackle(state, playerId) {
  const player = getPlayer(state, playerId);
  const owner = state.ball.ownerId ? getPlayer(state, state.ball.ownerId) : null;
  if (!player || hasPossession(state, playerId) || player.recoveryRemaining > 0 || player.tackleRemaining > 0) return false;
  player.tackleRemaining = RULES.tackleDuration;
  const close = owner && owner.team !== player.team && distance(player, owner) <= RULES.tackleRange;
  const facing = normalize(player.facingX, player.facingY);
  const toward = owner ? normalize(owner.x - player.x, owner.y - player.y) : { x: 0, y: 0 };
  const wellAngled = close && dot(facing, toward) >= RULES.tackleArcDot;
  if (wellAngled && owner.protectionRemaining <= 0) {
    owner.recoveryRemaining = 0.24;
    clearPossession(state);
    state.ball.vx = facing.x * 105;
    state.ball.vy = facing.y * 105;
    player.recoveryRemaining = RULES.tackleRecovery;
    state.lastEvent = "tackle_won";
  } else {
    player.recoveryRemaining = RULES.missedTackleRecovery;
    state.lastEvent = "tackle_missed";
  }
  state.eventId += 1;
  return true;
}

export function pressDefensiveBrake(state, playerId) {
  const player = getPlayer(state, playerId);
  if (!player || hasPossession(state, playerId) || player.recoveryRemaining > 0) return false;
  if ((player.defensiveBrakeRemaining ?? 0) > 0) {
    player.defensiveBrakeRemaining = 0;
    return startTackle(state, playerId);
  }
  player.defensiveBrakeRemaining = RULES.defensiveBrakeDuration;
  player.jockeying = true;
  state.lastEvent = "defensive_brake";
  state.eventId += 1;
  return true;
}