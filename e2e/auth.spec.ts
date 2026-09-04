import { test, expect } from "../playwright-fixture";

// Helper to dismiss cookie banner
async function dismissCookieBanner(page: import("@playwright/test").Page) {
  const acceptButton = page.getByRole("button", { name: /alle akzeptieren/i });
  if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptButton.click();
    await page.waitForTimeout(500);
  }
}

test.describe("Authentifizierung - Nicht eingeloggt", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("zeigt Login-Formular an", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByRole("heading", { name: /willkommen/i })).toBeVisible();
    await expect(page.getByLabel(/e-mail/i)).toBeVisible();
    await expect(page.getByLabel(/passwort/i)).toBeVisible();
  });

  test("wechselt zwischen Login und Registrierung", async ({ page }) => {
    await page.goto("/auth");
    
    // Switch to registration using the toggle button  
    const registerToggle = page.getByText(/noch kein konto|registrieren/i);
    await registerToggle.click();
    await expect(page.getByLabel(/vorname/i)).toBeVisible();
  });
});

test.describe("Authentifizierung - Eingeloggt", () => {
  test("Dashboard ist erreichbar", async ({ page }) => {
    await page.goto("/dashboard");
    await dismissCookieBanner(page);
    await expect(page.getByText(/mein skybuddy/i)).toBeVisible();
  });

  test("kann sich ausloggen", async ({ page }) => {
    await page.goto("/dashboard");
    await dismissCookieBanner(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Click logout button
    const logoutButton = page.locator("button").filter({ has: page.locator("svg.lucide-log-out") });
    await logoutButton.click();
    
    await expect(page).toHaveURL("/");
  });
});
