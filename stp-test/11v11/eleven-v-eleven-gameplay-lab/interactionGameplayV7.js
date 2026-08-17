import * as base from "./interactionGameplayV6.js?role-aerial-v7";

export const VIEWPORT = base.VIEWPORT;
export const TEAM = base.TEAM;
export const BALL_PHASE = base.BALL_PHASE;
export const CONTROLLED_ID = base.CONTROLLED_ID;
export const RULES = Object.freeze({ ...base.RULES });
export const INTERACTION_RULES = base.INTERACTION_RULES;
export const getControlledPlayer = base.getControlledPlayer;
export const getPlayer = base.getPlayer;
export const getOwner = base.getOwner;
export const controlMode = base.controlMode;
export const cameraGeometry = base.cameraGeometry;
export const isPointVisible = base.isPointVisible;
export const formationSummary = base.formationSummary;

const BASE_PITCH = Object.freeze({ ...base.PITCH });
export const PITCH = { ...BASE_PITCH, insetX: BASE_PITCH.inset, insetY: BASE_PITCH.inset };

export const TUNING_DEFAULTS = Object.freeze({
  pitchLengthScale: 1,
  pitchWidthScale: 1,
  matchSpeed: 1,
  shortPassSpeed: 1,
  longPassPower: 1,
  shotPower: 1,
  shotLift: 1,
});

export const ROLE_RULES = Object.freeze({
  idlePressDelay: 4,
  idleSpeedThreshold: 14,
  idlePressDuration: 3.2,
  idlePressMaxSpeedScale: 0.82,
  looseChaseMaxSpeedScale: 0.92,
  looseControlRadius: 34,
  cbHalfwayMargin: 44,
  fullbackSafeMargin: 34,
  fullbackOverlapProgress: 0.49,
  fullbackWideZone: 0.29,
  fullbackLanePressure: 105,
  fullbackSupportBehindBall: 120,
  midfieldDefendFloor: 0.36,
  wingerDefendFloor: 0.39,
  strikerDefendFloor: 0.47,
  aerialHeaderMinHeight: 7,
  aerialHeaderMaxHeight: 62,
  aerialChestHeight: 26,
  aerialContactRadius: 46,
  aerialIntentWindow: 1.25,
  autoFootLossChance: 0.34,
  autoChestLossChance: 0.52,
  orientedFootLossChance: 0.07,
  orientedChestLossChance: 0.12,
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalize(x, y) {
  const magnitude = Math.hypot(x, y);
  if (magnitude <= 0.0001) return { x: 0, y: 0, magnitude: 0 };
  return { x: x / magnitude, y: y / magnitude, magnitude };
}

function approach(value, target, amount) {
  if (value < target) return Math.min(target, value + amount);
  return Math.max(target, value - amount);
}

function teamKey(team) {
  return team === TEAM.HOME ? "home" : "away";
}

function teamDirection(team) {
  return team === TEAM.HOME ? 1 : -1;
}

function label(player) {
  return player?.positionLabel ?? player?.role ?? "";
}

function isGK(player) {
  return label(player) === "GK";
}

function isCB(player) {
  return ["RCB", "LCB"].includes(label(player));
}

function isFullback(player) {
  return ["RB", "LB"].includes(label(player));
}

function isMidfielder(player) {
  return ["DM", "CM", "AM", "RM", "LM"].includes(label(player));
}

function isWinger(player) {
  return ["RW", "LW", "RM", "LM"].includes(label(player));
}

function isStriker(player) {
  return label(player) === "ST";
}

function dynamicInsets() {
  return {
    x: PITCH.insetX ?? PITCH.inset,
    y: PITCH.insetY ?? PITCH.inset,
  };
}

function updatePitchObject(tuning) {
  const sx = tuning.pitchLengthScale;
  const sy = tuning.pitchWidthScale;
  PITCH.width = BASE_PITCH.width * sx;
  PITCH.height = BASE_PITCH.height * sy;
  PITCH.insetX = BASE_PITCH.inset * sx;
  PITCH.insetY = BASE_PITCH.inset * sy;
  PITCH.inset = Math.min(PITCH.insetX, PITCH.insetY);
  PITCH.goalDepth = BASE_PITCH.goalDepth * sx;
  PITCH.goalTop = BASE_PITCH.goalTop * sy;
  PITCH.goalBottom = BASE_PITCH.goalBottom * sy;
  PITCH.penaltyDepth = BASE_PITCH.penaltyDepth * sx;
  PITCH.penaltyTop = BASE_PITCH.penaltyTop * sy;
  PITCH.penaltyBottom = BASE_PITCH.penaltyBottom * sy;
  PITCH.sixYardDepth = BASE_PITCH.sixYardDepth * sx;
  PITCH.sixYardTop = BASE_PITCH.sixYardTop * sy;
  PITCH.sixYardBottom = BASE_PITCH.sixYardBottom * sy;
  PITCH.centerCircleRadius = BASE_PITCH.centerCircleRadius * Math.sqrt(sx * sy);
}

function transformSpatial(state, sx, sy) {
  for (const player of state.players) {
    player.x *= sx;
    player.y *= sy;
    player.originX *= sx;
    player.originY *= sy;
    player.vx *= sx;
    player.vy *= sy;
  }
  state.ball.x *= sx;
  state.ball.y *= sy;
  state.ball.vx *= sx;
  state.ball.vy *= sy;
}

function tuningState(state) {
  state.gameplayV7 ??= {
    tuning: { ...TUNING_DEFAULTS },
    expanded: true,
    lastPassSignature: "",
    lastShotEventId: -1,
    idleOwnerId: null,
    idleSeconds: 0,
    idlePresserId: null,
    idlePressUntil: 0,
    looseChasers: { home: null, away: null },
    aerialIntent: null,
    aerialLastResolution: null,
  };
  return state.gameplayV7;
}

export function getGameplayTuning(state) {
  return { ...tuningState(state).tuning };
}

export function setGameplayTuning(state, patch = {}) {
  const v7 = tuningState(state);
  const old = v7.tuning;
  const next = {
    pitchLengthScale: clamp(Number(patch.pitchLengthScale ?? old.pitchLengthScale), 0.78, 1.25),
    pitchWidthScale: clamp(Number(patch.pitchWidthScale ?? old.pitchWidthScale), 0.78, 1.25),
    matchSpeed: clamp(Number(patch.matchSpeed ?? old.matchSpeed), 0.60, 1.20),
    shortPassSpeed: clamp(Number(patch.shortPassSpeed ?? old.shortPassSpeed), 0.65, 1.35),
    longPassPower: clamp(Number(patch.longPassPower ?? old.longPassPower), 0.65, 1.45),
    shotPower: clamp(Number(patch.shotPower ?? old.shotPower), 0.65, 1.45),
    shotLift: clamp(Number(patch.shotLift ?? old.shotLift), 0.45, 1.65),
  };
  if (v7.expanded) {
    const sx = next.pitchLengthScale / old.pitchLengthScale;
    const sy = next.pitchWidthScale / old.pitchWidthScale;
    if (Math.abs(sx - 1) > 0.0001 || Math.abs(sy - 1) > 0.0001) {
      transformSpatial(state, sx, sy);
    }
  }
  v7.tuning = next;
  updatePitchObject(next);
  return state;
}

function compressForBase(state) {
  const v7 = tuningState(state);
  if (!v7.expanded) return;
  transformSpatial(state, 1 / v7.tuning.pitchLengthScale, 1 / v7.tuning.pitchWidthScale);
  v7.expanded = false;
}

function expandFromBase(state) {
  const v7 = tuningState(state);
  if (v7.expanded) return;
  transformSpatial(state, v7.tuning.pitchLengthScale, v7.tuning.pitchWidthScale);
  v7.expanded = true;
}

function goalPoint(team) {
  const inset = dynamicInsets();
  return {
    x: team === TEAM.HOME ? PITCH.width - inset.x : inset.x,
    y: PITCH.height / 2,
  };
}

function ownGoalPoint(team) {
  const inset = dynamicInsets();
  return {
    x: team === TEAM.HOME ? inset.x : PITCH.width - inset.x,
    y: PITCH.height / 2,
  };
}

function attackProgress(team, x) {
  return team === TEAM.HOME ? x / PITCH.width : (PITCH.width - x) / PITCH.width;
}

function deterministic01(state, salt = 0) {
  const raw = Math.sin((state.tick + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return raw - Math.floor(raw);
}

function clearOwner(state, phase = BALL_PHASE.FREE) {
  for (const player of state.players) player.hasBall = false;
  state.ball.ownerId = null;
  state.ball.phase = phase;
  state.possession = { team: null, playerId: null };
}

function setOwner(state, player, reason) {
  for (const candidate of state.players) candidate.hasBall = candidate.id === player.id;
  state.ball.ownerId = player.id;
  state.ball.targetId = null;
  state.ball.phase = BALL_PHASE.CONTROLLED;
  state.ball.lastTouchId = player.id;
  state.ball.lobActive = false;
  state.ball.lobHeight = 0;
  state.ball.lobVz = 0;
  state.possession = { team: player.team, playerId: player.id };
  state.lastEvent = reason;
  state.eventId += 1;
}

export function isIncomingAerial(state, player = getControlledPlayer(state)) {
  if (!player || player.hasBall) return false;
  return Boolean(
    state.ball.lobActive
    && state.ball.targetId === player.id
    && state.ball.phase === BALL_PHASE.PASS
  );
}

export function actionLabels(state) {
  const controlled = getControlledPlayer(state);
  if (isIncomingAerial(state, controlled)) {
    return { primary: "TÊTE TIR", secondary: "TÊTE PASSE", tertiary: "PROT." };
  }
  return base.actionLabels(state);
}

function passSpeedFactor(state) {
  const v7 = tuningState(state);
  const passer = state.ball.lastTouchId ? getPlayer(state, state.ball.lastTouchId) : null;
  const target = state.ball.targetId ? getPlayer(state, state.ball.targetId) : null;
  if (!passer || !target) return 1;
  const range = distance(passer, target);
  const normalizedRange = clamp((range - 120) / 480, 0, 1);
  return v7.tuning.shortPassSpeed * (1 - normalizedRange) + v7.tuning.longPassPower * normalizedRange;
}

function tuneNewPass(state) {
  if (state.ball.phase !== BALL_PHASE.PASS || !state.ball.lastTouchId || !state.ball.targetId) return;
  const v7 = tuningState(state);
  const signature = `${state.eventId}:${state.ball.lastTouchId}:${state.ball.targetId}:${state.lastEvent}`;
  if (signature === v7.lastPassSignature) return;
  v7.lastPassSignature = signature;
  const velocity = normalize(state.ball.vx, state.ball.vy);
  if (!velocity.magnitude) return;
  const factor = passSpeedFactor(state);
  const rawSpeed = Math.hypot(state.ball.vx, state.ball.vy);
  const speed = clamp(rawSpeed * factor, 145, 620);
  state.ball.vx = velocity.x * speed;
  state.ball.vy = velocity.y * speed;
  if (state.ball.lobActive) {
    state.ball.lobVz = (state.ball.lobVz ?? 0) * (0.90 + tuningState(state).tuning.longPassPower * 0.10);
  }
}

function tuneHumanShot(state, input, preOwnerId, preEventId) {
  const v7 = tuningState(state);
  if (!input.primaryPressed || !preOwnerId || state.eventId === preEventId) return;
  const shooter = getPlayer(state, preOwnerId);
  if (!shooter?.controlled) return;
  if (state.ball.phase !== BALL_PHASE.SHOT || state.ball.lastTouchId !== shooter.id) return;
  if (v7.lastShotEventId === state.eventId) return;
  v7.lastShotEventId = state.eventId;

  const power = clamp(Number(input.shotPower ?? 0.44), 0.18, 1);
  const direction = normalize(state.ball.vx, state.ball.vy);
  if (!direction.magnitude) return;
  const horizontal = (300 + 305 * power) * v7.tuning.shotPower;
  state.ball.vx = direction.x * horizontal;
  state.ball.vy = direction.y * horizontal;
  state.ball.shotPower = power;

  const lifted = clamp((power - 0.20) / 0.80, 0, 1);
  state.ball.lobActive = true;
  state.ball.lobHeight = 0.5;
  state.ball.lobVz = (28 + 205 * Math.pow(lifted, 1.35)) * v7.tuning.shotLift;
  state.ball.lobTargetId = null;
  state.lastEvent = "powered_lifted_shot";
}

function nearestOpponentPressure(state, owner) {
  return state.players
    .filter((player) => player.team !== owner.team && !isGK(player) && player.recoveryRemaining <= 0)
    .map((player) => ({
      player,
      score: distance(player, owner) + (isCB(player) ? 150 : isFullback(player) ? 85 : 0),
    }))
    .sort((a, b) => a.score - b.score)[0]?.player ?? null;
}

function steerAggressive(player, target, maxSpeed, dt, response = 7.5) {
  if (!player || !target || player.controlled) return;
  const dir = normalize(target.x - player.x, target.y - player.y);
  if (!dir.magnitude) return;
  player.vx = approach(player.vx, dir.x * maxSpeed, maxSpeed * response * dt);
  player.vy = approach(player.vy, dir.y * maxSpeed, maxSpeed * response * dt);
  const maxStep = maxSpeed * dt * 0.52;
  player.x += dir.x * Math.min(maxStep, distance(player, target));
  player.y += dir.y * Math.min(maxStep, distance(player, target));
}

function updateIdlePress(state, dtReal) {
  const v7 = tuningState(state);
  const owner = getOwner(state);
  if (!owner) {
    v7.idleOwnerId = null;
    v7.idleSeconds = 0;
    v7.idlePresserId = null;
    return;
  }
  const still = Math.hypot(owner.vx, owner.vy) <= ROLE_RULES.idleSpeedThreshold
    && Math.hypot(state.ball.vx, state.ball.vy) <= 35;
  if (v7.idleOwnerId !== owner.id || !still) {
    v7.idleOwnerId = owner.id;
    v7.idleSeconds = 0;
    v7.idlePresserId = null;
    return;
  }
  v7.idleSeconds += dtReal;
  if (v7.idleSeconds < ROLE_RULES.idlePressDelay) return;

  if (!v7.idlePresserId || state.elapsed >= v7.idlePressUntil) {
    const presser = nearestOpponentPressure(state, owner);
    v7.idlePresserId = presser?.id ?? null;
    v7.idlePressUntil = state.elapsed + ROLE_RULES.idlePressDuration;
  }
  const presser = v7.idlePresserId ? getPlayer(state, v7.idlePresserId) : null;
  if (!presser) return;
  const goalSide = normalize(ownGoalPoint(presser.team).x - owner.x, ownGoalPoint(presser.team).y - owner.y);
  const target = {
    x: owner.x + goalSide.x * 26,
    y: owner.y + goalSide.y * 26,
  };
  const maxSpeed = (RULES.effectiveRapidSpeed ?? RULES.rapidSpeed) * ROLE_RULES.idlePressMaxSpeedScale;
  steerAggressive(presser, target, maxSpeed, dtReal, 8.5);
  presser.tacticalRole = "idle-pressure";
  presser.markingMode = "individual";
  presser.markingTargetId = owner.id;
}

function nearestLooseByTeam(state, team) {
  return state.players
    .filter((player) => player.team === team && player.recoveryRemaining <= 0)
    .map((player) => ({ player, gap: distance(player, state.ball) }))
    .sort((a, b) => a.gap - b.gap)[0] ?? null;
}

function updateTwoTeamLooseChase(state, dtReal) {
  const v7 = tuningState(state);
  if (state.ball.ownerId || state.ball.phase !== BALL_PHASE.FREE) {
    v7.looseChasers.home = null;
    v7.looseChasers.away = null;
    state.looseBallChasers = { home: null, away: null };
    return;
  }

  const home = nearestLooseByTeam(state, TEAM.HOME);
  const away = nearestLooseByTeam(state, TEAM.AWAY);
  v7.looseChasers.home = home?.player.id ?? null;
  v7.looseChasers.away = away?.player.id ?? null;
  state.looseBallChasers = { home: v7.looseChasers.home, away: v7.looseChasers.away };

  const allowed = new Set([v7.looseChasers.home, v7.looseChasers.away].filter(Boolean));
  for (const player of state.players) {
    if (player.controlled || allowed.has(player.id)) continue;
    if ((player.tacticalRole ?? "").includes("loose-ball")) {
      player.tacticalRole = "shape";
      player.vx *= 0.58;
      player.vy *= 0.58;
    }
  }

  const maxSpeed = (RULES.effectiveRapidSpeed ?? RULES.rapidSpeed) * ROLE_RULES.looseChaseMaxSpeedScale;
  for (const item of [home, away]) {
    const chaser = item?.player;
    if (!chaser || chaser.controlled) continue;
    steerAggressive(chaser, state.ball, maxSpeed, dtReal, 9.0);
    chaser.tacticalRole = "loose-ball-team-nearest";
  }

  const contenders = [home, away].filter(Boolean).sort((a, b) => a.gap - b.gap);
  const winner = contenders[0];
  if (winner && winner.gap <= ROLE_RULES.looseControlRadius) {
    setOwner(state, winner.player, "loose_recovery_team_nearest");
  }
}

function fullbackSide(player) {
  const pos = label(player);
  if (pos === "RB") return "top";
  if (pos === "LB") return "bottom";
  return player.originY < PITCH.height / 2 ? "top" : "bottom";
}

function wingerForSide(state, team, side) {
  return state.players.find((player) => {
    if (player.team !== team || !isWinger(player)) return false;
    return (player.originY < PITCH.height / 2 ? "top" : "bottom") === side;
  }) ?? null;
}

function opponentLanePressure(state, fullback) {
  const dir = teamDirection(fullback.team);
  let nearest = Infinity;
  for (const opponent of state.players) {
    if (opponent.team === fullback.team) continue;
    const forward = (opponent.x - fullback.x) * dir;
    if (forward < -35 || forward > 260) continue;
    if (Math.abs(opponent.y - fullback.y) > PITCH.height * 0.12) continue;
    nearest = Math.min(nearest, distance(opponent, fullback));
  }
  return nearest;
}

function hasOverlapReason(state, fullback) {
  const owner = getOwner(state);
  if (!owner || owner.team !== fullback.team || fullback.hasBall) return false;
  if (attackProgress(fullback.team, state.ball.x) < ROLE_RULES.fullbackOverlapProgress) return false;

  const side = fullbackSide(fullback);
  const ballSide = state.ball.y < PITCH.height * ROLE_RULES.fullbackWideZone
    ? "top"
    : state.ball.y > PITCH.height * (1 - ROLE_RULES.fullbackWideZone)
      ? "bottom"
      : "center";
  if (ballSide !== side) return false;

  const winger = wingerForSide(state, fullback.team, side);
  const inset = dynamicInsets();
  const touchlineDistance = winger
    ? side === "top" ? winger.y - inset.y : PITCH.height - inset.y - winger.y
    : 0;
  const wingerInside = winger ? touchlineDistance > PITCH.height * 0.15 : false;
  const ownerCreatesWidthNeed = isMidfielder(owner) || isWinger(owner);
  if (!wingerInside && !ownerCreatesWidthNeed) return false;

  if (opponentLanePressure(state, fullback) < ROLE_RULES.fullbackLanePressure) return false;

  const dir = teamDirection(fullback.team);
  const behindBall = state.players.filter((player) => (
    player.team === fullback.team
    && (isCB(player) || (isFullback(player) && player.id !== fullback.id))
    && (state.ball.x - player.x) * dir >= ROLE_RULES.fullbackSupportBehindBall
  )).length;
  return behindBall >= 2;
}

function enforceFullbackReason(state, dtReal) {
  const mid = PITCH.width / 2;
  for (const team of [TEAM.HOME, TEAM.AWAY]) {
    const key = teamKey(team);
    let accepted = null;
    const fullbacks = state.players.filter((player) => player.team === team && isFullback(player));
    for (const fullback of fullbacks) {
      if (!accepted && hasOverlapReason(state, fullback)) accepted = fullback.id;
    }

    const requested = state.formationTactical?.[key]?.overlapId ?? null;
    if (requested && requested !== accepted && state.formationTactical?.[key]) {
      state.formationTactical[key].overlapId = null;
    }
    if (state.contextualRuns?.[key]?.activeOverlapId && state.contextualRuns[key].activeOverlapId !== accepted) {
      state.contextualRuns[key].activeOverlapId = null;
      state.contextualRuns[key].overlapUntil = 0;
    }

    for (const fullback of fullbacks) {
      if (fullback.id === accepted) continue;
      const safeX = team === TEAM.HOME ? mid - ROLE_RULES.fullbackSafeMargin : mid + ROLE_RULES.fullbackSafeMargin;
      const over = team === TEAM.HOME ? fullback.x > safeX : fullback.x < safeX;
      if (over && !fullback.hasBall) {
        steerAggressive(fullback, { x: safeX, y: fullback.originY }, 126, dtReal, 6.0);
        fullback.tacticalRole = "fullback-hold";
      }
    }
  }
}

function roleAnchor(state, player, phase) {
  const dir = teamDirection(player.team);
  const mid = PITCH.width / 2;
  const ballX = state.ball.x;
  const ballY = state.ball.y;
  const inset = dynamicInsets();
  const pos = label(player);
  const origin = { x: player.originX, y: player.originY };

  if (isGK(player)) {
    const own = ownGoalPoint(player.team);
    return { x: own.x + dir * 44, y: clamp(ballY, PITCH.goalTop + 34, PITCH.goalBottom - 34) };
  }

  if (isCB(player)) {
    const ownThird = player.team === TEAM.HOME ? PITCH.width * 0.34 : PITCH.width * 0.66;
    let x = origin.x + (ballX - mid) * 0.18 + dir * (phase === "attack" ? 24 : -18);
    if (phase === "defend") x = x * 0.74 + ownThird * 0.26;
    x = player.team === TEAM.HOME
      ? Math.min(x, mid - ROLE_RULES.cbHalfwayMargin)
      : Math.max(x, mid + ROLE_RULES.cbHalfwayMargin);
    const y = origin.y + (ballY - PITCH.height / 2) * 0.10;
    return { x, y: clamp(y, inset.y + 90, PITCH.height - inset.y - 90) };
  }

  if (isFullback(player)) {
    let x = origin.x + (ballX - mid) * 0.22 + dir * (phase === "attack" ? 34 : -24);
    if (!hasOverlapReason(state, player)) {
      x = player.team === TEAM.HOME
        ? Math.min(x, mid - ROLE_RULES.fullbackSafeMargin)
        : Math.max(x, mid + ROLE_RULES.fullbackSafeMargin);
    }
    const side = fullbackSide(player);
    const touchY = side === "top" ? inset.y + 88 : PITCH.height - inset.y - 88;
    const y = phase === "defend"
      ? origin.y * 0.72 + clamp(ballY, inset.y + 80, PITCH.height - inset.y - 80) * 0.28
      : touchY;
    return { x, y };
  }

  if (pos === "DM") {
    const defenseX = player.team === TEAM.HOME ? PITCH.width * 0.30 : PITCH.width * 0.70;
    const ballLink = ballX - dir * PITCH.width * 0.10;
    const x = phase === "defend"
      ? defenseX * 0.62 + ballLink * 0.38
      : origin.x * 0.46 + ballLink * 0.54;
    return { x, y: origin.y * 0.62 + ballY * 0.38 };
  }

  if (isMidfielder(player)) {
    const defensiveFloor = player.team === TEAM.HOME
      ? PITCH.width * ROLE_RULES.midfieldDefendFloor
      : PITCH.width * (1 - ROLE_RULES.midfieldDefendFloor);
    let x = origin.x * 0.52 + (ballX - dir * PITCH.width * 0.06) * 0.48;
    if (phase === "defend") {
      x = player.team === TEAM.HOME ? Math.min(x, mid - 8) : Math.max(x, mid + 8);
      x = x * 0.72 + defensiveFloor * 0.28;
    }
    return {
      x,
      y: origin.y * 0.64 + ballY * 0.36,
    };
  }

  if (isWinger(player)) {
    if (phase === "defend") {
      const floor = player.team === TEAM.HOME
        ? PITCH.width * ROLE_RULES.wingerDefendFloor
        : PITCH.width * (1 - ROLE_RULES.wingerDefendFloor);
      return {
        x: floor,
        y: origin.y * 0.78 + ballY * 0.22,
      };
    }
    return {
      x: origin.x * 0.52 + (ballX + dir * PITCH.width * 0.08) * 0.48,
      y: origin.y * 0.78 + ballY * 0.22,
    };
  }

  if (isStriker(player)) {
    if (phase === "defend") {
      const floor = player.team === TEAM.HOME
        ? PITCH.width * ROLE_RULES.strikerDefendFloor
        : PITCH.width * (1 - ROLE_RULES.strikerDefendFloor);
      return { x: floor, y: origin.y * 0.75 + ballY * 0.25 };
    }
    return {
      x: origin.x * 0.48 + (ballX + dir * PITCH.width * 0.10) * 0.52,
      y: origin.y * 0.76 + ballY * 0.24,
    };
  }

  return origin;
}

function enforceRoleDiscipline(state, dtReal) {
  const owner = getOwner(state);
  for (const team of [TEAM.HOME, TEAM.AWAY]) {
    const phase = owner?.team === team ? "attack" : owner ? "defend" : "transition";
    state.tactical[teamKey(team)] = { ...(state.tactical[teamKey(team)] ?? {}), phase };
    const teamPlayers = state.players.filter((player) => player.team === team);

    let steppingCB = null;
    if (phase === "defend" && owner) {
      const cbs = teamPlayers.filter(isCB).sort((a, b) => distance(a, owner) - distance(b, owner));
      const nearest = cbs[0];
      const ownDanger = team === TEAM.HOME ? owner.x < PITCH.width * 0.30 : owner.x > PITCH.width * 0.70;
      if (nearest && ownDanger && distance(nearest, owner) < 125) steppingCB = nearest.id;
    }

    for (const player of teamPlayers) {
      if (player.controlled || player.hasBall) continue;
      if ((player.tacticalRole ?? "").startsWith("loose-ball") || player.tacticalRole === "idle-pressure") continue;
      if (isFullback(player) && hasOverlapReason(state, player) && phase === "attack") continue;

      const target = roleAnchor(state, player, phase);
      if (isCB(player) && phase === "defend") {
        if (player.id === steppingCB) {
          const goalSide = normalize(ownGoalPoint(team).x - owner.x, ownGoalPoint(team).y - owner.y);
          target.x = owner.x + goalSide.x * 58;
          target.y = owner.y + goalSide.y * 32;
          player.tacticalRole = "cb-delay";
        } else {
          player.tacticalRole = "cb-cover";
        }
      } else if (isMidfielder(player) && phase === "defend") {
        player.tacticalRole = "midfield-recovery";
      } else if ((isWinger(player) || isStriker(player)) && phase === "defend") {
        player.tacticalRole = "forward-partial-recovery";
      } else if (phase === "attack") {
        player.tacticalRole = player.tacticalRole?.includes("run") ? player.tacticalRole : "role-attack";
      }

      const correctionSpeed = isCB(player) ? 88 : isMidfielder(player) ? 102 : 94;
      const gap = distance(player, target);
      if (gap > 22) {
        const ratio = Math.min(1, correctionSpeed * dtReal / gap);
        player.x += (target.x - player.x) * ratio;
        player.y += (target.y - player.y) * ratio;
      }
    }
  }
}

function rememberAerialIntent(state, input) {
  const v7 = tuningState(state);
  const controlled = getControlledPlayer(state);
  if (!isIncomingAerial(state, controlled)) {
    if (v7.aerialIntent && state.elapsed > v7.aerialIntent.until) v7.aerialIntent = null;
    return input;
  }

  const clean = { ...input };
  if (input.primaryPressed) {
    v7.aerialIntent = { type: "header-shot", until: state.elapsed + ROLE_RULES.aerialIntentWindow };
    clean.primaryPressed = false;
  } else if (input.secondaryPressed) {
    v7.aerialIntent = { type: "header-pass", until: state.elapsed + ROLE_RULES.aerialIntentWindow };
    clean.secondaryPressed = false;
  }

  const control = normalize(input.controlX, input.controlY);
  if (control.magnitude > 0.16) {
    v7.aerialIntent = {
      type: "oriented-control",
      x: control.x,
      y: control.y,
      until: state.elapsed + ROLE_RULES.aerialIntentWindow,
    };
  }
  return clean;
}

function headerPassTarget(state, player) {
  const mates = state.players.filter((mate) => mate.team === player.team && mate.id !== player.id && !isGK(mate));
  const dir = teamDirection(player.team);
  return mates
    .map((mate) => {
      const forward = (mate.x - player.x) * dir;
      const gap = distance(mate, player);
      const space = Math.min(...state.players.filter((o) => o.team !== player.team).map((o) => distance(o, mate)));
      return { mate, score: forward * 0.25 + space * 0.45 - gap * 0.18 };
    })
    .filter((item) => distance(item.mate, player) <= 420)
    .sort((a, b) => b.score - a.score)[0]?.mate ?? null;
}

function executeHeaderShot(state, player) {
  const goal = goalPoint(player.team);
  const dir = normalize(goal.x - player.x, goal.y - player.y);
  clearOwner(state, BALL_PHASE.SHOT);
  state.ball.x = player.x + dir.x * 18;
  state.ball.y = player.y + dir.y * 18;
  const speed = 355 * tuningState(state).tuning.shotPower;
  state.ball.vx = dir.x * speed;
  state.ball.vy = dir.y * speed;
  state.ball.targetId = null;
  state.ball.lastTouchId = player.id;
  state.ball.lobActive = true;
  state.ball.lobHeight = Math.max(5, (state.ball.lobHeight ?? 0) * 0.52);
  state.ball.lobVz = 42 * tuningState(state).tuning.shotLift;
  state.lastEvent = "header_shot";
  state.eventId += 1;
  tuningState(state).aerialLastResolution = "header_shot";
}

function executeHeaderPass(state, player) {
  const target = headerPassTarget(state, player);
  if (!target) return executeHeaderShot(state, player);
  const dir = normalize(target.x - player.x, target.y - player.y);
  clearOwner(state, BALL_PHASE.PASS);
  const gap = distance(player, target);
  const factor = gap < 220 ? tuningState(state).tuning.shortPassSpeed : tuningState(state).tuning.longPassPower;
  const speed = clamp((245 + gap * 0.16) * factor, 190, 430);
  state.ball.x = player.x + dir.x * 17;
  state.ball.y = player.y + dir.y * 17;
  state.ball.vx = dir.x * speed;
  state.ball.vy = dir.y * speed;
  state.ball.targetId = target.id;
  state.ball.lastTouchId = player.id;
  state.ball.lobActive = true;
  state.ball.lobHeight = Math.max(3, (state.ball.lobHeight ?? 0) * 0.30);
  state.ball.lobVz = 18;
  target.receptionRemaining = Math.max(target.receptionRemaining ?? 0, RULES.receptionWindow);
  state.lastEvent = "header_pass";
  state.eventId += 1;
  tuningState(state).aerialLastResolution = "header_pass";
}

function loseAerialControl(state, player, reason) {
  const dir = normalize(player.facingX + (deterministic01(state, 31) - 0.5) * 0.9, player.facingY + (deterministic01(state, 47) - 0.5) * 0.9);
  clearOwner(state, BALL_PHASE.FREE);
  state.ball.targetId = null;
  state.ball.lastTouchId = player.id;
  state.ball.lobActive = false;
  state.ball.lobHeight = 0;
  state.ball.lobVz = 0;
  state.ball.vx = dir.x * 105;
  state.ball.vy = dir.y * 105;
  state.lastEvent = reason;
  state.eventId += 1;
  tuningState(state).aerialLastResolution = reason;
}

function executeAerialControl(state, player, intent, height, oriented) {
  const chest = height > ROLE_RULES.aerialChestHeight;
  const chance = oriented
    ? chest ? ROLE_RULES.orientedChestLossChance : ROLE_RULES.orientedFootLossChance
    : chest ? ROLE_RULES.autoChestLossChance : ROLE_RULES.autoFootLossChance;
  if (deterministic01(state, chest ? 91 : 71) < chance) {
    loseAerialControl(state, player, oriented ? "oriented_aerial_miscontrol" : "auto_aerial_miscontrol");
    return;
  }

  setOwner(state, player, chest ? "chest_control" : "foot_control");
  const dir = oriented
    ? normalize(intent?.x ?? player.facingX, intent?.y ?? player.facingY)
    : normalize(player.facingX, player.facingY);
  const touch = chest ? 20 : oriented ? 28 : 17;
  state.ball.x = player.x + dir.x * touch;
  state.ball.y = player.y + dir.y * touch;
  state.ball.vx = player.vx * 0.25 + dir.x * (oriented ? 42 : 20);
  state.ball.vy = player.vy * 0.25 + dir.y * (oriented ? 42 : 20);
  player.facingX = dir.x;
  player.facingY = dir.y;
  tuningState(state).aerialLastResolution = chest ? "chest_control" : "foot_control";
}

function resolveAerialReception(state, preAerial) {
  if (!preAerial?.active || !preAerial.targetId) return;
  const player = getPlayer(state, preAerial.targetId);
  if (!player?.controlled) return;

  const v7 = tuningState(state);
  const intent = v7.aerialIntent && state.elapsed <= v7.aerialIntent.until ? v7.aerialIntent : null;
  const gap = distance(player, state.ball);
  const height = Math.max(preAerial.height ?? 0, state.ball.lobHeight ?? 0);
  const contact = gap <= ROLE_RULES.aerialContactRadius;

  if (contact && height >= ROLE_RULES.aerialHeaderMinHeight && height <= ROLE_RULES.aerialHeaderMaxHeight) {
    if (intent?.type === "header-shot") {
      executeHeaderShot(state, player);
      v7.aerialIntent = null;
      return;
    }
    if (intent?.type === "header-pass") {
      executeHeaderPass(state, player);
      v7.aerialIntent = null;
      return;
    }
    if (intent?.type === "oriented-control" && height <= 48) {
      executeAerialControl(state, player, intent, height, true);
      v7.aerialIntent = null;
      return;
    }
  }

  if (state.ball.ownerId === player.id && preAerial.active) {
    if (intent?.type === "oriented-control") {
      executeAerialControl(state, player, intent, height, true);
      v7.aerialIntent = null;
    } else {
      executeAerialControl(state, player, null, height, false);
    }
  }
}

export function createGameplayState() {
  const state = base.createGameplayState();
  tuningState(state);
  updatePitchObject(state.gameplayV7.tuning);
  return state;
}

export function stepGameplay(state, input = {}, dt = RULES.fixedStep) {
  const dtReal = clamp(dt, 0, 0.05);
  const v7 = tuningState(state);
  updatePitchObject(v7.tuning);

  const preOwnerId = getOwner(state)?.id ?? null;
  const preEventId = state.eventId;
  const preAerial = state.ball.lobActive
    ? {
      active: true,
      targetId: state.ball.targetId ?? state.ball.lobTargetId ?? null,
      height: state.ball.lobHeight ?? 0,
    }
    : null;

  const cleanInput = rememberAerialIntent(state, input);

  compressForBase(state);
  const next = base.stepGameplay(state, cleanInput, dtReal * v7.tuning.matchSpeed);
  expandFromBase(next);
  updatePitchObject(v7.tuning);

  tuneHumanShot(next, cleanInput, preOwnerId, preEventId);
  tuneNewPass(next);
  resolveAerialReception(next, preAerial);
  updateTwoTeamLooseChase(next, dtReal);
  enforceFullbackReason(next, dtReal);
  enforceRoleDiscipline(next, dtReal);
  updateIdlePress(next, dtReal);

  return next;
}

export function cameraFromBall(state, settings = {}) {
  const geometry = cameraGeometry(settings);
  const halfWidth = VIEWPORT.width / (2 * geometry.zoom);
  const halfHeight = VIEWPORT.height / (2 * geometry.zoom * geometry.yScale);
  const bounds = {
    minX: halfWidth - 20,
    maxX: PITCH.width - halfWidth + 20,
    minY: halfHeight - 20,
    maxY: PITCH.height - halfHeight + 20,
  };
  const player = getControlledPlayer(state);
  if (!player) {
    return {
      x: clamp(state.ball.x, bounds.minX, bounds.maxX),
      y: clamp(state.ball.y, bounds.minY, bounds.maxY),
      playerWeight: 0,
    };
  }
  const gap = distance(player, state.ball);
  const playerWeight = clamp(0.28 + (gap / 620) * 0.20, 0.28, 0.50);
  return {
    x: clamp(state.ball.x * (1 - playerWeight) + player.x * playerWeight, bounds.minX, bounds.maxX),
    y: clamp(state.ball.y * (1 - playerWeight) + player.y * playerWeight, bounds.minY, bounds.maxY),
    playerWeight,
  };
}
