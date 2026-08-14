import { test, expect } from '@playwright/test';

test('la fin de saison affiche les chiffres et l objectif du club', async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(async () => {
    const { default: BlockResultController } = await import('/ui/blockResultController.js');
    const ui = { gateway:{ state:{} }, renderDashboard(){} };
    const controller = new BlockResultController(ui, {});
    controller.showSeasonSummary({
      seasonLabel:'2026/2027',
      club:'Stade Montois',
      matches:21,
      goals:9,
      assists:6,
      averageRating:7.3,
      clubObjective:{ label:'Faire une saison solide', status:'reached', reached:true }
    });
  });

  const card = page.locator('[data-season-summary]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('FIN DE SAISON · 2026/2027');
  await expect(card).toContainText('21');
  await expect(card).toContainText('9');
  await expect(card).toContainText('6');
  await expect(card).toContainText('7.3');
  await expect(card).toContainText('Objectif atteint');
  await expect(card).toContainText('Faire une saison solide');
  await expect(page.locator('[data-season-summary-continue]')).toHaveText('Commencer la nouvelle saison');
});
