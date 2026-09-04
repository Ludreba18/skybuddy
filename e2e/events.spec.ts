import { test, expect } from "../playwright-fixture";

// Helper to dismiss cookie banner and wait for page load
async function setupPage(page: import("@playwright/test").Page) {
  const acceptButton = page.getByRole("button", { name: /alle akzeptieren/i });
  if (await acceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await acceptButton.click();
  }
  await page.waitForLoadState("networkidle");
}

test.describe("Events", () => {
  test("kann Events über Dashboard-Navigation erreichen", async ({ page }) => {
    await page.goto("/dashboard");
    await setupPage(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    // Use exact link name from secondary nav: "Fly-Outs & Events"
    await page.getByRole("link", { name: "Fly-Outs & Events" }).click();
    await page.waitForURL(/\/events/);
    await expect(page.getByRole("tab")).toHaveCount(3); // Three tabs: Fly-Outs, Fly-Ins, Meine
  });

  test("zeigt Event erstellen Button", async ({ page }) => {
    await page.goto("/dashboard");
    await setupPage(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    await page.getByRole("link", { name: "Fly-Outs & Events" }).click();
    await page.waitForURL(/\/events/);
    
    await expect(page.getByRole("button", { name: /event erstellen/i })).toBeVisible();
  });
});
