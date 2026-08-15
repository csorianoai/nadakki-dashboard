import { test, expect } from "@playwright/test";

/**
 * Validates that the login page never gets stuck in an infinite loading state.
 * Three scenarios: backend OK, backend timeout, backend error.
 *
 * Dev mode webpack compiles on first visit (~15-20s), so we use generous
 * timeouts and a warmup step.
 */

test.describe("Auth loading states", () => {
  // Dev server webpack compilation can be slow on first hit
  test.setTimeout(60_000);

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("a) backend responds normally → login form appears", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 30_000 });
    await emailInput.fill("test@example.com");
    await expect(emailInput).toHaveValue("test@example.com");
    console.log("PASS: login form appeared, email input is interactive");
  });

  test("b) backend timeout → actionable message appears, NOT infinite spinner", async ({
    page,
  }) => {
    // First visit to warm up the page (webpack compile)
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.locator('input[type="email"]').waitFor({ state: "visible", timeout: 30_000 });

    // Now set a stale refresh token
    await page.evaluate(() => {
      localStorage.setItem("nadakki_refresh_token_v2", "stale-token-for-test");
    });

    // Intercept auth API calls to simulate timeout (hang indefinitely)
    await page.route("**/api/v2/auth/refresh", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 30_000));
      await route.abort("timedout");
    });

    // Reload so AuthProvider picks up the stale token
    await page.reload({ waitUntil: "networkidle" });

    // After SESSION_INIT_TIMEOUT_MS (8s), the error message should appear
    const errorMessage = page.locator("text=No pudimos verificar tu sesion");
    await expect(errorMessage).toBeVisible({ timeout: 20_000 });

    const retryButton = page.locator("button", { hasText: "Reintentar" });
    await expect(retryButton).toBeVisible();

    const spinner = page.locator("text=Verificando sesion...");
    await expect(spinner).not.toBeVisible();

    console.log("PASS: timeout shows actionable error with Reintentar button, no infinite spinner");
  });

  test("c) backend returns error → actionable message appears, NOT infinite spinner", async ({
    page,
  }) => {
    // First visit to warm up
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.locator('input[type="email"]').waitFor({ state: "visible", timeout: 30_000 });

    // Set stale refresh token
    await page.evaluate(() => {
      localStorage.setItem("nadakki_refresh_token_v2", "stale-token-for-test");
    });

    // Intercept auth API calls to return 500
    await page.route("**/api/v2/auth/refresh", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Internal Server Error" }),
      });
    });

    await page.reload({ waitUntil: "networkidle" });

    // Should show error message quickly (500 returns immediately)
    const errorMessage = page.locator("text=No pudimos verificar tu sesion");
    await expect(errorMessage).toBeVisible({ timeout: 20_000 });

    const retryButton = page.locator("button", { hasText: "Reintentar" });
    await expect(retryButton).toBeVisible();

    const spinner = page.locator("text=Verificando sesion...");
    await expect(spinner).not.toBeVisible();

    console.log("PASS: server error shows actionable error with Reintentar button, no infinite spinner");
  });
});
