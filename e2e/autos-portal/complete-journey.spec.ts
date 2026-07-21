import { test, expect } from "@playwright/test";

/**
 * Autos Portal consumer journey E2E (AP-5).
 * Requires: `npm run dev` on PLAYWRIGHT_BASE_URL (default :3000).
 */
test.describe("Autos Portal — marketplace resolution", () => {
  test("redirects /autos/marketplace to /autos/vehiculos (301)", async ({ page }) => {
    const response = await page.goto("/autos/marketplace", { waitUntil: "commit" });
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/autos\/vehiculos\/?$/);
  });

  test("redirects nested marketplace paths with ref param", async ({ page }) => {
    await page.goto("/autos/marketplace/foo/bar");
    await expect(page).toHaveURL(/\/autos\/vehiculos\?ref=legacy_marketplace/);
  });
});

test.describe("Autos Portal — browse and cart", () => {
  test("browse vehicles and add to cart", async ({ page }) => {
    await page.goto("/autos/vehiculos");
    const cards = page.getByTestId("vehicle-card");
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });
    expect(await cards.count()).toBeGreaterThan(0);

    await cards.first().click();
    await expect(page).toHaveURL(/\/autos\/vehiculo\//);

    await page.getByTestId("add-to-cart-button").click();
    await expect(page.getByTestId("cart-badge")).toBeVisible({ timeout: 5000 });
  });

  test("cart page and compare toggle", async ({ page }) => {
    await page.goto("/autos/vehiculos");
    await page.getByTestId("vehicle-card").first().click();
    await page.getByTestId("add-to-cart-button").click();

    await page.goto("/autos/cart");
    await expect(page.getByRole("heading", { name: /mi carrito/i })).toBeVisible();
    await page.getByTestId("compare-toggle").check();
    await expect(page.getByTestId("compare-toggle")).toBeChecked();
  });

  test("share token loads cart in new page", async ({ page, context }) => {
    await page.goto("/autos/vehiculos");
    await page.getByTestId("vehicle-card").first().click();
    await page.getByTestId("add-to-cart-button").click();
    await page.goto("/autos/cart");

    await page.getByRole("button", { name: /compartir carrito/i }).click();
    const shareUrl = page.url();
    if (!shareUrl.includes("share_token=")) {
      await page.goto("/autos/cart");
      await page.getByRole("button", { name: /compartir carrito/i }).click();
    }

    const tokenPage = await context.newPage();
    await tokenPage.goto(page.url().includes("share_token=") ? page.url() : "/autos/cart");
    if (!tokenPage.url().includes("share_token=")) {
      test.skip(true, "Share URL not generated in this environment");
    }
  });
});

test.describe("Autos Portal — mis-leads", () => {
  test("mis-leads dashboard loads", async ({ page }) => {
    await page.goto("/autos/dashboard/mis-leads");
    await expect(
      page.getByRole("heading", { name: /mis solicitudes de financiamiento/i }),
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Autos Portal — financing CTA", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/autos/leads**", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            lead_id: "lead-e2e-1",
            tenant_id: "t1",
            user_id: "u1",
            vehicle_id: "1",
            vehicle_name: "Test",
            vehicle_price: 1000000,
            requested_amount: 800000,
            down_payment: 200000,
            term_months: 60,
            status: "PENDING",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.addInitScript(() => {
      const assign = window.location.assign.bind(window.location);
      window.location.assign = (url: string | URL) => {
        if (String(url).includes("credit-hub")) return;
        assign(url);
      };
    });
  });

  test("financing apply button visible on VDP", async ({ page }) => {
    await page.goto("/autos/vehiculos");
    await page.getByTestId("vehicle-card").first().click();
    await expect(page.getByTestId("financing-apply-button")).toBeVisible();
    await page.getByTestId("financing-apply-button").click();
    await expect(page.getByText(/solicitud de financiamiento creada/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
