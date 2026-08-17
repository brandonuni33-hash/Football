import * as core from "./engine.js";

export const VIEWPORT = core.VIEWPORT;
export const PITCH = core.PITCH;
export const TEAM = core.TEAM;
export const BALL_PHASE = core.BALL_PHASE;
export const RULES = core.RULES;
export const CONTROLLED_ID = core.CONTROLLED_ID;
export const getControlledPlayer = core.getControlledPlayer;
export const getPlayer = core.getPlayer;
export const getOwner = core.getOwner;
export const actionLabels = core.actionLabels;
export const controlMode = core.controlMode;
export const cameraGeometry = core.cameraGeometry;
export const isPointVisible = core.isPointVisible;

const MIDLINE = PITCH.width / 2;
const FORMATIONS = Object.freeze({
  home: Object.freeze({
    name: "4-3-3",
    slots: Object.freeze({
      "home-1": { role: "GK", line: "gk", x: 126, y: 544 },
      "home-2": { role: "RB", line: "fullback", side: "right", x: 330, y: 170 },
      "home-4": { role: "RCB", line: "centerback", x: 330, y: 410 },
      "home-5": { role: "LCB", line: "centerback", x: 330, y: 678 },
      "home-3": { role: "LB", line: "fullback", side: "left", x: 330, y: 918 },
      "home-6": { role: "DM", line: "midfield", x: 535, y: 544 },
      "home-8": { role: "CM", line: "midfield", x: 650, y: 355 },
      "home-10": { role: "CM", line: "midfield", x: 650, y: 733 },
      "home-7": { role: "RW", line: "forward", side: "right", x: 820, y: 220 },
      "home-9": { role: "ST", line: "forward", side: "center", x: 860, y: 544 },
      "home-11": { role: "LW", line: "forward", side: "left", x: 820, y: 868 },
    }),
  }),
  away: Object.freeze({
    name: "4-4-2",
    slots: Object.freeze({
      "away-1": { role: "GK", line: "gk", x: 1554, y: 544 },
      "away-2": { role: "RB", line: "fullback", side: "right", x: 1350, y: 918 },
      "away-4": { role: "RCB", line: "centerback", x: 1350, y: 678 },
      "away-5": { role: "LCB", line: "centerback", x: 1350, y: 410 },
      "away-3": { role: "LB", line: "fullback", side: "left", x: 1350, y: 170 },
      "away-7": { role: "RM", line: "midfield", side: "right", x: 1125, y: 900 },
      "away-8": { role: "CM", line: "midfield", x: 1125, y: 665 },
      "away-10": { role: "CM", line: "midfield", x: 1125, y: 423 },
      "away-6": { role: "LM", line: "midfield", side: "left", x: 1125, y: 188 },
      "away-9": { role: "ST", line: "forward", side: "right", x: 900, y: 675 },
      "away-11": { role: "ST", line: "forward", side: "left", x: 900, y: 413 },
    }),
  }),
});

const SHAPE = Object.freeze({
  correctionSpeed: 118,
  cbHalfwayMargin: 42,
  fullbackHalfwayMargin: 34,
  overlapTriggerProgress: 0.43,
  overlapLaneEdge: 330,
  overlapAdvance: 155,
  overlapMaxBeyondHalf: 310,
  backThreeXOffset: 26,
  midfieldBallShift: 0.30,
  midfieldForwardShift: 72,
  midfieldDefendDrop: 58,
  forwardBallShift: 0.22,
  forwardAdvance: 78,
  runDuration: 1.15,
  runMinCooldown: 4.0,
  runCooldownSpread: 2.8,
  runAdvance: 205,
  runCallDuration: 0.72,
  cameraPlayerWeightMin: 0.28,
  cameraPlayerWeightMax: 0.48,
  cameraWeightDistance: 620,
});

function teamDirection(team) { return team === TEAM.HOME ? 1 : -1; }
function teamKey(team) { return team === TEAM.HOME ? "home" : "away"; }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function attackProgress(team, x) {
  return team === TEAM.HOME ? x / PITCH.width : (PITCH.width - x) / PITCH.width;
}
function slotFor(player) { return FORMATIONS[teamKey(player.team)]?.slots[player.id] ?? null; }
function isCenterBack(player) { return slotFor(player)?.line === "centerback"; }
function isFullback(player) { return slotFor(player)?.line === "fullback"; }
function isForward(player) { return slotFor(player)?.line === "forward"; }

function resetPlayerToSlot(player, slot) {
  player.role = slot.line === "midfield" && ["RM", "LM"].includes(slot.role) ? "CM" : slot.role;
  player.positionLabel = slot.role;
  player.x = slot.x;
  player.y = slot.y;
  player.originX = slot.x;
  player.originY = slot.y;
  player.vx = 0;
  player.vy = 0;
  player.formationLine = slot.line;
  player.formationSide = slot.side ?? null;
}

function initialiseFormationState(state) {
  for (const player of state.players) {
    const slot = slotFor(player);
    if (slot) resetPlayerToSlot(player, slot);
  }
  const controlled = getControlledPlayer(state);
  if (controlled?.hasBall) {
    state.ball.x = controlled.x + RULES.dribbleControlDistance;
    state.ball.y = controlled.y;
  }
  state.formationTactical = {
    home: { formation: "4-3-3", overlapId: null, runnerId: null, runUntil: 0, nextRunAt: 2.8 },
    away: { formation: "4-4-2", overlapId: null, runnerId: null, runUntil: 0, nextRunAt: 3.6 },
  };
  state.tactical.home = { ...(state.tactical.home ?? {}), formation: "4-3-3" };
  state.tactical.away = { ...(state.tactical.away ?? {}), formation: "4-4-2" };
  return state;
}

export function createGameplayState() {
  return initialiseFormationState(core.createGameplayState());
}

function chooseOverlap(state, team) {
  const owner = getOwner(state);
  if (!owner || owner.team !== team) return null;
  const progress = attackProgress(team, state.ball.x);
  if (progress < SHAPE.overlapTriggerProgress) return null;

  const fullbacks = Object.entries(FORMATIONS[teamKey(team)].slots)
    .filter(([, slot]) => slot.line === "fullback")
    .map(([id, slot]) => ({ id, slot }));
  const corridor = state.ball.y <= SHAPE.overlapLaneEdge
    || state.ball.y >= PITCH.height - SHAPE.overlapLaneEdge;
  if (!corridor) return null;
  return fullbacks
    .sort((a, b) => Math.abs(a.slot.y - state.ball.y) - Math.abs(b.slot.y - state.ball.y))[0]?.id ?? null;
}

function blockShiftX(team, line, ballX, attacking) {
  const dir = teamDirection(team);
  const centered = ballX - MIDLINE;
  const lineFactor = line === "centerback" || line === "fullback" ? 0.22 : line === "midfield" ? 0.34 : 0.40;
  const phase = attacking
    ? (line === "midfield" ? SHAPE.midfieldForwardShift : line === "forward" ? SHAPE.forwardAdvance : 30)
    : (line === "midfield" ? -SHAPE.midfieldDefendDrop : line === "forward" ? -32 : -22);
  return centered * lineFactor + dir * phase;
}

function baseTarget(state, player, attacking) {
  const slot = slotFor(player);
  if (!slot) return { x: player.x, y: player.y };
  if (slot.line === "gk") {
    const y = clamp(state.ball.y, PITCH.goalTop + 40, PITCH.goalBottom - 40);
    return { x: slot.x, y };
  }

  let x = slot.x + blockShiftX(player.team, slot.line, state.ball.x, attacking);
  let y = slot.y + (state.ball.y - PITCH.height / 2) * (slot.line === "midfield" ? 0.20 : 0.12);

  if (slot.line === "midfield") {
    const dir = teamDirection(player.team);
    const defenseReference = player.team === TEAM.HOME ? 390 : PITCH.width - 390;
    const attackReference = player.team === TEAM.HOME ? 825 : PITCH.width - 825;
    const linkCenter = (defenseReference + attackReference + state.ball.x) / 3;
    x = x * 0.54 + linkCenter * 0.46 + dir * (attacking ? 18 : -10);
  }

  if (slot.line === "forward") {
    y += (state.ball.y - slot.y) * 0.10;
  }

  return {
    x: clamp(x, PITCH.inset + 28, PITCH.width - PITCH.inset - 28),
    y: clamp(y, PITCH.inset + 36, PITCH.height - PITCH.inset - 36),
  };
}

function applyBackThreeCoverage(state, team, targets, overlapId) {
  if (!overlapId) return;
  const key = teamKey(team);
  const defenders = Object.entries(FORMATIONS[key].slots)
    .filter(([id, slot]) => (slot.line === "centerback" || slot.line === "fullback") && id !== overlapId)
    .map(([id]) => getPlayer(state, id))
    .filter(Boolean)
    .sort((a, b) => a.y - b.y);

  const lanes = [PITCH.height * 0.27, PITCH.height * 0.50, PITCH.height * 0.73];
  const dir = teamDirection(team);
  defenders.forEach((player, index) => {
    const current = targets.get(player.id) ?? baseTarget(state, player, true);
    const x = current.x - dir * SHAPE.backThreeXOffset;
    targets.set(player.id, { x, y: lanes[index] ?? current.y, role: "back-three" });
  });
}

function overlapTarget(state, player) {
  const dir = teamDirection(player.team);
  const beyondHalf = player.team === TEAM.HOME
    ? MIDLINE + SHAPE.overlapMaxBeyondHalf
    : MIDLINE - SHAPE.overlapMaxBeyondHalf;
  const desiredX = state.ball.x + dir * SHAPE.overlapAdvance;
  return {
    x: player.team === TEAM.HOME
      ? clamp(desiredX, MIDLINE + 24, beyondHalf)
      : clamp(desiredX, beyondHalf, MIDLINE - 24),
    y: (slotFor(player)?.y ?? player.y) < PITCH.height / 2 ? PITCH.inset + 92 : PITCH.height - PITCH.inset - 92,
    role: "overlap",
  };
}

function eligibleRunners(state, team) {
  return state.players.filter((player) => player.team === team && isForward(player) && !player.hasBall);
}

function updateRunWindow(state, team) {
  const key = teamKey(team);
  const info = state.formationTactical[key];
  const owner = getOwner(state);
  if (!owner || owner.team !== team) {
    info.runnerId = null;
    info.runUntil = 0;
    return;
  }

  if (info.runnerId && state.elapsed >= info.runUntil) {
    const previous = getPlayer(state, info.runnerId);
    if (previous) previous.callRemaining = 0;
    info.runnerId = null;
    info.runUntil = 0;
  }

  if (!info.runnerId && state.elapsed >= info.nextRunAt) {
    const candidates = eligibleRunners(state, team).sort((a, b) => {
      const laneA = Math.abs(a.y - state.ball.y);
      const laneB = Math.abs(b.y - state.ball.y);
      return laneA - laneB || a.number - b.number;
    });
    const pick = candidates[(Math.floor(state.elapsed * 10) + (team === TEAM.HOME ? 1 : 0)) % Math.max(1, candidates.length)] ?? null;
    if (pick) {
      info.runnerId = pick.id;
      info.runUntil = state.elapsed + SHAPE.runDuration;
      pick.callRemaining = Math.max(pick.callRemaining, SHAPE.runCallDuration);
    }
    const seed = ((Math.floor(state.elapsed * 10) + (team === TEAM.HOME ? 13 : 29)) % 100) / 100;
    info.nextRunAt = state.elapsed + SHAPE.runMinCooldown + seed * SHAPE.runCooldownSpread;
  }
}

function runTarget(state, player) {
  const dir = teamDirection(player.team);
  const slot = slotFor(player);
  return {
    x: clamp(player.x + dir * SHAPE.runAdvance, PITCH.inset + 42, PITCH.width - PITCH.inset - 42),
    y: clamp(slot?.y ?? player.y, PITCH.inset + 70, PITCH.height - PITCH.inset - 70),
    role: "timed-run",
  };
}

function buildTargets(state, team) {
  const key = teamKey(team);
  const owner = getOwner(state);
  const attacking = owner?.team === team;
  const targets = new Map();
  const overlapId = attacking ? chooseOverlap(state, team) : null;
  state.formationTactical[key].overlapId = overlapId;

  for (const player of state.players.filter((entry) => entry.team === team && !entry.controlled)) {
    targets.set(player.id, baseTarget(state, player, attacking));
  }

  if (overlapId) {
    const overlap = getPlayer(state, overlapId);
    if (overlap && !overlap.hasBall) targets.set(overlap.id, overlapTarget(state, overlap));
    applyBackThreeCoverage(state, team, targets, overlapId);
  }

  updateRunWindow(state, team);
  const runnerId = state.formationTactical[key].runnerId;
  if (runnerId) {
    const runner = getPlayer(state, runnerId);
    if (runner && !runner.hasBall) targets.set(runner.id, runTarget(state, runner));
  }

  return targets;
}

function steerToTarget(player, target, dt) {
  if (!target || player.controlled || player.hasBall) return;
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const gap = Math.hypot(dx, dy);
  if (gap < 0.5) return;
  const maxStep = SHAPE.correctionSpeed * dt;
  const scale = Math.min(1, maxStep / gap);
  player.x += dx * scale;
  player.y += dy * scale;
  player.vx += dx * Math.min(0.22, dt * 7.5);
  player.vy += dy * Math.min(0.22, dt * 7.5);
  player.tacticalRole = target.role ?? player.tacticalRole ?? "shape";
}

function enforceHalfwayRules(state, team) {
  const key = teamKey(team);
  const overlapId = state.formationTactical[key].overlapId;
  for (const player of state.players.filter((entry) => entry.team === team)) {
    if (isCenterBack(player)) {
      if (team === TEAM.HOME) player.x = Math.min(player.x, MIDLINE - SHAPE.cbHalfwayMargin);
      else player.x = Math.max(player.x, MIDLINE + SHAPE.cbHalfwayMargin);
    }
    if (isFullback(player) && player.id !== overlapId) {
      if (team === TEAM.HOME) player.x = Math.min(player.x, MIDLINE - SHAPE.fullbackHalfwayMargin);
      else player.x = Math.max(player.x, MIDLINE + SHAPE.fullbackHalfwayMargin);
    }
  }

  const advanced = state.players.filter((entry) => entry.team === team && isFullback(entry)).filter((player) => (
    team === TEAM.HOME ? player.x > MIDLINE : player.x < MIDLINE
  ));
  if (advanced.length > 1) {
    for (const player of advanced) {
      if (player.id === overlapId) continue;
      player.x = team === TEAM.HOME ? MIDLINE - SHAPE.fullbackHalfwayMargin : MIDLINE + SHAPE.fullbackHalfwayMargin;
      player.vx *= 0.35;
    }
  }
}

function restrictForwardCalls(state, team) {
  const key = teamKey(team);
  const runnerId = state.formationTactical[key].runnerId;
  for (const player of state.players.filter((entry) => entry.team === team && isForward(entry))) {
    if (player.id !== runnerId && !player.controlled) player.callRemaining = Math.min(player.callRemaining, 0.08);
  }
}

function applyFormationLayer(state, dt) {
  if (!state.formationTactical) initialiseFormationState(state);
  for (const team of [TEAM.HOME, TEAM.AWAY]) {
    const targets = buildTargets(state, team);
    for (const [id, target] of targets) {
      const player = getPlayer(state, id);
      if (player) steerToTarget(player, target, dt);
    }
    enforceHalfwayRules(state, team);
    restrictForwardCalls(state, team);
    const key = teamKey(team);
    state.tactical[key] = {
      ...(state.tactical[key] ?? {}),
      formation: FORMATIONS[key].name,
      overlapId: state.formationTactical[key].overlapId,
      runnerId: state.formationTactical[key].runnerId,
    };
  }
}

export function stepGameplay(state, input = {}, dt = RULES.fixedStep) {
  const next = core.stepGameplay(state, input, dt);
  applyFormationLayer(next, Math.min(0.05, Math.max(0, dt)));
  return next;
}

export function cameraFromBall(state, settings = {}) {
  const bounds = core.cameraBounds(settings);
  const player = getControlledPlayer(state);
  if (!player) return core.cameraFromBall(state, settings);
  const gap = distance(player, state.ball);
  const playerWeight = clamp(
    SHAPE.cameraPlayerWeightMin + (gap / SHAPE.cameraWeightDistance) * 0.20,
    SHAPE.cameraPlayerWeightMin,
    SHAPE.cameraPlayerWeightMax,
  );
  const ballWeight = 1 - playerWeight;
  const targetX = state.ball.x * ballWeight + player.x * playerWeight;
  const targetY = state.ball.y * ballWeight + player.y * playerWeight;
  return {
    x: clamp(targetX, bounds.minX, bounds.maxX),
    y: clamp(targetY, bounds.minY, bounds.maxY),
    playerWeight,
  };
}

export function formationSummary(state) {
  return {
    home: state.formationTactical?.home?.formation ?? "4-3-3",
    away: state.formationTactical?.away?.formation ?? "4-4-2",
    homeOverlapId: state.formationTactical?.home?.overlapId ?? null,
    awayOverlapId: state.formationTactical?.away?.overlapId ?? null,
    homeRunnerId: state.formationTactical?.home?.runnerId ?? null,
    awayRunnerId: state.formationTactical?.away?.runnerId ?? null,
  };
}
