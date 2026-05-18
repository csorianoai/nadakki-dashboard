import { test, expect } from "@playwright/test";
import { BANK_E2E_TOKEN_KEY, makeBankE2eJwt } from "./bank-application-detail-helpers";

const APP_ID = "00000000-0000-4000-8000-000000000004";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ([k, token]: [string, string]) => {
      localStorage.setItem(k, token);
    },
    [BANK_E2E_TOKEN_KEY, makeBankE2eJwt("tenant-e2e")],
  );
});

test("404 shows not found state with queue link", async ({ page }) => {
  await page.route(`**/api/v2/credit/applications/${APP_ID}`, async (route) => {
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ code: "NOT_FOUND" }),
    });
  });

  await page.goto(`/bank/applications/${APP_ID}`);
  await expect(page.getByText(/solicitud no encontrada/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /bandeja/i })).toHaveAttribute("href", "/bank/applications/queue");
});
