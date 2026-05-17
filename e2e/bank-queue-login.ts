import type { Page } from "@playwright/test";

export const PLAYWRIGHT_BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const EMAIL = process.env.TEST_EMAIL ?? "admin@credicefi.com";
const PASSWORD = process.env.TEST_PASSWORD ?? "AdminProd2026!";
const TENANT = process.env.TEST_TENANT ?? "credicefi";

export async function loginFromEnv(page: Page): Promise<void> {
  await page.goto(`${PLAYWRIGHT_BASE_URL}/login`);
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  const tenantInput = page.locator('input[placeholder="credicefi"]');
  if (await tenantInput.isVisible()) {
    await tenantInput.fill(TENANT);
  }
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(credit-hub|dashboard)/, { timeout: 25_000 });
}
