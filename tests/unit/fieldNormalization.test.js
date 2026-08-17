import test from 'node:test';
import assert from 'node:assert/strict';
import { createFieldNormalization, getNodeWorldBounds } from '../../core/assets/fieldNormalization.js';

function parsedField({ scale = [1, 1, 1], rotation, translation } = {}) {
  return {
    json: {
      nodes: [{ name: 'Soccer Field', mesh: 0, scale, ...(rotation ? { rotation } : {}), ...(translation ? { translation } : {}) }],
      meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
      accessors: [{ min: [-12, -0.05, -7], max: [12, 0.05, 7] }],
    },
  };
}

test('normalise un terrain rectangulaire vers 105 x 68', () => {
  const result = createFieldNormalization(parsedField());
  assert.equal(result.source.length, 24);
  assert.equal(result.source.width, 14);
  assert.ok(Math.abs(result.scale[0] - 4.375) < 1e-9);
  assert.ok(Math.abs(result.scale[2] - (68 / 14)) < 1e-9);
});

test('détecte automatiquement si la longueur est portée par Z', () => {
  const parsed = {
    json: {
      nodes: [{ name: 'Soccer Field', mesh: 0 }],
      meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
      accessors: [{ min: [-7, -0.05, -12], max: [7, 0.05, 12] }],
    },
  };
  const result = createFieldNormalization(parsed);
  assert.ok(Math.abs(result.scale[0] - (68 / 14)) < 1e-9);
  assert.ok(Math.abs(result.scale[2] - 4.375) < 1e-9);
});

test('calcule les bounds monde avec translation et scale', () => {
  const bounds = getNodeWorldBounds(parsedField({ scale: [2, 1, 3], translation: [10, 2, -4] }), 0);
  assert.deepEqual(bounds.min.map((v) => Number(v.toFixed(6))), [-14, 1.95, -25]);
  assert.deepEqual(bounds.max.map((v) => Number(v.toFixed(6))), [34, 2.05, 17]);
});
