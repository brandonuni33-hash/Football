export const VIEWPORT = Object.freeze({ width: 1000, height: 540 });
export const PITCH = Object.freeze({
  width: 1680, height: 1088, inset: 68,
  goalDepth: 38, goalTop: 442, goalBottom: 646,
  penaltyDepth: 264, penaltyTop: 274, penaltyBottom: 814,
  sixYardDepth: 94, sixYardTop: 406, sixYardBottom: 682,
  centerCircleRadius: 92,
});
export const TEAM = Object.freeze({ HOME: "home", AWAY: "away" });
export const BALL_PHASE = Object.freeze({ CONTROLLED: "controlled", FREE: "free", PASS: "pass", SHOT: "shot" });
export const CONTROLLED_ID = "home-8";

export const RULES = Object.freeze({
  fixedStep: 1 / 60,
  playerRadius: 18,
  collisionRadius: 17,
  collisionIterations: 2,
  rapidSpeed: 222,
  normalPaceScale: 0.76,
  acceleration: 760,
  deceleration: 980,
  bodyTurnDegreesPerSecond: 200,
  headTurnDegreesPerSecond: 260,
  headReturnDegreesPerSecond: 210,
  aiHeadTurnDegreesPerSecond: 230,
  headScanDegrees: 180,
  visionDegrees: 120,
  scanDeadzone: 0.12,
  zoom: 0.90,
  minZoom: 0.75,
  maxZoom: 1.80,
  angle: 60,
  blindPitchAlpha: 0.035,

  controlRadius: 58,
  dribbleControlDistance: 30,
  dribbleFreedom: 0.50,
  dribbleTouchInterval: 0.145,
  dribbleTouchBaseSpeed: 34,
  dribbleTouchSpeedRatio: 0.13,
  dribbleGuideSpeed: 112,
  heavyTouchGap: 70,

  protectionDuration: 3,
  protectionCooldown: 2,
  protectionSpeedScale: 0.33,
  protectionControlDistance: 29,

  passSpeed: 335,
  passMaxRange: 720,
  passControlRadius: 28,
  passTargetLockVisual: 31,
  receptionWindow: 0.60,
  looseControlWindowRadius: 155,
  orientedTouchStartDistance: 25,
  orientedTouchShortDistance: 34,
  orientedTouchMediumDistance: 45,
  orientedTouchLongDistance: 58,
  orientedTouchShortDuration: 0.28,
  orientedTouchMediumDuration: 0.34,
  orientedTouchLongDuration: 0.42,
  orientedTouchShortBallSpeed: 58,
  orientedTouchMediumBallSpeed: 82,
  orientedTouchLongBallSpeed: 112,
  orientedTouchBallFriction: 0.94,
  orientedTouchRecontrolRadius: 48,

  shotSpeed: 540,
  defensiveBrakeDuration: 1.2,
  defensiveBrakeDeepDuration: 0.7,
  jockeySpeedScale: 0.52,
  deepJockeySpeedScale: 0.40,
  recentBallLossDuration: 0.55,
  recentBallLossReachScale: 0.64,
  naturalDuelReach: 27,
  naturalDuelCooldown: 0.55,

  callDuration: 1.6,
  manualCallPriorityBoost: 66,
  aiCallDuration: 0.9,
  aiCallCooldown: 2.6,
  aiTeamCallCooldown: 1.8,
  aiDecisionMin: 0.32,
  aiDecisionMax: 0.70,
  aiPassRange: 620,
  aiPassMinScore: 22,

  blockShiftDefense: 0.34,
  blockShiftMidfield: 0.50,
  blockShiftAttack: 0.58,
  blockShiftY: 0.18,
  attackLineAdvanceDefense: 42,
  attackLineAdvanceMidfield: 72,
  attackLineAdvanceAttack: 92,
  defendLineDropDefense: 34,
  defendLineDropMidfield: 48,
  defendLineDropAttack: 34,
  blockMinDepth: 390,
  blockMaxDepth: 610,
  teamMoveResponse: 0.74,
  aiMaxSpeedScale: 0.88,

  aiLightPressDistance: 72,
  aiContainDistance: 104,
  aiPressActivationRange: 230,
  aiPressSpeedScale: 0.78,
  aiContainSpeedScale: 0.68,

  zoneTrackRadius: 165,
  zoneTrackMaxDisplacement: 115,
  zoneGoalSideDistance: 46,

  triangleSupportBack: 116,
  triangleSupportForward: 72,
  triangleSupportWidth: 122,
  triangleDepthRun: 172,
  triangleAssignmentRadius: 360,

  goalkeeperSpeed: 154,
  goalkeeperSaveRadius: 38,
  goalkeeperHoldDistance: 32,
});

const HOME_FORMATION = [
  ["home-1", 1, "GK", 126, 544],
  ["home-2", 2, "RB", 330, 170],
  ["home-4", 4, "RCB", 330, 420],
  ["home-5", 5, "LCB", 330, 668],
  ["home-3", 3, "LB", 330, 918],
  ["home-6", 6, "DM", 500, 300],
  ["home-8", 8, "CM", 650, 544],
  ["home-10", 10, "AM", 690, 788],
  ["home-7", 7, "RW", 760, 245],
  ["home-9", 9, "ST", 810, 544],
  ["home-11", 11, "LW", 760, 843],
];

export function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
export function length(x = 0, y = 0) { return Math.hypot(x, y); }
export function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
export function normalize(x = 0, y = 0) {
  const raw = Math.hypot(x, y);
  if (raw <= 0.0001) return { x: 0, y: 0, magnitude: 0 };
  return { x: x / raw, y: y / raw, magnitude: Math.min(1, raw) };
}
function approach(value, target, amount) {
  if (value < target) return Math.min(target, value + amount);
  return Math.max(target, value - amount);
}
function teamDirection(team) { return team === TEAM.HOME ? 1 : -1; }
function attackingGoalX(team) { return team === TEAM.HOME ? PITCH.width - PITCH.inset : PITCH.inset; }
function ownGoalX(team) { return team === TEAM.HOME ? PITCH.inset : PITCH.width - PITCH.inset; }
function mirror([id, number, role, x, y]) { return [id.replace("home", "away"), number, role, PITCH.width - x, PITCH.height - y]; }
function shortestAngleDelta(from, to) {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}
function rotateVectorToward(currentX, currentY, targetX, targetY, speedDeg, dt) {
  const target = normalize(targetX, targetY);
  const current = normalize(currentX, currentY);
  if (!target.magnitude) return current;
  const from = current.magnitude ? Math.atan2(current.y, current.x) : Math.atan2(target.y, target.x);
  const to = Math.atan2(target.y, target.x);
  const maxTurn = speedDeg * Math.PI / 180 * Math.max(0, dt);
  const next = from + clamp(shortestAngleDelta(from, to), -maxTurn, maxTurn);
  return { x: Math.cos(next), y: Math.sin(next), magnitude: 1 };
}
function lineGroup(role) {
  if (role === "GK") return "gk";
  if (["RB", "LB", "RCB", "LCB"].includes(role)) return "defense";
  if (["DM", "CM", "AM"].includes(role)) return "midfield";
  return "attack";
}
function lineShiftFactor(role) {
  const group = lineGroup(role);
  if (group === "defense") return RULES.blockShiftDefense;
  if (group === "midfield") return RULES.blockShiftMidfield;
  if (group === "attack") return RULES.blockShiftAttack;
  return 0.08;
}
function attackAdvance(role) {
  const group = lineGroup(role);
  if (group === "defense") return RULES.attackLineAdvanceDefense;
  if (group === "midfield") return RULES.attackLineAdvanceMidfield;
  if (group === "attack") return RULES.attackLineAdvanceAttack;
  return 0;
}
function defendDrop(role) {
  const group = lineGroup(role);
  if (group === "defense") return RULES.defendLineDropDefense;
  if (group === "midfield") return RULES.defendLineDropMidfield;
  if (group === "attack") return RULES.defendLineDropAttack;
  return 0;
}

function makePlayer(entry, team) {
  const [id, number, role, x, y] = entry;
  const facingX = teamDirection(team);
  return {
    id, number, role, team, x, y, originX: x, originY: y,
    vx: 0, vy: 0,
    facingX, facingY: 0,
    headFacingX: facingX, headFacingY: 0,
    controlled: id === CONTROLLED_ID,
    hasBall: false,
    protectionRemaining: 0, protectionCooldown: 0,
    defensiveBrakeRemaining: 0, deepBrakeRemaining: 0,
    recoveryRemaining: 0, recentBallLossRemaining: 0,
    naturalDuelCooldown: 0,
    callRemaining: 0, aiCallCooldown: 0,
    receptionRemaining: 0,
    receptionIntentX: facingX, receptionIntentY: 0, receptionIntentMagnitude: 0,
    orientedTouchRemaining: 0, orientedTouchReleasePending: false,
    orientedTouchX: facingX, orientedTouchY: 0,
    dribbleTouchRemaining: 0,
    controlX: facingX, controlY: 0,
    aiDecisionRemaining: 0.2 + (number % 4) * 0.08,
    aiPassCooldown: 0,
    bodyFeintRemaining: 0,
    tacticalRole: "shape",
    markingMode: "zone",
    markingTargetId: null,
  };
}

export function createGameplayState() {
  const home = HOME_FORMATION.map((entry) => makePlayer(entry, TEAM.HOME));
  const away = HOME_FORMATION.map(mirror).map((entry) => makePlayer(entry, TEAM.AWAY));
  const players = [...home, ...away];
  const controlled = players.find((p) => p.id === CONTROLLED_ID);
  controlled.hasBall = true;
  return {
    tick: 0,
    elapsed: 0,
    players,
    score: { home: 0, away: 0 },
    possession: { team: TEAM.HOME, playerId: controlled.id },
    lastPossessionLoss: null,
    lastEvent: "kickoff",
    eventId: 0,
    aiTeamCallCooldown: { home: 0, away: 0 },
    tactical: {
      home: { phase: "attack", presserId: null, triangleIds: [] },
      away: { phase: "defend", presserId: null, triangleIds: [] },
    },
    ball: {
      x: controlled.x + RULES.dribbleControlDistance,
      y: controlled.y,
      vx: 0,
      vy: 0,
      phase: BALL_PHASE.CONTROLLED,
      ownerId: controlled.id,
      targetId: null,
      lastTouchId: controlled.id,
    },
  };
}

export function getPlayer(state, id) { return state.players.find((p) => p.id === id) ?? null; }
export function getControlledPlayer(state) { return getPlayer(state, CONTROLLED_ID); }
export function getOwner(state) { return state.ball.ownerId ? getPlayer(state, state.ball.ownerId) : null; }
export function hasPossession(state, id) { return state.ball.ownerId === id; }
export function actionLabels(state) {
  return hasPossession(state, CONTROLLED_ID)
    ? { primary: "TIR", secondary: "PASSE", tertiary: "PROT." }
    : { primary: "APPEL", secondary: "FREIN", tertiary: "PROT." };
}

function setOwner(state, player, reason = "control") {
  const previous = getOwner(state);
  if (previous && previous.id !== player.id) {
    previous.hasBall = false;
    previous.recentBallLossRemaining = RULES.recentBallLossDuration;
    state.lastPossessionLoss = { playerId: previous.id, team: previous.team, at: state.elapsed };
  }
  for (const p of state.players) p.hasBall = p.id === player.id;
  state.ball.ownerId = player.id;
  state.ball.targetId = null;
  state.ball.phase = BALL_PHASE.CONTROLLED;
  state.ball.lastTouchId = player.id;
  state.possession = { team: player.team, playerId: player.id };
  state.lastEvent = reason;
  state.eventId += 1;
}
function clearOwner(state, phase = BALL_PHASE.FREE) {
  const owner = getOwner(state);
  if (owner) {
    owner.hasBall = false;
    owner.recentBallLossRemaining = RULES.recentBallLossDuration;
    state.lastPossessionLoss = { playerId: owner.id, team: owner.team, at: state.elapsed };
  }
  state.ball.ownerId = null;
  state.ball.phase = phase;
  state.possession = { team: null, playerId: null };
}

function tickPlayer(p, dt) {
  const wasProtected = p.protectionRemaining > 0;
  const wasOriented = p.orientedTouchRemaining > 0;
  p.protectionRemaining = Math.max(0, p.protectionRemaining - dt);
  if (wasProtected && p.protectionRemaining === 0) p.protectionCooldown = RULES.protectionCooldown;
  p.protectionCooldown = Math.max(0, p.protectionCooldown - dt);
  p.defensiveBrakeRemaining = Math.max(0, p.defensiveBrakeRemaining - dt);
  p.deepBrakeRemaining = Math.max(0, p.deepBrakeRemaining - dt);
  p.recoveryRemaining = Math.max(0, p.recoveryRemaining - dt);
  p.recentBallLossRemaining = Math.max(0, p.recentBallLossRemaining - dt);
  p.naturalDuelCooldown = Math.max(0, p.naturalDuelCooldown - dt);
  p.callRemaining = Math.max(0, p.callRemaining - dt);
  p.aiCallCooldown = Math.max(0, p.aiCallCooldown - dt);
  p.receptionRemaining = Math.max(0, p.receptionRemaining - dt);
  p.orientedTouchRemaining = Math.max(0, p.orientedTouchRemaining - dt);
  if (wasOriented && p.orientedTouchRemaining === 0) p.orientedTouchReleasePending = true;
  p.dribbleTouchRemaining = Math.max(0, p.dribbleTouchRemaining - dt);
  p.aiDecisionRemaining = Math.max(0, p.aiDecisionRemaining - dt);
  p.aiPassCooldown = Math.max(0, p.aiPassCooldown - dt);
  p.bodyFeintRemaining = Math.max(0, p.bodyFeintRemaining - dt);
}

function clampHeadToBody(p) {
  const bodyAngle = Math.atan2(p.facingY, p.facingX);
  const headAngle = Math.atan2(p.headFacingY, p.headFacingX);
  const half = RULES.headScanDegrees * 0.5 * Math.PI / 180;
  const rel = clamp(shortestAngleDelta(bodyAngle, headAngle), -half, half);
  p.headFacingX = Math.cos(bodyAngle + rel);
  p.headFacingY = Math.sin(bodyAngle + rel);
}
function updateControlledHead(p, input, dt, mode) {
  let tx = p.facingX;
  let ty = p.facingY;
  let speed = RULES.headReturnDegreesPerSecond;
  if (["scan", "receive", "loose", "protect"].includes(mode)) {
    const right = normalize(input.controlX, input.controlY);
    if (right.magnitude >= RULES.scanDeadzone) {
      tx = right.x;
      ty = right.y;
      speed = RULES.headTurnDegreesPerSecond;
    }
  }
  const next = rotateVectorToward(p.headFacingX, p.headFacingY, tx, ty, speed, dt);
  if (next.magnitude) {
    p.headFacingX = next.x;
    p.headFacingY = next.y;
  }
  clampHeadToBody(p);
}
function updateAIHeadTowardBall(state, p, dt) {
  const toBall = normalize(state.ball.x - p.x, state.ball.y - p.y);
  if (!toBall.magnitude) return;
  const next = rotateVectorToward(
    p.headFacingX,
    p.headFacingY,
    toBall.x,
    toBall.y,
    RULES.aiHeadTurnDegreesPerSecond,
    dt,
  );
  if (next.magnitude) {
    p.headFacingX = next.x;
    p.headFacingY = next.y;
  }
}

export function isLooseBallOrientationWindow(state, player = getControlledPlayer(state)) {
  if (!player || state.ball.ownerId) return false;
  if (state.ball.phase !== BALL_PHASE.FREE) return false;
  return distance(player, state.ball) <= RULES.looseControlWindowRadius;
}

export function controlMode(state, player = getControlledPlayer(state)) {
  if (!player) return "scan";
  const targeted = state.ball.phase === BALL_PHASE.PASS && state.ball.targetId === player.id;
  if (targeted) return "receive";
  if (isLooseBallOrientationWindow(state, player)) return "loose";
  if (player.protectionRemaining > 0) return "protect";
  if (player.hasBall) return Math.hypot(player.vx, player.vy) < 18 ? "feint" : "locked";
  return "scan";
}

function moveControlled(state, p, input, dt) {
  tickPlayer(p, dt);
  let move = normalize(input.moveX, input.moveY);
  if (p.recoveryRemaining > 0) move = { x: 0, y: 0, magnitude: 0 };
  let speedScale = input.rapidHeld ? 1 : RULES.normalPaceScale;
  if (p.defensiveBrakeRemaining > 0 && !p.hasBall) {
    speedScale = p.deepBrakeRemaining > 0 ? RULES.deepJockeySpeedScale : RULES.jockeySpeedScale;
  }
  if (p.protectionRemaining > 0) speedScale = Math.min(speedScale, RULES.protectionSpeedScale);
  const targetVx = move.x * RULES.rapidSpeed * move.magnitude * speedScale;
  const targetVy = move.y * RULES.rapidSpeed * move.magnitude * speedScale;
  const accel = move.magnitude ? RULES.acceleration : RULES.deceleration;
  p.vx = approach(p.vx, targetVx, accel * dt);
  p.vy = approach(p.vy, targetVy, accel * dt);
  p.x = clamp(p.x + p.vx * dt, PITCH.inset + 24, PITCH.width - PITCH.inset - 24);
  p.y = clamp(p.y + p.vy * dt, PITCH.inset + 24, PITCH.height - PITCH.inset - 24);

  if (p.defensiveBrakeRemaining > 0 && !p.hasBall) {
    const owner = getOwner(state);
    if (owner && owner.team !== p.team) {
      const face = normalize(owner.x - p.x, owner.y - p.y);
      if (face.magnitude) {
        p.facingX = face.x;
        p.facingY = face.y;
      }
    }
  } else if (move.magnitude > 0.08) {
    const next = rotateVectorToward(p.facingX, p.facingY, move.x, move.y, RULES.bodyTurnDegreesPerSecond, dt);
    p.facingX = next.x;
    p.facingY = next.y;
  }

  const mode = controlMode(state, p);
  updateControlledHead(p, input, dt, mode);
  const right = normalize(input.controlX, input.controlY);

  if ((mode === "receive" || mode === "loose") && right.magnitude > 0.08) {
    p.receptionIntentX = right.x;
    p.receptionIntentY = right.y;
    p.receptionIntentMagnitude = right.magnitude;
  } else if (mode !== "receive" && mode !== "loose") {
    p.receptionIntentMagnitude = 0;
  }

  if (mode === "protect" && right.magnitude > 0.08) {
    p.controlX = right.x;
    p.controlY = right.y;
    p.facingX = right.x;
    p.facingY = right.y;
  } else if (mode === "feint" && right.magnitude > 0.55) {
    p.controlX = right.x;
    p.controlY = right.y;
    p.bodyFeintRemaining = 0.32;
    p.facingX = right.x;
    p.facingY = right.y;
    state.lastEvent = "body_feint";
  }
}

function passLaneClearance(state, passer, receiver) {
  const dx = receiver.x - passer.x;
  const dy = receiver.y - passer.y;
  const lengthSq = dx * dx + dy * dy;
  let nearest = Infinity;
  for (const opponent of state.players) {
    if (opponent.team === passer.team) continue;
    const t = lengthSq > 0.001
      ? clamp(((opponent.x - passer.x) * dx + (opponent.y - passer.y) * dy) / lengthSq, 0, 1)
      : 0;
    const px = passer.x + dx * t;
    const py = passer.y + dy * t;
    nearest = Math.min(nearest, Math.hypot(opponent.x - px, opponent.y - py));
  }
  return nearest;
}

function selectPassTarget(state, passer, intent = {}) {
  const requested = normalize(intent.controlX ?? intent.x, intent.controlY ?? intent.y);
  const dir = requested.magnitude > 0.18 ? requested : normalize(passer.facingX, passer.facingY);
  const mates = state.players.filter((p) => p.team === passer.team && p.id !== passer.id && p.recoveryRemaining <= 0);
  return mates.map((candidate) => {
    const to = normalize(candidate.x - passer.x, candidate.y - passer.y);
    const alignment = dir.x * to.x + dir.y * to.y;
    const call = candidate.callRemaining > 0 ? 0.75 : 0;
    const range = distance(passer, candidate);
    const opponents = state.players.filter((p) => p.team !== passer.team);
    const space = Math.min(...opponents.map((o) => distance(o, candidate)));
    const lane = passLaneClearance(state, passer, candidate);
    return {
      candidate,
      score: alignment * 1.25 + call + clamp(space, 0, 180) / 300 + clamp(lane, 0, 100) / 260 - Math.max(0, range - 520) / 700,
    };
  }).filter((item) => distance(passer, item.candidate) <= RULES.passMaxRange)
    .sort((a, b) => b.score - a.score)[0]?.candidate ?? null;
}

export function startPass(state, passer, input = {}, forcedTargetId = null) {
  if (!passer?.hasBall) return false;
  const target = forcedTargetId ? getPlayer(state, forcedTargetId) : selectPassTarget(state, passer, input);
  if (!target || target.team !== passer.team) return false;
  const dir = normalize(target.x - passer.x, target.y - passer.y);
  if (!dir.magnitude) return false;
  clearOwner(state, BALL_PHASE.PASS);
  state.ball.x = passer.x + dir.x * 26;
  state.ball.y = passer.y + dir.y * 26;
  state.ball.vx = dir.x * RULES.passSpeed;
  state.ball.vy = dir.y * RULES.passSpeed;
  state.ball.targetId = target.id;
  state.ball.lastTouchId = passer.id;
  target.receptionRemaining = RULES.receptionWindow;
  passer.aiPassCooldown = 0.8;
  state.lastEvent = "pass_locked";
  state.eventId += 1;
  return true;
}
export function startShot(state, p, input = {}) {
  if (!p?.hasBall) return false;
  const requested = normalize(input.controlX ?? input.x, input.controlY ?? input.y);
  const goal = { x: attackingGoalX(p.team), y: PITCH.height / 2 };
  const dir = requested.magnitude > 0.18 ? requested : normalize(goal.x - p.x, goal.y - p.y);
  clearOwner(state, BALL_PHASE.SHOT);
  state.ball.x = p.x + dir.x * 27;
  state.ball.y = p.y + dir.y * 27;
  state.ball.vx = dir.x * RULES.shotSpeed;
  state.ball.vy = dir.y * RULES.shotSpeed;
  state.ball.targetId = null;
  state.ball.lastTouchId = p.id;
  state.lastEvent = "shot";
  state.eventId += 1;
  return true;
}
export function startProtection(state, p) {
  if (!p || p.protectionRemaining > 0 || p.protectionCooldown > 0) return false;
  const awaiting = state.ball.phase === BALL_PHASE.PASS && state.ball.targetId === p.id;
  if (!p.hasBall && !awaiting && state.possession.team !== p.team) return false;
  p.protectionRemaining = RULES.protectionDuration;
  state.lastEvent = "protection";
  state.eventId += 1;
  return true;
}
export function requestCall(state, p) {
  if (!p || p.hasBall || state.possession.team !== p.team) return false;
  p.callRemaining = RULES.callDuration;
  state.lastEvent = "call";
  state.eventId += 1;
  return true;
}
export function pressBrake(state, p) {
  if (!p || p.hasBall || p.recoveryRemaining > 0) return false;
  if (p.defensiveBrakeRemaining > 0) {
    p.deepBrakeRemaining = RULES.defensiveBrakeDeepDuration;
    p.defensiveBrakeRemaining = Math.max(p.defensiveBrakeRemaining, RULES.defensiveBrakeDeepDuration);
    state.lastEvent = "brake_deep";
  } else {
    p.defensiveBrakeRemaining = RULES.defensiveBrakeDuration;
    p.deepBrakeRemaining = 0;
    state.lastEvent = "brake";
  }
  state.eventId += 1;
  return true;
}

function applyHumanActions(state, input) {
  const p = getControlledPlayer(state);
  if (!p) return;
  if (input.primaryPressed) p.hasBall ? startShot(state, p, input) : requestCall(state, p);
  if (input.secondaryPressed) p.hasBall ? startPass(state, p, input) : pressBrake(state, p);
  if (input.tertiaryPressed) startProtection(state, p);
}

function carryBall(state, owner, dt) {
  if (owner.orientedTouchRemaining > 0) {
    state.ball.x += state.ball.vx * dt;
    state.ball.y += state.ball.vy * dt;
    const friction = Math.pow(RULES.orientedTouchBallFriction, dt * 60);
    state.ball.vx *= friction;
    state.ball.vy *= friction;
    return;
  }
  if (owner.orientedTouchReleasePending) {
    owner.orientedTouchReleasePending = false;
    if (distance(owner, state.ball) > RULES.orientedTouchRecontrolRadius) {
      clearOwner(state, BALL_PHASE.FREE);
      state.ball.lastTouchId = owner.id;
      state.lastEvent = "heavy_oriented_touch";
      state.eventId += 1;
      return;
    }
  }
  const protectedControl = owner.protectionRemaining > 0;
  const fx = protectedControl ? owner.controlX : owner.facingX;
  const fy = protectedControl ? owner.controlY : owner.facingY;
  const forward = protectedControl ? RULES.protectionControlDistance : RULES.dribbleControlDistance;
  const desiredX = owner.x + fx * forward;
  const desiredY = owner.y + fy * forward;
  if (protectedControl) {
    state.ball.x = desiredX;
    state.ball.y = desiredY;
    state.ball.vx = owner.vx;
    state.ball.vy = owner.vy;
    return;
  }
  const speed = Math.hypot(owner.vx, owner.vy);
  const gap = distance(owner, state.ball);
  if (gap > RULES.heavyTouchGap) {
    clearOwner(state, BALL_PHASE.FREE);
    state.ball.lastTouchId = owner.id;
    state.lastEvent = "heavy_touch";
    state.eventId += 1;
    return;
  }
  if (speed < 9) {
    state.ball.x = approach(state.ball.x, desiredX, 300 * dt);
    state.ball.y = approach(state.ball.y, desiredY, 300 * dt);
    state.ball.vx *= 0.82;
    state.ball.vy *= 0.82;
    return;
  }
  if (owner.dribbleTouchRemaining <= 0 || gap < 17) {
    const touch = RULES.dribbleTouchBaseSpeed + speed * RULES.dribbleTouchSpeedRatio;
    state.ball.vx = owner.vx + fx * touch * RULES.dribbleFreedom + (desiredX - state.ball.x) * 1.25;
    state.ball.vy = owner.vy + fy * touch * RULES.dribbleFreedom + (desiredY - state.ball.y) * 1.25;
    owner.dribbleTouchRemaining = RULES.dribbleTouchInterval;
  }
  const freeX = state.ball.x + state.ball.vx * dt;
  const freeY = state.ball.y + state.ball.vy * dt;
  const guidedX = approach(freeX, desiredX, RULES.dribbleGuideSpeed * dt);
  const guidedY = approach(freeY, desiredY, RULES.dribbleGuideSpeed * dt);
  state.ball.x = freeX * RULES.dribbleFreedom + guidedX * (1 - RULES.dribbleFreedom);
  state.ball.y = freeY * RULES.dribbleFreedom + guidedY * (1 - RULES.dribbleFreedom);
  const friction = Math.pow(0.985, dt * 60);
  state.ball.vx *= friction;
  state.ball.vy *= friction;
}

function orientedReception(state, p) {
  const magnitude = p.receptionIntentMagnitude;
  if (magnitude <= 0.08) return;
  let duration = RULES.orientedTouchShortDuration;
  let ballSpeed = RULES.orientedTouchShortBallSpeed;
  if (magnitude >= 0.76) {
    duration = RULES.orientedTouchLongDuration;
    ballSpeed = RULES.orientedTouchLongBallSpeed;
  } else if (magnitude >= 0.42) {
    duration = RULES.orientedTouchMediumDuration;
    ballSpeed = RULES.orientedTouchMediumBallSpeed;
  }
  p.facingX = p.receptionIntentX;
  p.facingY = p.receptionIntentY;
  p.orientedTouchX = p.receptionIntentX;
  p.orientedTouchY = p.receptionIntentY;
  p.orientedTouchRemaining = duration;
  p.orientedTouchReleasePending = false;
  state.ball.x = p.x + p.orientedTouchX * RULES.orientedTouchStartDistance;
  state.ball.y = p.y + p.orientedTouchY * RULES.orientedTouchStartDistance;
  state.ball.vx = p.orientedTouchX * ballSpeed;
  state.ball.vy = p.orientedTouchY * ballSpeed;
  p.dribbleTouchRemaining = duration + 0.08;
  p.receptionIntentMagnitude = 0;
  state.lastEvent = "oriented_control";
}

function recoveryCandidate(state) {
  let best = null;
  for (const p of state.players) {
    if (p.id === state.ball.lastTouchId && (state.ball.phase === BALL_PHASE.PASS || state.ball.phase === BALL_PHASE.SHOT)) continue;
    if (p.recoveryRemaining > 0) continue;
    const reach = p.recentBallLossRemaining > 0
      ? RULES.passControlRadius * RULES.recentBallLossReachScale
      : RULES.passControlRadius;
    const gap = distance(p, state.ball);
    if (gap > reach) continue;
    const score = gap + (p.recentBallLossRemaining > 0 ? 24 : 0);
    if (!best || score < best.score) best = { player: p, score };
  }
  return best?.player ?? null;
}

function checkGoal(state, previousBall) {
  const inGoalMouth = state.ball.y >= PITCH.goalTop && state.ball.y <= PITCH.goalBottom;
  if (!inGoalMouth) return false;
  if (previousBall.x < PITCH.width - PITCH.inset && state.ball.x >= PITCH.width - PITCH.inset) {
    scoreGoal(state, TEAM.HOME);
    return true;
  }
  if (previousBall.x > PITCH.inset && state.ball.x <= PITCH.inset) {
    scoreGoal(state, TEAM.AWAY);
    return true;
  }
  return false;
}
function scoreGoal(state, team) {
  state.score[team] += 1;
  const conceding = team === TEAM.HOME ? TEAM.AWAY : TEAM.HOME;
  const restart = state.players.find((p) => p.team === conceding && p.role === "CM")
    ?? state.players.find((p) => p.team === conceding && p.role !== "GK");
  for (const p of state.players) {
    p.hasBall = false;
    p.x = p.originX;
    p.y = p.originY;
    p.vx = 0;
    p.vy = 0;
  }
  restart.hasBall = true;
  state.ball.ownerId = restart.id;
  state.ball.phase = BALL_PHASE.CONTROLLED;
  state.ball.targetId = null;
  state.ball.lastTouchId = restart.id;
  state.ball.x = restart.x + restart.facingX * RULES.dribbleControlDistance;
  state.ball.y = restart.y;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.possession = { team: conceding, playerId: restart.id };
  state.lastEvent = "goal";
  state.eventId += 1;
}

function goalkeeperSave(state) {
  if (state.ball.ownerId || state.ball.phase !== BALL_PHASE.SHOT) return false;
  for (const gk of state.players.filter((p) => p.role === "GK")) {
    if (distance(gk, state.ball) <= RULES.goalkeeperSaveRadius) {
      setOwner(state, gk, "goalkeeper_save");
      state.ball.x = gk.x + teamDirection(gk.team) * RULES.goalkeeperHoldDistance;
      state.ball.y = gk.y;
      return true;
    }
  }
  return false;
}

function stepBall(state, dt) {
  const owner = getOwner(state);
  if (owner) {
    carryBall(state, owner, dt);
    return;
  }
  const previousBall = { x: state.ball.x, y: state.ball.y };
  state.ball.x += state.ball.vx * dt;
  state.ball.y += state.ball.vy * dt;
  const friction = Math.pow(state.ball.phase === BALL_PHASE.SHOT ? 0.995 : 0.989, dt * 60);
  state.ball.vx *= friction;
  state.ball.vy *= friction;

  if (goalkeeperSave(state) || checkGoal(state, previousBall)) return;

  if (state.ball.y < PITCH.inset + 6 || state.ball.y > PITCH.height - PITCH.inset - 6) {
    state.ball.y = clamp(state.ball.y, PITCH.inset + 6, PITCH.height - PITCH.inset - 6);
    state.ball.vy *= -0.42;
  }
  if (state.ball.x < PITCH.inset + 6 || state.ball.x > PITCH.width - PITCH.inset - 6) {
    state.ball.x = clamp(state.ball.x, PITCH.inset + 6, PITCH.width - PITCH.inset - 6);
    state.ball.vx *= -0.42;
  }

  const winner = recoveryCandidate(state);
  if (winner) {
    const intendedPass = state.ball.phase === BALL_PHASE.PASS && state.ball.targetId === winner.id;
    const looseControl = state.ball.phase === BALL_PHASE.FREE && winner.controlled && winner.receptionIntentMagnitude > 0.08;
    setOwner(state, winner, intendedPass ? "reception" : "interception");
    if (intendedPass || looseControl) orientedReception(state, winner);
  }

  if (!state.ball.ownerId && Math.hypot(state.ball.vx, state.ball.vy) < 7) {
    state.ball.phase = BALL_PHASE.FREE;
    state.ball.targetId = null;
  }
}

function teamHasPossession(state, team) {
  return getOwner(state)?.team === team || state.possession.team === team;
}

function baseBlockTarget(state, p) {
  if (p.role === "GK") {
    const ownX = ownGoalX(p.team);
    return {
      x: ownX + teamDirection(p.team) * 44,
      y: clamp(state.ball.y, PITCH.goalTop + 35, PITCH.goalBottom - 35),
    };
  }

  const ownPossession = teamHasPossession(state, p.team);
  const direction = teamDirection(p.team);
  const factor = lineShiftFactor(p.role);
  const ballDeltaX = state.ball.x - PITCH.width / 2;
  const ballDeltaY = state.ball.y - PITCH.height / 2;
  let x = p.originX + ballDeltaX * factor;
  let y = p.originY + ballDeltaY * RULES.blockShiftY;

  if (ownPossession) x += direction * attackAdvance(p.role);
  else x -= direction * defendDrop(p.role);

  const blockCenter = PITCH.width / 2 + ballDeltaX * 0.46;
  const halfDepth = (ownPossession ? RULES.blockMaxDepth : RULES.blockMinDepth) / 2;
  x = clamp(x, blockCenter - halfDepth, blockCenter + halfDepth);

  if (p.role === "RW") y = Math.min(y, 235);
  if (p.role === "LW") y = Math.max(y, PITCH.height - 235);
  if (p.role === "RB") y = Math.min(y, 250);
  if (p.role === "LB") y = Math.max(y, PITCH.height - 250);

  return {
    x: clamp(x, PITCH.inset + 28, PITCH.width - PITCH.inset - 28),
    y: clamp(y, PITCH.inset + 28, PITCH.height - PITCH.inset - 28),
  };
}

function triangleSupportMap(state, team, owner) {
  if (!owner || owner.team !== team) return new Map();
  const direction = teamDirection(team);
  const candidates = state.players
    .filter((p) => p.team === team && p.id !== owner.id && p.role !== "GK")
    .map((p) => ({ p, gap: distance(p, owner) }))
    .filter((item) => item.gap <= RULES.triangleAssignmentRadius)
    .sort((a, b) => a.gap - b.gap);

  const first = candidates[0]?.p;
  const second = candidates.find((item) => item.p.id !== first?.id && Math.sign(item.p.y - owner.y) !== Math.sign((first?.y ?? owner.y) - owner.y))?.p
    ?? candidates[1]?.p;
  const depth = candidates.find((item) => item.p.id !== first?.id && item.p.id !== second?.id)?.p;

  const targets = new Map();
  const upperY = clamp(owner.y - RULES.triangleSupportWidth, PITCH.inset + 48, PITCH.height - PITCH.inset - 48);
  const lowerY = clamp(owner.y + RULES.triangleSupportWidth, PITCH.inset + 48, PITCH.height - PITCH.inset - 48);

  if (first) {
    const sideY = first.y <= owner.y ? upperY : lowerY;
    targets.set(first.id, {
      role: "triangle-support",
      x: clamp(owner.x - direction * RULES.triangleSupportBack, PITCH.inset + 40, PITCH.width - PITCH.inset - 40),
      y: sideY,
    });
  }
  if (second) {
    const sideY = second.y <= owner.y ? upperY : lowerY;
    targets.set(second.id, {
      role: "triangle-support",
      x: clamp(owner.x + direction * RULES.triangleSupportForward, PITCH.inset + 40, PITCH.width - PITCH.inset - 40),
      y: sideY,
    });
  }
  if (depth) {
    targets.set(depth.id, {
      role: "triangle-depth",
      x: clamp(owner.x + direction * RULES.triangleDepthRun, PITCH.inset + 48, PITCH.width - PITCH.inset - 48),
      y: clamp(owner.y + (depth.y < owner.y ? -72 : 72), PITCH.inset + 48, PITCH.height - PITCH.inset - 48),
    });
  }
  return targets;
}

function localZoneThreat(state, defender, zoneTarget) {
  const opponents = state.players.filter((p) => p.team !== defender.team && p.role !== "GK");
  let best = null;
  for (const opponent of opponents) {
    const zoneGap = Math.hypot(opponent.x - zoneTarget.x, opponent.y - zoneTarget.y);
    if (zoneGap > RULES.zoneTrackRadius) continue;
    const dangerDirection = teamDirection(opponent.team);
    const progressThreat = (opponent.x - zoneTarget.x) * dangerDirection;
    const score = zoneGap - Math.max(0, progressThreat) * 0.25;
    if (!best || score < best.score) best = { opponent, score };
  }
  return best?.opponent ?? null;
}

function defenderInOwnHalf(team, ballX) {
  return team === TEAM.HOME ? ballX < PITCH.width / 2 : ballX > PITCH.width / 2;
}

function selectLightPresser(state, defendingTeam, owner) {
  if (!owner || owner.team === defendingTeam) return null;
  if (!defenderInOwnHalf(defendingTeam, owner.x)) return null;
  return state.players
    .filter((p) => p.team === defendingTeam && p.role !== "GK" && !p.controlled && p.recoveryRemaining <= 0)
    .map((p) => ({ p, gap: distance(p, owner) }))
    .filter((item) => item.gap <= RULES.aiPressActivationRange)
    .sort((a, b) => a.gap - b.gap)[0]?.p ?? null;
}

function defensiveTeamTarget(state, p, owner, presser) {
  const zone = baseBlockTarget(state, p);
  p.tacticalRole = "zone";
  p.markingMode = "zone";
  p.markingTargetId = null;

  if (!owner || owner.team === p.team) return zone;

  if (presser?.id === p.id) {
    const ownGoal = { x: ownGoalX(p.team), y: PITCH.height / 2 };
    const goalSide = normalize(ownGoal.x - owner.x, ownGoal.y - owner.y);
    p.tacticalRole = "light-press";
    p.markingMode = "individual";
    p.markingTargetId = owner.id;
    return {
      x: clamp(owner.x + goalSide.x * RULES.aiLightPressDistance, PITCH.inset + 26, PITCH.width - PITCH.inset - 26),
      y: clamp(owner.y + goalSide.y * RULES.aiLightPressDistance, PITCH.inset + 26, PITCH.height - PITCH.inset - 26),
    };
  }

  const threat = localZoneThreat(state, p, zone);
  if (!threat) return zone;
  const ownGoal = { x: ownGoalX(p.team), y: PITCH.height / 2 };
  const goalSide = normalize(ownGoal.x - threat.x, ownGoal.y - threat.y);
  const track = {
    x: threat.x + goalSide.x * RULES.zoneGoalSideDistance,
    y: threat.y + goalSide.y * RULES.zoneGoalSideDistance * 0.35,
  };
  const dx = track.x - zone.x;
  const dy = track.y - zone.y;
  const gap = Math.hypot(dx, dy);
  if (gap > RULES.zoneTrackMaxDisplacement) {
    const scale = RULES.zoneTrackMaxDisplacement / gap;
    track.x = zone.x + dx * scale;
    track.y = zone.y + dy * scale;
  }
  p.tacticalRole = "mark";
  p.markingMode = "individual";
  p.markingTargetId = threat.id;
  return {
    x: clamp(track.x, PITCH.inset + 28, PITCH.width - PITCH.inset - 28),
    y: clamp(track.y, PITCH.inset + 28, PITCH.height - PITCH.inset - 28),
  };
}

function evaluateAICall(state, p, owner, triangleTarget) {
  if (!owner || owner.team !== p.team || p.id === owner.id || p.role === "GK") return;
  if (p.callRemaining > 0 || p.aiCallCooldown > 0 || state.aiTeamCallCooldown[p.team] > 0) return;
  if (!triangleTarget) return;
  const lane = passLaneClearance(state, owner, p);
  const opponents = state.players.filter((o) => o.team !== p.team);
  const space = Math.min(...opponents.map((o) => distance(o, p)));
  if (lane < 34 || space < 54) return;
  p.callRemaining = RULES.aiCallDuration;
  p.aiCallCooldown = RULES.aiCallCooldown;
  state.aiTeamCallCooldown[p.team] = RULES.aiTeamCallCooldown;
}

function bestAIPass(state, p) {
  const direction = teamDirection(p.team);
  const mates = state.players.filter((m) => m.team === p.team && m.id !== p.id && distance(m, p) <= RULES.aiPassRange);
  return mates.map((m) => {
    const opponents = state.players.filter((o) => o.team !== p.team);
    const space = Math.min(...opponents.map((o) => distance(o, m)));
    const progress = (m.x - p.x) * direction;
    const call = m.callRemaining > 0 ? RULES.manualCallPriorityBoost : 0;
    const lane = passLaneClearance(state, p, m);
    const triangle = m.tacticalRole.startsWith("triangle") ? 24 : 0;
    return {
      m,
      score: progress * 0.18 + space * 0.24 + lane * 0.26 + call + triangle - distance(p, m) * 0.045,
    };
  }).sort((a, b) => b.score - a.score)[0] ?? null;
}

function updateTeamPlans(state) {
  const owner = getOwner(state);
  for (const team of [TEAM.HOME, TEAM.AWAY]) {
    const attacking = owner?.team === team;
    const triangle = attacking ? triangleSupportMap(state, team, owner) : new Map();
    const presser = !attacking ? selectLightPresser(state, team, owner) : null;
    state.tactical[team] = {
      phase: attacking ? "attack" : owner ? "defend" : "loose",
      presserId: presser?.id ?? null,
      triangleIds: [...triangle.keys()],
      triangle,
    };
  }
}

function moveAI(state, p, dt) {
  tickPlayer(p, dt);
  if (p.controlled) return;
  updateAIHeadTowardBall(state, p, dt);
  if (p.recoveryRemaining > 0) {
    p.vx *= 0.75;
    p.vy *= 0.75;
    return;
  }

  const owner = getOwner(state);
  const plan = state.tactical[p.team];
  let target = baseBlockTarget(state, p);
  let pace = RULES.aiMaxSpeedScale;

  if (p.role === "GK") {
    target = baseBlockTarget(state, p);
    pace = 0.72;
  } else if (owner?.team === p.team && p.id !== owner.id) {
    const triangleTarget = plan?.triangle?.get(p.id);
    if (triangleTarget) {
      target = triangleTarget;
      p.tacticalRole = triangleTarget.role;
      evaluateAICall(state, p, owner, triangleTarget);
    } else {
      p.tacticalRole = "shape";
      p.markingMode = "zone";
      p.markingTargetId = null;
    }
  } else if (owner && owner.team !== p.team) {
    const presser = plan?.presserId ? getPlayer(state, plan.presserId) : null;
    target = defensiveTeamTarget(state, p, owner, presser);
    pace = p.id === presser?.id ? RULES.aiPressSpeedScale : RULES.aiContainSpeedScale;
  } else {
    const nearest = state.players
      .filter((candidate) => candidate.team === p.team && candidate.role !== "GK" && !candidate.controlled)
      .sort((a, b) => distance(a, state.ball) - distance(b, state.ball))[0];
    if (nearest?.id === p.id) {
      target = { x: state.ball.x, y: state.ball.y };
      p.tacticalRole = "loose-ball";
      pace = 0.92;
    }
  }

  if (p.hasBall) {
    p.tacticalRole = "carrier";
    const goal = { x: attackingGoalX(p.team), y: PITCH.height / 2 };
    target = {
      x: goal.x - teamDirection(p.team) * 120,
      y: clamp(p.y + Math.sin(state.elapsed * 0.75 + p.number) * 48, PITCH.inset + 80, PITCH.height - PITCH.inset - 80),
    };
    pace = 0.80;
    p.aiDecisionRemaining -= dt;
    if (p.aiDecisionRemaining <= 0 && p.aiPassCooldown <= 0) {
      const goalDistance = Math.abs(goal.x - p.x);
      const pass = bestAIPass(state, p);
      if (goalDistance < 260 && Math.abs(p.y - goal.y) < 250) startShot(state, p, {});
      else if (pass && pass.score > RULES.aiPassMinScore) startPass(state, p, {}, pass.m.id);
      p.aiDecisionRemaining = RULES.aiDecisionMin
        + ((p.number * 37 + state.tick) % 100) / 100 * (RULES.aiDecisionMax - RULES.aiDecisionMin);
    }
  }

  const move = normalize(target.x - p.x, target.y - p.y);
  const targetSpeed = RULES.rapidSpeed * pace;
  const targetVx = move.x * targetSpeed * Math.min(1, move.magnitude * 2.2);
  const targetVy = move.y * targetSpeed * Math.min(1, move.magnitude * 2.2);
  p.vx = approach(p.vx, targetVx, RULES.acceleration * RULES.teamMoveResponse * dt);
  p.vy = approach(p.vy, targetVy, RULES.acceleration * RULES.teamMoveResponse * dt);
  p.x = clamp(p.x + p.vx * dt, PITCH.inset + 24, PITCH.width - PITCH.inset - 24);
  p.y = clamp(p.y + p.vy * dt, PITCH.inset + 24, PITCH.height - PITCH.inset - 24);

  if (move.magnitude > 0.10 && Math.hypot(p.vx, p.vy) > 20) {
    const nextBody = rotateVectorToward(p.facingX, p.facingY, p.vx, p.vy, RULES.bodyTurnDegreesPerSecond, dt);
    p.facingX = nextBody.x;
    p.facingY = nextBody.y;
  } else if (owner && owner.team !== p.team && distance(p, owner) < 150) {
    const faceBall = normalize(state.ball.x - p.x, state.ball.y - p.y);
    const nextBody = rotateVectorToward(p.facingX, p.facingY, faceBall.x, faceBall.y, 115, dt);
    p.facingX = nextBody.x;
    p.facingY = nextBody.y;
  }
}

function resolveCollisions(state) {
  const minDistance = RULES.collisionRadius * 2;
  for (let iteration = 0; iteration < RULES.collisionIterations; iteration += 1) {
    for (let i = 0; i < state.players.length; i += 1) {
      for (let j = i + 1; j < state.players.length; j += 1) {
        const a = state.players[i];
        const b = state.players[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let gap = Math.hypot(dx, dy);
        if (gap >= minDistance) continue;
        if (gap < 0.001) {
          dx = 1;
          dy = 0;
          gap = 1;
        }
        const nx = dx / gap;
        const ny = dy / gap;
        const overlap = minDistance - gap;
        const firmnessA = a.protectionRemaining > 0 ? 0.70 : a.recoveryRemaining > 0 ? 0.30 : 0.50;
        const firmnessB = b.protectionRemaining > 0 ? 0.70 : b.recoveryRemaining > 0 ? 0.30 : 0.50;
        const total = firmnessA + firmnessB;
        a.x -= nx * overlap * (firmnessB / total);
        a.y -= ny * overlap * (firmnessB / total);
        b.x += nx * overlap * (firmnessA / total);
        b.y += ny * overlap * (firmnessA / total);
        const av = a.vx * nx + a.vy * ny;
        const bv = b.vx * nx + b.vy * ny;
        if (av > 0) {
          a.vx -= nx * av * 0.9;
          a.vy -= ny * av * 0.9;
        }
        if (bv < 0) {
          b.vx -= nx * bv * 0.9;
          b.vy -= ny * bv * 0.9;
        }
      }
    }
  }
}

function resolveNaturalDuels(state) {
  const owner = getOwner(state);
  if (!owner || owner.protectionRemaining > 0) return;
  const challengers = state.players
    .filter((p) => p.team !== owner.team && p.recoveryRemaining <= 0 && p.naturalDuelCooldown <= 0)
    .map((p) => ({ p, gap: distance(p, owner) }))
    .filter((item) => item.gap <= RULES.naturalDuelReach)
    .sort((a, b) => a.gap - b.gap);
  const challenger = challengers[0]?.p;
  if (!challenger) return;

  const toOwner = normalize(owner.x - challenger.x, owner.y - challenger.y);
  const body = normalize(challenger.facingX, challenger.facingY);
  const angle = body.x * toOwner.x + body.y * toOwner.y;
  const ownerSpeed = Math.hypot(owner.vx, owner.vy);
  const cleanContact = angle > 0.10 && ownerSpeed < RULES.rapidSpeed * 0.96;
  if (!cleanContact) return;

  clearOwner(state, BALL_PHASE.FREE);
  state.ball.vx = challenger.vx * 0.35 + toOwner.x * 65;
  state.ball.vy = challenger.vy * 0.35 + toOwner.y * 65;
  state.ball.lastTouchId = challenger.id;
  challenger.naturalDuelCooldown = RULES.naturalDuelCooldown;
  owner.recoveryRemaining = 0.18;
  state.lastEvent = "duel_ball_loose";
  state.eventId += 1;
}

function goalkeeperAutoDistribution(state, dt) {
  const owner = getOwner(state);
  if (!owner || owner.role !== "GK") return;
  owner.aiDecisionRemaining -= dt;
  if (owner.aiDecisionRemaining > 0) return;
  const targets = state.players
    .filter((p) => p.team === owner.team && p.role !== "GK")
    .map((p) => ({ p, lane: passLaneClearance(state, owner, p), range: distance(owner, p) }))
    .filter((item) => item.range <= RULES.passMaxRange)
    .sort((a, b) => (b.lane - a.lane) || (a.range - b.range));
  if (targets[0]) startPass(state, owner, {}, targets[0].p.id);
  owner.aiDecisionRemaining = 0.65;
}

export function stepGameplay(state, input = {}, dt = RULES.fixedStep) {
  const time = clamp(dt, 0, 0.05);
  state.tick += 1;
  state.elapsed += time;
  state.aiTeamCallCooldown.home = Math.max(0, state.aiTeamCallCooldown.home - time);
  state.aiTeamCallCooldown.away = Math.max(0, state.aiTeamCallCooldown.away - time);

  applyHumanActions(state, input);
  updateTeamPlans(state);

  const controlled = getControlledPlayer(state);
  moveControlled(state, controlled, input, time);
  for (const p of state.players) if (!p.controlled) moveAI(state, p, time);

  resolveCollisions(state);
  resolveNaturalDuels(state);
  stepBall(state, time);
  goalkeeperAutoDistribution(state, time);
  return state;
}

export function cameraGeometry(settings = {}) {
  const zoom = clamp(Number(settings.zoom ?? RULES.zoom), RULES.minZoom, RULES.maxZoom);
  const angle = clamp(Number(settings.angle ?? RULES.angle), 0, 60);
  const yScale = 0.95 - angle * 0.0028;
  const shear = -(0.018 + angle * 0.00145);
  return { zoom, angle, yScale, shear };
}
export function cameraBounds(settings = {}) {
  const geometry = cameraGeometry(settings);
  const halfWidth = VIEWPORT.width / (2 * geometry.zoom);
  const halfHeight = VIEWPORT.height / (2 * geometry.zoom * geometry.yScale);
  return {
    minX: halfWidth - 20,
    maxX: PITCH.width - halfWidth + 20,
    minY: halfHeight - 20,
    maxY: PITCH.height - halfHeight + 20,
  };
}
export function cameraFromBall(state, settings = {}) {
  const bounds = cameraBounds(settings);
  return {
    x: clamp(state.ball.x, bounds.minX, bounds.maxX),
    y: clamp(state.ball.y, bounds.minY, bounds.maxY),
  };
}
export function isPointVisible(player, point, degrees = RULES.visionDegrees) {
  const to = normalize(point.x - player.x, point.y - player.y);
  if (!to.magnitude) return true;
  const head = normalize(player.headFacingX, player.headFacingY);
  const threshold = Math.cos((degrees / 2) * Math.PI / 180);
  return to.x * head.x + to.y * head.y >= threshold - 0.0001;
}
