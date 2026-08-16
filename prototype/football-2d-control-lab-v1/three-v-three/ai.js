import { FIELD, clamp, distance, normalize } from "./constants.js";
import { getOwner } from "./matchState.js";
import { ATTACK_ROLE, DEFEND_ROLE, buildTeamPlan, tacticalRole } from "./teamBrain.js";
import { carrierMoveIntent, chooseCarrierIntent, evaluateTackle } from "./utilityAI.js";
import { startPass, startProtection, startShot, startTackle } from "./actions.js";
import { teamDirection } from "./possession.js";

function moveToward(player, target, scale = 0.72) {
  const direction = normalize(target.x - player.x, target.y - player.y);
  return { moveX: direction.x * scale, moveY: direction.y * scale };
}

function fallbackShape(player) {
  const lane = player.id.endsWith("left") ? 155 : player.id.endsWith("right") ? 385 : FIELD.height / 2;
  const x = player.team === "home" ? 285 : FIELD.width - 285;
  return { x, y: lane };
}

export function looseBallRole(state, player) {
  if (state.ball.ownerId !== null) return "shape";
  const teammates = state.players.filter((entry) => entry.team === player.team && !entry.humanSlot);
  const ranked = teammates
    .map((entry) => ({ entry, d: distance(entry, state.ball) }))
    .sort((a, b) => a.d - b.d);
  return ranked[0]?.entry.id === player.id ? "recover" : "support";
}

function looseBallIntent(state, player) {
  if (looseBallRole(state, player) === "recover") return moveToward(player, state.ball, 0.7);
  const direction = teamDirection(player.team);
  const shape = fallbackShape(player);
  return moveToward(player, {
    x: state.ball.x - direction * 92,
    y: shape.y * 0.72 + state.ball.y * 0.28,
  }, 0.46);
}

export function attackingRole(state, player) {
  const role = tacticalRole(state, player);
  return [ATTACK_ROLE.SUPPORT, ATTACK_ROLE.DEPTH].includes(role) ? role : "shape";
}

export function defensiveRole(state, player) {
  const role = tacticalRole(state, player);
  if (role === DEFEND_ROLE.PRESSURE) return "press";
  if (role === DEFEND_ROLE.COVER && isRareTrap(state, player)) return "trap";
  return role === DEFEND_ROLE.COVER ? "cover" : role === DEFEND_ROLE.BALANCE ? "screen" : "shape";
}

function isRareTrap(state, player) {
  const owner = getOwner(state);
  if (!owner || owner.team === player.team) return false;
  const ownGoalX = player.team === "home" ? FIELD.inset : FIELD.width - FIELD.inset;
  return (owner.y < 92 || owner.y > FIELD.height - 92) && Math.abs(owner.x - ownGoalX) <= 260;
}

function carrierIntent(state, player) {
  const choice = chooseCarrierIntent(state, player);
  if (choice.type === "pass") return { passPressed: true, targetId: choice.targetId };
  if (choice.type === "shoot") return { moveX: teamDirection(player.team) * 0.25, moveY: 0, shootPressed: true };
  return { ...carrierMoveIntent(state, player, choice), protectPressed: choice.type === "protect" };
}

function attackIntent(state, player, plan) {
  const owner = getOwner(state);
  if (!owner) return looseBallIntent(state, player);
  if (player.hasBall) return carrierIntent(state, player);
  const target = plan.targets.get(player.id) ?? fallbackShape(player);
  const role = plan.assignments.get(player.id);
  return moveToward(player, target, role === ATTACK_ROLE.DEPTH ? 0.68 : 0.57);
}

function pressureIntent(state, player, owner, target) {
  const gap = distance(player, owner);
  let intent;
  if (gap > 155) intent = moveToward(player, target, 0.52);
  else if (gap > 42) intent = { ...moveToward(player, target, 0.34), jockeyHeld: true };
  else intent = { moveX: 0, moveY: 0, jockeyHeld: true };
  const aggression = 0.44 + (player.id.length % 5) * 0.08;
  const tackle = evaluateTackle(state, player, owner, aggression);
  player.aiTackleEvaluation = { score: Math.round(tackle.score * 10) / 10, gap: Math.round(tackle.gap), shouldTackle: tackle.shouldTackle };
  if (tackle.shouldTackle && player.recoveryRemaining <= 0) intent.tacklePressed = true;
  return intent;
}

function defendIntent(state, player, plan) {
  const owner = getOwner(state);
  if (!owner) return looseBallIntent(state, player);
  const role = plan.assignments.get(player.id);
  const target = plan.targets.get(player.id) ?? fallbackShape(player);
  if (role === DEFEND_ROLE.PRESSURE) return pressureIntent(state, player, owner, target);
  if (role === DEFEND_ROLE.COVER && isRareTrap(state, player)) {
    const insideY = owner.y < FIELD.height / 2 ? owner.y + 34 : owner.y - 34;
    return { ...moveToward(player, { x: owner.x - teamDirection(owner.team) * 25, y: insideY }, 0.58), jockeyHeld: true };
  }
  return { ...moveToward(player, target, role === DEFEND_ROLE.COVER ? 0.5 : 0.44), jockeyHeld: distance(player, owner) < 135 };
}

export function collectAIInputs(state) {
  const result = {};
  const level = clamp(state.aiLevel ?? 50, 0, 100);
  const reactionInterval = 0.48 - level * 0.0038;
  const error = (100 - level) / 100;
  const teams = [...new Set(state.players.map((entry) => entry.team))];
  const plans = new Map(teams.map((team) => [team, buildTeamPlan(state, team)]));
  state.teamPlans = Object.fromEntries([...plans].map(([team, plan]) => [team, {
    phase: plan.phase,
    ownerId: plan.ownerId ?? null,
    assignments: Object.fromEntries(plan.assignments),
    targets: Object.fromEntries(plan.targets),
  }]));
  for (const player of state.players) {
    if (player.humanSlot) continue;
    if ((player.aiDecisionRemaining ?? 0) <= 0) {
      const plan = plans.get(player.team);
      const ideal = state.ball.ownerId === null
        ? looseBallIntent(state, player)
        : plan.phase === "attack" ? attackIntent(state, player, plan) : defendIntent(state, player, plan);
      const phase = state.tick * 0.071 + player.id.length * 1.37;
      player.aiInput = {
        ...ideal,
        moveX: clamp((ideal.moveX ?? 0) + Math.sin(phase) * error * 0.16, -1, 1),
        moveY: clamp((ideal.moveY ?? 0) + Math.cos(phase * 1.17) * error * 0.16, -1, 1),
      };
      player.aiDecisionRemaining = reactionInterval;
    }
    result[player.id] = player.aiInput ?? {};
  }
  return result;
}

export function executeAIAction(state, player, input) {
  if (input.passPressed) startPass(state, player.id, input.targetId, input);
  if (input.protectPressed) startProtection(state, player.id);
  if (input.shootPressed) {
    const keeper = state.goalkeepers?.find((entry) => entry.team !== player.team);
    const targetY = (keeper?.y ?? FIELD.height / 2) <= FIELD.height / 2 ? FIELD.goalBottom - 18 : FIELD.goalTop + 18;
    const goalX = player.team === "home" ? FIELD.width - FIELD.inset : FIELD.inset;
    startShot(state, player.id, { x: goalX - player.x, y: targetY - player.y }, 0.72);
  }
  if (input.tacklePressed) startTackle(state, player.id);
}
