import test from 'node:test';
import assert from 'node:assert/strict';
import { createBallPhysics } from '../../core/physics/ballPhysics.js';

test('le roulement ralentit progressivement sur la pelouse', () => {
  const physics = createBallPhysics({ rollingDeceleration: 1, position: [0, 0.11, 0] });
  physics.kick({ direction: [1, 0, 0], speed: 5 });
  const before = physics.snapshot().horizontalSpeed;
  physics.step(1);
  const after = physics.snapshot().horizontalSpeed;
  assert.ok(after < before && after > 0);
});

test('le ballon rebondit sans traverser le sol', () => {
  const physics = createBallPhysics({ position: [0, 1, 0], velocity: [0, -5, 0], restitution: 0.5 });
  physics.step(0.2);
  const state = physics.snapshot();
  assert.ok(state.position[1] >= 0.11);
  assert.ok(state.velocity[1] > 0);
});

test('un petit impact vertical se stabilise au sol', () => {
  const physics = createBallPhysics({ position: [0, 0.111, 0], velocity: [0, -0.2, 0] });
  physics.step(0.01);
  const state = physics.snapshot();
  assert.equal(state.position[1], 0.11);
  assert.equal(state.velocity[1], 0);
  assert.equal(state.grounded, true);
});

test('le roulement entraîne une rotation visible du ballon', () => {
  const physics = createBallPhysics();
  physics.kick({ speed: 2 });
  physics.step(0.2);
  assert.ok(Math.abs(physics.snapshot().rotation[2]) > 0);
});
