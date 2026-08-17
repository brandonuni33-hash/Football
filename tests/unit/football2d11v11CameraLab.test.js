import test from "node:test";
import assert from "node:assert/strict";
import { CAMERA_DEFAULTS, LAB_RULES, PITCH } from "../../prototype/football-2d-control-lab-v1/eleven-v-eleven-camera-lab/constants.js";
import { TEAM, createLabState, getControlledPlayer, rotateFacingToward, rotateHeadToward, stepLabState } from "../../prototype/football-2d-control-lab-v1/eleven-v-eleven-camera-lab/state.js";
import { cameraBounds, cameraGeometry, constrainScanToFacing, createCameraState, isPointInVision, updateCamera } from "../../prototype/football-2d-control-lab-v1/eleven-v-eleven-camera-lab/camera.js";
import { constrainScanStickVector } from "../../prototype/football-2d-control-lab-v1/eleven-v-eleven-camera-lab/input.js";

test("le camera lab contient bien 22 joueurs, 11 par équipe", () => {
  const state = createLabState();
  assert.equal(state.players.length, 22);
  assert.equal(state.players.filter((player) => player.team === TEAM.HOME).length, 11);
  assert.equal(state.players.filter((player) => player.team === TEAM.AWAY).length, 11);
  assert.ok(getControlledPlayer(state));
});

test("le grand terrain respecte approximativement les proportions 105 x 68", () => {
  const expected = 105 / 68;
  const actual = PITCH.width / PITCH.height;
  assert.ok(Math.abs(actual - expected) < 0.01);
});

test("corps et tête sont deux orientations distinctes", () => {
  const state = createLabState();
  const player = getControlledPlayer(state);
  assert.ok(player.facingX > 0.99);
  assert.ok(player.headFacingX > 0.99);

  stepLabState(state, { scanX: 0, scanY: 1 }, 0.25);
  const bodyAngle = Math.atan2(player.facingY, player.facingX) * 180 / Math.PI;
  const headAngle = Math.atan2(player.headFacingY, player.headFacingX) * 180 / Math.PI;
  assert.ok(Math.abs(bodyAngle) < 0.1, "le SCAN ne doit pas faire tourner le torse");
  assert.ok(headAngle > 64 && headAngle < 66, "la tête doit pouvoir tourner indépendamment à environ 260 degrés par seconde");
});

test("le corps du joueur ne se retourne plus instantanément", () => {
  const state = createLabState();
  const player = getControlledPlayer(state);
  stepLabState(state, { moveX: 0, moveY: 1 }, 1 / 60);
  const angle = Math.atan2(player.facingY, player.facingX) * 180 / Math.PI;
  assert.ok(angle > 2 && angle < 3);
});

test("un changement de corps à 90 degrés prend environ 0.65 seconde", () => {
  const state = createLabState();
  const player = getControlledPlayer(state);
  rotateFacingToward(player, 0, 1, 0.5);
  let angle = Math.atan2(player.facingY, player.facingX) * 180 / Math.PI;
  assert.ok(angle > 69 && angle < 71);
  rotateFacingToward(player, 0, 1, 0.2);
  angle = Math.atan2(player.facingY, player.facingX) * 180 / Math.PI;
  assert.ok(angle > 89.9 && angle < 90.1);
});

test("la tête revient vers le corps sans téléportation quand le SCAN est relâché", () => {
  const state = createLabState();
  const player = getControlledPlayer(state);
  rotateHeadToward(player, 0, 1, 0.25, false);
  const before = Math.atan2(player.headFacingY, player.headFacingX) * 180 / Math.PI;
  rotateHeadToward(player, player.facingX, player.facingY, 0.1, true);
  const after = Math.atan2(player.headFacingY, player.headFacingX) * 180 / Math.PI;
  assert.ok(before > 64 && before < 66);
  assert.ok(after > 43 && after < 45, "le retour de tête doit être progressif à environ 210 degrés par seconde");
});

test("la tête reste limitée à 110 degrés de chaque côté du corps", () => {
  const state = createLabState();
  const player = getControlledPlayer(state);
  rotateHeadToward(player, -1, 0.1, 2, false);
  const relative = Math.atan2(player.headFacingY, player.headFacingX) * 180 / Math.PI;
  assert.ok(relative > 109 && relative < 111);
});

test("la caméra et la vision de base sont verrouillées", () => {
  const geometry = cameraGeometry(CAMERA_DEFAULTS);
  assert.equal(geometry.zoom, 1.40);
  assert.equal(geometry.angle, 60);
  assert.equal(geometry.scan, 41);
  assert.equal(CAMERA_DEFAULTS.headScanDegrees, 220);
  assert.equal(CAMERA_DEFAULTS.visionDegrees, 120);
  assert.equal(LAB_RULES.controlledSpeed, 222);
  assert.equal(LAB_RULES.bodyTurnDegreesPerSecond, 140);
  assert.equal(LAB_RULES.headTurnDegreesPerSecond, 260);
});

test("la caméra est ancrée exactement sur le ballon au centre du terrain", () => {
  const state = createLabState();
  const camera = createCameraState(state, CAMERA_DEFAULTS);
  assert.ok(Math.abs(camera.x - state.ball.x) < 0.001);
  assert.ok(Math.abs(camera.y - state.ball.y) < 0.001);

  stepLabState(state, { moveX: 1, moveY: 0 }, 0.25);
  updateCamera(camera, state, {}, CAMERA_DEFAULTS);
  assert.ok(Math.abs(camera.x - state.ball.x) < 0.001);
  assert.ok(Math.abs(camera.y - state.ball.y) < 0.001);
});

test("le SCAN tourne uniquement la tête et ne déplace plus la caméra hors du ballon", () => {
  const state = createLabState();
  const camera = createCameraState(state, CAMERA_DEFAULTS);
  for (let i = 0; i < 30; i += 1) {
    stepLabState(state, { scanX: 0, scanY: 1 }, 1 / 60);
    updateCamera(camera, state, { scanX: 0, scanY: 1 }, CAMERA_DEFAULTS);
  }
  assert.ok(Math.abs(camera.x - state.ball.x) < 0.001);
  assert.ok(Math.abs(camera.y - state.ball.y) < 0.001);
  assert.ok(camera.gazeY > 0.99);
  assert.equal(camera.scanActive, true);
});

test("la vision lisible couvre exactement 120 degrés autour de la tête", () => {
  const state = createLabState();
  const player = getControlledPlayer(state);
  player.headFacingX = 0;
  player.headFacingY = 1;

  assert.equal(isPointInVision(player, null, { x: player.x, y: player.y + 100 }), true);

  const angle60 = 60 * Math.PI / 180;
  const onBoundary = {
    x: player.x + Math.sin(angle60) * 100,
    y: player.y + Math.cos(angle60) * 100,
  };
  assert.equal(isPointInVision(player, null, onBoundary), true, "la limite à 60 degrés fait partie du champ");

  const angle70 = 70 * Math.PI / 180;
  const outside = {
    x: player.x + Math.sin(angle70) * 100,
    y: player.y + Math.cos(angle70) * 100,
  };
  assert.equal(isPointInVision(player, null, outside), false);
  assert.equal(isPointInVision(player, null, { x: player.x + 100, y: player.y }), false, "90 degrés latéraux sont désormais hors vision");
  assert.equal(isPointInVision(player, null, { x: player.x, y: player.y - 100 }), false);
});

test("le SCAN logiciel reste plafonné à 110 degrés", () => {
  const state = createLabState();
  const player = getControlledPlayer(state);
  const limited = constrainScanToFacing(player, -1, 0.25);
  const dot = limited.x * player.facingX + limited.y * player.facingY;
  const angle = Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;
  assert.ok(angle > 109 && angle < 111);
});

test("le joystick SCAN est physiquement bloqué à la butée et ne traverse pas derrière", () => {
  const facing = { x: 1, y: 0 };
  const rightStop = constrainScanStickVector(-1, 0.4, facing, 0);
  const draggedBehind = constrainScanStickVector(-1, -0.4, facing, rightStop.lockSide);
  const angle = Math.atan2(draggedBehind.y, draggedBehind.x) * 180 / Math.PI;
  assert.ok(angle > 109 && angle < 111);
  assert.equal(draggedBehind.lockSide, 1);
});

test("recentrer le joystick libère la butée", () => {
  const facing = { x: 1, y: 0 };
  const stop = constrainScanStickVector(-1, 0.4, facing, 0);
  const centered = constrainScanStickVector(0, 0, facing, stop.lockSide);
  assert.equal(centered.lockSide, 0);
});

test("la caméra reste dans les limites du terrain près des bords", () => {
  const state = createLabState();
  state.ball.x = PITCH.inset;
  state.ball.y = PITCH.inset;
  const settings = { zoom: 1.8, angle: 60, scan: 100 };
  const camera = createCameraState(state, settings);
  const bounds = cameraBounds(settings);
  assert.ok(camera.x >= bounds.minX - 0.001 && camera.x <= bounds.maxX + 0.001);
  assert.ok(camera.y >= bounds.minY - 0.001 && camera.y <= bounds.maxY + 0.001);
});
