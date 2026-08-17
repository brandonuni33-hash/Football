import * as base from "./paceWidthGameplayV4.js?interaction-v5";

export const VIEWPORT = base.VIEWPORT;
export const PITCH = base.PITCH;
export const TEAM = base.TEAM;
export const BALL_PHASE = base.BALL_PHASE;
export const RULES = base.RULES;
export const CONTROLLED_ID = base.CONTROLLED_ID;
export const getControlledPlayer = base.getControlledPlayer;
export const getPlayer = base.getPlayer;
export const getOwner = base.getOwner;
export const actionLabels = base.actionLabels;
export const controlMode = base.controlMode;
export const cameraGeometry = base.cameraGeometry;
export const cameraFromBall = base.cameraFromBall;
export const isPointVisible = base.isPointVisible;
export const formationSummary = base.formationSummary;

const MIDLINE = PITCH.width / 2;
const CENTER_Y = PITCH.height / 2;

export const INTERACTION_RULES = Object.freeze({
  callPassMinSpeed: 245,
  callPassMaxSpeed: 395,
  passMinSpeed: 215,
  passMaxSpeed: 455,
  aiPassMinSpeed: 235,
  aiPassMaxSpeed: 390,
  lobMinVerticalSpeed: 145,
  lobMaxVerticalSpeed: 245,
  lobGravity: 430,
  lobUncontrollableHeight: 18,
  looseControlRadius: 32,
  looseChaseSpeed: 0.80,
  overlapDuration: 1.20,
  overlapCooldownMin: 5.5,
  overlapCooldownSpread: 3.0,
  overlapAdvance: 155,
  overlapBeyondHalf: 275,
  supportBack: 105,
  supportSteerSpeed: 96,
  wingerRunAdvance: 205,
  wingerInsideOffset: 118,
  wingerLineInset: 96,
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

function teamDirection(team) {
  return team === TEAM.HOME ? 1 : -1;
}

function teamKey(team) {
  return team === TEAM.HOME ? "home" : "away";
}

function isFullback(player) {
  const label = player?.positionLabel ?? player?.role;
  return label === "RB" || label === "LB";
}

function isWinger(player) {
  const label = player?.positionLabel ?? player?.role;
  return label === "RW" || label === "LW";
}

function isMidfielder(player) {
  const label = player?.positionLabel ?? player?.role;
  return ["DM", "CM", "AM", "RM", "LM"].includes(label);
}

function setOwnerSimple(state, player, reason) {
  for (const candidate of state.players) candidate.hasBall = candidate.id === player.id;
  state.ball.ownerId = player.id;
  state.ball.targetId = null;
  state.ball.phase = BALL_PHASE.CONTROLLED;
  state.ball.lastTouchId = player.id;
  state.possession = { team: player.team, playerId: player.id };
  state.lastEvent = reason;
  state.eventId += 1;
}

function releasePass(state, passer, receiver, speed, reason = "pass_forced_call") {
  if (!passer || !receiver || passer.team !== receiver.team) return false;
  const dir = normalize(receiver.x - passer.x, receiver.y - passer.y);
  if (!dir.magnitude) return false;

  for (const player of state.players) player.hasBall = false;
  state.ball.ownerId = null;
  state.ball.phase = BALL_PHASE.PASS;
  state.ball.targetId = receiver.id;
  state.ball.lastTouchId = passer.id;
  state.ball.x = passer.x + dir.x * 26;
  state.ball.y = passer.y + dir.y * 26;
  state.ball.vx = dir.x * speed;
  state.ball.vy = dir.y * speed;
  state.ball.lobActive = false;
  state.ball.lobHeight = 0;
  state.ball.lobVz = 0;
  receiver.receptionRemaining = Math.max(receiver.receptionRemaining ?? 0, RULES.receptionWindow);
  passer.aiPassCooldown = Math.max(passer.aiPassCooldown ?? 0, 0.55);
  state.possession = { team: null, playerId: null };
  state.lastEvent = reason;
  state.eventId += 1;
  return true;
}

function forceCallPass(state, input, preOwnerId) {
  if (!input.primaryPressed) return;
  const controlled = getControlledPlayer(state);
  if (!controlled || controlled.hasBall) return;

  const preOwner = preOwnerId ? getPlayer(state, preOwnerId) : null;
  if (!preOwner || preOwner.controlled || preOwner.team !== controlled.team) return;

  controlled.callRemaining = Math.max(controlled.callRemaining ?? 0, RULES.callDuration);

  const currentOwner = getOwner(state);
  if (currentOwner && currentOwner.team === controlled.team && !currentOwner.controlled) {
    const range = distance(currentOwner, controlled);
    const speed = clamp(INTERACTION_RULES.callPassMinSpeed + range * 0.20, INTERACTION_RULES.callPassMinSpeed, INTERACTION_RULES.callPassMaxSpeed);
    releasePass(state, currentOwner, controlled, speed, "call_pass");
    return;
  }

  if (state.ball.phase === BALL_PHASE.PASS && state.ball.lastTouchId === preOwner.id) {
    const dir = normalize(controlled.x - state.ball.x, controlled.y - state.ball.y);
    if (!dir.magnitude) return;
    const range = distance(state.ball, controlled);
    const speed = clamp(INTERACTION_RULES.callPassMinSpeed + range * 0.20, INTERACTION_RULES.callPassMinSpeed, INTERACTION_RULES.callPassMaxSpeed);
    const oldTarget = state.ball.targetId ? getPlayer(state, state.ball.targetId) : null;
    if (oldTarget && oldTarget.id !== controlled.id) oldTarget.receptionRemaining = 0;
    state.ball.targetId = controlled.id;
    state.ball.vx = dir.x * speed;
    state.ball.vy = dir.y * speed;
    controlled.receptionRemaining = Math.max(controlled.receptionRemaining ?? 0, RULES.receptionWindow);
    state.lastEvent = "call_pass";
  }
}

function powerToSpeed(power, minSpeed = INTERACTION_RULES.passMinSpeed, maxSpeed = INTERACTION_RULES.passMaxSpeed) {
  const normalized = clamp(Number(power ?? 0.48), 0, 1);
  return minSpeed + (maxSpeed - minSpeed) * normalized;
}

function applyPassPowerAndLob(state, input, preOwnerId) {
  if (!input.secondaryPressed || !preOwnerId) return;
  const passer = getPlayer(state, preOwnerId);
  if (!passer?.controlled) return;
  if (state.ball.phase !== BALL_PHASE.PASS || state.ball.lastTouchId !== passer.id) return;

  const direction = normalize(state.ball.vx, state.ball.vy);
  if (!direction.magnitude) return;
  const speed = powerToSpeed(input.passPower);
  state.ball.vx = direction.x * speed;
  state.ball.vy = direction.y * speed;
  state.ball.passPower = clamp(Number(input.passPower ?? 0.48), 0, 1);

  if (input.lobPass) {
    const power = state.ball.passPower;
    state.ball.lobActive = true;
    state.ball.lobHeight = 0.5;
    state.ball.lobVz = INTERACTION_RULES.lobMinVerticalSpeed
      + (INTERACTION_RULES.lobMaxVerticalSpeed - INTERACTION_RULES.lobMinVerticalSpeed) * power;
    state.ball.lobTargetId = state.ball.targetId;
    state.lastEvent = "lob_pass";
  } else {
    state.ball.lobActive = false;
    state.ball.lobHeight = 0;
    state.ball.lobVz = 0;
    state.lastEvent = "powered_pass";
  }
}

function tuneAIPassPower(state, preEventId) {
  if (state.eventId === preEventId) return;
  if (state.ball.phase !== BALL_PHASE.PASS || !state.ball.lastTouchId || !state.ball.targetId) return;
  const passer = getPlayer(state, state.ball.lastTouchId);
  const target = getPlayer(state, state.ball.targetId);
  if (!passer || !target || passer.controlled) return;
  if (state.lastEvent === "call_pass") return;

  state.interactionV5 ??= {};
  if (state.interactionV5.aiPassEventId === state.eventId) return;
  const direction = normalize(state.ball.vx, state.ball.vy);
  if (!direction.magnitude) return;
  const range = distance(passer, target);
  const speed = clamp(INTERACTION_RULES.aiPassMinSpeed + range * 0.19, INTERACTION_RULES.aiPassMinSpeed, INTERACTION_RULES.aiPassMaxSpeed);
  state.ball.vx = direction.x * speed;
  state.ball.vy = direction.y * speed;
  state.interactionV5.aiPassEventId = state.eventId;
}

function rejectHighLobControl(state, airborneSnapshot) {
  if (!airborneSnapshot?.active || airborneSnapshot.height <= INTERACTION_RULES.lobUncontrollableHeight) return;
  if (!state.ball.ownerId) return;

  for (const player of state.players) player.hasBall = false;
  state.ball.ownerId = null;
  state.ball.phase = BALL_PHASE.PASS;
  state.ball.targetId = airborneSnapshot.targetId;
  state.ball.lastTouchId = airborneSnapshot.lastTouchId;
  state.ball.lobActive = true;
  state.ball.lobHeight = airborneSnapshot.height;
  state.ball.lobVz = airborneSnapshot.vz;
  state.ball.lobTargetId = airborneSnapshot.targetId;
  state.possession = { team: null, playerId: null };
}

function stepLob(state, dt) {
  if (!state.ball.lobActive) return;
  const time = dt * (RULES.effectiveGameSpeed ?? 1);
  state.ball.lobHeight = Math.max(0, (state.ball.lobHeight ?? 0) + (state.ball.lobVz ?? 0) * time);
  state.ball.lobVz = (state.ball.lobVz ?? 0) - INTERACTION_RULES.lobGravity * time;

  if (state.ball.lobHeight <= 0 && state.ball.lobVz <= 0) {
    state.ball.lobHeight = 0;
    state.ball.lobVz = 0;
    state.ball.lobActive = false;
    state.ball.lobTargetId = null;
    if (!state.ball.ownerId && Math.hypot(state.ball.vx, state.ball.vy) < 16) {
      state.ball.phase = BALL_PHASE.FREE;
      state.ball.targetId = null;
    }
  }
}

function nearestLoosePlayer(state) {
  return state.players
    .filter((player) => player.recoveryRemaining <= 0)
    .map((player) => ({ player, gap: distance(player, state.ball) }))
    .sort((a, b) => a.gap - b.gap)[0] ?? null;
}

function enforceNearestLooseBall(state, preLooseNearest) {
  const ballLooseNow = !state.ball.ownerId && state.ball.phase === BALL_PHASE.FREE;
  if (!ballLooseNow && !preLooseNearest) return;

  const nearest = ballLooseNow ? nearestLoosePlayer(state) : preLooseNearest;
  if (!nearest?.player) return;

  if (state.ball.ownerId && preLooseNearest && state.ball.ownerId !== preLooseNearest.player.id) {
    const closest = preLooseNearest.player;
    if (distance(closest, state.ball) <= INTERACTION_RULES.looseControlRadius + 8) {
      setOwnerSimple(state, closest, "loose_recovery_nearest");
      return;
    }
  }

  if (!ballLooseNow) return;
  const chaser = nearest.player;
  state.looseBallChaserId = chaser.id;

  for (const player of state.players) {
    if (player.controlled || player.id === chaser.id) continue;
    if (player.tacticalRole === "loose-ball") {
      player.vx *= 0.42;
      player.vy *= 0.42;
      player.tacticalRole = "shape";
    }
  }

  if (!chaser.controlled) {
    const direction = normalize(state.ball.x - chaser.x, state.ball.y - chaser.y);
    const desired = RULES.effectiveRapidSpeed
      ? RULES.effectiveRapidSpeed * INTERACTION_RULES.looseChaseSpeed
      : RULES.rapidSpeed * 0.70;
    chaser.vx += direction.x * Math.min(desired, 92);
    chaser.vy += direction.y * Math.min(desired, 92);
    const speed = Math.hypot(chaser.vx, chaser.vy);
    if (speed > desired && speed > 0.001) {
      const ratio = desired / speed;
      chaser.vx *= ratio;
      chaser.vy *= ratio;
    }
    chaser.tacticalRole = "loose-ball-nearest";
  }

  if (nearest.gap <= INTERACTION_RULES.looseControlRadius) {
    setOwnerSimple(state, chaser, "loose_recovery_nearest");
  }
}

function contextualState(state, team) {
  state.contextualRuns ??= {
    home: { activeOverlapId: null, overlapUntil: 0, nextOverlapAt: 3.8, runnerId: null, runnerStyle: null, runnerStartX: 0, runnerStartY: 0, sequence: 0, supportId: null },
    away: { activeOverlapId: null, overlapUntil: 0, nextOverlapAt: 4.6, runnerId: null, runnerStyle: null, runnerStartX: 0, runnerStartY: 0, sequence: 0, supportId: null },
  };
  return state.contextualRuns[teamKey(team)];
}

function steer(player, target, dt, maxSpeed = INTERACTION_RULES.supportSteerSpeed) {
  if (!player || player.controlled || player.hasBall || !target) return;
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const gap = Math.hypot(dx, dy);
  if (gap < 1) return;
  const scale = Math.min(1, (maxSpeed * dt) / gap);
  player.x += dx * scale;
  player.y += dy * scale;
  player.vx += dx * Math.min(0.12, dt * 4.8);
  player.vy += dy * Math.min(0.12, dt * 4.8);
}

function gateFullbackOverlap(state, team, dt) {
  const info = contextualState(state, team);
  const formation = state.formationTactical?.[teamKey(team)];
  if (!formation) return null;
  const requestedId = formation.overlapId;
  const owner = getOwner(state);

  if (info.activeOverlapId && (state.elapsed >= info.overlapUntil || owner?.team !== team)) {
    info.activeOverlapId = null;
    info.overlapUntil = 0;
  }

  if (!info.activeOverlapId && requestedId && owner?.team === team && state.elapsed >= info.nextOverlapAt) {
    info.activeOverlapId = requestedId;
    info.overlapUntil = state.elapsed + INTERACTION_RULES.overlapDuration;
    const seed = ((Math.floor(state.elapsed * 10) + (team === TEAM.HOME ? 17 : 41)) % 100) / 100;
    info.nextOverlapAt = info.overlapUntil + INTERACTION_RULES.overlapCooldownMin + seed * INTERACTION_RULES.overlapCooldownSpread;
  }

  formation.overlapId = info.activeOverlapId;
  const dir = teamDirection(team);
  const fullbacks = state.players.filter((player) => player.team === team && isFullback(player));

  for (const fullback of fullbacks) {
    if (fullback.id === info.activeOverlapId) {
      const topSide = fullback.originY < CENTER_Y;
      const desiredX = state.ball.x + dir * INTERACTION_RULES.overlapAdvance;
      const maxX = team === TEAM.HOME ? MIDLINE + INTERACTION_RULES.overlapBeyondHalf : MIDLINE - INTERACTION_RULES.overlapBeyondHalf;
      const x = team === TEAM.HOME
        ? clamp(desiredX, MIDLINE + 20, maxX)
        : clamp(desiredX, maxX, MIDLINE - 20);
      steer(fullback, { x, y: topSide ? PITCH.inset + 92 : PITCH.height - PITCH.inset - 92 }, dt, 110);
      fullback.tacticalRole = "context-overlap";
    } else {
      const safeX = team === TEAM.HOME ? MIDLINE - 42 : MIDLINE + 42;
      if ((team === TEAM.HOME && fullback.x > safeX) || (team === TEAM.AWAY && fullback.x < safeX)) {
        steer(fullback, { x: safeX, y: fullback.originY }, dt, 128);
      }
    }
  }
  return info.activeOverlapId;
}

function updateWingerRunStyle(state, team, dt) {
  const info = contextualState(state, team);
  const runnerId = state.formationTactical?.[teamKey(team)]?.runnerId ?? null;
  if (runnerId !== info.runnerId) {
    info.runnerId = runnerId;
    info.supportId = null;
    if (runnerId) {
      const runner = getPlayer(state, runnerId);
      info.runnerStartX = runner?.x ?? 0;
      info.runnerStartY = runner?.y ?? 0;
      info.sequence += 1;
      info.runnerStyle = runner && isWinger(runner)
        ? (info.sequence % 2 === 0 ? "inside" : "line")
        : "depth";
    } else {
      info.runnerStyle = null;
    }
  }

  if (!runnerId) return null;
  const runner = getPlayer(state, runnerId);
  if (!runner || runner.controlled || runner.hasBall || !isWinger(runner)) return runnerId;

  const dir = teamDirection(team);
  const topSide = runner.originY < CENTER_Y;
  const target = {
    x: clamp(info.runnerStartX + dir * INTERACTION_RULES.wingerRunAdvance, PITCH.inset + 42, PITCH.width - PITCH.inset - 42),
    y: info.runnerStyle === "inside"
      ? CENTER_Y + (topSide ? -INTERACTION_RULES.wingerInsideOffset : INTERACTION_RULES.wingerInsideOffset)
      : (topSide ? PITCH.inset + INTERACTION_RULES.wingerLineInset : PITCH.height - PITCH.inset - INTERACTION_RULES.wingerLineInset),
  };
  steer(runner, target, dt, 118);
  runner.tacticalRole = `winger-run-${info.runnerStyle}`;
  return runnerId;
}

function coherentSupportPlayer(state, team, mover) {
  if (!mover) return null;
  const candidates = state.players.filter((player) => player.team === team && !player.controlled && !player.hasBall && player.id !== mover.id);
  if (isFullback(mover)) {
    const sameSide = mover.originY < CENTER_Y;
    return candidates
      .filter((player) => {
        const label = player.positionLabel ?? player.role;
        return ["RW", "LW", "RM", "LM"].includes(label) && (player.originY < CENTER_Y) === sameSide;
      })[0] ?? candidates.filter(isMidfielder).sort((a, b) => Math.abs(a.originY - mover.originY) - Math.abs(b.originY - mover.originY))[0] ?? null;
  }
  return candidates
    .filter(isMidfielder)
    .sort((a, b) => (Math.abs(a.originY - mover.originY) - Math.abs(b.originY - mover.originY)) || (distance(a, state.ball) - distance(b, state.ball)))[0] ?? null;
}

function applyCoherentSupport(state, team, activeOverlapId, runnerId, dt) {
  const info = contextualState(state, team);
  const mover = activeOverlapId ? getPlayer(state, activeOverlapId) : runnerId ? getPlayer(state, runnerId) : null;
  if (!mover) {
    info.supportId = null;
    return;
  }
  const support = coherentSupportPlayer(state, team, mover);
  if (!support) return;
  info.supportId = support.id;
  const dir = teamDirection(team);
  const moverTop = mover.y < CENTER_Y;
  const target = {
    x: clamp(state.ball.x - dir * INTERACTION_RULES.supportBack, PITCH.inset + 50, PITCH.width - PITCH.inset - 50),
    y: clamp((state.ball.y + CENTER_Y + (moverTop ? -55 : 55)) / 2, PITCH.inset + 80, PITCH.height - PITCH.inset - 80),
  };
  steer(support, target, dt, INTERACTION_RULES.supportSteerSpeed);
  support.tacticalRole = "coherent-support";
}

function applyContextualRuns(state, dt) {
  for (const team of [TEAM.HOME, TEAM.AWAY]) {
    const overlapId = gateFullbackOverlap(state, team, dt);
    const runnerId = updateWingerRunStyle(state, team, dt);
    applyCoherentSupport(state, team, overlapId, runnerId, dt);
  }
}

export function createGameplayState() {
  const state = base.createGameplayState();
  state.interactionV5 = { aiPassEventId: -1 };
  contextualState(state, TEAM.HOME);
  contextualState(state, TEAM.AWAY);
  state.ball.lobActive = false;
  state.ball.lobHeight = 0;
  state.ball.lobVz = 0;
  return state;
}

export function stepGameplay(state, input = {}, dt = RULES.fixedStep) {
  const preOwner = getOwner(state);
  const preOwnerId = preOwner?.id ?? null;
  const preEventId = state.eventId;
  const preLooseNearest = state.ball.phase === BALL_PHASE.FREE && !state.ball.ownerId ? nearestLoosePlayer(state) : null;
  const airborneSnapshot = state.ball.lobActive
    ? {
      active: true,
      height: state.ball.lobHeight ?? 0,
      vz: state.ball.lobVz ?? 0,
      targetId: state.ball.targetId ?? state.ball.lobTargetId ?? null,
      lastTouchId: state.ball.lastTouchId ?? null,
    }
    : null;

  const next = base.stepGameplay(state, input, dt);

  rejectHighLobControl(next, airborneSnapshot);
  forceCallPass(next, input, preOwnerId);
  applyPassPowerAndLob(next, input, preOwnerId);
  tuneAIPassPower(next, preEventId);
  stepLob(next, dt);
  enforceNearestLooseBall(next, preLooseNearest);
  applyContextualRuns(next, dt);
  return next;
}
