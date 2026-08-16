import test from "node:test";
import assert from "node:assert/strict";
import { BALL_PHASE, normalize } from "../../prototype/football-2d-control-lab-v1/three-v-three/constants.js";
import { createMatchState, getPlayer } from "../../prototype/football-2d-control-lab-v1/three-v-three/matchState.js";
import { givePossession } from "../../prototype/football-2d-control-lab-v1/three-v-three/possession.js";
import { startPass } from "../../prototype/football-2d-control-lab-v1/three-v-three/actions.js";
import { stepMatch } from "../../prototype/football-2d-control-lab-v1/three-v-three/simulation.js";

test("une passe est verrouillée à 100 % sur le receveur sélectionné", () => {
  const state = createMatchState();
  const passer = getPlayer(state, "home-human");
  const receiver = getPlayer(state, "home-left");
  givePossession(state, passer.id);

  const expected = normalize(receiver.x - passer.x, receiver.y - passer.y);
  assert.equal(startPass(state, passer.id, receiver.id, { x: 1, y: 0 }), true);

  const actual = normalize(state.ball.vx, state.ball.vy);
  assert.equal(state.ball.phase, BALL_PHASE.PASS);
  assert.equal(state.ball.targetId, receiver.id);
  assert.ok(Math.abs(actual.x - expected.x) < 0.000001);
  assert.ok(Math.abs(actual.y - expected.y) < 0.000001);
});

test("le receveur reste verrouillé pendant la trajectoire sans ballon aimanté", () => {
  let state = createMatchState();
  const passer = getPlayer(state, "home-human");
  const receiver = getPlayer(state, "home-left");
  givePossession(state, passer.id);
  startPass(state, passer.id, receiver.id);

  const vx = state.ball.vx;
  const vy = state.ball.vy;
  receiver.x += 80;
  receiver.y += 45;
  state = stepMatch(state, {}, 1 / 60);

  assert.equal(state.ball.targetId, receiver.id);
  assert.ok(Math.abs(state.ball.vx) < Math.abs(vx));
  assert.ok(Math.abs(state.ball.vy) <= Math.abs(vy) + 0.000001);
  const beforeDirection = normalize(vx, vy);
  const afterDirection = normalize(state.ball.vx, state.ball.vy);
  assert.ok(Math.abs(afterDirection.x - beforeDirection.x) < 0.000001);
  assert.ok(Math.abs(afterDirection.y - beforeDirection.y) < 0.000001);
});
