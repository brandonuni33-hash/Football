import test from "node:test";
import assert from "node:assert/strict";
import {
  PITCH, TEAM, createGameplayState, getPlayer, getControlledPlayer,
  stepGameplay, cameraFromBall, formationSummary,
} from "../../prototype/football-2d-control-lab-v1/eleven-v-eleven-gameplay-lab/formationGameplayV2.js";

test("formations are locked to home 4-3-3 and away 4-4-2", () => {
  const state = createGameplayState();
  const summary = formationSummary(state);
  assert.equal(summary.home, "4-3-3");
  assert.equal(summary.away, "4-4-2");
  assert.equal(getPlayer(state, "home-9").formationLine, "forward");
  assert.equal(getPlayer(state, "away-7").formationLine, "midfield");
});

test("centre backs never cross halfway", () => {
  const state = createGameplayState();
  getPlayer(state, "home-4").x = PITCH.width / 2 + 200;
  getPlayer(state, "home-5").x = PITCH.width / 2 + 150;
  getPlayer(state, "away-4").x = PITCH.width / 2 - 200;
  getPlayer(state, "away-5").x = PITCH.width / 2 - 150;
  stepGameplay(state, {}, 1 / 60);
  assert.ok(getPlayer(state, "home-4").x < PITCH.width / 2);
  assert.ok(getPlayer(state, "home-5").x < PITCH.width / 2);
  assert.ok(getPlayer(state, "away-4").x > PITCH.width / 2);
  assert.ok(getPlayer(state, "away-5").x > PITCH.width / 2);
});

test("only one fullback may be beyond halfway", () => {
  const state = createGameplayState();
  const controlled = getControlledPlayer(state);
  controlled.x = PITCH.width * 0.62;
  controlled.y = 160;
  state.ball.x = controlled.x + 30;
  state.ball.y = controlled.y;
  getPlayer(state, "home-2").x = PITCH.width / 2 + 120;
  getPlayer(state, "home-3").x = PITCH.width / 2 + 120;
  stepGameplay(state, {}, 1 / 60);
  const advanced = [getPlayer(state, "home-2"), getPlayer(state, "home-3")]
    .filter((p) => p.x > PITCH.width / 2);
  assert.ok(advanced.length <= 1);
});

test("camera blends ball and controlled player", () => {
  const state = createGameplayState();
  const player = getControlledPlayer(state);
  player.x = 600;
  player.y = 500;
  state.ball.x = 1100;
  state.ball.y = 700;
  const camera = cameraFromBall(state, { zoom: 0.9, angle: 60 });
  assert.ok(camera.x < state.ball.x);
  assert.ok(camera.x > player.x);
  assert.ok(camera.playerWeight >= 0.28);
});

test("forward runs are intermittent, not permanent", () => {
  const state = createGameplayState();
  state.elapsed = 3;
  stepGameplay(state, {}, 1 / 60);
  const summary = formationSummary(state);
  assert.ok(summary.homeRunnerId === null || summary.homeRunnerId.startsWith("home-"));
  const calls = state.players.filter((p) => p.team === TEAM.HOME && p.formationLine === "forward" && p.callRemaining > 0.1);
  assert.ok(calls.length <= 1);
});
