import { test, expect } from "../playwright-fixture";

async function setupPage(page: import("@playwright/test").Page) {
  const acceptButton = page.getByRole("button", { name: /alle akzeptieren/i });
  if (await acceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await acceptButton.click();
  }
  await page.waitForLoadState("networkidle");
}

test.describe("Nachrichten", () => {
  test("kann Nachrichten über Dashboard-Navigation erreichen", async ({ page }) => {
    await page.goto("/dashboard");
    await setupPage(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    // Use exact link name from secondary nav
    await page.getByRole("link", { name: "Nachrichten" }).click();
    await page.waitForURL(/\/messages/);
    await expect(page.getByText(/nachrichten|konversationen|keine nachrichten/i)).toBeVisible();
  });
});
