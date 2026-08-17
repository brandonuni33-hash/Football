export const FIELD = Object.freeze({ width: 1000, height: 540, inset: 34, goalDepth: 24, goalTop: 205, goalBottom: 335 });

export const TEAM = Object.freeze({ HOME: "home", AWAY: "away" });
export const BALL_PHASE = Object.freeze({ CONTROLLED: "controlled", FREE: "free", PASS: "pass", SHOT: "shot" });

export const RULES = Object.freeze({
  fixedStep: 1 / 60,
  playerRadius: 17,
  playerCollisionRadius: 16,
  playerCollisionIterations: 3,
  playerCollisionVelocityBlock: 0.94,
  controlRadius: 29,
  dribbleFreedom: 0.5,
  dribbleControlDistance: 20,
  dribbleGuideSpeed: 90,
  dribbleTouchBaseSpeed: 28,
  dribbleTouchSpeedRatio: 0.12,
  dribbleTouchInterval: 0.14,
  maxSpeed: 143,
  acceleration: 615,
  deceleration: 900,
  protectionDuration: 3,
  protectionCooldown: 2,
  protectionSpeedScale: 0.33,
  protectionControlDistance: 23,
  receptionWindow: 0.55,
  orientedTouchStartDistance: 21,
  orientedTouchShortDistance: 29,
  orientedTouchMediumDistance: 34,
  orientedTouchLongDistance: 39,
  orientedTouchShortDuration: 0.28,
  orientedTouchMediumDuration: 0.34,
  orientedTouchLongDuration: 0.42,
  orientedTouchShortBallSpeed: 42,
  orientedTouchMediumBallSpeed: 62,
  orientedTouchLongBallSpeed: 82,
  orientedTouchBallFriction: 0.94,
  orientedTouchRecontrolRadius: 36,
  orientedTouchAutoFollowMin: 0.14,
  orientedTouchAutoFollowMax: 0.26,
  shotSpeed: 430,
  passAssist: 0.8,
  passLaneBlockRadius: 29,
  tackleRange: 43,
  tackleArcDot: 0.15,
  tackleDuration: 0.22,
  tackleRecovery: 0.42,
  missedTackleRecovery: 0.9,
  defensiveBrakeDuration: 1.2,
  defensiveBrakeDeepDuration: 0.7,
  jockeySpeedScale: 0.52,
  deepJockeySpeedScale: 0.40,
  normalPaceScale: 0.76,
  recentBallLossDuration: 0.55,
  recentBallLossReachScale: 0.64,
  recentBallLossMaxSpeedPenalty: 75,
  recentBallLossScorePenalty: 20,
  goalkeeperRadius: 19,
  goalkeeperSaveRadius: 27,
  goalkeeperSpeed: 92,
  callDuration: 1.6,
  manualCallPriorityBoost: 66,
  aiCallBoost: 22,
  aiCallDuration: 0.9,
  aiCallCooldown: 2.6,
  aiTeamCallCooldown: 1.8,
  aiCallMinLaneScore: 32,
  aiCallMinReceiverSpace: 48,
  aiPressMaxDuration: 3,
  aiPressTechnicalDuration: 2.4,
  aiPressCounterDuration: 1.8,
  aiPressTrapDuration: 2.1,
  aiPressCooldown: 4.2,
  aiPressTriggerWindow: 0.95,
  aiHighPressMaxDuration: 1.35,
  aiHighPressCooldown: 7,
  aiHighPressDefenderRange: 82,
  aiHighPressCompactDepth: 175,
  aiContainDistance: 86,
  aiRetreatDistance: 108,
  aiCatchUpSpeedScale: 1.08,
  aiCatchUpDepthTrigger: -8,
  imprecisePassCrossTrack: 31,
  imprecisePassCheckRange: 145,
  scoreToWin: 3,
});

export const ACTION_LABELS = Object.freeze({
  attack: Object.freeze({ primary: "TIR", secondary: "PASSE", tertiary: "PROT." }),
  defend: Object.freeze({ primary: "APPEL", secondary: "FREIN", tertiary: "PROT." }),
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
export function passSpeedFromLevel(level = 40) {
  return 170 + clamp(Number(level) || 0, 0, 100) * 1.9;
}
export function movementFeelFromLevel(level = 50) {
  const value = clamp(Number(level) || 0, 0, 100) / 100;
  return {
    maxSpeed: 105 + value * 76,
    acceleration: 430 + value * 370,
    deceleration: 720 + value * 360,
  };
}
