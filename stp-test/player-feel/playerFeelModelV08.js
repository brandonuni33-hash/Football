import * as base from "./playerFeelModelV06.js";

export const VIEWPORT = base.VIEWPORT;
export const PITCH = base.PITCH;
export const FEEL_RULES = Object.freeze({
  ...base.FEEL_RULES,
  precisionMagnitudeMax: 0.46,
  precisionFacingAngleDegrees: 95,
  precisionMaxSpeed: 88,
  precisionMaxPreserve: 0.72,
});

const DEG = Math.PI / 180;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const shortestAngleDelta = (from, to) => {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
};

export function createPlayerFeelState() {
  const state = base.createPlayerFeelState();
  state.player.precisionBodyControl = 0;
  return state;
}

export function stepPlayerFeel(state, input = {}, dt = FEEL_RULES.fixedStep) {
  const p = state.player;
  const previousFacing = p.facing;
  const previousSpeed = p.speed;
  const moveX = input.moveX ?? 0;
  const moveY = input.moveY ?? 0;
  const magnitude = Math.min(1, Math.hypot(moveX, moveY));
  const target = magnitude > 0.001 ? Math.atan2(moveY, moveX) : previousFacing;
  const requestedDelta = shortestAngleDelta(previousFacing, target);

  base.stepPlayerFeel(state, input, dt);

  const eligible = !input.rapidHeld
    && magnitude >= 0.08
    && magnitude <= FEEL_RULES.precisionMagnitudeMax
    && previousSpeed <= FEEL_RULES.precisionMaxSpeed
    && Math.abs(requestedDelta) >= FEEL_RULES.precisionFacingAngleDegrees * DEG;

  if (!eligible) {
    p.precisionBodyControl = 0;
    return state;
  }

  // V0.8 : plus de verrouillage rigide. Le corps garde seulement une partie
  // de son orientation quand le stick est léger et franchement vers l'arrière.
  const intensity = clamp(
    (FEEL_RULES.precisionMagnitudeMax - magnitude) / (FEEL_RULES.precisionMagnitudeMax - 0.08),
    0,
    1,
  );
  const preserve = FEEL_RULES.precisionMaxPreserve * intensity;
  const baseTurn = shortestAngleDelta(previousFacing, p.facing);
  p.facing = previousFacing + baseTurn * (1 - preserve);
  p.desiredFacing = target;
  p.turnDeltaDegrees = Math.abs(requestedDelta) / DEG;
  p.precisionBodyControl = preserve;
  if (p.mode === "run" && preserve > 0.18) p.mode = "precision";

  return state;
}

export const mannequinPose = base.mannequinPose;
