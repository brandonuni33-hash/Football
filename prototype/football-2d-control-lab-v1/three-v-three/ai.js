import { RULES, TEAM, clamp, distance, normalize } from "./constants.js";
import { getOwner } from "./matchState.js";
import { startPass, startShot } from "./actions.js";
import { teamDirection } from "./possession.js";

function homePosition(player) {
  const lane = player.id.endsWith("left") ? 155 : player.id.endsWith("right") ? 385 : 270;
  if (player.team === TEAM.HOME) return { x: player.role === "support" ? 285 : 690, y: lane };
  return { x: player.role === "cover" ? 675 : 710, y: lane };
}

function moveToward(player, target, scale = 0.72) {
  const direction = normalize(target.x - player.x, target.y - player.y);
  return { moveX: direction.x * scale, moveY: direction.y * scale };
}

function teammateIntent(state, player) {
  const owner = getOwner(state);
  if (player.hasBall) {
    const goalX = player.team === TEAM.HOME ? 930 : 30;
    if (Math.abs(goalX - player.x) < 210) return { moveX: teamDirection(player.team) * 0.65, moveY: 0, shootPressed: true };
    const caller = state.players.find((entry) => entry.team === player.team && entry.callRemaining > 0);
    if (caller && distance(player, caller) < 420) return { passPressed: true, targetId: caller.id };
    return { moveX: teamDirection(player.team) * 0.66, moveY: Math.sin(state.elapsed * 0.9 + player.y) * 0.2 };
  }
  if (owner?.team === player.team) {
    const lane = homePosition(player).y;
    const targetX = owner.x + teamDirection(player.team) * (player.role === "support" ? 125 : 85);
    return moveToward(player, { x: targetX, y: lane }, 0.67);
  }
  return moveToward(player, homePosition(player), 0.58);
}

function opponentIntent(state, player) {
  const owner = getOwner(state);
  if (player.hasBall) return teammateIntent(state, player);
  if (!owner || owner.team === player.team) return teammateIntent(state, player);
  const defenders = state.players.filter((entry) => entry.team === player.team && !entry.humanSlot);
  const ranked = defenders.map((entry) => ({ entry, d: distance(entry, owner) })).sort((a, b) => a.d - b.d);
  const rank = ranked.findIndex(({ entry }) => entry.id === player.id);
  if (rank === 0) {
    const intent = moveToward(player, owner, 0.78);
    if (distance(player, owner) < RULES.tackleRange * 0.92 && player.recoveryRemaining <= 0) intent.tacklePressed = true;
    return intent;
  }
  if (rank === 1) {
    const goalX = player.team === TEAM.HOME ? 55 : 905;
    return moveToward(player, { x: (owner.x + goalX) / 2, y: owner.y + (player.y < owner.y ? -72 : 72) }, 0.62);
  }
  return moveToward(player, { x: homePosition(player).x, y: 270 }, 0.55);
}

export function collectAIInputs(state) {
  const result = {};
  const level = clamp(state.aiLevel ?? 50, 0, 100);
  const reactionInterval = 0.48 - level * 0.0038;
  const error = (100 - level) / 100;
  for (const player of state.players) {
    if (player.humanSlot) continue;
    if ((player.aiDecisionRemaining ?? 0) <= 0) {
      const ideal = player.team === state.possession.team ? teammateIntent(state, player) : opponentIntent(state, player);
      const phase = state.tick * 0.071 + player.id.length * 1.37;
      player.aiInput = {
        ...ideal,
        moveX: clamp((ideal.moveX ?? 0) + Math.sin(phase) * error * 0.24, -1, 1),
        moveY: clamp((ideal.moveY ?? 0) + Math.cos(phase * 1.17) * error * 0.24, -1, 1),
      };
      player.aiDecisionRemaining = reactionInterval;
    }
    result[player.id] = player.aiInput ?? {};
  }
  return result;
}

export function executeAIAction(state, player, input) {
  if (input.passPressed) startPass(state, player.id, input.targetId, input);
  if (input.shootPressed) startShot(state, player.id, { x: teamDirection(player.team), y: 0 }, 0.72);
}