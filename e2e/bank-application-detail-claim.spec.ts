import { test, expect } from "@playwright/test";
import { BANK_E2E_TOKEN_KEY, makeBankE2eJwt, sampleDetailBody } from "./bank-application-detail-helpers";

const APP_ID = "00000000-0000-4000-8000-000000000002";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ([k, token]: [string, string]) => {
      localStorage.setItem(k, token);
    },
    [BANK_E2E_TOKEN_KEY, makeBankE2eJwt("tenant-e2e")],
  );
});

test("claim updates UI when POST returns success", async ({ page }) => {
  let claimed = false;

  await page.route(`**/api/v2/credit/applications/${APP_ID}**`, async (route) => {
    const req = route.request();
    if (req.method() === "POST" && req.url().includes("/claim")) {
      claimed = true;
      await route.fulfill({ status: 204 });
      return;
    }
    if (req.method() === "GET" && req.url().includes(`/applications/${APP_ID}`) && !req.url().includes("/claim")) {
      const body = { ...sampleDetailBody(APP_ID) };
      if (claimed) {
        body.bank_claim = {
          claimed_by: "e2e-user",
          claimed_at: new Date().toISOString(),
          current_user_owns: true,
        };
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
      return;
    }
    await route.continue();
  });

  await page.goto(`/bank/applications/${APP_ID}`);
  await page.getByRole("button", { name: /^reclamar$/i }).click();
  await expect(page.getByText(/tienes la solicitud asignada/i)).toBeVisible({ timeout: 15_000 });
});
