import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayerMovement } from '../../core/physics/playerMovement.js';

test('accélère progressivement au lieu de téléporter la vitesse', () => {
  const movement = createPlayerMovement({ acceleration: 10, jogSpeed: 5 });
  movement.step(0.1, { x: 1, z: 0 });
  const speed = movement.snapshot().speed;
  assert.ok(speed > 0 && speed < 5);
});

test('ralentit jusqu’à l’arrêt sans dérive résiduelle', () => {
  const movement = createPlayerMovement({ acceleration: 30, deceleration: 20 });
  movement.step(0.5, { x: 1, z: 0, sprint: true });
  movement.step(1, { x: 0, z: 0 });
  assert.equal(movement.snapshot().speed, 0);
});

test('la phase des pas dépend de la distance parcourue, pas du temps écoulé', () => {
  const a = createPlayerMovement({ acceleration: 100, jogSpeed: 4, maxSubstep: 1 / 240 });
  const b = createPlayerMovement({ acceleration: 100, jogSpeed: 4, maxSubstep: 1 / 240 });
  a.step(0.5, { x: 1, z: 0 });
  b.step(0.25, { x: 1, z: 0 });
  b.step(0.25, { x: 1, z: 0 });
  assert.ok(Math.abs(a.snapshot().travelled - b.snapshot().travelled) < 0.02);
  assert.ok(Math.abs(a.snapshot().stridePhase - b.snapshot().stridePhase) < 0.02);
});

test('les limites du terrain empêchent le joueur de sortir', () => {
  const movement = createPlayerMovement({ position: [52, 0, 0], acceleration: 100 });
  movement.step(1, { x: 1, z: 0, sprint: true });
  assert.ok(movement.snapshot().position[0] <= movement.config.fieldHalfLength);
});

test('un changement brutal de direction garde une rotation progressive', () => {
  const movement = createPlayerMovement({ acceleration: 100, turnRateSlow: 2, turnRateFast: 2 });
  movement.step(0.2, { x: 0, z: 1 });
  const before = movement.snapshot().facing;
  movement.step(0.05, { x: 0, z: -1 });
  const after = movement.snapshot().facing;
  assert.ok(Math.abs(after - before) < Math.PI);
});
