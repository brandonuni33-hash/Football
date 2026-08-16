import test from "node:test";
import assert from "node:assert/strict";
import { createControlLabState, getBallIntent, stepControlLab } from "../../prototype/football-2d-control-lab-v1/controlLabModel.js";

const FEEL = { playerSpeed: 1, ballControl: 1, shotPower: 1.09 };
const ATHLETIC = { speed: 80, acceleration: 80 };

test("right stick amplitude separates short and long touches", () => {
  const short = getBallIntent(0.3, 0);
  const long = getBallIntent(1, 0);
  assert.equal(short.label, "court");
  assert.equal(long.label, "long");
  assert.ok(long.targetDistance > short.targetDistance + 15);
});

test("right stick direction can orient the ball independently of movement", () => {
  const state = createControlLabState();
  const next = stepControlLab(state, { moveX: 1, moveY: 0, controlX: 0, controlY: -1 }, 1 / 60, FEEL, ATHLETIC);
  assert.ok(next.player.x > state.player.x);
  assert.ok(next.ball.y < state.ball.y);
  assert.equal(next.controlMode, "long");
});

test("right stick becomes vision control when possession is lost", () => {
  const state = createControlLabState();
  const loose = { ...state, possession: false, ball: { x: 500, y: 120, vx: 0, vy: 0 } };
  const next = stepControlLab(loose, { controlX: 0, controlY: -1 }, 1 / 60, FEEL, ATHLETIC);
  assert.equal(next.controlMode, "vision");
  assert.ok(next.lookY < -0.9);
});

test("protection keeps priority over right-stick ball manipulation", () => {
  const state = createControlLabState();
  const next = stepControlLab(state, { moveX: 0.5, controlX: 0, controlY: -1, protecting: true }, 1 / 60, FEEL, ATHLETIC);
  assert.equal(next.controlMode, "protection");
});
