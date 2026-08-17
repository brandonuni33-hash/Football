import test from 'node:test';
import assert from 'node:assert/strict';
import { createBallNormalization, STP_BALL_DIAMETER_M } from '../../core/assets/ballNormalization.js';

function parsedBall() {
  return {
    json: {
      nodes: [{ name: 'Ball', mesh: 0, translation: [2, 1, 0] }],
      meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
      accessors: [{ min: [-1, -1, -1], max: [1, 1, 1] }],
    },
  };
}

test('normalise le ballon STP à 22 cm de diamètre', () => {
  const result = createBallNormalization(parsedBall());
  assert.equal(result.diameter, STP_BALL_DIAMETER_M);
  assert.equal(result.radius, 0.11);
  assert.ok(Math.abs(result.scale - 0.11) < 1e-12);
  assert.deepEqual(result.source.center, [2, 1, 0]);
  assert.deepEqual(result.source.extents, [2, 2, 2]);
});

test('accepte un diamètre cible explicite pour les tests', () => {
  const result = createBallNormalization(parsedBall(), { diameter: 0.24 });
  assert.equal(result.radius, 0.12);
  assert.ok(Math.abs(result.scale - 0.12) < 1e-12);
});
