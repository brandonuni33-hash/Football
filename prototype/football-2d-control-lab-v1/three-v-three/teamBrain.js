import { FIELD, RULES, TEAM, clamp, distance, normalize } from "./constants.js";
import { getOwner } from "./matchState.js";
import { teamDirection } from "./possession.js";

export const ATTACK_ROLE = Object.freeze({ SUPPORT: "support", DEPTH: "depth" });
export const DEFEND_ROLE = Object.freeze({ PRESSURE: "press", COVER: "cover", BALANCE: "balance" });

function goalX(team) { return team === TEAM.HOME ? FIELD.width - FIELD.inset : FIELD.inset; }
function ownGoalX(team) { return team === TEAM.HOME ? FIELD.inset : FIELD.width - FIELD.inset; }

function segmentClearance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= 0.001) return distance(point, start);
  const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1);
  return Math.hypot(point.x - (start.x + dx * t), point.y - (start.y + dy * t));
}

export function evaluatePassingLane(state, passer, receiver) {
  const opponents = state.players.filter((entry) => entry.team !== passer.team);
  const nearestClearance = Math.min(...opponents.map((entry) => segmentClearance(entry, passer, receiver)));
  const blocked = nearestClearance < RULES.passLaneBlockRadius;
  const direction = teamDirection(passer.team);
  const progress = (receiver.x - passer.x) * direction;
  const range = distance(passer, receiver);
  const receiverSpace = Math.min(...opponents.map((entry) => distance(entry, receiver)));
  const score = (blocked ? -75 : 20)
    + clamp(nearestClearance - RULES.passLaneBlockRadius, 0, 90) * 0.35
    + clamp(receiverSpace, 0, 130) * 0.25
    + clamp(progress, -100, 220) * 0.16
    - Math.max(0, range - 360) * 0.16;
  return { blocked, nearestClearance, receiverSpace, progress, range, score };
}

function attackAssignments(state, team, owner) {
  const offBall = state.players.filter((entry) => entry.team === team && entry.id !== owner.id);
  const ranked = offBall.map((entry) => ({ entry, gap: distance(entry, owner) })).sort((a, b) => a.gap - b.gap);
  return new Map(ranked.map(({ entry }, index) => [entry.id, index === 0 ? ATTACK_ROLE.SUPPORT : ATTACK_ROLE.DEPTH]));
}

function attackTarget(state, player, role, owner) {
  const direction = teamDirection(player.team);
  const upperLane = owner.y >= FIELD.height / 2;
  if (role === ATTACK_ROLE.SUPPORT) {
    return {
      x: clamp(owner.x - direction * 92, FIELD.inset + 55, FIELD.width - FIELD.inset - 55),
      y: clamp(owner.y + (upperLane ? -82 : 82), 92, FIELD.height - 92),
    };
  }
  return {
    x: clamp(owner.x + direction * 145, FIELD.inset + 65, FIELD.width - FIELD.inset - 65),
    y: clamp(owner.y + (upperLane ? 112 : -112), 78, FIELD.height - 78),
  };
}

function pressureSuitability(player, owner) {
  const recovering = (player.recoveryRemaining ?? 0) > 0 ? 180 : 0;
  const committed = player.supportState === "COMMITTED" ? 90 : 0;
  const goalSideBonus = Math.abs(player.x - ownGoalX(player.team)) < Math.abs(owner.x - ownGoalX(player.team)) ? -18 : 12;
  return distance(player, owner) + recovering + committed + goalSideBonus;
}

function defenseAssignments(state, team, owner) {
  const ranked = state.players
    .filter((entry) => entry.team === team)
    .map((entry) => ({ entry, score: pressureSuitability(entry, owner) }))
    .sort((a, b) => a.score - b.score);
  return new Map(ranked.map(({ entry }, index) => [entry.id, index === 0 ? DEFEND_ROLE.PRESSURE : index === 1 ? DEFEND_ROLE.COVER : DEFEND_ROLE.BALANCE]));
}

function defensiveTarget(state, player, role, owner) {
  const ownGoal = { x: ownGoalX(player.team), y: FIELD.height / 2 };
  const toGoal = normalize(ownGoal.x - owner.x, ownGoal.y - owner.y);
  if (role === DEFEND_ROLE.PRESSURE) {
    const inside = owner.y < FIELD.height / 2 ? 1 : -1;
    return { x: owner.x + toGoal.x * 38, y: owner.y + toGoal.y * 38 + inside * 10 };
  }
  if (role === DEFEND_ROLE.COVER) {
    return { x: owner.x + toGoal.x * 118, y: owner.y + toGoal.y * 118 };
  }
  const otherThreat = state.players
    .filter((entry) => entry.team === owner.team && entry.id !== owner.id)
    .sort((a, b) => Math.abs(a.x - ownGoal.x) - Math.abs(b.x - ownGoal.x))[0];
  return otherThreat
    ? { x: (otherThreat.x + ownGoal.x) / 2, y: (otherThreat.y + ownGoal.y) / 2 }
    : { x: (owner.x + ownGoal.x) / 2, y: FIELD.height / 2 };
}

export function buildTeamPlan(state, team) {
  const owner = getOwner(state);
  if (!owner) return { team, phase: "loose", assignments: new Map(), targets: new Map() };
  if (owner.team === team) {
    const assignments = attackAssignments(state, team, owner);
    const targets = new Map([...assignments].map(([id, role]) => {
      const player = state.players.find((entry) => entry.id === id);
      return [id, attackTarget(state, player, role, owner)];
    }));
    return { team, phase: "attack", ownerId: owner.id, assignments, targets };
  }
  const assignments = defenseAssignments(state, team, owner);
  const targets = new Map([...assignments].map(([id, role]) => {
    const player = state.players.find((entry) => entry.id === id);
    return [id, defensiveTarget(state, player, role, owner)];
  }));
  return { team, phase: "defend", ownerId: owner.id, assignments, targets };
}

export function tacticalRole(state, player) {
  return buildTeamPlan(state, player.team).assignments.get(player.id) ?? "shape";
}

export function distanceToGoal(player) { return Math.abs(goalX(player.team) - player.x); }
