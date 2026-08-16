import { test, expect } from "@playwright/test";

test("la page 3v3 ouvre le même moteur en solo avec contrôles contextuels", async ({ page }) => {
  await page.goto("/prototype/football-2d-control-lab-v1/play-3v3-v1.html");
  await expect(page.getByRole("heading", { name: /Petit match/ })).toBeVisible();
  await page.getByRole("button", { name: /JOUER SOLO/ }).click();
  await expect(page.locator("#game")).toBeVisible();
  await expect(page.locator("#network-status")).toHaveText("SOLO · IA");
  await expect(page.locator("#primary")).toHaveText("APPEL");
  await expect(page.locator("#secondary")).toHaveText("FREIN");
  await expect(page.locator("#tertiary")).toHaveText("PROT.");
  const placement = await page.evaluate(() => {
    const action = document.querySelector("#primary").getBoundingClientRect();
    const stick = document.querySelector("#control-joystick").getBoundingClientRect();
    return {
      centerDelta: Math.abs((action.left + action.width / 2) - (stick.left + stick.width / 2)),
      gap: stick.top - action.bottom,
    };
  });
  expect(placement.centerDelta).toBeLessThan(3);
  expect(placement.gap).toBeGreaterThanOrEqual(0);
  expect(placement.gap).toBeLessThanOrEqual(6);
});

test("la page ami crée une invitation sans imposer le paysage", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/prototype/football-2d-control-lab-v1/play-3v3-v1.html");
  await page.getByRole("button", { name: /JOUER AVEC UN AMI/ }).click();
  await expect(page.locator("#share-panel")).toBeVisible();
  await expect(page.locator("#share-url")).toHaveValue(/room=STP-/);
  await expect(page.locator("#game")).toBeVisible();
});