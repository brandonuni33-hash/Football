import test from "node:test";
import assert from "node:assert/strict";
import { createScenarioState } from "../../prototype/football-2d-v0/scenarioModel.js";

test("scenario starts with defender and goalkeeper", () => {
  const state = createScenarioState();
  assert.ok(state.defender.x > state.player.x);
  assert.ok(state.keeper.x > state.defender.x);
});
