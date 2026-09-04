import { test, expect } from "../playwright-fixture";

// Helper to dismiss cookie banner
async function dismissCookieBanner(page: import("@playwright/test").Page) {
  const acceptButton = page.getByRole("button", { name: /alle akzeptieren/i });
  if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptButton.click();
    await page.waitForTimeout(500);
  }
}

test.describe("Account", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/account");
    await dismissCookieBanner(page);
  });

  test("zeigt Account-Seite an", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /konto.*abonnement/i })).toBeVisible();
  });

  test("zeigt Mitgliedschaftsstatus an", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /aktueller status/i })).toBeVisible();
  });

  test("zeigt Abonnement-Bereich an", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /abonnement/i })).toBeVisible();
  });

  test("Mitglied werden Button ist vorhanden", async ({ page }) => {
    await expect(page.getByRole("button", { name: /jetzt mitglied werden/i })).toBeVisible();
  });
});
