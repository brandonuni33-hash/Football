import { RULES, TEAM, clamp, distance, normalize } from "./constants.js";
import { getOwner } from "./matchState.js";
import { startPass, startShot, startTackle } from "./actions.js";
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

function defensiveAssignments(state, team) {
  const owner = getOwner(state);
  const defenders = state.players.filter((entry) => entry.team === team && !entry.humanSlot);
  if (!owner || owner.team === team) return new Map();
  const ranked = defenders.map((entry) => ({ entry, d: distance(entry, owner) })).sort((a, b) => a.d - b.d);
  return new Map(ranked.map(({ entry }, index) => [entry.id, index]));
}

export function defensiveRole(state, player) {
  const owner = getOwner(state);
  const rank = defensiveAssignments(state, player.team).get(player.id) ?? 2;
  const rareTrap = !!owner
    && (owner.y < 92 || owner.y > 448)
    && Math.abs(owner.x - (player.team === TEAM.HOME ? 55 : 905)) < 245;
  if (rank === 0) return "press";
  if (rank === 1 && rareTrap) return "trap";
  if (rank === 1) return "cover";
  return "screen";
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
  const role = defensiveRole(state, player);
  if (role === "press") {
    const gap = distance(player, owner);
    const intent = gap > RULES.tackleRange * 0.82 ? moveToward(player, owner, 0.68) : { moveX: 0, moveY: 0, jockeyHeld: true };
    if (distance(player, owner) < RULES.tackleRange * 0.92 && player.recoveryRemaining <= 0) intent.tacklePressed = true;
    return intent;
  }
  if (role === "trap") {
    const insideY = owner.y < 270 ? owner.y + 32 : owner.y - 32;
    return moveToward(player, { x: owner.x - teamDirection(owner.team) * 24, y: insideY }, 0.6);
  }
  if (role === "cover") {
    const goalX = player.team === TEAM.HOME ? 55 : 905;
    const towardGoal = normalize(goalX - owner.x, 270 - owner.y);
    const side = player.y < owner.y ? -1 : 1;
    return moveToward(player, { x: owner.x + towardGoal.x * 112, y: owner.y + towardGoal.y * 112 + side * 68 }, 0.53);
  }
  const attackers = state.players.filter((entry) => entry.team === owner.team && entry.id !== owner.id);
  const danger = attackers.sort((a, b) => Math.abs(a.y - player.y) - Math.abs(b.y - player.y))[0];
  const goalX = player.team === TEAM.HOME ? 55 : 905;
  const screenTarget = danger
    ? { x: (danger.x + goalX) / 2, y: (danger.y + 270) / 2 }
    : { x: (owner.x + goalX) / 2, y: 270 };
  return moveToward(player, screenTarget, 0.48);
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
  if (input.tacklePressed) startTackle(state, player.id);
}