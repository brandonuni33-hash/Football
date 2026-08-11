import { test, expect } from '@playwright/test';

async function bootWithCareer(page) {
  await page.goto('/index.html');
  await page.waitForFunction(() => Boolean(window.game?.gameUI && window.game?.gameSystems));
  await page.evaluate(() => {
    window.game.gameUI.startCareer({
      firstname: 'Relation',
      lastname: 'Tester',
      country: 'France',
      position: 'MC',
      origin: 'CENTRE_FORMATION',
      youthClub: { name: 'Test Academy', country: 'France', prestige: 45, tier: 2 },
      coachName: 'Coach CI'
    });
  });
}

test('une nouvelle carrière crée coach et vestiaire dans RelationshipSystem', async ({ page }) => {
  await bootWithCareer(page);

  const result = await page.evaluate(() => {
    const systems = window.game.gameSystems;
    const state = window.game.gameUI.state;
    const coach = systems.socialSystem.getCanonicalRelationship(state, 'coach');
    const locker = systems.socialSystem.getCanonicalRelationship(state, 'vestiaire');
    return {
      relationshipCount: Object.keys(state.relationships || {}).length,
      coachType: coach?.type || null,
      lockerType: locker?.type || null,
      coachScore: systems.relationshipSystem.compatibilityScore(coach),
      legacyCoach: state.player.stats.relationCoach,
      lockerScore: systems.relationshipSystem.compatibilityScore(locker),
      legacyLocker: state.player.stats.vestiaire
    };
  });

  expect(result.relationshipCount).toBeGreaterThanOrEqual(2);
  expect(result.coachType).toBe('coach');
  expect(result.lockerType).toBe('teammate');
  expect(result.legacyCoach).toBe(result.coachScore);
  expect(result.legacyLocker).toBe(result.lockerScore);
});

test('SocialSystem modifie le canonique puis projette le score legacy sans double source', async ({ page }) => {
  await bootWithCareer(page);

  const result = await page.evaluate(() => {
    const systems = window.game.gameSystems;
    const state = window.game.gameUI.state;
    const beforeRelation = systems.socialSystem.getCanonicalRelationship(state, 'coach');
    const before = systems.relationshipSystem.compatibilityScore(beforeRelation);
    const change = systems.socialSystem.modifyRelationship(state, 'coach', 12, { event: 'ci_coach_support', significant: true });
    const canonical = systems.socialSystem.getCanonicalRelationship(state, 'coach');
    return {
      before,
      change,
      canonicalScore: systems.relationshipSystem.compatibilityScore(canonical),
      legacyStats: state.player.stats.relationCoach,
      legacySocial: state.social.coachData.relation,
      memoryCount: state.relationshipMemory?.length || 0
    };
  });

  expect(result.change.after).toBeGreaterThan(result.before);
  expect(result.canonicalScore).toBe(result.change.after);
  expect(result.legacyStats).toBe(result.canonicalScore);
  expect(result.legacySocial).toBe(result.canonicalScore);
  expect(result.memoryCount).toBeGreaterThan(0);
});

test('une ancienne écriture relationCoach est absorbée une fois dans la relation canonique', async ({ page }) => {
  await bootWithCareer(page);

  const result = await page.evaluate(() => {
    const systems = window.game.gameSystems;
    const state = window.game.gameUI.state;
    systems.socialSystem.ensureRelationships(state);
    const before = systems.relationshipSystem.compatibilityScore(systems.socialSystem.getCanonicalRelationship(state, 'coach'));

    state.player.stats.relationCoach = 27;
    state.social.coachData.relation = 27;
    systems.socialSystem.ensureRelationships(state);

    const canonical = systems.socialSystem.getCanonicalRelationship(state, 'coach');
    return {
      before,
      after: systems.relationshipSystem.compatibilityScore(canonical),
      legacyStats: state.player.stats.relationCoach,
      legacySocial: state.social.coachData.relation,
      synced: state.social.relationshipSync.coach,
      bridgeMemory: state.relationshipMemory?.some(item => item.event === 'legacy_coach_changed') || false
    };
  });

  expect(result.before).not.toBe(27);
  expect(result.after).toBe(27);
  expect(result.legacyStats).toBe(27);
  expect(result.legacySocial).toBe(27);
  expect(result.synced).toBe(27);
  expect(result.bridgeMemory).toBe(true);
});

test('une interaction riche canonique est reprojetée vers les anciens consommateurs', async ({ page }) => {
  await bootWithCareer(page);

  const result = await page.evaluate(() => {
    const systems = window.game.gameSystems;
    const state = window.game.gameUI.state;
    systems.socialSystem.ensureRelationships(state);
    const relation = systems.socialSystem.getCanonicalRelationship(state, 'coach');
    const before = systems.relationshipSystem.compatibilityScore(relation);

    systems.relationshipSystem.interact({
      state,
      subjectId: state.player.id,
      targetId: 'coach',
      type: 'coach',
      effects: { trust: 18, respect: 14, communication: 10, tension: -12 },
      context: { event: 'ci_rich_interaction', significant: true }
    });

    const canonicalAfter = systems.relationshipSystem.compatibilityScore(relation);
    systems.socialSystem.ensureRelationships(state);
    return {
      before,
      canonicalAfter,
      legacyAfter: state.player.stats.relationCoach,
      socialAfter: state.social.coachData.relation,
      remembered: state.relationshipMemory?.some(item => item.event === 'ci_rich_interaction') || false
    };
  });

  expect(result.canonicalAfter).toBeGreaterThan(result.before);
  expect(result.legacyAfter).toBe(result.canonicalAfter);
  expect(result.socialAfter).toBe(result.canonicalAfter);
  expect(result.remembered).toBe(true);
});
