import test from "node:test";
import assert from "node:assert/strict";
import { CAMERA_DEFAULTS, PITCH } from "../../prototype/football-2d-control-lab-v1/eleven-v-eleven-camera-lab/constants.js";
import { TEAM, createLabState, getControlledPlayer, stepLabState } from "../../prototype/football-2d-control-lab-v1/eleven-v-eleven-camera-lab/state.js";
import { cameraBounds, cameraGeometry, createCameraState, updateCamera } from "../../prototype/football-2d-control-lab-v1/eleven-v-eleven-camera-lab/camera.js";

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
  assert.ok(PITCH.width > 1500);
  assert.ok(PITCH.height > 1000);
});

test("le joueur contrôlé peut parcourir le grand terrain sans déplacer les limites", () => {
  const state = createLabState();
  const player = getControlledPlayer(state);
  const startX = player.x;
  stepLabState(state, { moveX: 1, moveY: 0 }, 0.5);
  assert.ok(player.x > startX + 80);
  assert.ok(player.x < PITCH.width - PITCH.inset);
});

test("la caméra proche garde un zoom fixe et un léger trois-quarts", () => {
  const geometry = cameraGeometry(CAMERA_DEFAULTS);
  assert.equal(geometry.zoom, 1.48);
  assert.ok(geometry.yScale < 0.9);
  assert.ok(Math.abs(geometry.shear) < 0.08);
});

test("le SCAN déplace franchement le regard puis revient quand le stick est relâché", () => {
  const state = createLabState();
  const camera = createCameraState(state, CAMERA_DEFAULTS);
  const baseX = camera.x;
  for (let i = 0; i < 30; i += 1) updateCamera(camera, state, { scanX: 1, scanY: 0 }, CAMERA_DEFAULTS, 1 / 60);
  const scannedX = camera.x;
  assert.ok(scannedX > baseX + 150);
  assert.equal(camera.scanActive, true);
  for (let i = 0; i < 90; i += 1) updateCamera(camera, state, { scanX: 0, scanY: 0 }, CAMERA_DEFAULTS, 1 / 60);
  assert.ok(Math.abs(camera.x - camera.baseX) < 2);
  assert.equal(camera.scanActive, false);
});

test("la caméra reste toujours dans les limites du terrain même avec SCAN maximal", () => {
  const state = createLabState();
  const settings = { zoom: 1.8, angle: 60, scan: 100 };
  const camera = createCameraState(state, settings);
  for (let i = 0; i < 120; i += 1) updateCamera(camera, state, { scanX: -1, scanY: -1 }, settings, 1 / 60);
  const bounds = cameraBounds(settings);
  assert.ok(camera.x >= bounds.minX - 0.001 && camera.x <= bounds.maxX + 0.001);
  assert.ok(camera.y >= bounds.minY - 0.001 && camera.y <= bounds.maxY + 0.001);
});
