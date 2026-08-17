import test from "node:test";
import assert from "node:assert/strict";
import {
  BALL_PHASE,
  CONTROLLED_ID,
  createGameplayState,
  getControlledPlayer,
  getPlayer,
  stepGameplay,
} from "../../prototype/football-2d-control-lab-v1/eleven-v-eleven-gameplay-lab/interactionGameplayV6.js";

function giveBall(state, playerId) {
  const player = getPlayer(state, playerId);
  for (const candidate of state.players) candidate.hasBall = candidate.id === playerId;
  state.ball.ownerId = playerId;
  state.ball.targetId = null;
  state.ball.phase = BALL_PHASE.CONTROLLED;
  state.ball.lastTouchId = playerId;
  state.ball.x = player.x + 28;
  state.ball.y = player.y;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.possession = { team: player.team, playerId };
  return player;
}

test("APPEL est prioritaire avant la décision autonome de l'IA", () => {
  const state = createGameplayState();
  const controlled = getControlledPlayer(state);
  const passer = giveBall(state, "home-6");
  controlled.hasBall = false;
  passer.aiDecisionRemaining = 0;
  passer.aiPassCooldown = 0;

  stepGameplay(state, { primaryPressed: true }, 1 / 60);

  assert.equal(state.ball.phase, BALL_PHASE.PASS);
  assert.equal(state.ball.lastTouchId, passer.id);
  assert.equal(state.ball.targetId, CONTROLLED_ID);
  assert.match(state.lastEvent, /call_pass/);
});
