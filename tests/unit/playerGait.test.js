import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayerGaitPose } from '../../core/animation/playerGait.js';

test('reste neutre quand le joueur est arrêté', () => {
  const pose = createPlayerGaitPose({ speedRatio: 0, stridePhase: 0.25, plantedFoot: 'left' });
  assert.equal(pose.leftLegDeg, 0);
  assert.equal(pose.rightLegDeg, 0);
  assert.equal(pose.leftLiftRatio, 0);
  assert.equal(pose.rightLiftRatio, 0);
});

test('lève le pied libre pendant la première demi-foulée', () => {
  const pose = createPlayerGaitPose({ speedRatio: 1, stridePhase: 0.25, plantedFoot: 'left' });
  assert.equal(pose.leftLiftRatio, 0);
  assert.ok(pose.rightLiftRatio > 0);
  assert.ok(pose.leftLegDeg > 0);
  assert.ok(pose.rightLegDeg < 0);
});

test('inverse les jambes sur la deuxième demi-foulée', () => {
  const pose = createPlayerGaitPose({ speedRatio: 1, stridePhase: 0.75, plantedFoot: 'right' });
  assert.ok(pose.leftLiftRatio > 0);
  assert.equal(pose.rightLiftRatio, 0);
  assert.ok(pose.leftLegDeg < 0);
  assert.ok(pose.rightLegDeg > 0);
});

test('la pose reste continue au changement d appui', () => {
  const before = createPlayerGaitPose({ speedRatio: 0.8, stridePhase: 0.499 });
  const after = createPlayerGaitPose({ speedRatio: 0.8, stridePhase: 0.501 });
  assert.ok(Math.abs(before.leftLegDeg - after.leftLegDeg) < 1);
  assert.ok(Math.abs(before.rightLegDeg - after.rightLegDeg) < 1);
});
