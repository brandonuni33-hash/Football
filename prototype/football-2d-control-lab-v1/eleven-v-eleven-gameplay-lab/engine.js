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
  headScanDegrees: 180,
  visionDegrees: 120,
  scanDeadzone: 0.12,
  zoom: 0.90,
  minZoom: 0.75,
  maxZoom: 1.80,
  angle: 60,
  blindPitchAlpha: 0.12,

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
  tackleRange: 47,
  tackleDuration: 0.22,
  tackleRecovery: 0.42,
  missedTackleRecovery: 0.9,
  defensiveBrakeDuration: 1.2,
  defensiveBrakeDeepDuration: 0.7,
  jockeySpeedScale: 0.52,
  deepJockeySpeedScale: 0.40,
  recentBallLossDuration: 0.55,
  recentBallLossReachScale: 0.64,

  callDuration: 1.6,
  manualCallPriorityBoost: 66,
  aiDecisionMin: 0.32,
  aiDecisionMax: 0.70,
  aiPassRange: 620,
  aiContainDistance: 74,
  aiPressDistance: 58,
  aiHighPressDistance: 48,
  aiHighPressOwnHalfChance: 0.05,
  aiShapeResponse: 3.0,
  aiMaxSpeedScale: 0.89,
  goalkeeperSpeed: 154,
  goalkeeperSaveRadius: 38,
  goalkeeperHoldDistance: 32,
});

const HOME_FORMATION = [
  ["home-1", 1, "GK", 126, 544],
  ["home-2", 2, "RB", 350, 170],
  ["home-4", 4, "RCB", 350, 420],
  ["home-5", 5, "LCB", 350, 668],
  ["home-3", 3, "LB", 350, 918],
  ["home-6", 6, "DM", 610, 300],
  ["home-8", 8, "CM", 650, 544],
  ["home-10", 10, "AM", 610, 788],
  ["home-7", 7, "RW", 920, 245],
  ["home-9", 9, "ST", 965, 544],
  ["home-11", 11, "LW", 920, 843],
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

function makePlayer(entry, team) {
  const [id, number, role, x, y] = entry;
  const facingX = teamDirection(team);
  return {
    id, number, role, team, x, y, originX: x, originY: y,
    vx: 0, vy: 0, facingX, facingY: 0, headFacingX: facingX, headFacingY: 0,
    controlled: id === CONTROLLED_ID, hasBall: false,
    protectionRemaining: 0, protectionCooldown: 0,
    defensiveBrakeRemaining: 0, deepBrakeRemaining: 0,
    tackleRemaining: 0, recoveryRemaining: 0, recentBallLossRemaining: 0,
    callRemaining: 0, receptionRemaining: 0,
    receptionIntentX: facingX, receptionIntentY: 0, receptionIntentMagnitude: 0,
    orientedTouchRemaining: 0, orientedTouchReleasePending: false,
    orientedTouchX: facingX, orientedTouchY: 0,
    dribbleTouchRemaining: 0,
    controlX: facingX, controlY: 0,
    aiDecisionRemaining: 0.2 + (number % 4) * 0.08,
    aiPassCooldown: 0,
    bodyFeintRemaining: 0,
  };
}

export function createGameplayState() {
  const home = HOME_FORMATION.map((e) => makePlayer(e, TEAM.HOME));
  const away = HOME_FORMATION.map(mirror).map((e) => makePlayer(e, TEAM.AWAY));
  const players = [...home, ...away];
  const controlled = players.find((p) => p.id === CONTROLLED_ID);
  controlled.hasBall = true;
  return {
    tick: 0, elapsed: 0, players,
    score: { home: 0, away: 0 },
    possession: { team: TEAM.HOME, playerId: controlled.id },
    lastPossessionLoss: null,
    lastEvent: "kickoff", eventId: 0,
    ball: {
      x: controlled.x + RULES.dribbleControlDistance,
      y: controlled.y, vx: 0, vy: 0,
      phase: BALL_PHASE.CONTROLLED,
      ownerId: controlled.id, targetId: null, lastTouchId: controlled.id,
    },
  };
}

export function getPlayer(state, id) { return state.players.find((p) => p.id === id) ?? null; }
export function getControlledPlayer(state) { return getPlayer(state, CONTROLLED_ID); }
export function getOwner(state) { return state.ball.ownerId ? getPlayer(state, state.ball.ownerId) : null; }
export function hasPossession(state, id) { return state.ball.ownerId === id; }
export function actionLabels(state) {
  return hasPossession(state, CONTROLLED_ID)
    ? { primary: "TIR", secondary: "PASSE", tertiary: "PROT.", tackle: "" }
    : { primary: "APPEL", secondary: "FREIN", tertiary: "PROT.", tackle: "TACLE" };
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
  p.tackleRemaining = Math.max(0, p.tackleRemaining - dt);
  p.recoveryRemaining = Math.max(0, p.recoveryRemaining - dt);
  p.recentBallLossRemaining = Math.max(0, p.recentBallLossRemaining - dt);
  p.callRemaining = Math.max(0, p.callRemaining - dt);
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
function updateHead(p, input, dt, mode) {
  let tx = p.facingX, ty = p.facingY;
  let speed = RULES.headReturnDegreesPerSecond;
  if (mode === "scan") {
    const right = normalize(input.controlX, input.controlY);
    if (right.magnitude >= RULES.scanDeadzone) { tx = right.x; ty = right.y; speed = RULES.headTurnDegreesPerSecond; }
  }
  const next = rotateVectorToward(p.headFacingX, p.headFacingY, tx, ty, speed, dt);
  if (next.magnitude) { p.headFacingX = next.x; p.headFacingY = next.y; }
  clampHeadToBody(p);
}

export function controlMode(state, player = getControlledPlayer(state)) {
  if (!player) return "scan";
  const targeted = state.ball.phase === BALL_PHASE.PASS && state.ball.targetId === player.id;
  if (targeted || player.protectionRemaining > 0) return "tech";
  if (player.hasBall) {
    const speed = Math.hypot(player.vx, player.vy);
    return speed < 18 ? "tech" : "locked";
  }
  return "scan";
}

function moveControlled(state, p, input, dt) {
  tickPlayer(p, dt);
  let move = normalize(input.moveX, input.moveY);
  if (p.recoveryRemaining > 0) move = { x: 0, y: 0, magnitude: 0 };
  let speedScale = input.rapidHeld ? 1 : RULES.normalPaceScale;
  if (p.defensiveBrakeRemaining > 0 && !p.hasBall) speedScale = p.deepBrakeRemaining > 0 ? RULES.deepJockeySpeedScale : RULES.jockeySpeedScale;
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
      if (face.magnitude) { p.facingX = face.x; p.facingY = face.y; }
    }
  } else if (move.magnitude > 0.08) {
    const next = rotateVectorToward(p.facingX, p.facingY, move.x, move.y, RULES.bodyTurnDegreesPerSecond, dt);
    p.facingX = next.x; p.facingY = next.y;
  }

  const mode = controlMode(state, p);
  updateHead(p, input, dt, mode);
  const right = normalize(input.controlX, input.controlY);
  if (mode === "tech" && right.magnitude > 0.08) {
    p.controlX = right.x; p.controlY = right.y;
    if (state.ball.phase === BALL_PHASE.PASS && state.ball.targetId === p.id) {
      p.receptionIntentX = right.x; p.receptionIntentY = right.y; p.receptionIntentMagnitude = right.magnitude;
    } else if (p.protectionRemaining > 0) {
      p.facingX = right.x; p.facingY = right.y;
    } else if (p.hasBall && Math.hypot(p.vx, p.vy) < 18 && right.magnitude > 0.55) {
      p.bodyFeintRemaining = 0.32;
      p.facingX = right.x; p.facingY = right.y;
      state.lastEvent = "body_feint";
    }
  } else if (!(state.ball.phase === BALL_PHASE.PASS && state.ball.targetId === p.id)) {
    p.receptionIntentMagnitude = 0;
  }
}

function selectPassTarget(state, passer, intent = {}) {
  const requested = normalize(intent.controlX ?? intent.x, intent.controlY ?? intent.y);
  const dir = requested.magnitude > 0.18 ? requested : normalize(passer.facingX, passer.facingY);
  const mates = state.players.filter((p) => p.team === passer.team && p.id !== passer.id && p.role !== "GK" && p.recoveryRemaining <= 0);
  return mates.map((candidate) => {
    const to = normalize(candidate.x - passer.x, candidate.y - passer.y);
    const alignment = dir.x * to.x + dir.y * to.y;
    const call = candidate.callRemaining > 0 ? 0.75 : 0;
    const range = distance(passer, candidate);
    const opponents = state.players.filter((p) => p.team !== passer.team);
    const space = Math.min(...opponents.map((o) => distance(o, candidate)));
    return { candidate, score: alignment * 1.25 + call + clamp(space, 0, 180) / 300 - Math.max(0, range - 520) / 700 };
  }).filter((x) => distance(passer, x.candidate) <= RULES.passMaxRange)
    .sort((a, b) => b.score - a.score)[0]?.candidate ?? null;
}

export function startPass(state, passer, input = {}, forcedTargetId = null) {
  if (!passer?.hasBall) return false;
  const target = forcedTargetId ? getPlayer(state, forcedTargetId) : selectPassTarget(state, passer, input);
  if (!target || target.team !== passer.team) return false;
  const dir = normalize(target.x - passer.x, target.y - passer.y);
  if (!dir.magnitude) return false;
  clearOwner(state, BALL_PHASE.PASS);
  state.ball.x = passer.x + dir.x * 26; state.ball.y = passer.y + dir.y * 26;
  state.ball.vx = dir.x * RULES.passSpeed; state.ball.vy = dir.y * RULES.passSpeed;
  state.ball.targetId = target.id; state.ball.lastTouchId = passer.id;
  target.receptionRemaining = RULES.receptionWindow;
  passer.aiPassCooldown = 0.8;
  state.lastEvent = "pass_locked"; state.eventId += 1;
  return true;
}
export function startShot(state, p, input = {}) {
  if (!p?.hasBall) return false;
  const requested = normalize(input.controlX ?? input.x, input.controlY ?? input.y);
  let dir = requested.magnitude > 0.18 ? requested : normalize(p.facingX, p.facingY);
  const goal = { x: attackingGoalX(p.team), y: PITCH.height / 2 };
  if (requested.magnitude <= 0.18) dir = normalize(goal.x - p.x, goal.y - p.y);
  clearOwner(state, BALL_PHASE.SHOT);
  state.ball.x = p.x + dir.x * 27; state.ball.y = p.y + dir.y * 27;
  state.ball.vx = dir.x * RULES.shotSpeed; state.ball.vy = dir.y * RULES.shotSpeed;
  state.ball.targetId = null; state.ball.lastTouchId = p.id;
  state.lastEvent = "shot"; state.eventId += 1;
  return true;
}
export function startProtection(state, p) {
  if (!p || p.protectionRemaining > 0 || p.protectionCooldown > 0) return false;
  const awaiting = state.ball.phase === BALL_PHASE.PASS && state.ball.targetId === p.id;
  if (!p.hasBall && !awaiting && state.possession.team !== p.team) return false;
  p.protectionRemaining = RULES.protectionDuration;
  state.lastEvent = "protection"; state.eventId += 1;
  return true;
}
export function requestCall(state, p) {
  if (!p || p.hasBall || state.possession.team !== p.team) return false;
  p.callRemaining = RULES.callDuration;
  state.lastEvent = "call"; state.eventId += 1;
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
  state.eventId += 1; return true;
}
export function startTackle(state, p) {
  if (!p || p.hasBall || p.recoveryRemaining > 0) return false;
  p.tackleRemaining = RULES.tackleDuration;
  const owner = getOwner(state);
  const close = owner && owner.team !== p.team && distance(p, owner) <= RULES.tackleRange;
  const facing = normalize(p.facingX, p.facingY);
  const toward = owner ? normalize(owner.x - p.x, owner.y - p.y) : { x: 0, y: 0 };
  const angled = close && facing.x * toward.x + facing.y * toward.y > 0.12;
  if (angled && owner.protectionRemaining <= 0) {
    clearOwner(state, BALL_PHASE.FREE);
    state.ball.vx = facing.x * 150; state.ball.vy = facing.y * 150;
    state.ball.lastTouchId = p.id;
    p.recoveryRemaining = RULES.tackleRecovery;
    state.lastEvent = "tackle_won";
  } else {
    p.recoveryRemaining = RULES.missedTackleRecovery;
    state.lastEvent = "tackle_missed";
  }
  state.eventId += 1; return true;
}

function applyHumanActions(state, input) {
  const p = getControlledPlayer(state);
  if (!p) return;
  if (input.primaryPressed) p.hasBall ? startShot(state, p, input) : requestCall(state, p);
  if (input.secondaryPressed) p.hasBall ? startPass(state, p, input) : pressBrake(state, p);
  if (input.tertiaryPressed) startProtection(state, p);
  if (input.tacklePressed && !p.hasBall) startTackle(state, p);
}

function carryBall(state, owner, dt) {
  if (owner.orientedTouchRemaining > 0) {
    state.ball.x += state.ball.vx * dt; state.ball.y += state.ball.vy * dt;
    const friction = Math.pow(RULES.orientedTouchBallFriction, dt * 60);
    state.ball.vx *= friction; state.ball.vy *= friction; return;
  }
  if (owner.orientedTouchReleasePending) {
    owner.orientedTouchReleasePending = false;
    if (distance(owner, state.ball) > RULES.orientedTouchRecontrolRadius) {
      clearOwner(state, BALL_PHASE.FREE); state.ball.lastTouchId = owner.id;
      state.lastEvent = "heavy_oriented_touch"; state.eventId += 1; return;
    }
  }
  const protectedControl = owner.protectionRemaining > 0;
  const fx = protectedControl ? owner.controlX : owner.facingX;
  const fy = protectedControl ? owner.controlY : owner.facingY;
  const forward = protectedControl ? RULES.protectionControlDistance : RULES.dribbleControlDistance;
  const desiredX = owner.x + fx * forward, desiredY = owner.y + fy * forward;
  if (protectedControl) {
    state.ball.x = desiredX; state.ball.y = desiredY; state.ball.vx = owner.vx; state.ball.vy = owner.vy; return;
  }
  const speed = Math.hypot(owner.vx, owner.vy);
  const gap = distance(owner, state.ball);
  if (gap > RULES.heavyTouchGap) {
    clearOwner(state, BALL_PHASE.FREE); state.ball.lastTouchId = owner.id;
    state.lastEvent = "heavy_touch"; state.eventId += 1; return;
  }
  if (speed < 9) {
    state.ball.x = approach(state.ball.x, desiredX, 300 * dt);
    state.ball.y = approach(state.ball.y, desiredY, 300 * dt);
    state.ball.vx *= 0.82; state.ball.vy *= 0.82; return;
  }
  if (owner.dribbleTouchRemaining <= 0 || gap < 17) {
    const touch = RULES.dribbleTouchBaseSpeed + speed * RULES.dribbleTouchSpeedRatio;
    state.ball.vx = owner.vx + fx * touch * RULES.dribbleFreedom + (desiredX - state.ball.x) * 1.25;
    state.ball.vy = owner.vy + fy * touch * RULES.dribbleFreedom + (desiredY - state.ball.y) * 1.25;
    owner.dribbleTouchRemaining = RULES.dribbleTouchInterval;
  }
  const freeX = state.ball.x + state.ball.vx * dt, freeY = state.ball.y + state.ball.vy * dt;
  const guidedX = approach(freeX, desiredX, RULES.dribbleGuideSpeed * dt);
  const guidedY = approach(freeY, desiredY, RULES.dribbleGuideSpeed * dt);
  state.ball.x = freeX * RULES.dribbleFreedom + guidedX * (1 - RULES.dribbleFreedom);
  state.ball.y = freeY * RULES.dribbleFreedom + guidedY * (1 - RULES.dribbleFreedom);
  const friction = Math.pow(0.985, dt * 60); state.ball.vx *= friction; state.ball.vy *= friction;
}

function orientedReception(state, p) {
  const m = p.receptionIntentMagnitude;
  if (m <= 0.08) return;
  let dist = RULES.orientedTouchShortDistance, duration = RULES.orientedTouchShortDuration, ballSpeed = RULES.orientedTouchShortBallSpeed;
  if (m >= 0.76) { dist = RULES.orientedTouchLongDistance; duration = RULES.orientedTouchLongDuration; ballSpeed = RULES.orientedTouchLongBallSpeed; }
  else if (m >= 0.42) { dist = RULES.orientedTouchMediumDistance; duration = RULES.orientedTouchMediumDuration; ballSpeed = RULES.orientedTouchMediumBallSpeed; }
  p.facingX = p.receptionIntentX; p.facingY = p.receptionIntentY;
  p.orientedTouchX = p.receptionIntentX; p.orientedTouchY = p.receptionIntentY;
  p.orientedTouchRemaining = duration; p.orientedTouchReleasePending = false;
  state.ball.x = p.x + p.orientedTouchX * RULES.orientedTouchStartDistance;
  state.ball.y = p.y + p.orientedTouchY * RULES.orientedTouchStartDistance;
  state.ball.vx = p.orientedTouchX * ballSpeed; state.ball.vy = p.orientedTouchY * ballSpeed;
  p.dribbleTouchRemaining = duration + 0.08;
  state.lastEvent = "oriented_reception";
}

function recoveryCandidate(state) {
  let best = null;
  for (const p of state.players) {
    if (p.id === state.ball.lastTouchId && (state.ball.phase === BALL_PHASE.PASS || state.ball.phase === BALL_PHASE.SHOT)) continue;
    if (p.recoveryRemaining > 0) continue;
    const reach = p.recentBallLossRemaining > 0 ? RULES.passControlRadius * RULES.recentBallLossReachScale : RULES.passControlRadius;
    const gap = distance(p, state.ball);
    if (gap > reach) continue;
    const score = gap + (p.recentBallLossRemaining > 0 ? 18 : 0);
    if (!best || score < best.score) best = { p, score };
  }
  return best?.p ?? null;
}

function checkGoal(state, prev) {
  const within = state.ball.y >= PITCH.goalTop && state.ball.y <= PITCH.goalBottom;
  if (!within) return false;
  if (prev.x < PITCH.width - PITCH.inset && state.ball.x >= PITCH.width - PITCH.inset) { scoreGoal(state, TEAM.HOME); return true; }
  if (prev.x > PITCH.inset && state.ball.x <= PITCH.inset) { scoreGoal(state, TEAM.AWAY); return true; }
  return false;
}
function scoreGoal(state, team) {
  state.score[team] += 1;
  const conceding = team === TEAM.HOME ? TEAM.AWAY : TEAM.HOME;
  const restart = state.players.find((p) => p.team === conceding && p.role === "CM") ?? state.players.find((p) => p.team === conceding && p.role !== "GK");
  for (const p of state.players) { p.hasBall = false; p.x = p.originX; p.y = p.originY; p.vx = p.vy = 0; }
  restart.hasBall = true;
  state.ball.ownerId = restart.id; state.ball.phase = BALL_PHASE.CONTROLLED; state.ball.targetId = null; state.ball.lastTouchId = restart.id;
  state.ball.x = restart.x + restart.facingX * RULES.dribbleControlDistance; state.ball.y = restart.y; state.ball.vx = state.ball.vy = 0;
  state.possession = { team: conceding, playerId: restart.id };
  state.lastEvent = "goal"; state.eventId += 1;
}

function goalkeeperSave(state) {
  if (state.ball.ownerId || state.ball.phase !== BALL_PHASE.SHOT) return false;
  for (const gk of state.players.filter((p) => p.role === "GK")) {
    if (distance(gk, state.ball) <= RULES.goalkeeperSaveRadius) {
      setOwner(state, gk, "goalkeeper_save");
      state.ball.x = gk.x + teamDirection(gk.team) * RULES.goalkeeperHoldDistance; state.ball.y = gk.y;
      return true;
    }
  }
  return false;
}

function stepBall(state, dt) {
  const owner = getOwner(state);
  if (owner) { carryBall(state, owner, dt); return; }
  const prev = { x: state.ball.x, y: state.ball.y };
  state.ball.x += state.ball.vx * dt; state.ball.y += state.ball.vy * dt;
  const friction = Math.pow(state.ball.phase === BALL_PHASE.SHOT ? 0.995 : 0.989, dt * 60);
  state.ball.vx *= friction; state.ball.vy *= friction;
  if (goalkeeperSave(state) || checkGoal(state, prev)) return;
  if (state.ball.y < PITCH.inset + 6 || state.ball.y > PITCH.height - PITCH.inset - 6) {
    state.ball.y = clamp(state.ball.y, PITCH.inset + 6, PITCH.height - PITCH.inset - 6); state.ball.vy *= -0.42;
  }
  if (state.ball.x < PITCH.inset + 6 || state.ball.x > PITCH.width - PITCH.inset - 6) {
    state.ball.x = clamp(state.ball.x, PITCH.inset + 6, PITCH.width - PITCH.inset - 6); state.ball.vx *= -0.42;
  }
  const winner = recoveryCandidate(state);
  if (winner) {
    const intended = state.ball.targetId === winner.id;
    setOwner(state, winner, intended ? "reception" : "interception");
    if (intended) orientedReception(state, winner);
  }
  if (!state.ball.ownerId && Math.hypot(state.ball.vx, state.ball.vy) < 7) { state.ball.phase = BALL_PHASE.FREE; state.ball.targetId = null; }
}

function roleScale(role) {
  if (role === "GK") return 0.08;
  if (["RB","LB","RCB","LCB"].includes(role)) return 0.54;
  if (role === "DM") return 0.72;
  if (["CM","AM"].includes(role)) return 0.86;
  return 1;
}
function tacticalTarget(state, p) {
  if (p.role === "GK") {
    const ownX = ownGoalX(p.team);
    return { x: ownX + teamDirection(p.team) * 44, y: clamp(state.ball.y, PITCH.goalTop + 35, PITCH.goalBottom - 35) };
  }
  const owner = getOwner(state);
  const dir = teamDirection(p.team);
  const possessionTeam = owner?.team ?? state.possession.team;
  const ballShiftX = (state.ball.x - PITCH.width / 2) * 0.20 * roleScale(p.role);
  const ballShiftY = (state.ball.y - PITCH.height / 2) * 0.13 * roleScale(p.role);
  let x = p.originX + ballShiftX, y = p.originY + ballShiftY;
  if (possessionTeam === p.team) {
    if (["RW","LW","ST"].includes(p.role)) x += dir * 75;
    if (["CM","AM","DM"].includes(p.role)) x += dir * 35;
    if (p.role === "RW") y = Math.min(y, 235);
    if (p.role === "LW") y = Math.max(y, PITCH.height - 235);
  } else {
    x -= dir * 38;
  }
  return { x: clamp(x, PITCH.inset + 28, PITCH.width - PITCH.inset - 28), y: clamp(y, PITCH.inset + 28, PITCH.height - PITCH.inset - 28) };
}
function nearestDefenderToOwner(state, owner) {
  if (!owner) return null;
  return state.players.filter((p) => p.team !== owner.team && p.role !== "GK" && !p.controlled)
    .sort((a,b) => distance(a, owner) - distance(b, owner))[0] ?? null;
}
function ownerInOwnHalf(owner) { return owner.team === TEAM.HOME ? owner.x < PITCH.width / 2 : owner.x > PITCH.width / 2; }

function bestAIPass(state, p) {
  const mates = state.players.filter((m) => m.team === p.team && m.id !== p.id && m.role !== "GK" && distance(m,p) <= RULES.aiPassRange);
  const dir = teamDirection(p.team);
  return mates.map((m) => {
    const opponents = state.players.filter((o) => o.team !== p.team);
    const space = Math.min(...opponents.map((o) => distance(o,m)));
    const progress = (m.x - p.x) * dir;
    const call = m.callRemaining > 0 ? RULES.manualCallPriorityBoost : 0;
    return { m, score: progress * 0.22 + space * 0.30 + call - distance(p,m) * 0.05 };
  }).sort((a,b) => b.score - a.score)[0] ?? null;
}

function moveAI(state, p, dt) {
  tickPlayer(p, dt);
  if (p.controlled) return;
  if (p.recoveryRemaining > 0) { p.vx *= 0.75; p.vy *= 0.75; return; }
  const owner = getOwner(state);
  let target = tacticalTarget(state, p);
  let pace = RULES.aiMaxSpeedScale;
  const nearestPressure = owner && owner.team !== p.team ? nearestDefenderToOwner(state, owner) : null;
  if (nearestPressure?.id === p.id) {
    const highZone = ownerInOwnHalf(owner);
    const shouldPress = !highZone || (state.tick + p.number * 17) % 120 < Math.floor(120 * RULES.aiHighPressOwnHalfChance);
    if (shouldPress) {
      const toGoal = normalize(ownGoalX(p.team) - owner.x, PITCH.height / 2 - owner.y);
      const contain = highZone ? RULES.aiContainDistance : RULES.aiPressDistance;
      target = { x: owner.x + toGoal.x * contain, y: owner.y + toGoal.y * contain };
      pace = highZone ? 0.72 : 0.94;
    }
  }
  if (p.hasBall) {
    const goal = { x: attackingGoalX(p.team), y: PITCH.height / 2 };
    target = { x: goal.x - teamDirection(p.team) * 120, y: clamp(goal.y + Math.sin(state.elapsed + p.number) * 100, PITCH.inset + 80, PITCH.height - PITCH.inset - 80) };
    pace = 0.82;
    p.aiDecisionRemaining -= dt;
    if (p.aiDecisionRemaining <= 0 && p.aiPassCooldown <= 0) {
      const goalDistance = Math.abs(goal.x - p.x);
      const pass = bestAIPass(state, p);
      if (goalDistance < 260 && Math.abs(p.y - goal.y) < 250) startShot(state, p, {});
      else if (pass && pass.score > 18) startPass(state, p, {}, pass.m.id);
      p.aiDecisionRemaining = RULES.aiDecisionMin + ((p.number * 37 + state.tick) % 100) / 100 * (RULES.aiDecisionMax - RULES.aiDecisionMin);
    }
  }
  const move = normalize(target.x - p.x, target.y - p.y);
  const speed = RULES.rapidSpeed * pace;
  const targetVx = move.x * speed * Math.min(1, move.magnitude * 2.2);
  const targetVy = move.y * speed * Math.min(1, move.magnitude * 2.2);
  p.vx = approach(p.vx, targetVx, RULES.acceleration * 0.72 * dt);
  p.vy = approach(p.vy, targetVy, RULES.acceleration * 0.72 * dt);
  p.x = clamp(p.x + p.vx * dt, PITCH.inset + 24, PITCH.width - PITCH.inset - 24);
  p.y = clamp(p.y + p.vy * dt, PITCH.inset + 24, PITCH.height - PITCH.inset - 24);
  if (move.magnitude > 0.08) {
    const next = rotateVectorToward(p.facingX, p.facingY, move.x, move.y, RULES.bodyTurnDegreesPerSecond, dt);
    p.facingX = next.x; p.facingY = next.y; p.headFacingX = next.x; p.headFacingY = next.y;
  }
}

function resolveCollisions(state) {
  const minDist = RULES.collisionRadius * 2;
  for (let iter = 0; iter < RULES.collisionIterations; iter += 1) {
    for (let i = 0; i < state.players.length; i += 1) for (let j = i + 1; j < state.players.length; j += 1) {
      const a = state.players[i], b = state.players[j];
      let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx,dy);
      if (d >= minDist) continue;
      if (d < 0.001) { dx = 1; dy = 0; d = 1; }
      const nx = dx / d, ny = dy / d, overlap = minDist - d;
      const firmnessA = a.protectionRemaining > 0 ? 0.70 : a.recoveryRemaining > 0 ? 0.30 : 0.50;
      const firmnessB = b.protectionRemaining > 0 ? 0.70 : b.recoveryRemaining > 0 ? 0.30 : 0.50;
      const total = firmnessA + firmnessB;
      a.x -= nx * overlap * (firmnessB / total); a.y -= ny * overlap * (firmnessB / total);
      b.x += nx * overlap * (firmnessA / total); b.y += ny * overlap * (firmnessA / total);
      const av = a.vx * nx + a.vy * ny, bv = b.vx * nx + b.vy * ny;
      if (av > 0) { a.vx -= nx * av * 0.9; a.vy -= ny * av * 0.9; }
      if (bv < 0) { b.vx -= nx * bv * 0.9; b.vy -= ny * bv * 0.9; }
    }
  }
}

function goalkeeperAutoDistribution(state) {
  const owner = getOwner(state);
  if (!owner || owner.role !== "GK") return;
  owner.aiDecisionRemaining -= RULES.fixedStep;
  if (owner.aiDecisionRemaining <= 0) {
    const target = state.players.filter((p) => p.team === owner.team && p.role !== "GK").sort((a,b) => distance(a,owner)-distance(b,owner))[0];
    if (target) startPass(state, owner, {}, target.id);
    owner.aiDecisionRemaining = 0.65;
  }
}

export function stepGameplay(state, input = {}, dt = RULES.fixedStep) {
  const time = clamp(dt, 0, 0.05);
  state.tick += 1; state.elapsed += time;
  applyHumanActions(state, input);
  const controlled = getControlledPlayer(state);
  moveControlled(state, controlled, input, time);
  for (const p of state.players) if (!p.controlled) moveAI(state, p, time);
  resolveCollisions(state);
  stepBall(state, time);
  goalkeeperAutoDistribution(state);
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
  const g = cameraGeometry(settings);
  const halfWidth = VIEWPORT.width / (2 * g.zoom);
  const halfHeight = VIEWPORT.height / (2 * g.zoom * g.yScale);
  return { minX: halfWidth - 20, maxX: PITCH.width - halfWidth + 20, minY: halfHeight - 20, maxY: PITCH.height - halfHeight + 20 };
}
export function cameraFromBall(state, settings = {}) {
  const b = cameraBounds(settings);
  return { x: clamp(state.ball.x, b.minX, b.maxX), y: clamp(state.ball.y, b.minY, b.maxY) };
}
export function isPointVisible(player, point, degrees = RULES.visionDegrees) {
  const to = normalize(point.x - player.x, point.y - player.y);
  if (!to.magnitude) return true;
  const head = normalize(player.headFacingX, player.headFacingY);
  const threshold = Math.cos((degrees / 2) * Math.PI / 180);
  return to.x * head.x + to.y * head.y >= threshold - 0.0001;
}
