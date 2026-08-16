import { test, expect } from '@playwright/test';

test('Carrière → Continuer utilise la simulation PR28 depuis le hub PR29, sans réactiver le gameplay legacy', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => Boolean(window.game?.gameUI && window.game?.viewCoordinator));

  await page.evaluate(() => {
    const gateway = window.game.gameUI;
    const state = gateway.startCareer({
      firstname: 'Merge',
      lastname: 'Tester',
      country: 'France',
      position: 'AD',
      origin: 'CENTRE_FORMATION',
      youthClub: { name: 'Test Academy', country: 'France', tier: 1 }
    });

    state.player.age = 18;
    state.player.club = 'Test FC';
    state.player.clubCountry = 'France';
    state.player.clubLevel = 1;
    state.calendar.currentMonth = 8;
    state.calendar.currentSeasonYear = 2026;
    state.calendar.seasonMatchCursor = 0;

    const fixture = {
      id: 'post-merge-routing-001',
      month: 8,
      type: 'league',
      competitionId: 'POST_MERGE_LEAGUE',
      competitionType: 'league',
      competitionName: 'Championnat Test',
      opponent: 'Rival Test',
      opponentStrength: 58,
      home: true
    };
    const byMonth = {};
    for (let month = 1; month <= 12; month += 1) {
      byMonth[month] = { month, label: `Mois ${month}`, period: 'Test', phase: 'season', matches: [] };
    }
    byMonth[8].matches = [fixture];
    state.calendar.seasonSchedule = {
      version: 5,
      seasonYear: 2026,
      seasonLabel: '2026-2027',
      generatedForAge: 18,
      category: 'Senior',
      seed: 1,
      matches: [fixture],
      byMonth,
      totals: { allMatches: 1, leagueMatches: 1, cupMatches: 0, europeanMatches: 0 }
    };
    state.cups = {};
    state.europeanTournament = null;
    state.activeMatchSession = { id: 'legacy-session-that-must-not-resume' };
    state.matchInteractionPlan = {
      key: 'legacy-plan',
      budget: 1,
      playableCount: 1,
      entries: [{ matchIndex: 0, playable: true, importance: { score: 90, level: 'exceptional', reasons: ['legacy'] } }]
    };

    window.game.gameSystems.blockSystem.stateManager.save(state);
    window.game.viewCoordinator.show('home');
  });

  const continueButton = page.locator('#play-block-btn');
  await expect(continueButton).toBeVisible();
  await expect(continueButton).toContainText(/continuer la carrière/i);
  await continueButton.click();

  await expect(page.locator('[data-simulated-match-visualization="true"]')).toBeVisible();

  const state = await page.evaluate(() => ({
    hasLegacySession: Boolean(window.game.gameUI.state.activeMatchSession),
    hasLegacyPlan: Boolean(window.game.gameUI.state.matchInteractionPlan),
    hasInteractiveBuffer: Array.isArray(window.game.gameUI.state.interactiveBlockResults),
    simulatedOverlay: Boolean(document.querySelector('[data-simulated-match-visualization="true"]')),
    interactiveOverlay: Boolean(document.querySelector('[data-interactive-match], .interactive-match-overlay'))
  }));

  expect(state.hasLegacySession).toBe(false);
  expect(state.hasLegacyPlan).toBe(false);
  expect(state.hasInteractiveBuffer).toBe(false);
  expect(state.simulatedOverlay).toBe(true);
  expect(state.interactiveOverlay).toBe(false);
});
