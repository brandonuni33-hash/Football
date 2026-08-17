import { RULES, clamp } from "./constants.js";
import { fieldBounds } from "./matchState.js";

function firmness(player) {
  if ((player.protectionRemaining ?? 0) > 0) return 1.45;
  if ((player.recoveryRemaining ?? 0) > 0) return 0.82;
  return 1;
}

function clampToPitch(player) {
  player.x = clamp(player.x, fieldBounds.minX, fieldBounds.maxX);
  player.y = clamp(player.y, fieldBounds.minY, fieldBounds.maxY);
}

function resolvePair(a, b, fallbackSign = 1) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy);
  const minimumDistance = RULES.playerCollisionRadius * 2;
  if (distance >= minimumDistance) return false;

  let nx;
  let ny;
  if (distance > 0.0001) {
    nx = dx / distance;
    ny = dy / distance;
  } else {
    nx = fallbackSign;
    ny = 0;
  }

  const overlap = minimumDistance - distance;
  const firmnessA = firmness(a);
  const firmnessB = firmness(b);
  const totalFirmness = firmnessA + firmnessB;
  const moveA = overlap * (firmnessB / totalFirmness);
  const moveB = overlap * (firmnessA / totalFirmness);

  a.x -= nx * moveA;
  a.y -= ny * moveA;
  b.x += nx * moveB;
  b.y += ny * moveB;
  clampToPitch(a);
  clampToPitch(b);

  // Remove almost all velocity that drives a player through the other body,
  // while preserving tangential velocity so shoulder-to-shoulder contact can slide.
  const aIntoB = Math.max(0, a.vx * nx + a.vy * ny);
  const bIntoA = Math.max(0, -(b.vx * nx + b.vy * ny));
  const block = RULES.playerCollisionVelocityBlock;
  if (aIntoB > 0) {
    a.vx -= nx * aIntoB * block;
    a.vy -= ny * aIntoB * block;
  }
  if (bIntoA > 0) {
    b.vx += nx * bIntoA * block;
    b.vy += ny * bIntoA * block;
  }

  a.bodyContactId = b.id;
  b.bodyContactId = a.id;
  return true;
}

export function resolvePlayerCollisions(state) {
  const players = state.players ?? [];
  for (const player of players) player.bodyContactId = null;

  let contacts = 0;
  for (let iteration = 0; iteration < RULES.playerCollisionIterations; iteration += 1) {
    let resolvedThisIteration = 0;
    for (let i = 0; i < players.length; i += 1) {
      for (let j = i + 1; j < players.length; j += 1) {
        const fallbackSign = players[i].id < players[j].id ? 1 : -1;
        if (resolvePair(players[i], players[j], fallbackSign)) {
          resolvedThisIteration += 1;
          contacts += 1;
        }
      }
    }
    if (resolvedThisIteration === 0) break;
  }
  return contacts;
}
