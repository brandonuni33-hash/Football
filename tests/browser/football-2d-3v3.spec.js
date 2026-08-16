import { test, expect } from "@playwright/test";

test("la page 3v3 ouvre le même moteur en solo avec contrôles contextuels", async ({ page }) => {
  await page.goto("/prototype/football-2d-control-lab-v1/play-3v3-v1.html");
  await expect(page.getByRole("heading", { name: /Petit match/ })).toBeVisible();
  await page.getByRole("button", { name: /JOUER SOLO/ }).click();
  await expect(page.locator("#game")).toBeVisible();
  await expect(page.locator("#network-status")).toHaveText("SOLO · IA");
  await expect(page.locator("#primary")).toHaveText("TACLE");
  await expect(page.locator("#secondary")).toHaveText("APPEL");
  await expect(page.locator("#tertiary")).toHaveText("FREIN");
});

test("la page ami crée une invitation sans imposer le paysage", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/prototype/football-2d-control-lab-v1/play-3v3-v1.html");
  await page.getByRole("button", { name: /JOUER AVEC UN AMI/ }).click();
  await expect(page.locator("#share-panel")).toBeVisible();
  await expect(page.locator("#share-url")).toHaveValue(/room=STP-/);
  await expect(page.locator("#game")).toBeVisible();
});