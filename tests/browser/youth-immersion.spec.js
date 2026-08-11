import { test, expect } from '@playwright/test';

async function boot(page) {
  await page.goto('/index.html');
  await page.waitForFunction(() => Boolean(window.game?.gameUI && window.game?.gameSystems));
}

test('les matchs jeunes utilisent de vrais noms de clubs et un championnat de catégorie', async ({ page }) => {
  await boot(page);
  const result = await page.evaluate(() => {
    const gateway = window.game.gameUI;
    const state = gateway.startCareer({
      firstname: 'Youth', lastname: 'Tester', country: 'France', position: 'BU',
      origin: 'CENTRE_FORMATION', heartClub: 'Paris Saint-Germain',
      youthClub: { name: 'Stade Bordelais', country: 'France', prestige: 44, tier: 3 }
    });
    state.player.age = 14;
    state.calendar.seasonSchedule = null;
    window.game.gameSystems.competitionSystem.ensureSeasonSchedule(state);
    const matches = state.calendar.seasonSchedule?.matches || [];
    return {
      count: matches.length,
      competition: matches[0]?.competitionName || '',
      opponents: matches.slice(0, 5).map(match => match.opponent)
    };
  });

  expect(result.count).toBeGreaterThan(0);
  expect(result.competition).toContain('U15');
  expect(result.opponents.every(name => name && !name.includes('Adversaire de championnat'))).toBe(true);
  expect(result.opponents.some(name => name.includes(' U15'))).toBe(true);
});

test('les jeunes gardent un seul match à décisions maximum mais avec une fréquence renforcée', async ({ page }) => {
  await boot(page);
  const result = await page.evaluate(async () => {
    const { MatchImportanceSystem } = await import('/domain/match/matchImportanceSystem.js');
    const state = { player: { age: 15, isYouthPlayer: true }, calendar: { currentMonth: 2, currentSeasonYear: 2026 } };
    const normal = MatchImportanceSystem.evaluate(state, { competitionId: 'YOUTH_FR_U15', type: 'youth', month: 2 });
    const originalRandom = Math.random;
    Math.random = () => 0;
    try {
      const plan = MatchImportanceSystem.planBlock(state, [
        { id: 'a', competitionId: 'YOUTH_FR_U15', type: 'youth' },
        { id: 'b', competitionId: 'YOUTH_FR_U15', type: 'youth' },
        { id: 'c', competitionId: 'YOUTH_FR_U15', type: 'youth' }
      ]);
      return { chance: normal.playableChance, budget: plan.budget, playableCount: plan.playableCount };
    } finally {
      Math.random = originalRandom;
    }
  });

  expect(result.chance).toBeGreaterThanOrEqual(.15);
  expect(result.budget).toBe(1);
  expect(result.playableCount).toBe(1);
});

test('le statut inclut Joueur important et peut produire titulaire remplaçant ou hors groupe', async ({ page }) => {
  await boot(page);
  const result = await page.evaluate(async () => {
    const { SquadSelectionSystem } = await import('/domain/match/squadSelectionSystem.js');
    const statuses = SquadSelectionSystem.statuses;
    const strongYouth = { player: { id: 'y1', age: 16, isYouthPlayer: true, overall: 62, youthClubData: { prestige: 55 }, stats: { averageRating: 8, relationCoach: 70 } }, calendar: { currentSeasonYear: 2026, currentMonth: 9 } };
    const firstPro = { player: { id: 'p1', age: 18, isYouthPlayer: false, overall: 58, club: 'Paris Saint-Germain', stats: { averageRating: 6.1, relationCoach: 45 } }, calendar: { currentSeasonYear: 2026, currentMonth: 9 } };
    const youthStatus = SquadSelectionSystem.evaluateStatus(strongYouth);
    const proStatus = SquadSelectionSystem.evaluateStatus(firstPro);
    const plan = SquadSelectionSystem.planBlock(firstPro, [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }]);
    return { statuses, youthStatus, proStatus, appearances: plan.entries.map(entry => entry.appearance) };
  });

  expect(result.statuses).toContain('Joueur important');
  expect(['Titulaire', 'Joueur important', 'Joueur clé']).toContain(result.youthStatus.status);
  expect(['Hors groupe', 'Remplaçant', 'Rotation', 'Titulaire']).toContain(result.proStatus.status);
  expect(result.appearances.length).toBe(3);
});

test('les offres de départ françaises privilégient les clubs modestes et limitent les élites', async ({ page }) => {
  await boot(page);
  const result = await page.evaluate(async () => {
    const { default: CreationController } = await import('/ui/creationController.js');
    const originalRandom = Math.random;
    let cursor = 0;
    const sequence = [.7, .6, .2, .8, .3, .7, .4, .9, .5, .6, .2, .7, .4, .8, .3, .6, .5, .7, .2, .9];
    Math.random = () => sequence[(cursor++) % sequence.length];
    try {
      const ui = { selectedData: { country: 'France' }, randomYouthClubs: [] };
      const controller = new CreationController(ui);
      controller.prepareYouthOffers();
      return ui.randomYouthClubs.map(club => ({ country: club.country, prestige: club.prestige, name: club.name }));
    } finally {
      Math.random = originalRandom;
    }
  });

  expect(result.length).toBeGreaterThanOrEqual(4);
  expect(result.every(club => club.country === 'France')).toBe(true);
  expect(result.filter(club => Number(club.prestige) >= 76).length).toBeLessThanOrEqual(1);
  expect(result.some(club => Number(club.prestige) <= 60)).toBe(true);
});
