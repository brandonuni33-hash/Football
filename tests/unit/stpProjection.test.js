import test from 'node:test';
import assert from 'node:assert/strict';
import { projectStpWorldPoint, projectPlayerBillboard } from '../../core/rendering/stpProjection.js';

test('projette le centre du terrain proche du centre écran', () => {
  const p = projectStpWorldPoint([0, 0, 0], { width: 1000, height: 600 });
  assert.ok(Math.abs(p.x - 500) < 1);
  assert.ok(p.y > 250 && p.y < 500);
});

test('projette une taille de joueur positive à 1,68 m', () => {
  const p = projectPlayerBillboard([0, 0, 0], 1.68, { width: 1000, height: 600 });
  assert.ok(p.visible);
  assert.ok(p.pixelHeight > 1);
  assert.ok(p.head.y < p.feet.y);
});
