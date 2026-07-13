import { test, expect } from "@playwright/test";
import { setupCockpitE2e, waitForSessionReady } from "./finance-helpers";

test.describe("Finance registry restricted role — F7", () => {
  test.beforeEach(async ({ context, page }) => {
    await setupCockpitE2e(context, page, "tenant_admin");
  });

  test("tenant_admin: registry not in subnav", async ({ page }) => {
    await page.goto("/cockpit/finance/revenue");
    await waitForSessionReady(page);
    await expect(page.getByTestId("finance-subnav")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("finance-subnav").getByRole("link", { name: /registro/i })).toHaveCount(0);
  });

  test("tenant_admin: direct registry URL shows access denied", async ({ page }) => {
    await page.goto("/cockpit/finance/registry");
    await waitForSessionReady(page);
    await expect(page.getByTestId("registry-access-denied")).toBeVisible({ timeout: 15_000 });
  });
});
