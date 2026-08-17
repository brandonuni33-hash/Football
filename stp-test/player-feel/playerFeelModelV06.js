import * as base from "./playerFeelModelV05.js";

export const VIEWPORT = base.VIEWPORT;
export const PITCH = base.PITCH;
export const FEEL_RULES = Object.freeze({
  ...base.FEEL_RULES,
  torsoNormalDegrees: 3.3,
  torsoRapidDegrees: 4.6,
});
export const createPlayerFeelState = base.createPlayerFeelState;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export function stepPlayerFeel(state, input = {}, dt = FEEL_RULES.fixedStep) {
  base.stepPlayerFeel(state, input, dt);
  const p = state.player;
  const lean = clamp(p.torsoLean ?? 0, 0, 1);
  const max = p.rapid ? FEEL_RULES.torsoRapidDegrees : FEEL_RULES.torsoNormalDegrees;
  p.torsoLeanDegrees = 0.8 + lean * (max - 0.8);
  return state;
}

function forwardDistance(a, b, forward) {
  return (a.x - b.x) * forward.x + (a.y - b.y) * forward.y;
}

function shiftBack(point, forward, amount) {
  return {
    x: point.x - forward.x * amount,
    y: point.y - forward.y * amount,
  };
}

export function mannequinPose(state) {
  const pose = base.mannequinPose(state);
  const lean = clamp(state.player.torsoLean ?? 0, 0, 1);

  // Le bassin reste la base du corps. On garde seulement une légère projection
  // en course pour éviter l'impression que le joueur tombe vers l'avant.
  const currentTorsoForward = forwardDistance(pose.torso, pose.hip, pose.forward);
  const desiredTorsoForward = 0.15 + lean * 1.35;
  const torsoBack = Math.max(0, currentTorsoForward - desiredTorsoForward);

  for (const key of [
    "torso",
    "leftShoulder",
    "rightShoulder",
    "leftElbow",
    "rightElbow",
    "leftHand",
    "rightHand",
  ]) {
    pose[key] = shiftBack(pose[key], pose.forward, torsoBack);
  }

  // La tête doit rester au-dessus du buste, pas projetée loin devant lui.
  const currentHeadForward = forwardDistance(pose.head, pose.torso, pose.forward);
  const desiredHeadForward = 8.7 + lean * 0.5;
  const headBack = Math.max(0, currentHeadForward - desiredHeadForward);
  pose.head = shiftBack(pose.head, pose.forward, torsoBack + headBack);

  pose.torsoLeanDegrees = state.player.torsoLeanDegrees;
  return pose;
}
