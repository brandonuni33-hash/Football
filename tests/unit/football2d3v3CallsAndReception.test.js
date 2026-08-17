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
  return { state, receiver, before, controlY };
}

function advanceReception(sample, seconds) {
  const frames = Math.ceil(seconds * 60);
  for (let i = 0; i < frames; i += 1) {
    sample.state = stepMatch(sample.state, { host: { controlX: 0, controlY: sample.controlY } }, 1 / 60);
  }
  return sample;
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

test("le contrôle orienté ne téléporte plus brutalement le ballon", () => {
  const strong = receiveWithIntent(1);
  assert.equal(strong.state.ball.ownerId, strong.receiver.id);
  const gap = distance(strong.receiver, strong.state.ball);
  assert.ok(gap >= RULES.orientedTouchStartDistance - 3);
  assert.ok(gap < RULES.orientedTouchLongDistance, "le ballon doit démarrer près du pied puis rouler, pas apparaître directement loin devant");
  assert.ok(strong.state.ball.vy < -RULES.orientedTouchMediumBallSpeed, "la première touche doit donner une vraie vitesse au ballon dans la direction demandée");
});

test("le ballon continue dans la direction demandée au lieu de revenir dans les pieds", () => {
  const strong = receiveWithIntent(1);
  const firstBallY = strong.state.ball.y;
  advanceReception(strong, 0.14);
  assert.ok(strong.state.ball.y < firstBallY - 4, "le ballon doit continuer à rouler vers la direction choisie");
  assert.ok(strong.state.ball.y < strong.receiver.y - RULES.dribbleControlDistance, "le joueur doit poursuivre le ballon et non l'aspirer sous ses pieds");
});

test("petite direction et direction franche restent distinctes sans poussée excessive", () => {
  const short = receiveWithIntent(0.28);
  const strong = receiveWithIntent(1);
  advanceReception(short, 0.12);
  advanceReception(strong, 0.12);
  assert.equal(short.receiver.orientedTouchDistance, RULES.orientedTouchShortDistance);
  assert.equal(strong.receiver.orientedTouchDistance, RULES.orientedTouchLongDistance);
  assert.ok(strong.state.ball.y < short.state.ball.y - 3, "le stick franc doit emmener plus loin que la petite orientation");
  assert.ok(distance(strong.receiver, strong.state.ball) < 45, "même franche, la première touche ne doit pas ressembler à une grosse poussée de balle");
});
