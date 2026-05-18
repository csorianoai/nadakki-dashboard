import { test, expect } from "@playwright/test";
import { BANK_E2E_TOKEN_KEY, makeBankE2eJwt, sampleDetailBody } from "./bank-application-detail-helpers";

const APP_ID = "00000000-0000-4000-8000-000000000099";

test.describe("EP-T3-2 observability smoke", () => {
  test("login route renders without crashing the client bundle", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("body")).toBeVisible();
  });

  test("bank application detail works under route error boundaries", async ({ page }) => {
    await page.addInitScript(
      ([k, token]: [string, string]) => {
        localStorage.setItem(k, token);
      },
      [BANK_E2E_TOKEN_KEY, makeBankE2eJwt("tenant-e2e")],
    );

    await page.route(`**/api/v2/credit/applications/${APP_ID}`, async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(sampleDetailBody(APP_ID)),
      });
    });

    await page.goto(`/bank/applications/${APP_ID}`);
    await expect(page.getByText("F. *** Last")).toBeVisible();
    await expect(page.getByRole("main", { name: /detalle de solicitud bancaria/i })).toBeVisible();
  });

  test("credit-hub dealer home responds", async ({ page }) => {
    await page.goto("/credit-hub/dealer");
    await expect(page).toHaveURL(/\/credit-hub\/dealer\/?$/);
    await expect(page.locator("body")).toBeVisible();
  });
});
