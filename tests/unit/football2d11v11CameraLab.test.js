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

test("les 21 joueurs de référence bougent réellement autour de leur structure", () => {
  const state = createLabState();
  const controlled = getControlledPlayer(state);
  const starts = new Map(
    state.players
      .filter((player) => player.id !== controlled.id)
      .map((player) => [player.id, { x: player.x, y: player.y }]),
  );

  for (let i = 0; i < 120; i += 1) stepLabState(state, {}, 1 / 60);

  const distances = state.players
    .filter((player) => player.id !== controlled.id)
    .map((player) => {
      const start = starts.get(player.id);
      return Math.hypot(player.x - start.x, player.y - start.y);
    });

  assert.ok(distances.filter((distance) => distance > 12).length >= 15);
  assert.ok(Math.max(...distances) > 30);
});

test("le grand terrain respecte approximativement les proportions 105 x 68", () => {
  const expected = 105 / 68;
  const actual = PITCH.width / PITCH.height;
  assert.ok(Math.abs(actual - expected) < 0.01);
});

test("corps et tête sont deux orientations distinctes", () => {
  const state = createLabState();
  const player = getControlledPlayer(state);
  stepLabState(state, { scanX: 0, scanY: 1 }, 0.25);
  const bodyAngle = Math.atan2(player.facingY, player.facingX) * 180 / Math.PI;
  const headAngle = Math.atan2(player.headFacingY, player.headFacingX) * 180 / Math.PI;
  assert.ok(Math.abs(bodyAngle) < 0.1);
  assert.ok(headAngle > 64 && headAngle < 66);
});

test("le corps du joueur tourne à 200 degrés par seconde sans snap instantané", () => {
  const state = createLabState();
  const player = getControlledPlayer(state);
  stepLabState(state, { moveX: 0, moveY: 1 }, 1 / 60);
  const angle = Math.atan2(player.facingY, player.facingX) * 180 / Math.PI;
  assert.ok(angle > 3.2 && angle < 3.5);
});

test("un changement de corps à 90 degrés prend environ 0.45 seconde", () => {
  const state = createLabState();
  const player = getControlledPlayer(state);
  rotateFacingToward(player, 0, 1, 0.4);
  let angle = Math.atan2(player.facingY, player.facingX) * 180 / Math.PI;
  assert.ok(angle > 79 && angle < 81);
  rotateFacingToward(player, 0, 1, 0.1);
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
  assert.ok(after > 43 && after < 45);
});

test("la tête reste limitée à 90 degrés de chaque côté du corps", () => {
  const state = createLabState();
  const player = getControlledPlayer(state);
  rotateHeadToward(player, -1, 0.1, 2, false);
  const relative = Math.atan2(player.headFacingY, player.headFacingX) * 180 / Math.PI;
  assert.ok(relative > 89 && relative < 91);
});

test("la caméra et la vision de base sont verrouillées", () => {
  const geometry = cameraGeometry(CAMERA_DEFAULTS);
  assert.equal(geometry.zoom, 0.90);
  assert.equal(CAMERA_DEFAULTS.minZoom, 0.75);
  assert.equal(CAMERA_DEFAULTS.maxZoom, 1.80);
  assert.equal(geometry.angle, 60);
  assert.equal(geometry.scan, 41);
  assert.equal(CAMERA_DEFAULTS.headScanDegrees, 180);
  assert.equal(CAMERA_DEFAULTS.visionDegrees, 120);
  assert.equal(LAB_RULES.controlledSpeed, 222);
  assert.equal(LAB_RULES.bodyTurnDegreesPerSecond, 200);
});

test("le moteur accepte réellement un zoom éloigné à 0.75", () => {
  const geometry = cameraGeometry({ ...CAMERA_DEFAULTS, zoom: 0.75 });
  assert.equal(geometry.zoom, 0.75);
  const tooFar = cameraGeometry({ ...CAMERA_DEFAULTS, zoom: 0.4 });
  assert.equal(tooFar.zoom, 0.75);
});

test("le ballon de conduite n'est plus soudé à une position fixe du pied", () => {
  const state = createLabState();
  const player = getControlledPlayer(state);
  const separations = [];
  for (let i = 0; i < 60; i += 1) {
    stepLabState(state, { moveX: 1, moveY: 0 }, 1 / 60);
    separations.push(Math.hypot(state.ball.x - player.x, state.ball.y - player.y));
  }
  const weldedX = player.x + player.facingX * LAB_RULES.ballOffset;
  const weldedY = player.y + player.facingY * LAB_RULES.ballOffset;
  assert.ok(Math.hypot(state.ball.x - weldedX, state.ball.y - weldedY) > 4);
  assert.ok(Math.max(...separations) - Math.min(...separations) > 10);
  assert.ok(separations.at(-1) < LAB_RULES.ballControlRadius + 1);
});

test("la caméra reste ancrée sur le ballon même avec le nouveau dribble", () => {
  const state = createLabState();
  const camera = createCameraState(state, CAMERA_DEFAULTS);
  for (let i = 0; i < 30; i += 1) stepLabState(state, { moveX: 1, moveY: 0 }, 1 / 60);
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
});

test("la vision lisible couvre exactement 120 degrés autour de la tête", () => {
  const state = createLabState();
  const player = getControlledPlayer(state);
  player.headFacingX = 0;
  player.headFacingY = 1;
  assert.equal(isPointInVision(player, null, { x: player.x, y: player.y + 100 }), true);
  const angle60 = 60 * Math.PI / 180;
  assert.equal(isPointInVision(player, null, {
    x: player.x + Math.sin(angle60) * 100,
    y: player.y + Math.cos(angle60) * 100,
  }), true);
  assert.equal(isPointInVision(player, null, { x: player.x + 100, y: player.y }), false);
});

test("le SCAN logiciel et physique reste plafonné à 90 degrés", () => {
  const state = createLabState();
  const player = getControlledPlayer(state);
  const limited = constrainScanToFacing(player, -1, 0.25);
  const dot = limited.x * player.facingX + limited.y * player.facingY;
  const angle = Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;
  assert.ok(angle > 89 && angle < 91);

  const facing = { x: 1, y: 0 };
  const rightStop = constrainScanStickVector(-1, 0.4, facing, 0);
  const draggedBehind = constrainScanStickVector(-1, -0.4, facing, rightStop.lockSide);
  const stickAngle = Math.atan2(draggedBehind.y, draggedBehind.x) * 180 / Math.PI;
  assert.ok(stickAngle > 89 && stickAngle < 91);
  assert.equal(draggedBehind.lockSide, 1);
});

test("la caméra reste dans les limites du terrain près des bords au zoom éloigné", () => {
  const state = createLabState();
  state.ball.x = PITCH.inset;
  state.ball.y = PITCH.inset;
  const settings = { zoom: 0.75, angle: 60, scan: 41 };
  const camera = createCameraState(state, settings);
  const bounds = cameraBounds(settings);
  assert.ok(camera.x >= bounds.minX - 0.001 && camera.x <= bounds.maxX + 0.001);
  assert.ok(camera.y >= bounds.minY - 0.001 && camera.y <= bounds.maxY + 0.001);
});
