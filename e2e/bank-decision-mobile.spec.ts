import { test, expect } from "@playwright/test";
import { BANK_E2E_TOKEN_KEY, makeBankE2eJwt, sampleDetailOwnedClaim } from "./bank-application-detail-helpers";

const APP_ID = "00000000-0000-4000-8000-000000000b06";

test.use({ viewport: { width: 390, height: 844 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ([k, token]: [string, string]) => {
      localStorage.setItem(k, token);
    },
    [BANK_E2E_TOKEN_KEY, makeBankE2eJwt("tenant-e2e")],
  );
});

test("mobile layout shows decision modal", async ({ page }) => {
  await page.route(`**/api/v2/credit/applications/${APP_ID}`, async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(sampleDetailOwnedClaim(APP_ID)),
    });
  });

  await page.goto(`/bank/applications/${APP_ID}`);
  await page.getByRole("button", { name: /decisión/i }).click();
  await expect(page.getByRole("radio", { name: /aprobar/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /cancelar/i })).toBeVisible();
});
