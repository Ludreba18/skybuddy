import { test, expect } from "../playwright-fixture";

async function setupPage(page: import("@playwright/test").Page) {
  const acceptButton = page.getByRole("button", { name: /alle akzeptieren/i });
  if (await acceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await acceptButton.click();
  }
  await page.waitForLoadState("networkidle");
}

test.describe("Profil", () => {
  test("kann Profil über Header erreichen", async ({ page }) => {
    await page.goto("/dashboard");
    await setupPage(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    // Click on profile link in header (has username "TestPilot")
    await page.getByRole("link", { name: /testpilot/i }).click();
    await page.waitForURL(/\/profile/);
    await expect(page.getByRole("button", { name: /bearbeiten/i })).toBeVisible();
  });

  test("Bearbeitungsmodus funktioniert", async ({ page }) => {
    await page.goto("/dashboard");
    await setupPage(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    await page.getByRole("link", { name: /testpilot/i }).click();
    await page.waitForURL(/\/profile/);
    
    await page.getByRole("button", { name: /bearbeiten/i }).click();
    await expect(page.getByRole("button", { name: /speichern/i })).toBeVisible();
  });
});
