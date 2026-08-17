function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smooth01(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

export const DEFAULT_GAIT = Object.freeze({
  maxLegSwingDeg: 15,
  maxFootLiftRatio: 0.018,
  maxTorsoRollDeg: 1.4,
  maxForwardLeanDeg: 3.2,
  maxHipShiftRatio: 0.006,
});

export function createPlayerGaitPose(state = {}, options = {}) {
  const config = { ...DEFAULT_GAIT, ...options };
  const speedRatio = clamp(Number(state.speedRatio) || 0, 0, 1);
  const phase = ((Number(state.stridePhase) || 0) % 1 + 1) % 1;

  if (speedRatio < 0.01) {
    return Object.freeze({
      phase,
      speedRatio: 0,
      plantedFoot: state.plantedFoot ?? 'left',
      leftLegDeg: 0,
      rightLegDeg: 0,
      leftLiftRatio: 0,
      rightLiftRatio: 0,
      torsoRollDeg: 0,
      forwardLeanDeg: 0,
      hipShiftRatio: 0,
    });
  }

  // La phase vient de la distance réellement parcourue dans playerMovement.
  // Ainsi les jambes ne continuent jamais à « pédaler » si le joueur ne bouge pas.
  const effort = smooth01(speedRatio);
  const wave = Math.sin(phase * Math.PI * 2);
  const legSwing = config.maxLegSwingDeg * (0.35 + 0.65 * effort);
  const lift = config.maxFootLiftRatio * effort;

  // Quand le pied gauche est en appui, le droit est dans sa phase de retour,
  // puis l'inverse sur la deuxième moitié de la foulée.
  const leftLift = Math.max(0, -wave) * lift;
  const rightLift = Math.max(0, wave) * lift;

  return Object.freeze({
    phase,
    speedRatio,
    plantedFoot: state.plantedFoot ?? (phase < 0.5 ? 'left' : 'right'),
    leftLegDeg: wave * legSwing,
    rightLegDeg: -wave * legSwing,
    leftLiftRatio: leftLift,
    rightLiftRatio: rightLift,
    torsoRollDeg: -wave * config.maxTorsoRollDeg * effort,
    forwardLeanDeg: config.maxForwardLeanDeg * effort,
    hipShiftRatio: Math.sin(phase * Math.PI * 4) * config.maxHipShiftRatio * effort,
  });
}
