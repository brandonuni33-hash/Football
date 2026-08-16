import test from "node:test";
import assert from "node:assert/strict";
import { createControlLabState, stepControlLab } from "../../prototype/football-2d-control-lab-v1/controlLabModel-v4.js";

const FEEL = { playerSpeed: 1, ballControl: 1, shotPower: 1.09 };
const ATHLETIC = { speed: 80, acceleration: 80 };

test("vertical slice starts with a visible teammate owning the ball", () => {
  const state = createControlLabState();
  assert.ok(state.teammate);
  assert.equal(state.teammateHasBall, true);
  assert.equal(state.incomingPassActive, false);
  assert.equal(state.possession, false);
  assert.ok(Math.hypot(state.ball.x - state.teammate.x, state.ball.y - state.teammate.y) < 30);
});

test("pressing pass without possession requests the teammate pass", () => {
  const state = createControlLabState();
  const next = stepControlLab(state, { passPressed: true }, 1 / 60, FEEL, ATHLETIC);
  assert.equal(next.teammateHasBall, false);
  assert.equal(next.incomingPassActive, true);
  assert.equal(next.lastControlAction, "appel");
  assert.ok(Math.hypot(next.ball.vx, next.ball.vy) > 100);
});

test("requested pass can be received by the controlled player", () => {
  let state = createControlLabState();
  state = stepControlLab(state, { passPressed: true }, 1 / 60, FEEL, ATHLETIC);
  for (let i = 0; i < 120 && !state.possession; i++) {
    state = stepControlLab(state, {}, 1 / 60, FEEL, ATHLETIC);
  }
  assert.equal(state.possession, true);
  assert.equal(state.incomingPassActive, false);
  assert.ok(state.receptionWindow > 0);
});

test("protection can be engaged after the call while the pass is travelling", () => {
  let state = createControlLabState();
  state = stepControlLab(state, { passPressed: true }, 1 / 60, FEEL, ATHLETIC);
  state = stepControlLab(state, { protectPressed: true, controlX: 0, controlY: -1 }, 1 / 60, FEEL, ATHLETIC);
  assert.equal(state.protectionActive, true);
  assert.equal(state.controlMode, "protection_attente");
  assert.ok(state.lookY < -0.9);
});
