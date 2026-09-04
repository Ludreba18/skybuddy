import { test, expect } from "../playwright-fixture";

async function setupPage(page: import("@playwright/test").Page) {
  const acceptButton = page.getByRole("button", { name: /alle akzeptieren/i });
  if (await acceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await acceptButton.click();
  }
  await page.waitForLoadState("networkidle");
}

test.describe("Piloten", () => {
  test("kann Piloten über Dashboard-Navigation erreichen", async ({ page }) => {
    await page.goto("/dashboard");
    await setupPage(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    // Use exact link name from secondary nav
    await page.getByRole("link", { name: "Piloten" }).first().click();
    await page.waitForURL(/\/pilots/);
    await expect(page.getByPlaceholder(/suchen/i)).toBeVisible();
  });

  test("zeigt Filter-Button", async ({ page }) => {
    await page.goto("/dashboard");
    await setupPage(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    await page.getByRole("link", { name: "Piloten" }).first().click();
    await page.waitForURL(/\/pilots/);
    
    await expect(page.getByRole("button", { name: /filter/i })).toBeVisible();
  });
});
