import test from "node:test";
import assert from "node:assert/strict";
import { CONTROL_RULES, createControlLabState, stepControlLab } from "../../prototype/football-2d-control-lab-v1/controlLabModel-v3.js";

const FEEL = { playerSpeed: 1, ballControl: 1, shotPower: 1.09 };
const ATHLETIC = { speed: 80, acceleration: 80 };

function possessedState() {
  const base = createControlLabState();
  return {
    ...base,
    incomingPassActive: false,
    possession: true,
    lastEvent: null,
    ball: { x: base.player.x + 24, y: base.player.y, vx: 0, vy: 0 },
    receptionWindow: 0,
    driveMagnitude: 0,
  };
}

test("one tap commits protection without holding", () => {
  let state = possessedState();
  state = stepControlLab(state, { protectPressed: true }, 1 / 60, FEEL, ATHLETIC);
  assert.equal(state.protectionActive, true);
  const before = state.protectionRemaining;
  state = stepControlLab(state, {}, 1 / 60, FEEL, ATHLETIC);
  assert.equal(state.protectionActive, true);
  assert.ok(state.protectionRemaining < before);
});

test("pressing protection again does not reset its timer", () => {
  let state = possessedState();
  state = stepControlLab(state, { protectPressed: true }, 1 / 60, FEEL, ATHLETIC);
  for (let i = 0; i < 60; i++) state = stepControlLab(state, {}, 1 / 60, FEEL, ATHLETIC);
  const before = state.protectionRemaining;
  state = stepControlLab(state, { protectPressed: true }, 1 / 60, FEEL, ATHLETIC);
  assert.ok(state.protectionRemaining < before);
  assert.ok(state.protectionRemaining < 2.1);
});

test("protection lasts three seconds then starts a two second cooldown", () => {
  let state = possessedState();
  state = stepControlLab(state, { protectPressed: true }, 1 / 60, FEEL, ATHLETIC);
  for (let i = 0; i < 181; i++) state = stepControlLab(state, {}, 1 / 60, FEEL, ATHLETIC);
  assert.equal(state.protectionActive, false);
  assert.ok(state.protectionCooldown > 1.8 && state.protectionCooldown <= 2);
});

test("full left stick is capped to slow movement during protection", () => {
  let state = possessedState();
  state = stepControlLab(state, { protectPressed: true }, 1 / 60, FEEL, ATHLETIC);
  for (let i = 0; i < 90; i++) state = stepControlLab(state, { moveX: 1 }, 1 / 60, FEEL, ATHLETIC);
  assert.equal(state.protectionActive, true);
  assert.ok(state.driveMagnitude <= CONTROL_RULES.protectionMoveCap + 0.001);
});

test("right stick stays active and orients the ball during protection", () => {
  let state = possessedState();
  state = stepControlLab(state, { protectPressed: true, controlY: -1 }, 1 / 60, FEEL, ATHLETIC);
  assert.equal(state.controlMode, "protection");
  assert.ok(state.player.facingY < -0.9);
  assert.ok(state.ball.y < state.player.y);
});

test("protection can start before reception and right stick chooses the first control", () => {
  const base = createControlLabState();
  let state = {
    ...base,
    ball: { x: base.player.x - 20, y: base.player.y, vx: 30, vy: 0 },
    driveMagnitude: 0,
  };
  state = stepControlLab(state, { protectPressed: true, controlY: -1 }, 1 / 60, FEEL, ATHLETIC);
  assert.equal(state.protectionActive, true);
  assert.equal(state.possession, true);
  assert.equal(state.controlMode, "protection_reception");
  assert.ok(state.player.facingY < -0.9);
  assert.ok(state.ball.y < state.player.y);
  assert.equal(state.lastControlAction, "controle_reception_protege");
});
