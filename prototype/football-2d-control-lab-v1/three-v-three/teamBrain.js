import { FIELD, RULES, TEAM, clamp, distance, normalize } from "./constants.js";
import { getOwner } from "./matchState.js";
import { teamDirection } from "./possession.js";

export const ATTACK_ROLE = Object.freeze({ SUPPORT: "support", DEPTH: "depth" });
export const DEFEND_ROLE = Object.freeze({ PRESSURE: "press", COVER: "cover", BALANCE: "balance" });
export const WIDTH_LANES = Object.freeze([105, FIELD.height / 2, FIELD.height - 105]);

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

function attackLaneAssignments(state, team, owner) {
  const ownerLane = WIDTH_LANES.reduce((best, lane) => Math.abs(owner.y - lane) < Math.abs(owner.y - best) ? lane : best, WIDTH_LANES[0]);
  const openLanes = WIDTH_LANES.filter((lane) => lane !== ownerLane).sort((a, b) => a - b);
  const offBall = state.players.filter((entry) => entry.team === team && entry.id !== owner.id).sort((a, b) => a.y - b.y);
  return new Map(offBall.map((player, index) => [player.id, openLanes[index]]));
}

function attackTarget(state, player, role, owner, laneY) {
  const direction = teamDirection(player.team);
  if (role === ATTACK_ROLE.SUPPORT) {
    return {
      x: clamp(owner.x - direction * 98, FIELD.inset + 55, FIELD.width - FIELD.inset - 55),
      y: laneY,
    };
  }
  return {
    x: clamp(owner.x + direction * 145, FIELD.inset + 65, FIELD.width - FIELD.inset - 65),
    y: laneY,
  };
}

function oneToOneMatchups(state, team) {
  const defenders = state.players.filter((entry) => entry.team === team).sort((a, b) => a.y - b.y);
  const attackers = state.players.filter((entry) => entry.team !== team).sort((a, b) => a.y - b.y);
  return new Map(defenders.map((defender, index) => [defender.id, attackers[index]?.id ?? null]));
}

function defenseAssignments(state, team, owner, matchups) {
  const defenders = state.players.filter((entry) => entry.team === team);
  let pressure = defenders.find((entry) => matchups.get(entry.id) === owner.id);
  if (!pressure || pressure.recoveryRemaining > 0) {
    pressure = defenders.filter((entry) => entry.recoveryRemaining <= 0).sort((a, b) => distance(a, owner) - distance(b, owner))[0] ?? pressure;
  }
  const remaining = defenders.filter((entry) => entry.id !== pressure?.id).sort((a, b) => {
    const threatA = state.players.find((entry) => entry.id === matchups.get(a.id));
    const threatB = state.players.find((entry) => entry.id === matchups.get(b.id));
    return Math.abs((threatA?.x ?? owner.x) - ownGoalX(team)) - Math.abs((threatB?.x ?? owner.x) - ownGoalX(team));
  });
  return new Map(defenders.map((entry) => [entry.id,
    entry.id === pressure?.id ? DEFEND_ROLE.PRESSURE : entry.id === remaining[0]?.id ? DEFEND_ROLE.COVER : DEFEND_ROLE.BALANCE]));
}

function defensiveTarget(state, player, role, owner, matchedAttacker) {
  const ownGoal = { x: ownGoalX(player.team), y: FIELD.height / 2 };
  const toGoal = normalize(ownGoal.x - owner.x, ownGoal.y - owner.y);
  if (role === DEFEND_ROLE.PRESSURE) {
    const inside = owner.y < FIELD.height / 2 ? 1 : -1;
    return { x: owner.x + toGoal.x * 38, y: owner.y + toGoal.y * 38 + inside * 10 };
  }
  const threat = matchedAttacker ?? owner;
  const goalSide = normalize(ownGoal.x - threat.x, ownGoal.y - threat.y);
  const depth = role === DEFEND_ROLE.COVER ? 54 : 68;
  return {
    x: clamp(threat.x + goalSide.x * depth, FIELD.inset + 46, FIELD.width - FIELD.inset - 46),
    y: clamp(threat.y + goalSide.y * depth * 0.28, 78, FIELD.height - 78),
  };
}

export function buildTeamPlan(state, team) {
  const owner = getOwner(state);
  if (!owner) return { team, phase: "loose", assignments: new Map(), targets: new Map() };
  if (owner.team === team) {
    const assignments = attackAssignments(state, team, owner);
    const lanes = attackLaneAssignments(state, team, owner);
    const targets = new Map([...assignments].map(([id, role]) => {
      const player = state.players.find((entry) => entry.id === id);
      return [id, attackTarget(state, player, role, owner, lanes.get(id))];
    }));
    return { team, phase: "attack", ownerId: owner.id, assignments, targets, lanes, matchups: new Map() };
  }
  const matchups = oneToOneMatchups(state, team);
  const assignments = defenseAssignments(state, team, owner, matchups);
  const targets = new Map([...assignments].map(([id, role]) => {
    const player = state.players.find((entry) => entry.id === id);
    const matchedAttacker = state.players.find((entry) => entry.id === matchups.get(id));
    return [id, defensiveTarget(state, player, role, owner, matchedAttacker)];
  }));
  return { team, phase: "defend", ownerId: owner.id, assignments, targets, matchups, lanes: new Map() };
}

export function tacticalRole(state, player) {
  return buildTeamPlan(state, player.team).assignments.get(player.id) ?? "shape";
}

export function distanceToGoal(player) { return Math.abs(goalX(player.team) - player.x); }
