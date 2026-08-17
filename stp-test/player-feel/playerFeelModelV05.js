import * as base from "./playerFeelModelV04.js";

export const VIEWPORT = base.VIEWPORT;
export const PITCH = base.PITCH;
export const FEEL_RULES = base.FEEL_RULES;
export const createPlayerFeelState = base.createPlayerFeelState;
export const stepPlayerFeel = base.stepPlayerFeel;

function compressSide(point, hip, right, factor) {
  const dx = point.x - hip.x;
  const dy = point.y - hip.y;
  const side = dx * right.x + dy * right.y;
  const forwardX = dx - right.x * side;
  const forwardY = dy - right.y * side;
  return {
    x: hip.x + forwardX + right.x * side * factor,
    y: hip.y + forwardY + right.y * side * factor,
  };
}

export function mannequinPose(state) {
  const pose = base.mannequinPose(state);
  const factor = state.player.mode === "plant" ? 0.82 : 0.70;

  pose.leftFoot = compressSide(pose.leftFoot, pose.hip, pose.right, factor);
  pose.rightFoot = compressSide(pose.rightFoot, pose.hip, pose.right, factor);
  pose.leftKnee = compressSide(pose.leftKnee, pose.hip, pose.right, factor);
  pose.rightKnee = compressSide(pose.rightKnee, pose.hip, pose.right, factor);

  if (state.player.mode === "plant") {
    pose.plantAnchor = pose.plantedFoot === "left" ? pose.leftFoot : pose.rightFoot;
  }

  return pose;
}
