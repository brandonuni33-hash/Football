import test from "node:test";
import assert from "node:assert/strict";
import {
  RULES, TEAM, BALL_PHASE, CONTROLLED_ID,
  createGameplayState, getControlledPlayer, getOwner, getPlayer,
  controlMode, stepGameplay, startPass, startProtection, pressBrake,
  cameraGeometry, isPointVisible,
} from "../../prototype/football-2d-control-lab-v1/eleven-v-eleven-gameplay-lab/engine.js";

test("le gameplay lab crée un vrai 11v11", () => {
  const state = createGameplayState();
  assert.equal(state.players.length, 22);
  assert.equal(state.players.filter((p) => p.team === TEAM.HOME).length, 11);
  assert.equal(state.players.filter((p) => p.team === TEAM.AWAY).length, 11);
  assert.equal(getControlledPlayer(state).id, CONTROLLED_ID);
});

test("les réglages caméra/perception validés sont conservés", () => {
  assert.equal(RULES.zoom, 0.90);
  assert.equal(RULES.minZoom, 0.75);
  assert.equal(RULES.bodyTurnDegreesPerSecond, 200);
  assert.equal(RULES.headScanDegrees, 180);
  assert.equal(RULES.visionDegrees, 120);
  assert.equal(cameraGeometry({ zoom: 0.75, angle: 60 }).zoom, 0.75);
});

test("RAPIDE est séparé de l'allure normale", () => {
  const normal = createGameplayState();
  const fast = createGameplayState();
  for (let i = 0; i < 90; i += 1) {
    stepGameplay(normal, { moveX: 1, moveY: 0, rapidHeld: false }, 1/60);
    stepGameplay(fast, { moveX: 1, moveY: 0, rapidHeld: true }, 1/60);
  }
  assert.ok(getControlledPlayer(fast).x > getControlledPlayer(normal).x + 30);
  assert.equal(RULES.normalPaceScale, 0.76);
});

test("le joystick droit est verrouillé quand on court avec le ballon", () => {
  const state = createGameplayState();
  const p = getControlledPlayer(state);
  p.vx = 100;
  assert.equal(controlMode(state, p), "locked");
  p.vx = 0;
  assert.equal(controlMode(state, p), "tech");
});

test("une passe verrouille un receveur sans homing", () => {
  const state = createGameplayState();
  const passer = getControlledPlayer(state);
  const target = getPlayer(state, "home-10");
  assert.equal(startPass(state, passer, {}, target.id), true);
  assert.equal(state.ball.phase, BALL_PHASE.PASS);
  assert.equal(state.ball.targetId, target.id);
  const vx = state.ball.vx, vy = state.ball.vy;
  target.x += 160; target.y -= 120;
  stepGameplay(state, {}, 1/60);
  assert.ok(Math.abs(state.ball.vx - vx * Math.pow(0.989, 1)) < 3);
  assert.ok(Math.sign(state.ball.vy || 1) === Math.sign(vy || 1));
});

test("la protection dure 3 secondes et impose son plafond de vitesse", () => {
  const state = createGameplayState();
  const p = getControlledPlayer(state);
  assert.equal(startProtection(state, p), true);
  assert.equal(p.protectionRemaining, 3);
  for (let i = 0; i < 30; i += 1) stepGameplay(state, { moveX: 1, moveY: 0, rapidHeld: true }, 1/60);
  assert.ok(Math.hypot(p.vx, p.vy) <= RULES.rapidSpeed * RULES.protectionSpeedScale + 2);
});

test("le second FREIN ralentit davantage sans lancer de tacle", () => {
  const state = createGameplayState();
  const p = getControlledPlayer(state);
  p.hasBall = false;
  state.ball.ownerId = "away-8";
  state.possession = { team: TEAM.AWAY, playerId: "away-8" };
  getPlayer(state, "away-8").hasBall = true;
  assert.equal(pressBrake(state, p), true);
  assert.equal(p.deepBrakeRemaining, 0);
  assert.equal(pressBrake(state, p), true);
  assert.ok(p.deepBrakeRemaining > 0);
  assert.equal(p.tackleRemaining, 0);
  assert.equal(RULES.deepJockeySpeedScale, 0.40);
});

test("la vision 120 degrés suit la tête", () => {
  const state = createGameplayState();
  const p = getControlledPlayer(state);
  p.headFacingX = 1; p.headFacingY = 0;
  assert.equal(isPointVisible(p, { x: p.x + 100, y: p.y }), true);
  assert.equal(isPointVisible(p, { x: p.x, y: p.y + 100 }), false);
});

test("les 21 IA se déplacent et la possession peut changer", () => {
  const state = createGameplayState();
  const before = new Map(state.players.filter(p => !p.controlled).map(p => [p.id, {x:p.x,y:p.y}]));
  for (let i = 0; i < 180; i += 1) stepGameplay(state, { moveX: 0.5, moveY: 0.1 }, 1/60);
  const moved = state.players.filter(p => !p.controlled).filter(p => {
    const b = before.get(p.id); return Math.hypot(p.x-b.x,p.y-b.y) > 10;
  });
  assert.ok(moved.length >= 14);
  assert.ok(getOwner(state) || state.ball.phase !== BALL_PHASE.CONTROLLED);
});
