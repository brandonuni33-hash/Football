import test from "node:test";
import assert from "node:assert/strict";
import { RULES } from "../../prototype/football-2d-control-lab-v1/three-v-three/constants.js";
import { createMatchState, getPlayer } from "../../prototype/football-2d-control-lab-v1/three-v-three/matchState.js";
import { clearPossession, givePossession } from "../../prototype/football-2d-control-lab-v1/three-v-three/possession.js";
import { pressDefensiveBrake, startPass } from "../../prototype/football-2d-control-lab-v1/three-v-three/actions.js";
import { recoveryWindow } from "../../prototype/football-2d-control-lab-v1/three-v-three/ballRecovery.js";
import { stepMatch } from "../../prototype/football-2d-control-lab-v1/three-v-three/simulation.js";

test("le stick droit oriente immédiatement le joueur ciblé par une passe", () => {
  let state = createMatchState();
  startPass(state, "home-left", "home-human");
  const receiver = getPlayer(state, "home-human");
  assert.equal(state.ball.targetId, receiver.id);
  state = stepMatch(state, { host: { moveX: 1, controlX: 0, controlY: -1 } }, 1 / 60);
  assert.ok(receiver.facingY < -0.9);
  assert.ok(receiver.receptionIntentMagnitude > 0.9);
});

test("après une perte de balle l'ancien porteur garde une chance mais une fenêtre réduite", () => {
  const state = createMatchState();
  const player = getPlayer(state, "home-human");
  givePossession(state, player.id);
  state.ball.x = player.x + 18;
  state.ball.y = player.y;
  clearPossession(state);
  state.ball.x = player.x + 18;
  state.ball.y = player.y;
  state.ball.vx = 40;
  state.ball.vy = 0;
  const penalized = recoveryWindow(player, state.ball);
  player.recentBallLossRemaining = 0;
  const normal = recoveryWindow(player, state.ball);
  assert.equal(player.recentBallLossRemaining, 0);
  assert.ok(penalized.reach < normal.reach);
  assert.ok(penalized.maxBallSpeed < normal.maxBallSpeed);
  assert.ok(penalized.score < normal.score);
  assert.equal(RULES.recentBallLossDuration, 0.55);
});

test("le deuxième FREIN ralentit davantage mais le joueur continue de reculer", () => {
  let state = createMatchState({ online: true });
  const defender = getPlayer(state, "home-human");
  const owner = getPlayer(state, "away-human");
  givePossession(state, owner.id);
  owner.x = defender.x + 100;
  owner.y = defender.y;
  pressDefensiveBrake(state, defender.id);
  pressDefensiveBrake(state, defender.id);
  assert.ok(defender.deepBrakeRemaining > 0);
  assert.equal(state.ball.ownerId, owner.id);
  const before = defender.x;
  for (let i = 0; i < 12; i += 1) state = stepMatch(state, { host: { moveX: -1 } }, 1 / 60);
  assert.ok(defender.x < before);
  assert.ok(Math.abs(defender.vx) > 0);
  assert.equal(state.ball.ownerId, owner.id);
});
