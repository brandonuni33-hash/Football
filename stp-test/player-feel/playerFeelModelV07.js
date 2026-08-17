import * as base from "./playerFeelModelV06.js";

export const VIEWPORT = base.VIEWPORT;
export const PITCH = base.PITCH;
export const FEEL_RULES = Object.freeze({
  ...base.FEEL_RULES,
  precisionMagnitudeMax: 0.58,
  precisionFacingAngleDegrees: 55,
  precisionMaxSpeed: 104,
});

const DEG = Math.PI / 180;
const shortestAngleDelta = (from, to) => {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
};

export function createPlayerFeelState() {
  const state = base.createPlayerFeelState();
  state.player.precisionBodyLock = false;
  return state;
}

export function stepPlayerFeel(state, input = {}, dt = FEEL_RULES.fixedStep) {
  const p = state.player;
  const previousFacing = p.facing;
  const moveX = input.moveX ?? 0;
  const moveY = input.moveY ?? 0;
  const magnitude = Math.min(1, Math.hypot(moveX, moveY));
  const target = magnitude > 0.001 ? Math.atan2(moveY, moveX) : previousFacing;
  const requestedDelta = shortestAngleDelta(previousFacing, target);
  const previousSpeed = p.speed;

  base.stepPlayerFeel(state, input, dt);

  const precisionBodyLock = !input.rapidHeld
    && magnitude >= 0.08
    && magnitude <= FEEL_RULES.precisionMagnitudeMax
    && previousSpeed <= FEEL_RULES.precisionMaxSpeed
    && Math.abs(requestedDelta) >= FEEL_RULES.precisionFacingAngleDegrees * DEG;

  p.precisionBodyLock = precisionBodyLock;
  if (precisionBodyLock) {
    p.facing = previousFacing;
    p.desiredFacing = previousFacing;
    p.turnDeltaDegrees = Math.abs(requestedDelta) / DEG;
    if (p.mode === "run") p.mode = "precision";
  }

  return state;
}

export const mannequinPose = base.mannequinPose;
