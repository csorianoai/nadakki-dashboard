/**
 * Smoke test: login flow + credit-hub renders without crashing.
 *
 * Prevents regression on the QueryClientProvider / provider-tree issue
 * that caused 11/12 authenticated routes to white-screen (P11-06 hotfix).
 *
 * Run: npx playwright test tests/smoke/login-flow.spec.ts
 */
import { test, expect } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.TEST_EMAIL ?? "admin@credicefi.com";
const PASSWORD = process.env.TEST_PASSWORD ?? "AdminProd2026!";
const TENANT = process.env.TEST_TENANT ?? "credicefi";

test.describe("Login → Credit Hub smoke", () => {
  test("login and render /credit-hub without white screen", async ({ page }) => {
    // 1. Navigate to /login
    await page.goto(`${BASE}/login`);
    await expect(page.locator("form")).toBeVisible({ timeout: 10_000 });

    // 2. Fill credentials
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);

    // Fill tenant slug if the field exists
    const tenantInput = page.locator('input[placeholder="credicefi"]');
    if (await tenantInput.isVisible()) {
      await tenantInput.fill(TENANT);
    }

    // 3. Submit
    await page.click('button[type="submit"]');

    // 4. Wait for redirect to /credit-hub (or any authenticated page)
    await page.waitForURL(/\/(credit-hub|dashboard)/, { timeout: 15_000 });

    // 5. Assert: page renders without the "No QueryClient set" error
    const body = await page.textContent("body");
    expect(body).not.toContain("No QueryClient set");
    expect(body).not.toContain("Unhandled Runtime Error");

    // 6. Assert: some meaningful content rendered (not a white screen)
    //    The global topbar or sidebar should be visible within 5s
    const topbarOrContent = page.locator(
      '[data-testid="forge-topbar"], nav, [role="navigation"], header',
    );
    await expect(topbarOrContent.first()).toBeVisible({ timeout: 5_000 });
  });
});
