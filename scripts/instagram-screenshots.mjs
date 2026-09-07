// Generates mobile app screenshots for Instagram posts, covering the app's
// full feature set with polished demo data (no test/lorem content visible).
//
// Usage:
//   BASE_URL=https://demo.sky-buddy.de node scripts/instagram-screenshots.mjs
//   BASE_URL=http://localhost:8080 node scripts/instagram-screenshots.mjs
//
// Credentials for the demo account can be overridden via env vars:
//   DEMO_EMAIL, DEMO_PASSWORD

import { chromium, devices } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "https://demo.sky-buddy.de";
const EMAIL = process.env.DEMO_EMAIL || "release.tester.skybuddy@gmail.com";
const PASSWORD = process.env.DEMO_PASSWORD || "test123456";
const OUT_DIR = path.resolve("screenshots");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function acceptCookiesIfPresent(page) {
  const button = page.getByRole("button", { name: "Nur notwendige" });
  if (await button.isVisible({ timeout: 3000 }).catch(() => false)) {
    await button.click();
  }
}

async function login(page) {
  await page.goto(`${BASE_URL}/auth`);
  await acceptCookiesIfPresent(page);
  await page.getByPlaceholder("pilot@example.com").fill(EMAIL);
  await page.getByPlaceholder("••••••••").fill(PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await wait(500);
}

async function shoot(page, name) {
  await page.waitForLoadState("networkidle");
  await acceptCookiesIfPresent(page);
  await wait(800); // let animations/lazy content settle
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`) });
  console.log(`✓ ${name}.png`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ ...devices["iPhone 14 Pro"] });
  const page = await context.newPage();

  await login(page);

  // 1. Feed - main dashboard
  await page.goto(`${BASE_URL}/dashboard`);
  await shoot(page, "01_feed");

  // 2. Own profile
  await page.goto(`${BASE_URL}/profile`);
  await shoot(page, "02_profil");

  // 3. Pilot directory
  await page.goto(`${BASE_URL}/pilots`);
  await shoot(page, "03_piloten");

  // 4. Pilot detail sheet
  await page.getByText("Luca Dresbach").first().click({ force: true });
  await page.getByText("Nachricht senden").waitFor({ timeout: 10000 });
  await shoot(page, "04_pilot_detail");
  await page.keyboard.press("Escape");
  await wait(300);

  // 5. Fly-Outs & Events
  await page.goto(`${BASE_URL}/events`);
  await page.getByRole("tab", { name: "Fly-Outs" }).click();
  await page.waitForSelector("text=Teilnehmer", { timeout: 10000 });
  await shoot(page, "05_events");

  // 6. Groups overview
  await page.goto(`${BASE_URL}/groups`);
  await shoot(page, "06_gruppen");

  // 7. Group detail (with a post visible)
  await page.getByText("Fly-Out Süddeutschland").first().click({ force: true });
  await page.waitForSelector("text=Mitglied", { timeout: 10000 });
  await shoot(page, "07_gruppe_detail");

  // 8. Forum categories overview
  await page.goto(`${BASE_URL}/forum`);
  await shoot(page, "08_forum");

  // 9. Forum - Technik category thread
  await page.getByText("Technik", { exact: true }).first().click();
  await page.waitForSelector("text=Avionik", { timeout: 10000 });
  await shoot(page, "09_forum_technik");

  // 10. Chat
  await page.goto(`${BASE_URL}/messages`);
  await page.waitForLoadState("networkidle");
  await acceptCookiesIfPresent(page);
  await page.getByRole("button", { name: /Luca Dresbach/ }).first().click({ force: true });
  await page.waitForSelector('[placeholder="Nachricht schreiben..."]', { timeout: 10000 });
  await shoot(page, "10_chat");

  await browser.close();
  console.log(`\nDone. Screenshots written to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
