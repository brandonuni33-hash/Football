import test from "node:test";
import assert from "node:assert/strict";
import { CAMERA_DEFAULTS, PITCH } from "../../prototype/football-2d-control-lab-v1/eleven-v-eleven-camera-lab/constants.js";
import { TEAM, createLabState, getControlledPlayer, stepLabState } from "../../prototype/football-2d-control-lab-v1/eleven-v-eleven-camera-lab/state.js";
import { cameraBounds, cameraGeometry, constrainScanToFacing, createCameraState, updateCamera } from "../../prototype/football-2d-control-lab-v1/eleven-v-eleven-camera-lab/camera.js";

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

test("la caméra de base est verrouillée sur 1.40 / 60 / 41", () => {
  const geometry = cameraGeometry(CAMERA_DEFAULTS);
  assert.equal(geometry.zoom, 1.40);
  assert.equal(geometry.angle, 60);
  assert.equal(geometry.scan, 41);
  assert.equal(CAMERA_DEFAULTS.headScanDegrees, 260);
  assert.ok(geometry.yScale < 0.8);
  assert.ok(Math.abs(geometry.shear) > 0.09);
});

test("le SCAN est volontairement lent puis revient quand le stick est relâché", () => {
  const state = createLabState();
  const camera = createCameraState(state, CAMERA_DEFAULTS);
  const baseX = camera.x;
  for (let i = 0; i < 5; i += 1) updateCamera(camera, state, { scanX: 1, scanY: 0 }, CAMERA_DEFAULTS, 1 / 60);
  assert.ok(camera.x < baseX + 110, "le regard ne doit pas partir instantanément au maximum");
  for (let i = 5; i < 30; i += 1) updateCamera(camera, state, { scanX: 1, scanY: 0 }, CAMERA_DEFAULTS, 1 / 60);
  const scannedX = camera.x;
  assert.ok(scannedX > baseX + 150);
  assert.equal(camera.scanActive, true);
  for (let i = 0; i < 120; i += 1) updateCamera(camera, state, { scanX: 0, scanY: 0 }, CAMERA_DEFAULTS, 1 / 60);
  assert.ok(Math.abs(camera.x - camera.baseX) < 2);
  assert.equal(camera.scanActive, false);
});

test("le SCAN autorise environ 130 degrés de chaque côté du regard", () => {
  const state = createLabState();
  const player = getControlledPlayer(state);
  player.facingX = 1;
  player.facingY = 0;
  const behindRight = constrainScanToFacing(player, -1, 1);
  const angle = Math.atan2(behindRight.y, behindRight.x) * 180 / Math.PI;
  assert.ok(angle > 129 && angle < 131);
  assert.ok(behindRight.magnitude > 0.99);
});

test("le SCAN à 90 degrés reste totalement accessible", () => {
  const state = createLabState();
  const player = getControlledPlayer(state);
  player.facingX = 1;
  player.facingY = 0;
  const left = constrainScanToFacing(player, 0, -1);
  const right = constrainScanToFacing(player, 0, 1);
  assert.ok(left.magnitude > 0.99);
  assert.ok(right.magnitude > 0.99);
  assert.ok(Math.abs(left.x) < 0.001 && left.y < -0.99);
  assert.ok(Math.abs(right.x) < 0.001 && right.y > 0.99);
});

test("une demande trop loin derrière est plafonnée à 130 degrés et jamais à 180", () => {
  const state = createLabState();
  const player = getControlledPlayer(state);
  player.facingX = 1;
  player.facingY = 0;
  const limited = constrainScanToFacing(player, -1, 0.25);
  const dot = limited.x * player.facingX + limited.y * player.facingY;
  const angle = Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;
  assert.ok(angle > 129 && angle < 131);
  assert.ok(limited.x < 0, "à 130 degrés le joueur peut clairement regarder derrière l'épaule sans obtenir une vision arrière totale");
});

test("la caméra reste toujours dans les limites du terrain même avec SCAN maximal", () => {
  const state = createLabState();
  const settings = { zoom: 1.8, angle: 60, scan: 100 };
  const camera = createCameraState(state, settings);
  const player = getControlledPlayer(state);
  player.facingX = 0;
  player.facingY = -1;
  for (let i = 0; i < 120; i += 1) updateCamera(camera, state, { scanX: -1, scanY: -1 }, settings, 1 / 60);
  const bounds = cameraBounds(settings);
  assert.ok(camera.x >= bounds.minX - 0.001 && camera.x <= bounds.maxX + 0.001);
  assert.ok(camera.y >= bounds.minY - 0.001 && camera.y <= bounds.maxY + 0.001);
});
