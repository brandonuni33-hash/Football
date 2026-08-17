import test from "node:test";
import assert from "node:assert/strict";
import {
  RULES, TEAM, BALL_PHASE, CONTROLLED_ID, PITCH,
  createGameplayState, getControlledPlayer, getPlayer,
  controlMode, isLooseBallOrientationWindow, stepGameplay, startPass, startProtection, pressBrake,
  cameraGeometry, isPointVisible,
} from "../../prototype/football-2d-control-lab-v1/eleven-v-eleven-gameplay-lab/engine.js";

test("le gameplay lab crée un vrai 11v11", () => {
  const state = createGameplayState();
  assert.equal(state.players.length, 22);
  assert.equal(state.players.filter((p) => p.team === TEAM.HOME).length, 11);
  assert.equal(state.players.filter((p) => p.team === TEAM.AWAY).length, 11);
  assert.equal(getControlledPlayer(state).id, CONTROLLED_ID);
});

test("les réglages caméra/perception restent bloqués", () => {
  assert.equal(RULES.zoom, 0.90);
  assert.equal(RULES.minZoom, 0.75);
  assert.equal(RULES.bodyTurnDegreesPerSecond, 200);
  assert.equal(RULES.headScanDegrees, 180);
  assert.equal(RULES.visionDegrees, 120);
  assert.ok(RULES.blindPitchAlpha <= 0.04);
  assert.equal(cameraGeometry({ zoom: 0.75, angle: 60 }).zoom, 0.75);
});

test("aucune mécanique de bouton TACLE n'existe dans les règles", () => {
  assert.equal(Object.hasOwn(RULES, "tackleRange"), false);
  assert.equal(Object.hasOwn(RULES, "tackleDuration"), false);
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

test("le contrôle orienté n'est disponible que sur passe ciblée ou ballon libre proche", () => {
  const state = createGameplayState();
  const p = getControlledPlayer(state);
  p.vx = 100;
  assert.equal(controlMode(state, p), "locked");
  p.vx = 0;
  assert.equal(controlMode(state, p), "feint");

  const receiverState = createGameplayState();
  const receiver = getControlledPlayer(receiverState);
  const passer = getPlayer(receiverState, "home-10");
  receiver.hasBall = false;
  passer.hasBall = true;
  receiverState.ball.ownerId = passer.id;
  receiverState.possession = { team: TEAM.HOME, playerId: passer.id };
  assert.equal(startPass(receiverState, passer, {}, receiver.id), true);
  assert.equal(controlMode(receiverState, receiver), "receive");

  const loose = createGameplayState();
  const loosePlayer = getControlledPlayer(loose);
  loosePlayer.hasBall = false;
  loose.ball.ownerId = null;
  loose.ball.phase = BALL_PHASE.FREE;
  loose.ball.x = loosePlayer.x + 80;
  loose.ball.y = loosePlayer.y;
  loose.possession = { team: null, playerId: null };
  assert.equal(isLooseBallOrientationWindow(loose, loosePlayer), true);
  assert.equal(controlMode(loose, loosePlayer), "loose");
});

test("une passe verrouille un receveur sans homing", () => {
  const state = createGameplayState();
  const passer = getControlledPlayer(state);
  const target = getPlayer(state, "home-10");
  assert.equal(startPass(state, passer, {}, target.id), true);
  assert.equal(state.ball.phase, BALL_PHASE.PASS);
  assert.equal(state.ball.targetId, target.id);
  const vx = state.ball.vx;
  const vy = state.ball.vy;
  target.x += 160;
  target.y -= 120;
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
  assert.equal(RULES.deepJockeySpeedScale, 0.40);
});

test("la vision 120 degrés suit la tête", () => {
  const state = createGameplayState();
  const p = getControlledPlayer(state);
  p.headFacingX = 1;
  p.headFacingY = 0;
  assert.equal(isPointVisible(p, { x: p.x + 100, y: p.y }), true);
  assert.equal(isPointVisible(p, { x: p.x, y: p.y + 100 }), false);
});

test("les deux équipes coulissent en bloc avec le ballon", () => {
  const state = createGameplayState();
  const home4 = getPlayer(state, "home-4");
  const away4 = getPlayer(state, "away-4");
  const startHome = home4.x;
  const startAway = away4.x;
  for (let i = 0; i < 180; i += 1) stepGameplay(state, { moveX: 1, moveY: 0, rapidHeld: true }, 1/60);
  assert.ok(home4.x > startHome + 20);
  assert.ok(Math.abs(away4.x - startAway) > 10);
});

test("le pressing léger ne se déclenche que dans la moitié du défenseur", () => {
  const state = createGameplayState();
  const carrier = getControlledPlayer(state);
  for (let i = 0; i < 10; i += 1) stepGameplay(state, {}, 1/60);
  assert.equal(state.tactical.away.presserId, null);

  carrier.x = PITCH.width / 2 + 170;
  state.ball.x = carrier.x + RULES.dribbleControlDistance;
  for (const p of state.players.filter((entry) => entry.team === TEAM.AWAY && entry.role !== "GK")) {
    p.x = Math.max(p.x, carrier.x + 100);
  }
  for (let i = 0; i < 10; i += 1) stepGameplay(state, {}, 1/60);
  assert.ok(state.tactical.away.presserId !== null);
});

test("les partenaires proches forment des triangles et peuvent appeler", () => {
  const state = createGameplayState();
  for (let i = 0; i < 120; i += 1) stepGameplay(state, {}, 1/60);
  assert.ok(state.tactical.home.triangleIds.length >= 2);
  const trianglePlayers = state.tactical.home.triangleIds.map((id) => getPlayer(state, id));
  assert.ok(trianglePlayers.some((p) => p.tacticalRole.startsWith("triangle")));
  assert.ok(state.players.some((p) => p.team === TEAM.HOME && p.callRemaining > 0) || state.aiTeamCallCooldown.home > 0);
});

test("l'IA regarde principalement le ballon sans aligner forcément le corps", () => {
  const state = createGameplayState();
  const ai = getPlayer(state, "away-6");
  const bodyBefore = { x: ai.facingX, y: ai.facingY };
  state.ball.x = ai.x - 40;
  state.ball.y = ai.y + 120;
  for (let i = 0; i < 20; i += 1) stepGameplay(state, {}, 1/60);
  const toBall = { x: state.ball.x - ai.x, y: state.ball.y - ai.y };
  const d = Math.hypot(toBall.x, toBall.y) || 1;
  const headDot = ai.headFacingX * toBall.x / d + ai.headFacingY * toBall.y / d;
  assert.ok(headDot > 0.45);
  assert.ok(Math.hypot(ai.facingX - bodyBefore.x, ai.facingY - bodyBefore.y) < 1.8);
});
