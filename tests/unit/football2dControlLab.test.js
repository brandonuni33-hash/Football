import test from "node:test";
import assert from "node:assert/strict";
import { CONTROL_RULES, createControlLabState, stepControlLab } from "../../prototype/football-2d-control-lab-v1/controlLabModel.js";

const FEEL = { playerSpeed: 1, ballControl: 1, shotPower: 1.09 };
const ATHLETIC = { speed: 80, acceleration: 80 };

function possessedState() {
  const base = createControlLabState();
  return {
    ...base,
    possession: true,
    lastEvent: null,
    ball: { x: base.player.x + 24, y: base.player.y, vx: 0, vy: 0 },
    receptionWindow: 0,
    driveMagnitude: 0,
  };
}

test("vertical slice starts with an incoming pass and right stick available for vision", () => {
  const state = createControlLabState();
  assert.equal(state.possession, false);
  const next = stepControlLab(state, { controlX: 0, controlY: -1 }, 1 / 60, FEEL, ATHLETIC);
  assert.equal(next.controlMode, "vision");
  assert.ok(next.lookY < -0.9);
});

test("right stick is fully locked while moving with the ball", () => {
  const state = { ...possessedState(), driveMagnitude: 0.7 };
  const beforeBall = { ...state.ball };
  const next = stepControlLab(state, { moveX: 1, moveY: 0, controlX: 0, controlY: -1 }, 1 / 60, FEEL, ATHLETIC);
  assert.equal(next.controlMode, "verrouille");
  assert.ok(next.ball.y >= beforeBall.y - 2);
});

test("reception orientation is available for at most three seconds and closes when movement starts", () => {
  const state = { ...possessedState(), receptionWindow: CONTROL_RULES.receptionWindow };
  const oriented = stepControlLab(state, { controlX: 0, controlY: -1 }, 1 / 60, FEEL, ATHLETIC);
  assert.equal(oriented.controlMode, "reception");
  assert.ok(oriented.player.facingY < -0.9);
  const moving = stepControlLab(oriented, { moveX: 1, controlX: 0, controlY: 1 }, 1 / 60, FEEL, ATHLETIC);
  assert.equal(moving.controlMode, "verrouille");
  assert.equal(moving.receptionWindow, 0);
});

test("body feint only exists at a stop and never moves the ball as a dribble command", () => {
  const state = { ...possessedState(), defender: { x: 335, y: 270 }, defenderVelocityX: -150, defenderVelocityY: 0 };
  const beforeBall = { ...state.ball };
  const next = stepControlLab(state, { controlX: 0, controlY: 1 }, 1 / 60, FEEL, ATHLETIC);
  assert.equal(next.controlMode, "feinte");
  assert.equal(next.lastControlAction, "feinte");
  assert.ok(Math.abs(next.ball.y - beforeBall.y) < 5);
  assert.ok(["transfert_appui", "reste_sur_appuis"].includes(next.lastFeintResult));
});

test("protection is limited to low speed, lasts three seconds max, then starts five second cooldown", () => {
  let state = possessedState();
  state = stepControlLab(state, { protecting: true, moveX: 0.1 }, 1 / 60, FEEL, ATHLETIC);
  assert.equal(state.protectionActive, true);
  for (let i = 0; i < 190; i++) state = stepControlLab(state, { protecting: true, moveX: 0.1 }, 1 / 60, FEEL, ATHLETIC);
  assert.equal(state.protectionActive, false);
  assert.ok(state.protectionCooldown > 4.7);
});

test("accelerating beyond the allowed threshold interrupts protection immediately", () => {
  let state = possessedState();
  state = stepControlLab(state, { protecting: true, moveX: 0.1 }, 1 / 60, FEEL, ATHLETIC);
  assert.equal(state.protectionActive, true);
  state = stepControlLab(state, { protecting: true, moveX: 1 }, 1 / 60, FEEL, ATHLETIC);
  assert.equal(state.protectionActive, false);
  assert.ok(state.protectionCooldown > 4.9);
});

test("releasing the movement stick from a run creates a hard plant instead of a long glide", () => {
  const base = possessedState();
  const state = { ...base, driveMagnitude: 0.8, player: { ...base.player, vx: 160, vy: 0 } };
  const next = stepControlLab(state, { moveX: 0, moveY: 0 }, 1 / 60, FEEL, ATHLETIC);
  assert.ok(next.driveMagnitude < 0.2);
  assert.ok(next.plantTime > 0);
});
