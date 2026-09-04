import { test, expect } from "../playwright-fixture";

async function setupPage(page: import("@playwright/test").Page) {
  const acceptButton = page.getByRole("button", { name: /alle akzeptieren/i });
  if (await acceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await acceptButton.click();
  }
  await page.waitForLoadState("networkidle");
}

test.describe("Forum", () => {
  test("kann Forum über Dashboard-Navigation erreichen", async ({ page }) => {
    await page.goto("/dashboard");
    await setupPage(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    // Use exact link name from secondary nav
    await page.getByRole("link", { name: "Forum" }).first().click();
    await page.waitForURL(/\/forum/);
    await expect(page.getByRole("tab", { name: /kategorien/i })).toBeVisible();
  });

  test("zeigt Neuer Beitrag Button", async ({ page }) => {
    await page.goto("/dashboard");
    await setupPage(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    await page.getByRole("link", { name: "Forum" }).first().click();
    await page.waitForURL(/\/forum/);
    
    await expect(page.getByRole("button", { name: /neuer beitrag/i })).toBeVisible();
  });
});
