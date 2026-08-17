import test from "node:test";
import assert from "node:assert/strict";
import { BALL_PHASE, RULES, TEAM } from "../../prototype/football-2d-control-lab-v1/three-v-three/constants.js";
import { createMatchState, getPlayer } from "../../prototype/football-2d-control-lab-v1/three-v-three/matchState.js";
import { givePossession } from "../../prototype/football-2d-control-lab-v1/three-v-three/possession.js";
import { startPass } from "../../prototype/football-2d-control-lab-v1/three-v-three/actions.js";
import { collectAIInputs, DEFENSE_PHASE, defensiveTeamPhase } from "../../prototype/football-2d-control-lab-v1/three-v-three/ai.js";
import { stepMatch } from "../../prototype/football-2d-control-lab-v1/three-v-three/simulation.js";

function setStableAwayShape(state, ownerX = 500) {
  const owner = getPlayer(state, "home-human");
  owner.x = ownerX; owner.y = 270;
  const middle = getPlayer(state, "away-human");
  const left = getPlayer(state, "away-left");
  const right = getPlayer(state, "away-right");
  middle.x = ownerX + 92; middle.y = 270;
  left.x = ownerX + 135; left.y = 155;
  right.x = ownerX + 150; right.y = 385;
  return { owner, middle, left, right };
}

test("sans déclencheur l'IA contient au lieu de presser constamment", () => {
  const state = createMatchState({ aiLevel: 80 });
  const { owner } = setStableAwayShape(state);
  givePossession(state, owner.id);
  state.lastPossessionLoss = null;
  state.lastTechnicalError = null;
  state.aiDefense.away.cooldownUntil = 0;
  assert.equal(defensiveTeamPhase(state, TEAM.AWAY), DEFENSE_PHASE.CONTAIN);
  const inputs = collectAIInputs(state);
  const pressure = getPlayer(state, "away-human");
  assert.equal(state.teamPlans.away.defensivePhase, DEFENSE_PHASE.CONTAIN);
  assert.equal(inputs[pressure.id].tacklePressed, undefined);
  assert.ok(Math.hypot(inputs[pressure.id].moveX ?? 0, inputs[pressure.id].moveY ?? 0) <= 0.5);
});

test("si deux défenseurs sont battus l'équipe se replie pour protéger l'espace dans son dos", () => {
  const state = createMatchState({ aiLevel: 80 });
  const owner = getPlayer(state, "home-human");
  givePossession(state, owner.id);
  owner.x = 520; owner.y = 270;
  getPlayer(state, "away-human").x = 470;
  getPlayer(state, "away-left").x = 455;
  getPlayer(state, "away-right").x = 650;
  assert.equal(defensiveTeamPhase(state, TEAM.AWAY), DEFENSE_PHASE.RETREAT);
});

test("une erreur technique déclenche un pressing limité à trois secondes", () => {
  const state = createMatchState({ aiLevel: 80 });
  const { owner } = setStableAwayShape(state);
  givePossession(state, owner.id);
  state.elapsed = 10;
  state.lastPossessionLoss = null;
  state.lastTechnicalError = { team: TEAM.HOME, playerId: owner.id, at: 10, type: "heavy_touch" };
  const phase = defensiveTeamPhase(state, TEAM.AWAY);
  assert.equal(phase, DEFENSE_PHASE.PRESS);
  assert.equal(state.aiDefense.away.lastTrigger, "heavy_touch");
  assert.ok(state.aiDefense.away.pressUntil - state.elapsed <= RULES.aiPressMaxDuration);
  assert.ok(state.aiDefense.away.pressUntil - state.elapsed > 0);
});

test("après un pressing l'IA revient en contain pendant le cooldown", () => {
  const state = createMatchState({ aiLevel: 80 });
  const { owner } = setStableAwayShape(state);
  givePossession(state, owner.id);
  state.elapsed = 5;
  state.lastPossessionLoss = null;
  state.lastTechnicalError = { team: TEAM.HOME, playerId: owner.id, at: 5, type: "heavy_touch" };
  defensiveTeamPhase(state, TEAM.AWAY);
  const pressUntil = state.aiDefense.away.pressUntil;
  state.elapsed = pressUntil + 0.05;
  state.lastTechnicalError = null;
  assert.ok(state.aiDefense.away.cooldownUntil > state.elapsed);
  assert.equal(defensiveTeamPhase(state, TEAM.AWAY), DEFENSE_PHASE.CONTAIN);
});

test("un défenseur battu déclenche un vrai sprint de rattrapage", () => {
  const state = createMatchState({ aiLevel: 100 });
  const owner = getPlayer(state, "home-human");
  givePossession(state, owner.id);
  owner.x = 500; owner.y = 270;
  const beaten = getPlayer(state, "away-human");
  beaten.x = 445; beaten.y = 270;
  getPlayer(state, "away-left").x = 635;
  getPlayer(state, "away-right").x = 650;
  const inputs = collectAIInputs(state);
  assert.equal(state.teamPlans.away.defensivePhase, DEFENSE_PHASE.CONTAIN);
  assert.equal(inputs[beaten.id].catchUp, true);
  assert.ok(inputs[beaten.id].moveX > 0.75);
  assert.equal(RULES.aiCatchUpSpeedScale, 1.08);
});

test("une passe qui s'écarte nettement du receveur est détectée comme imprécise", () => {
  let state = createMatchState({ aiLevel: 80 });
  const passer = getPlayer(state, "home-left");
  const target = getPlayer(state, "home-human");
  givePossession(state, passer.id);
  assert.equal(startPass(state, passer.id, target.id), true);
  target.x = 300; target.y = 330;
  state.ball.x = 250; state.ball.y = 270;
  state.ball.vx = 150; state.ball.vy = 0;
  state.ball.phase = BALL_PHASE.PASS;
  state.ball.imprecisionFlagged = false;
  state = stepMatch(state, {}, 1 / 60);
  assert.equal(state.ball.imprecisionFlagged, true);
  assert.equal(state.lastTechnicalError?.type, "imprecise_pass");
  assert.equal(state.lastTechnicalError?.team, TEAM.HOME);
});
