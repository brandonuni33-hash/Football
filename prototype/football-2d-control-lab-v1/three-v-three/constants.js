export const FIELD = Object.freeze({ width: 960, height: 540, inset: 34, goalDepth: 24, goalTop: 205, goalBottom: 335 });

export const TEAM = Object.freeze({ HOME: "home", AWAY: "away" });
export const BALL_PHASE = Object.freeze({ CONTROLLED: "controlled", FREE: "free", PASS: "pass", SHOT: "shot" });

export const RULES = Object.freeze({
  fixedStep: 1 / 60,
  playerRadius: 17,
  controlRadius: 29,
  maxSpeed: 198,
  acceleration: 1080,
  deceleration: 1420,
  protectionDuration: 3,
  protectionCooldown: 2,
  protectionSpeedScale: 0.33,
  protectionControlDistance: 23,
  receptionWindow: 0.55,
  passSpeed: 360,
  shotSpeed: 560,
  tackleRange: 43,
  tackleArcDot: 0.15,
  tackleDuration: 0.22,
  tackleRecovery: 0.42,
  missedTackleRecovery: 0.9,
  jockeySpeedScale: 0.48,
  callDuration: 1.3,
  scoreToWin: 3,
});

export const ACTION_LABELS = Object.freeze({
  attack: Object.freeze({ primary: "TIR", secondary: "PASSE", tertiary: "PROT." }),
  defend: Object.freeze({ primary: "TACLE", secondary: "APPEL", tertiary: "FREIN" }),
});

export function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
export function length(x = 0, y = 0) { return Math.hypot(x, y); }
export function normalize(x = 0, y = 0) {
  const magnitude = length(x, y);
  return magnitude > 0.0001 ? { x: x / magnitude, y: y / magnitude, magnitude: clamp(magnitude, 0, 1) } : { x: 0, y: 0, magnitude: 0 };
}
export function dot(a, b) { return a.x * b.x + a.y * b.y; }
export function distance(a, b) { return length(a.x - b.x, a.y - b.y); }
export function approach(value, target, amount) {
  if (value < target) return Math.min(target, value + amount);
  return Math.max(target, value - amount);
}