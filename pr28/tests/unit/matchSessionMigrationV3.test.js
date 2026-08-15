import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateMatchSessionV3 } from '../../domain/match/matchSessionMigration.js';

test('ancienne session vers flow v3', () => {
  const session = migrateMatchSessionV3({ events: [{ title: 'ancien' }] }, [30, 70]);
  assert.equal(session.flowVersion, 3);
  assert.deepEqual(session.moments, [30, 70]);
  assert.equal(session.events.length, 1);
});
