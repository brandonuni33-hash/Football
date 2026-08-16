import { clamp, dot, normalize } from "./constants.js";

export const SUPPORT_STATE = Object.freeze({
  BALANCED: "BALANCED",
  LEANING_LEFT: "LEANING_LEFT",
  LEANING_RIGHT: "LEANING_RIGHT",
  COMMITTED: "COMMITTED",
  RECOVERING: "RECOVERING",
});

export function tickFootwork(player, dt) {
  player.supportLockRemaining = Math.max(0, (player.supportLockRemaining ?? 0) - dt);
  player.feintCooldown = Math.max(0, (player.feintCooldown ?? 0) - dt);
  if ((player.recoveryRemaining ?? 0) > 0) player.supportState = SUPPORT_STATE.RECOVERING;
  else if ((player.tackleRemaining ?? 0) > 0) player.supportState = SUPPORT_STATE.COMMITTED;
  else if ((player.supportLockRemaining ?? 0) <= 0) player.supportState = SUPPORT_STATE.BALANCED;
}

export function updateSupportState(player, move) {
  if ([SUPPORT_STATE.COMMITTED, SUPPORT_STATE.RECOVERING].includes(player.supportState)) return;
  if ((player.supportLockRemaining ?? 0) > 0) return;
  if (move.magnitude < 0.12) {
    if ((player.supportLockRemaining ?? 0) <= 0) player.supportState = SUPPORT_STATE.BALANCED;
    return;
  }
  const facing = normalize(player.facingX, player.facingY);
  const side = facing.x * move.y - facing.y * move.x;
  if (Math.abs(side) > 0.22) player.supportState = side < 0 ? SUPPORT_STATE.LEANING_LEFT : SUPPORT_STATE.LEANING_RIGHT;
}

export function footworkAccelerationScale(player, move) {
  if (player.supportState === SUPPORT_STATE.RECOVERING) return 0.25;
  if (player.supportState === SUPPORT_STATE.COMMITTED) return 0.45;
  const facing = normalize(player.facingX, player.facingY);
  const side = facing.x * move.y - facing.y * move.x;
  const oppositeLean = (player.supportState === SUPPORT_STATE.LEANING_LEFT && side > 0.18)
    || (player.supportState === SUPPORT_STATE.LEANING_RIGHT && side < -0.18);
  const reversing = dot(normalize(player.vx, player.vy), move) < -0.25 && Math.hypot(player.vx, player.vy) > 24;
  return clamp((oppositeLean ? 0.58 : 1) * (reversing ? 0.68 : 1), 0.3, 1);
}

export function reactToBodyFeint(state, attacker, intent) {
  if ((attacker.feintCooldown ?? 0) > 0) return null;
  const defender = state.players
    .filter((entry) => entry.team !== attacker.team && (entry.recoveryRemaining ?? 0) <= 0)
    .map((entry) => ({ entry, gap: Math.hypot(entry.x - attacker.x, entry.y - attacker.y) }))
    .filter(({ gap }) => gap <= 76)
    .sort((a, b) => a.gap - b.gap)[0]?.entry;
  attacker.feintCooldown = 0.42;
  if (!defender || defender.supportState !== SUPPORT_STATE.BALANCED) return null;
  const facing = normalize(defender.facingX, defender.facingY);
  const towardAttacker = normalize(attacker.x - defender.x, attacker.y - defender.y);
  if (dot(facing, towardAttacker) < 0.25) return null;
  const read = (state.tick * 29 + defender.id.length * 11) % 100;
  const biteThreshold = clamp(55 + (attacker.ballControl ?? 65) * 0.15 - (defender.balance ?? 65) * 0.25 - (state.aiLevel ?? 50) * 0.18, 18, 70);
  if (read > biteThreshold) return null;
  const side = facing.x * intent.y - facing.y * intent.x;
  if (Math.abs(side) < 0.12) return null;
  defender.supportState = side < 0 ? SUPPORT_STATE.LEANING_LEFT : SUPPORT_STATE.LEANING_RIGHT;
  defender.supportLockRemaining = 0.24;
  return defender;
}
