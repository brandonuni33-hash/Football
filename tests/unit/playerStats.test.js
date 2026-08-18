import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STP_STAT_DEFINITIONS,
  STP_ACTIVE_MOVEMENT_STATS,
  createDefaultPlayerStats,
  deriveMovementTuning,
  sharpTurnSpeedFactor,
} from '../../core/stats/playerStats.js';

test('V1 exposes exactly the 23 locked STP stats', () => {
  assert.equal(STP_STAT_DEFINITIONS.length, 23);
  assert.deepEqual(
    [...new Set(STP_STAT_DEFINITIONS.map((item) => item.group))],
    ['Technique', 'Physique', 'Défense', 'Mental'],
  );
});

test('neutral 50 profile preserves the current movement baseline', () => {
  const tuning = deriveMovementTuning(createDefaultPlayerStats(50));
  assert.equal(tuning.jogSpeed, 4.8);
  assert.equal(tuning.sprintSpeed, 7.2);
  assert.equal(tuning.acceleration, 11.5);
  assert.equal(tuning.deceleration, 14);
  assert.ok(Math.abs(tuning.turnRateSlow - Math.PI * 3.2) < 1e-9);
  assert.ok(Math.abs(tuning.turnRateFast - Math.PI * 2.1) < 1e-9);
});

test('movement lab only activates stats that currently have a physical effect', () => {
  assert.deepEqual([...STP_ACTIVE_MOVEMENT_STATS], ['vitesse', 'acceleration', 'agilite', 'equilibre', 'endurance']);
});

test('higher speed and acceleration produce stronger movement tuning', () => {
  const low = deriveMovementTuning({ vitesse: 20, acceleration: 20 });
  const high = deriveMovementTuning({ vitesse: 80, acceleration: 80 });
  assert.ok(high.sprintSpeed > low.sprintSpeed);
  assert.ok(high.acceleration > low.acceleration);
});

test('balance preserves more speed through sharp turns', () => {
  const low = deriveMovementTuning({ equilibre: 10 });
  const high = deriveMovementTuning({ equilibre: 90 });
  assert.ok(sharpTurnSpeedFactor(high, Math.PI) > sharpTurnSpeedFactor(low, Math.PI));
  assert.equal(sharpTurnSpeedFactor(low, 0.2), 1);
});
