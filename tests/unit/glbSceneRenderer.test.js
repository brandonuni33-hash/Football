import test from 'node:test';
import assert from 'node:assert/strict';
import {createStpCamera, STP_CAMERA_REFERENCE} from '../../core/rendering/glbSceneRenderer.js';

test('verrouille la caméra Player Feel sur le preset STP validé', () => {
  const camera = createStpCamera();
  assert.equal(camera.mode, 'intermediate');
  assert.equal(camera.tiltDeg, 16);
  assert.equal(camera.zoom, 1.07);
  assert.deepEqual(STP_CAMERA_REFERENCE, {
    mode: 'intermediate',
    tiltDeg: 16,
    zoom: 1.07,
    sidelineDistance: 95,
  });
});

test('convertit les 16 degrés en hauteur de caméra cohérente', () => {
  const camera = createStpCamera({
    mode: 'intermediate',
    tiltDeg: 16,
    zoom: 1.07,
    sidelineDistance: 95,
  });
  const expectedHeight = Math.tan(16 * Math.PI / 180) * 95;
  assert.ok(Math.abs(camera.eye[1] - expectedHeight) < 1e-9);
  assert.deepEqual(camera.target, [0, 0, 0]);
});
