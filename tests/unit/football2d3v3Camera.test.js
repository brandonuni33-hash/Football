import test from "node:test";
import assert from "node:assert/strict";
import { CAMERA_RULES, canScanCamera, createCameraState, updateCamera } from "../../prototype/football-2d-control-lab-v1/three-v-three/camera.js";
import { createMatchState, getPlayer } from "../../prototype/football-2d-control-lab-v1/three-v-three/matchState.js";
import { givePossession } from "../../prototype/football-2d-control-lab-v1/three-v-three/possession.js";
import { startPass } from "../../prototype/football-2d-control-lab-v1/three-v-three/actions.js";

test("la caméra 3v3 est proche avec un léger trois-quarts fixe", () => {
  assert.ok(CAMERA_RULES.zoom > 1.3);
  assert.ok(CAMERA_RULES.zoom < 1.55);
  assert.ok(CAMERA_RULES.yScale < 1);
  assert.ok(Math.abs(CAMERA_RULES.shear) > 0);
});

test("la caméra ne réagit pas à chaque petit déplacement du joueur", () => {
  const state = createMatchState();
  const player = getPlayer(state, "home-human");
  const camera = createCameraState(state, "host");
  const before = { x: camera.baseX, y: camera.baseY };
  player.x += 20;
  player.y += 15;
  updateCamera(camera, state, "host", {}, 0.2);
  assert.equal(camera.baseX, before.x);
  assert.equal(camera.baseY, before.y);
});

test("le stick droit scanne le terrain seulement quand il n'a pas de rôle technique", () => {
  const state = createMatchState();
  assert.equal(canScanCamera(state, "host"), true, "sans ballon le joueur peut scanner");
  givePossession(state, "home-human");
  assert.equal(canScanCamera(state, "host"), false, "avec ballon le stick garde son rôle football");

  givePossession(state, "home-left");
  startPass(state, "home-left", "home-human");
  assert.equal(canScanCamera(state, "host"), false, "ciblé par une passe le stick reste réservé au contrôle orienté");
});

test("SCAN déplace doucement le cadrage puis revient quand le stick est relâché", () => {
  const state = createMatchState();
  const camera = createCameraState(state, "host");
  const neutralX = camera.x;
  for (let i = 0; i < 18; i += 1) updateCamera(camera, state, "host", { controlX: 1, controlY: 0 }, 1 / 60);
  const scannedX = camera.x;
  assert.ok(scannedX > neutralX + 35);
  assert.equal(camera.scanActive, true);

  for (let i = 0; i < 36; i += 1) updateCamera(camera, state, "host", { controlX: 0, controlY: 0 }, 1 / 60);
  assert.ok(camera.x < scannedX - 25);
  assert.equal(camera.scanActive, false);
});

test("un scan vertical donne un regard latéral sans modifier le zoom", () => {
  const state = createMatchState();
  const camera = createCameraState(state, "host");
  const beforeY = camera.y;
  for (let i = 0; i < 18; i += 1) updateCamera(camera, state, "host", { controlX: 0, controlY: -1 }, 1 / 60);
  assert.ok(camera.y < beforeY - 20);
  assert.equal(CAMERA_RULES.zoom, 1.42);
});
