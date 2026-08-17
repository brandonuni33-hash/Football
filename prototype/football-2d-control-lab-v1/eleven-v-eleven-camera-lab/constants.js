export const VIEWPORT = Object.freeze({ width: 1000, height: 540 });

// 105 x 68 m proportions, enlarged in world units so camera tuning can happen
// independently from the 3v3 prototype.
export const PITCH = Object.freeze({
  width: 1680,
  height: 1088,
  inset: 68,
  goalDepth: 38,
  goalTop: 442,
  goalBottom: 646,
  penaltyDepth: 264,
  penaltyTop: 274,
  penaltyBottom: 814,
  sixYardDepth: 94,
  sixYardTop: 406,
  sixYardBottom: 682,
  centerCircleRadius: 92,
});

export const LAB_RULES = Object.freeze({
  playerRadius: 18,
  controlledSpeed: 222,
  ballOffset: 28,
  movementDeadzone: 0.06,
});

// Validated mobile camera baseline: 1.40 / 60 / 41.
// The head may scan across 260°, but only a 180° visual hemisphere is readable
// at any instant. SCAN turns attention; it is no longer a free camera.
export const CAMERA_DEFAULTS = Object.freeze({
  zoom: 1.40,
  angle: 60,
  scan: 41,
  headScanDegrees: 260,
  visionDegrees: 180,
  followAhead: 64,
  followDeadX: 76,
  followDeadY: 58,
  followResponse: 4.8,
  scanResponse: 2.25,
  scanReturnResponse: 3.15,
  scanDeadzone: 0.12,
  blindPitchAlpha: 0.12,
});

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalize(x = 0, y = 0) {
  const raw = Math.hypot(x, y);
  if (raw <= 0.0001) return { x: 0, y: 0, magnitude: 0 };
  const magnitude = Math.min(1, raw);
  return { x: x / raw, y: y / raw, magnitude };
}
