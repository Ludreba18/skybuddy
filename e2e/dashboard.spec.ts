import { test, expect } from "../playwright-fixture";

// Helper to dismiss cookie banner
async function dismissCookieBanner(page: import("@playwright/test").Page) {
  const acceptButton = page.getByRole("button", { name: /alle akzeptieren/i });
  if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptButton.click();
    await page.waitForTimeout(500);
  }
}

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await dismissCookieBanner(page);
  });

  test("zeigt Dashboard mit Mein SkyBuddy an", async ({ page }) => {
    await expect(page.getByText(/mein skybuddy/i)).toBeVisible();
  });

  test("zeigt Profilkarte mit Benutzername an", async ({ page }) => {
    await expect(page.getByText(/testpilot/i).first()).toBeVisible();
  });

  test("Navigation Links sind in der Secondary Nav vorhanden", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    // Use exact link text from the nav
    await expect(page.getByRole("link", { name: "Mein Cockpit" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Piloten" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Forum" }).first()).toBeVisible();
  });

  test("Kontakte-Bereich ist auf Desktop sichtbar", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.getByText(/meine kontakte/i)).toBeVisible();
  });

  test("Events-Bereich ist auf Desktop sichtbar", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.getByText(/meine events/i)).toBeVisible();
  });

  test("Mobile Bottom Navigation ist auf Mobile sichtbar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const bottomNav = page.locator("nav.fixed.bottom-0");
    await expect(bottomNav).toBeVisible();
  });
});
