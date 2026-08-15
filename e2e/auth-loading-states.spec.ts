import { test, expect } from "@playwright/test";

/**
 * Tests for the auth loading fix.
 * Intercepts backend calls with page.route() to simulate three scenarios:
 *   a) Backend normal → login form appears
 *   b) Backend slower than timeout → error message + retry button
 *   c) Backend returns error → error message + retry button
 */

const API_BASE = "https://api.nadakki.com";

test.describe("Auth loading states", () => {
  test.beforeEach(async ({ context }) => {
    // Clear all cookies/storage so there's no stale session
    await context.clearCookies();
  });

  test("a) backend normal → login form appears immediately", async ({ page }) => {
    // No refresh token in storage → isLoading goes to false immediately
    // The form should appear without delay
    await page.goto("/login");
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 5_000 });
    console.log("PASS: login form appeared, input[type=email] visible");
  });

  test("b) backend slower than timeout → error message with retry button", async ({
    page,
  }) => {
    // Simulate a stale refresh token in localStorage
    await page.goto("/login");
    await page.evaluate(() => {
      localStorage.setItem("nadakki_refresh_token_v2", "stale-token-for-test");
    });

    // Intercept refresh endpoint: never respond (simulate hung backend)
    await page.route(`${API_BASE}/api/v2/auth/refresh`, async (route) => {
      // Don't fulfill or abort — just let it hang.
      // The app's AbortController (5s) + session timeout (8s) should fire.
      await new Promise((resolve) => setTimeout(resolve, 30_000));
      route.abort();
    });

    // Intercept health check too
    await page.route(`${API_BASE}/health`, (route) =>
      route.fulfill({ status: 200, body: '{"status":"ok"}' })
    );

    // Reload to trigger init with the stale token
    await page.reload();

    // The error message should appear within ~9s (5s fetch timeout + buffer)
    const errorText = page.locator("text=No pudimos verificar tu sesión");
    await expect(errorText).toBeVisible({ timeout: 12_000 });

    const retryButton = page.locator("button", { hasText: "Reintentar" });
    await expect(retryButton).toBeVisible();

    // Spinner should NOT be visible
    const spinner = page.locator(".animate-spin");
    await expect(spinner).not.toBeVisible();

    console.log(
      "PASS: error message visible, retry button visible, spinner gone"
    );
  });

  test("c) backend returns error → error message with retry button", async ({
    page,
  }) => {
    // Simulate a stale refresh token in localStorage
    await page.goto("/login");
    await page.evaluate(() => {
      localStorage.setItem("nadakki_refresh_token_v2", "stale-token-for-test");
    });

    // Intercept refresh endpoint: return 500 immediately
    await page.route(`${API_BASE}/api/v2/auth/refresh`, (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Internal Server Error" }),
      })
    );

    // Intercept health check
    await page.route(`${API_BASE}/health`, (route) =>
      route.fulfill({ status: 200, body: '{"status":"ok"}' })
    );

    // Reload to trigger init with the stale token
    await page.reload();

    // Error message should appear quickly (no timeout wait needed)
    const errorText = page.locator("text=No pudimos verificar tu sesión");
    await expect(errorText).toBeVisible({ timeout: 5_000 });

    const retryButton = page.locator("button", { hasText: "Reintentar" });
    await expect(retryButton).toBeVisible();

    // Spinner should NOT be visible
    const spinner = page.locator(".animate-spin");
    await expect(spinner).not.toBeVisible();

    console.log(
      "PASS: error message visible after backend error, retry button visible, spinner gone"
    );
  });
});
