import test from "node:test";
import assert from "node:assert/strict";
import {
  PITCH,
  TEAM,
  BALL_PHASE,
  ROLE_RULES,
  createGameplayState,
  getControlledPlayer,
  getGameplayTuning,
  setGameplayTuning,
  stepGameplay,
} from "../../prototype/football-2d-control-lab-v1/eleven-v-eleven-gameplay-lab/interactionGameplayV8.js";

test("live tuning changes pitch dimensions and gameplay parameters", () => {
  const state = createGameplayState();
  const baseWidth = PITCH.width;
  const baseHeight = PITCH.height;
  setGameplayTuning(state, {
    pitchLengthScale: 1.12,
    pitchWidthScale: 1.08,
    matchSpeed: 0.82,
    shortPassSpeed: 0.9,
    longPassPower: 1.15,
    shotPower: 1.1,
    shotLift: 1.2,
  });
  const tuning = getGameplayTuning(state);
  assert.equal(tuning.matchSpeed, 0.82);
  assert.equal(tuning.shortPassSpeed, 0.9);
  assert.equal(tuning.longPassPower, 1.15);
  assert.ok(PITCH.width > baseWidth);
  assert.ok(PITCH.height > baseHeight);
});

test("stationary carrier triggers an opponent pressure after four seconds", () => {
  const state = createGameplayState();
  const controlled = getControlledPlayer(state);
  controlled.vx = 0;
  controlled.vy = 0;
  state.ball.vx = 0;
  state.ball.vy = 0;
  for (let i = 0; i < 260; i += 1) stepGameplay(state, {}, 1 / 60);
  assert.ok(state.gameplayV7.idleSeconds >= ROLE_RULES.idlePressDelay);
  assert.ok(state.gameplayV7.idlePresserId);
});

test("loose ball assigns one nearest chaser per team", () => {
  const state = createGameplayState();
  for (const player of state.players) player.hasBall = false;
  state.ball.ownerId = null;
  state.ball.phase = BALL_PHASE.FREE;
  state.possession = { team: null, playerId: null };
  stepGameplay(state, {}, 1 / 60);
  assert.ok(state.looseBallChasers.home);
  assert.ok(state.looseBallChasers.away);
  const home = state.players.find((player) => player.id === state.looseBallChasers.home);
  const away = state.players.find((player) => player.id === state.looseBallChasers.away);
  assert.equal(home.team, TEAM.HOME);
  assert.equal(away.team, TEAM.AWAY);
});

test("centre reception exposes aerial header controls", async () => {
  const state = createGameplayState();
  const controlled = getControlledPlayer(state);
  controlled.hasBall = false;
  state.ball.ownerId = null;
  state.ball.phase = BALL_PHASE.PASS;
  state.ball.targetId = controlled.id;
  state.ball.lastTouchId = "home-7";
  state.ball.x = controlled.x + 20;
  state.ball.y = controlled.y;
  state.ball.vx = -20;
  state.ball.vy = 0;
  state.ball.lobActive = true;
  state.ball.lobHeight = 24;
  state.ball.lobVz = -20;
  state.possession = { team: null, playerId: null };
  stepGameplay(state, { primaryPressed: true }, 1 / 60);
  assert.ok(["header_shot", "powered_lifted_shot"].includes(state.lastEvent) || state.gameplayV7.aerialIntent?.type === "header-shot");
});
