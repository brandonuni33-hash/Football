import test from "node:test";
import assert from "node:assert/strict";
import { createFootball2DState, normalizeVector, shotSpeedFromPower, stepFootball2D } from "../../prototype/football-2d-v0/football2dModel.js";

test("ball starts separate from the player", () => {
  const state = createFootball2DState();
  assert.ok(state.ball.x > state.player.x);
  assert.equal(state.possession, true);
});

test("diagonal movement is normalized", () => {
  const direction = normalizeVector(1, 1);
  assert.ok(Math.abs(Math.hypot(direction.x, direction.y) - 1) < 1e-9);
});

test("charged shot launches the ball", () => {
  const state = createFootball2DState();
  const next = stepFootball2D(state, { shootReleased: true, shootPower: 1 }, 1 / 60);
  assert.ok(shotSpeedFromPower(1) > shotSpeedFromPower(0));
  assert.ok(next.ball.vx > 0);
  assert.equal(next.possession, false);
  assert.equal(next.lastEvent, "shot");
});
