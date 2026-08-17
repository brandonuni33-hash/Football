import * as base from "./playerFeelModelV08.js";

export const VIEWPORT = base.VIEWPORT;
export const PITCH = base.PITCH;
export const FEEL_RULES = Object.freeze({
  ...base.FEEL_RULES,
  rapidSpeed: 212,
});

export const createPlayerFeelState = base.createPlayerFeelState;

export function stepPlayerFeel(state, input = {}, dt = FEEL_RULES.fixedStep) {
  base.stepPlayerFeel(state, input, dt);
  const p = state.player;

  if (input.rapidHeld && p.speed > FEEL_RULES.rapidSpeed) {
    const oldVx = p.vx;
    const oldVy = p.vy;
    const ratio = FEEL_RULES.rapidSpeed / p.speed;
    p.vx *= ratio;
    p.vy *= ratio;
    p.speed = FEEL_RULES.rapidSpeed;

    // Corrige aussi le petit excès de déplacement du pas simulé par la base.
    p.x -= (oldVx - p.vx) * dt;
    p.y -= (oldVy - p.vy) * dt;
  }

  return state;
}

export const mannequinPose = base.mannequinPose;
