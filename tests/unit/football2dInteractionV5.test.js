import test from "node:test";
import assert from "node:assert/strict";
import {
  BALL_PHASE,
  CONTROLLED_ID,
  INTERACTION_RULES,
  PITCH,
  TEAM,
  createGameplayState,
  getControlledPlayer,
  getPlayer,
  stepGameplay,
} from "../../prototype/football-2d-control-lab-v1/eleven-v-eleven-gameplay-lab/interactionGameplayV5.js";

function giveBall(state, playerId) {
  const player = getPlayer(state, playerId);
  for (const candidate of state.players) candidate.hasBall = candidate.id === playerId;
  state.ball.ownerId = playerId;
  state.ball.targetId = null;
  state.ball.phase = BALL_PHASE.CONTROLLED;
  state.ball.lastTouchId = playerId;
  state.ball.lobActive = false;
  state.ball.lobHeight = 0;
  state.ball.lobVz = 0;
  state.ball.x = player.x + (player.team === TEAM.HOME ? 28 : -28);
  state.ball.y = player.y;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.possession = { team: player.team, playerId };
  return player;
}

function passSpeed(state) {
  return Math.hypot(state.ball.vx, state.ball.vy);
}

test("APPEL force le coéquipier IA porteur à jouer vers le joueur contrôlé", () => {
  const state = createGameplayState();
  const controlled = getControlledPlayer(state);
  const passer = giveBall(state, "home-6");
  controlled.hasBall = false;

  stepGameplay(state, { primaryPressed: true }, 1 / 60);

  assert.equal(state.ball.phase, BALL_PHASE.PASS);
  assert.equal(state.ball.lastTouchId, passer.id);
  assert.equal(state.ball.targetId, CONTROLLED_ID);
  assert.equal(state.lastEvent, "call_pass");
});

test("la durée d'appui peut produire une passe nettement plus puissante", () => {
  const low = createGameplayState();
  stepGameplay(low, { secondaryPressed: true, passPower: 0.20, lobPass: false }, 1 / 60);
  const lowSpeed = passSpeed(low);

  const high = createGameplayState();
  stepGameplay(high, { secondaryPressed: true, passPower: 0.92, lobPass: false }, 1 / 60);
  const highSpeed = passSpeed(high);

  assert.ok(lowSpeed >= INTERACTION_RULES.passMinSpeed - 5);
  assert.ok(highSpeed > lowSpeed + 120);
  assert.ok(highSpeed <= INTERACTION_RULES.passMaxSpeed + 5);
});

test("double-tap + maintien déclenche une passe levée avec hauteur physique", () => {
  const state = createGameplayState();
  stepGameplay(state, { secondaryPressed: true, passPower: 0.72, lobPass: true }, 1 / 60);

  assert.equal(state.ball.phase, BALL_PHASE.PASS);
  assert.equal(state.ball.lobActive, true);
  assert.ok(state.ball.lobHeight > 0);
  assert.ok(state.ball.lobVz > 0);
  assert.equal(state.lastEvent, "lob_pass");
});

test("un ballon libre désigne un seul chasseur : le joueur réellement le plus proche", () => {
  const state = createGameplayState();
  for (const player of state.players) player.hasBall = false;
  state.ball.ownerId = null;
  state.ball.targetId = null;
  state.ball.phase = BALL_PHASE.FREE;
  state.ball.vx = 0;
  state.ball.vy = 0;

  const candidate = getPlayer(state, "home-6");
  state.ball.x = candidate.x + 18;
  state.ball.y = candidate.y + 4;
  state.possession = { team: null, playerId: null };

  const expected = state.players
    .map((player) => ({ id: player.id, gap: Math.hypot(player.x - state.ball.x, player.y - state.ball.y) }))
    .sort((a, b) => a.gap - b.gap)[0].id;

  stepGameplay(state, {}, 1 / 60);

  assert.equal(expected, candidate.id);
  assert.ok(state.ball.ownerId === expected || state.looseBallChaserId === expected);
  const activeLooseChasers = state.players.filter((player) => player.tacticalRole === "loose-ball-nearest");
  assert.ok(activeLooseChasers.length <= 1);
});

test("le terrain élargi et les formations précédentes restent actifs", () => {
  const state = createGameplayState();
  assert.equal(PITCH.height, 1180);
  assert.equal(state.formationTactical.home.formation, "4-3-3");
  assert.equal(state.formationTactical.away.formation, "4-4-2");
});
