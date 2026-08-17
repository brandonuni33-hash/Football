import assert from "node:assert/strict";
import { FEEL_RULES, createPlayerFeelState, stepPlayerFeel, mannequinPose } from "../../prototype/player-feel-lab-v0/playerFeelModel.js";

const stepMany = (state, input, seconds) => {
  const frames = Math.round(seconds / FEEL_RULES.fixedStep);
  for (let i = 0; i < frames; i += 1) stepPlayerFeel(state, input, FEEL_RULES.fixedStep);
  return state;
};

{
  const state = createPlayerFeelState();
  stepMany(state, { moveX: 1, moveY: 0 }, 1);
  assert.ok(state.player.speed > 100, "normal run accelerates");
  assert.ok(state.player.speed <= FEEL_RULES.rapidSpeed * FEEL_RULES.normalPaceScale + 3, "normal pace remains capped");
}
{
  const state = createPlayerFeelState();
  stepMany(state, { moveX: 1, moveY: 0, rapidHeld: true }, 1);
  assert.ok(state.player.speed > FEEL_RULES.rapidSpeed * FEEL_RULES.normalPaceScale, "rapid exceeds normal pace");
}
{
  const state = createPlayerFeelState();
  stepMany(state, { moveX: 1, moveY: 0, rapidHeld: true }, 0.8);
  stepPlayerFeel(state, { moveX: -1, moveY: 0, rapidHeld: true }, FEEL_RULES.fixedStep);
  assert.equal(state.player.mode, "plant", "sharp reversal triggers plant");
  assert.ok(state.player.plantRemaining > 0, "plant has a time window");
  const cooldown = state.player.plantCooldown;
  stepMany(state, { moveX: -1, moveY: 0, rapidHeld: true }, 0.16);
  assert.ok(state.player.plantRemaining <= 0, "plant releases quickly");
  assert.ok(state.player.plantCooldown < cooldown, "plant cooldown prevents immediate replant");
  assert.notEqual(state.player.mode, "plant", "reversal continues without repeated plant");
}
{
  const state = createPlayerFeelState();
  stepMany(state, { moveX: 1, moveY: 0 }, 1);
  const runningSpeed = state.player.speed;
  stepMany(state, {}, 0.15);
  assert.ok(state.player.speed > 35, "release keeps visible momentum instead of stopping abruptly");
  assert.ok(state.player.speed < runningSpeed, "release still decelerates");
  stepMany(state, {}, 0.25);
  assert.ok(state.player.speed < 8, "player still comes to a full stop in a controlled window");
}
{
  const state = createPlayerFeelState();
  stepMany(state, { moveX: 1, moveY: 0, rapidHeld: true }, 0.8);
  stepMany(state, { moveX: -1, moveY: 0, rapidHeld: true }, 0.30);
  assert.ok(Math.abs(state.player.facing) > 1.0, "body rotates decisively during a reversal");
}
{
  const state = createPlayerFeelState();
  const pose = mannequinPose(state);
  assert.ok(Number.isFinite(pose.leftFoot.x) && Number.isFinite(pose.rightFoot.y), "mannequin pose is finite");
}
