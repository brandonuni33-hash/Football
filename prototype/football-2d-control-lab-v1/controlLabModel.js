import { DEFAULT_FEEL_TUNING, FIELD } from "../football-2d-v0/football2dModel.js";
import { DEFAULT_ATHLETIC_PROFILE } from "../football-2d-v0/playerAthleticProfile.js";
import { createScenarioState, stepScenario } from "../football-2d-v0/scenarioModel.js";

export const CONTROL_RULES = Object.freeze({
  receptionWindow: 3,
  protectionMax: 3,
  protectionCooldown: 5,
  protectionMaxDrive: 0.34,
  protectionMaxInput: 0.38,
  stationaryDrive: 0.14,
  stationaryInput: 0.14,
  feintTrigger: 0.55,
  feintReset: 0.2,
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function normalize(x = 0, y = 0) {
  const length = Math.hypot(x, y);
  if (length < 0.001) return { x: 0, y: 0, magnitude: 0 };
  return { x: x / length, y: y / length, magnitude: clamp(length, 0, 1) };
}

function dot(ax, ay, bx, by) {
  return ax * bx + ay * by;
}

function isStationary(state, moveMagnitude) {
  return (state.driveMagnitude ?? 0) <= CONTROL_RULES.stationaryDrive && moveMagnitude <= CONTROL_RULES.stationaryInput;
}

function startIncomingPass(base) {
  return {
    ...base,
    possession: false,
    ball: { x: 132, y: FIELD.h / 2, vx: 188, vy: 0 },
    lastEvent: "incoming_pass",
  };
}

export function createControlLabState() {
  const base = startIncomingPass(createScenarioState());
  return {
    ...base,
    controlMode: "vision",
    lookX: 1,
    lookY: 0,
    rightStickMagnitude: 0,
    rightStickArmed: true,
    receptionWindow: 0,
    receptionPrepared: false,
    protectionActive: false,
    protectionRemaining: CONTROL_RULES.protectionMax,
    protectionCooldown: 0,
    protectionLockUntilRelease: false,
    protectWasRequested: false,
    plantTime: 0,
    previousMoveMagnitude: 0,
    feintTime: 0,
    feintStrength: 0,
    feintX: 0,
    feintY: 0,
    lastFeintResult: null,
    defenderVelocityX: 0,
    defenderVelocityY: 0,
    lastControlAction: null,
  };
}

function applyFootPlant(state, input, dt) {
  const move = normalize(input.moveX, input.moveY);
  let next = { ...state, plantTime: Math.max(0, (state.plantTime ?? 0) - dt) };
  const drive = state.driveMagnitude ?? 0;
  const hardStop = move.magnitude < 0.08 && drive > 0.55;
  const facing = normalize(state.player.facingX, state.player.facingY);
  const reversal = move.magnitude > 0.25 && drive > 0.55 && dot(facing.x, facing.y, move.x, move.y) < -0.35;

  if (hardStop) {
    next = {
      ...next,
      driveMagnitude: Math.min(drive, 0.18),
      plantTime: 0.16,
      player: { ...state.player, vx: state.player.vx * 0.25, vy: state.player.vy * 0.25 },
      lastControlAction: "appui",
    };
  } else if (reversal) {
    next = {
      ...next,
      driveMagnitude: Math.min(drive, 0.42),
      plantTime: 0.12,
      player: { ...state.player, vx: state.player.vx * 0.62, vy: state.player.vy * 0.62 },
      lastControlAction: "appui",
    };
  }

  return { state: next, move };
}

function resolveProtection(state, requested, moveMagnitude, dt) {
  let cooldown = Math.max(0, (state.protectionCooldown ?? 0) - dt);
  let active = !!state.protectionActive;
  let remaining = state.protectionRemaining ?? CONTROL_RULES.protectionMax;
  let lock = !!state.protectionLockUntilRelease;
  const drive = state.driveMagnitude ?? 0;
  const lowSpeed = drive <= CONTROL_RULES.protectionMaxDrive && moveMagnitude <= CONTROL_RULES.protectionMaxInput;
  const canStart = !!state.possession && lowSpeed && cooldown <= 0 && !lock;

  if (!requested) {
    if (active) cooldown = CONTROL_RULES.protectionCooldown;
    active = false;
    remaining = CONTROL_RULES.protectionMax;
    lock = false;
  } else if (active) {
    const forcedEnd = !state.possession || !lowSpeed || remaining <= 0;
    if (forcedEnd) {
      active = false;
      remaining = CONTROL_RULES.protectionMax;
      cooldown = CONTROL_RULES.protectionCooldown;
      lock = true;
    } else {
      remaining = Math.max(0, remaining - dt);
      if (remaining <= 0) {
        active = false;
        remaining = CONTROL_RULES.protectionMax;
        cooldown = CONTROL_RULES.protectionCooldown;
        lock = true;
      }
    }
  } else if (canStart) {
    active = true;
    remaining = Math.max(0, CONTROL_RULES.protectionMax - dt);
  }

  return {
    active,
    remaining,
    cooldown,
    lock,
    available: !!state.possession && lowSpeed && cooldown <= 0 && !lock,
  };
}

function orientReception(state, intent) {
  if (intent.magnitude < 0.08) return state;
  const distance = 22;
  return {
    ...state,
    lookX: intent.x,
    lookY: intent.y,
    receptionPrepared: true,
    player: { ...state.player, facingX: intent.x, facingY: intent.y },
    ball: {
      ...state.ball,
      x: state.player.x + intent.x * distance,
      y: state.player.y + intent.y * distance,
      vx: state.player.vx * 0.35,
      vy: state.player.vy * 0.35,
    },
    lastControlAction: "orientation_reception",
  };
}

function feintBiteStrength(state, intent) {
  const toPlayer = normalize(state.player.x - state.defender.x, state.player.y - state.defender.y);
  const distance = Math.hypot(state.player.x - state.defender.x, state.player.y - state.defender.y);
  if (distance < 24 || distance > 170) return 0;

  const proximity = clamp(1 - Math.abs(distance - 78) / 92, 0, 1);
  const defenderSpeed = Math.hypot(state.defenderVelocityX ?? 0, state.defenderVelocityY ?? 0);
  const velocity = normalize(state.defenderVelocityX, state.defenderVelocityY);
  const engagement = clamp(defenderSpeed / 178, 0, 1) * clamp((dot(velocity.x, velocity.y, toPlayer.x, toPlayer.y) + 1) / 2, 0, 1);
  const facing = normalize(state.player.facingX, state.player.facingY);
  const sideX = -facing.y;
  const sideY = facing.x;
  const lateralQuality = Math.abs(dot(intent.x, intent.y, sideX, sideY));
  const composure = 0.58;
  const score = proximity * 0.45 + engagement * 0.30 + lateralQuality * 0.25 - composure;
  return clamp(score * 2.15, 0, 0.78);
}

function triggerFeint(state, intent) {
  const strength = feintBiteStrength(state, intent);
  return {
    ...state,
    rightStickArmed: false,
    feintTime: 0.38,
    feintStrength: strength,
    feintX: intent.x,
    feintY: intent.y,
    lookX: intent.x,
    lookY: intent.y,
    lastFeintResult: strength >= 0.18 ? "transfert_appui" : "reste_sur_appuis",
    lastControlAction: "feinte",
  };
}

function applyDefenderCommitment(state, dt) {
  const time = Math.max(0, (state.feintTime ?? 0) - dt);
  if ((state.feintTime ?? 0) <= 0 || (state.feintStrength ?? 0) <= 0) {
    return { ...state, feintTime: time };
  }

  const speed = 92 * state.feintStrength;
  return {
    ...state,
    feintTime: time,
    defender: {
      ...state.defender,
      x: clamp(state.defender.x + state.feintX * speed * dt, 500, FIELD.goalX - 90),
      y: clamp(state.defender.y + state.feintY * speed * dt, FIELD.inset + 20, FIELD.h - FIELD.inset - 20),
    },
  };
}

function resolveRightStick(state, input, moveMagnitude) {
  const intent = normalize(input.controlX, input.controlY);
  let next = { ...state, rightStickMagnitude: intent.magnitude };
  if (intent.magnitude <= CONTROL_RULES.feintReset) next.rightStickArmed = true;

  if (!state.possession) {
    if (intent.magnitude >= 0.08) next = { ...next, lookX: intent.x, lookY: intent.y };
    return { state: next, mode: "vision" };
  }

  if (state.protectionActive || (state.burstTime ?? 0) > 0) return { state: next, mode: "verrouille" };

  const stationary = isStationary(state, moveMagnitude);
  if (!stationary) {
    return { state: { ...next, receptionWindow: 0 }, mode: "verrouille" };
  }

  if ((state.receptionWindow ?? 0) > 0) {
    if (intent.magnitude >= 0.08) next = orientReception(next, intent);
    return { state: next, mode: "reception" };
  }

  if (intent.magnitude >= CONTROL_RULES.feintTrigger && next.rightStickArmed) next = triggerFeint(next, intent);
  else if (intent.magnitude >= 0.08) next = { ...next, lookX: intent.x, lookY: intent.y };
  return { state: next, mode: "feinte" };
}

export function stepControlLab(
  state,
  input = {},
  dt = 1 / 60,
  tuning = DEFAULT_FEEL_TUNING,
  athletic = DEFAULT_ATHLETIC_PROFILE,
) {
  const time = clamp(Number(dt) || 0, 0, 0.05);
  const planted = applyFootPlant(state, input, time);
  let working = planted.state;
  const move = planted.move;

  const protection = resolveProtection(working, !!input.protecting, move.magnitude, time);
  working = {
    ...working,
    protectionActive: protection.active,
    protectionRemaining: protection.remaining,
    protectionCooldown: protection.cooldown,
    protectionLockUntilRelease: protection.lock,
    protectWasRequested: !!input.protecting,
  };

  const right = resolveRightStick(working, input, move.magnitude);
  working = { ...right.state, controlMode: right.mode };

  const hadPossession = !!working.possession;
  const defenderBefore = { ...working.defender };
  const scenarioInput = {
    moveX: input.moveX ?? 0,
    moveY: input.moveY ?? 0,
    protecting: working.protectionActive,
    burstTriggered: !!input.burstTriggered && !working.protectionActive,
    burstX: input.burstX ?? 0,
    burstY: input.burstY ?? 0,
    shootReleased: !!input.shootReleased,
    shootPower: input.shootPower ?? 0,
  };

  let next = stepScenario(working, scenarioInput, time, tuning, athletic);
  const defenderVelocityX = time > 0 ? (next.defender.x - defenderBefore.x) / time : 0;
  const defenderVelocityY = time > 0 ? (next.defender.y - defenderBefore.y) / time : 0;
  next = { ...next, defenderVelocityX, defenderVelocityY };

  if (!hadPossession && next.possession) {
    next = {
      ...next,
      receptionWindow: CONTROL_RULES.receptionWindow,
      receptionPrepared: false,
      lastEvent: "reception",
    };
    if (move.magnitude <= CONTROL_RULES.stationaryInput) {
      const intent = normalize(input.controlX, input.controlY);
      if (intent.magnitude >= 0.08) next = orientReception(next, intent);
    }
  } else if (next.possession && (next.receptionWindow ?? 0) > 0) {
    next = { ...next, receptionWindow: Math.max(0, next.receptionWindow - time) };
  } else if (!next.possession) {
    next = { ...next, receptionWindow: 0, receptionPrepared: false };
  }

  if (working.protectionActive && !next.possession) {
    next = {
      ...next,
      protectionActive: false,
      protectionRemaining: CONTROL_RULES.protectionMax,
      protectionCooldown: CONTROL_RULES.protectionCooldown,
      protectionLockUntilRelease: !!input.protecting,
    };
  }

  next = applyDefenderCommitment(next, time);

  const finalMoveMagnitude = Math.hypot(input.moveX ?? 0, input.moveY ?? 0);
  let finalMode = next.controlMode;
  if (!next.possession) finalMode = "vision";
  else if (next.protectionActive) finalMode = "protection";
  else if ((next.burstTime ?? 0) > 0 || (next.driveMagnitude ?? 0) > CONTROL_RULES.stationaryDrive || finalMoveMagnitude > CONTROL_RULES.stationaryInput) finalMode = "verrouille";
  else if ((next.receptionWindow ?? 0) > 0) finalMode = "reception";
  else finalMode = "feinte";

  if (input.passPressed) next = { ...next, lastControlAction: "passe" };
  else if (input.shootReleased) next = { ...next, lastControlAction: "tir" };

  return {
    ...next,
    controlMode: finalMode,
    previousMoveMagnitude: move.magnitude,
    protectionAvailable: !!next.possession
      && (next.driveMagnitude ?? 0) <= CONTROL_RULES.protectionMaxDrive
      && finalMoveMagnitude <= CONTROL_RULES.protectionMaxInput
      && (next.protectionCooldown ?? 0) <= 0
      && !next.protectionLockUntilRelease,
  };
}
