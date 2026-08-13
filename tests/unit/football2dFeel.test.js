import test from "node:test";
import assert from "node:assert/strict";
import { createFootball2DState, normalizeFeelTuning, shotSpeedFromPower, stepFootball2D } from "../../prototype/football-2d-v0/football2dModel.js";

test("feel tuning is clamped to safe ranges", () => {
  assert.deepEqual(normalizeFeelTuning({ playerSpeed: 2, ballControl: 0.1, shotPower: 4 }), { playerSpeed: 1.2, ballControl: 0.7, shotPower: 1.2 });
});

test("player speed tuning changes travelled distance", () => {
  const state = createFootball2DState();
  const slow = stepFootball2D(state, { moveX: 1 }, 1 / 60, { playerSpeed: 0.8 });
  const fast = stepFootball2D(state, { moveX: 1 }, 1 / 60, { playerSpeed: 1.2 });
  assert.ok(fast.player.x > slow.player.x);
});

test("shot tuning changes shot velocity", () => {
  assert.ok(shotSpeedFromPower(1, { shotPower: 1.2 }) > shotSpeedFromPower(1, { shotPower: 0.8 }));
});
