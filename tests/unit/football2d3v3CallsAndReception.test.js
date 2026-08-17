import test from "node:test";
import assert from "node:assert/strict";
import { RULES, distance } from "../../prototype/football-2d-control-lab-v1/three-v-three/constants.js";
import { createMatchState, getPlayer } from "../../prototype/football-2d-control-lab-v1/three-v-three/matchState.js";
import { givePossession } from "../../prototype/football-2d-control-lab-v1/three-v-three/possession.js";
import { requestCall, startPass } from "../../prototype/football-2d-control-lab-v1/three-v-three/actions.js";
import { collectAIInputs } from "../../prototype/football-2d-control-lab-v1/three-v-three/ai.js";
import { evaluateCarrierOptions } from "../../prototype/football-2d-control-lab-v1/three-v-three/utilityAI.js";
import { stepMatch } from "../../prototype/football-2d-control-lab-v1/three-v-three/simulation.js";

function receiveWithIntent(magnitude) {
  let state = createMatchState();
  const receiver = getPlayer(state, "home-human");
  startPass(state, "home-left", receiver.id);
  const before = { x: receiver.x, y: receiver.y };
  const controlY = -magnitude;
  state = stepMatch(state, { host: { controlX: 0, controlY } }, 1 / 60);
  state.ball.x = receiver.x;
  state.ball.y = receiver.y;
  state.ball.vx = 70;
  state.ball.vy = 0;
  state = stepMatch(state, { host: { controlX: 0, controlY } }, 1 / 60);
  return { state, receiver, before };
}

test("une demande APPEL valide devient prioritaire pendant environ 1,6 seconde", () => {
  const state = createMatchState({ aiLevel: 80 });
  const carrier = getPlayer(state, "home-left");
  const human = getPlayer(state, "home-human");
  human.x = 330;
  human.y = 270;
  for (const opponent of state.players.filter((player) => player.team !== carrier.team)) {
    opponent.x = 720;
    opponent.y += 80;
  }
  assert.equal(requestCall(state, human.id), true);
  assert.equal(human.callRemaining, RULES.callDuration);
  const ranked = evaluateCarrierOptions(state, carrier);
  assert.equal(ranked[0].type, "pass");
  assert.equal(ranked[0].targetId, human.id);
  assert.equal(ranked[0].reason, "manual-call-priority");
});

test("APPEL ne force pas une passe quand la ligne est fermée", () => {
  const state = createMatchState({ aiLevel: 80 });
  const carrier = getPlayer(state, "home-left");
  const human = getPlayer(state, "home-human");
  const blocker = getPlayer(state, "away-human");
  human.x = 380;
  human.y = 155;
  blocker.x = (carrier.x + human.x) / 2;
  blocker.y = 155;
  requestCall(state, human.id);
  const humanOption = evaluateCarrierOptions(state, carrier).find((option) => option.type === "pass" && option.targetId === human.id);
  assert.equal(humanOption.reason, "manual-call-unsafe");
  assert.equal(humanOption.lane.blocked, true);
});

test("les appels IA restent rares et déclenchent un cooldown individuel et collectif", () => {
  const state = createMatchState({ aiLevel: 80 });
  const human = getPlayer(state, "home-human");
  givePossession(state, human.id);
  human.x = 430;
  human.y = 270;
  const opponents = state.players.filter((player) => player.team !== human.team);
  for (const [index, opponent] of opponents.entries()) {
    opponent.x = 620 + index * 35;
    opponent.y = 120 + index * 150;
  }
  collectAIInputs(state);
  const callers = state.players.filter((player) => player.team === human.team && !player.humanSlot && player.callRemaining > 0);
  assert.ok(callers.length <= 1);
  if (callers.length === 1) {
    const caller = callers[0];
    assert.ok(caller.aiCallCooldown > 0);
    assert.ok(state.aiTeamCallCooldown.home > 0);
    caller.callRemaining = 0;
    collectAIInputs(state);
    assert.equal(caller.callRemaining, 0, "le même joueur ne doit pas repartir immédiatement après son appel");
  }
});

test("contrôle neutre reste proche alors qu'un stick franc emmène clairement ballon et corps", () => {
  const neutral = receiveWithIntent(0);
  const strong = receiveWithIntent(1);
  assert.equal(neutral.state.ball.ownerId, neutral.receiver.id);
  assert.equal(strong.state.ball.ownerId, strong.receiver.id);
  assert.ok(distance(strong.receiver, strong.state.ball) > distance(neutral.receiver, neutral.state.ball) + 25);
  assert.ok(strong.receiver.y < strong.before.y - 4, "le corps doit accompagner la première touche engagée");
  assert.ok(strong.receiver.vy < -35, "le premier appui doit lancer le corps dans la direction choisie");
  assert.equal(strong.receiver.orientedTouchDistance, RULES.orientedTouchLongDistance);
});

test("petite direction et direction franche produisent deux contrôles distincts", () => {
  const short = receiveWithIntent(0.28);
  const strong = receiveWithIntent(1);
  assert.equal(short.receiver.orientedTouchDistance, RULES.orientedTouchShortDistance);
  assert.equal(strong.receiver.orientedTouchDistance, RULES.orientedTouchLongDistance);
  assert.ok(distance(strong.receiver, strong.state.ball) > distance(short.receiver, short.state.ball) + 20);
  assert.ok(strong.receiver.orientedTouchRemaining > short.receiver.orientedTouchRemaining);
});
