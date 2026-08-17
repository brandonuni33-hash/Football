import * as base from "./playerFeelModelV02.js";

export const VIEWPORT = base.VIEWPORT;
export const PITCH = base.PITCH;

export const FEEL_RULES = Object.freeze({
  ...base.FEEL_RULES,
  torsoIdleDegrees: 1.5,
  torsoNormalDegrees: 7.5,
  torsoRapidDegrees: 10.5,
  torsoLeanInResponse: 5.8,
  torsoLeanOutResponse: 2.6,
  torsoBrakeTargetScale: 0.22,
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function createPlayerFeelState() {
  const state = base.createPlayerFeelState();
  state.player.torsoLean = 0;
  state.player.torsoLeanDegrees = FEEL_RULES.torsoIdleDegrees;
  return state;
}

function updateTorsoLean(state, input, dt) {
  const player = state.player;
  const speedRatio = clamp(player.speed / FEEL_RULES.rapidSpeed, 0, 1);
  const moveMagnitude = Math.hypot(input.moveX ?? 0, input.moveY ?? 0);
  const hasMovementInput = moveMagnitude > 0.04;

  let targetLean = 0;
  if (player.speed > 8) {
    if (hasMovementInput) {
      const paceScale = player.rapid ? 1 : 0.72;
      targetLean = clamp(speedRatio * paceScale, 0, 1);
    } else {
      // Dès que le stick est relâché le joueur commence à se redresser,
      // mais garde un léger angle tant que son inertie le fait encore avancer.
      targetLean = clamp(speedRatio * FEEL_RULES.torsoBrakeTargetScale, 0, 1);
    }
  }

  const response = targetLean > player.torsoLean
    ? FEEL_RULES.torsoLeanInResponse
    : FEEL_RULES.torsoLeanOutResponse;
  const alpha = 1 - Math.exp(-response * dt);
  player.torsoLean += (targetLean - player.torsoLean) * alpha;
  if (player.speed <= 2 && player.torsoLean < 0.01) player.torsoLean = 0;

  const maxDegrees = player.rapid
    ? FEEL_RULES.torsoRapidDegrees
    : FEEL_RULES.torsoNormalDegrees;
  player.torsoLeanDegrees = FEEL_RULES.torsoIdleDegrees
    + player.torsoLean * (maxDegrees - FEEL_RULES.torsoIdleDegrees);
}

export function stepPlayerFeel(state, input = {}, dt = FEEL_RULES.fixedStep) {
  const safeDt = clamp(dt, 0, 0.05);
  base.stepPlayerFeel(state, input, safeDt);
  updateTorsoLean(state, input, safeDt);
  return state;
}

function translated(point, forward, amount) {
  return {
    x: point.x + forward.x * amount,
    y: point.y + forward.y * amount,
  };
}

export function mannequinPose(state) {
  const pose = base.mannequinPose(state);
  const lean = clamp(state.player.torsoLean ?? 0, 0, 1);

  // Dans la vue du dessus, l'inclinaison du buste se lit par le décalage
  // bassin → torse → tête. À l'arrêt ce décalage est presque nul ; il
  // augmente progressivement avec la course.
  const currentTorsoOffset = (pose.torso.x - pose.hip.x) * pose.forward.x
    + (pose.torso.y - pose.hip.y) * pose.forward.y;
  const desiredTorsoOffset = 1.2 + lean * 8.0;
  const torsoDelta = desiredTorsoOffset - currentTorsoOffset;
  const headExtra = lean * 2.4;

  pose.torso = translated(pose.torso, pose.forward, torsoDelta);
  pose.leftShoulder = translated(pose.leftShoulder, pose.forward, torsoDelta);
  pose.rightShoulder = translated(pose.rightShoulder, pose.forward, torsoDelta);
  pose.leftElbow = translated(pose.leftElbow, pose.forward, torsoDelta);
  pose.rightElbow = translated(pose.rightElbow, pose.forward, torsoDelta);
  pose.leftHand = translated(pose.leftHand, pose.forward, torsoDelta);
  pose.rightHand = translated(pose.rightHand, pose.forward, torsoDelta);
  pose.head = translated(pose.head, pose.forward, torsoDelta + headExtra);
  pose.torsoLean = lean;
  pose.torsoLeanDegrees = state.player.torsoLeanDegrees ?? FEEL_RULES.torsoIdleDegrees;

  return pose;
}
