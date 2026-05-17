import { test, expect } from "@playwright/test";
import { loginFromEnv, PLAYWRIGHT_BASE_URL } from "./bank-queue-login";

test.describe("bank queue keyboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/bank/applications/queue**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          applications: [
            {
              application_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              dealer_name: "Dealer",
              borrower_name: "Borrower",
              amount: 100000,
              created_at: new Date().toISOString(),
              sla_deadline: new Date().toISOString(),
              hours_until_sla: 5,
              status: "pending",
              claimed_by: null,
              claimed_at: null,
              pti: 12,
              dti: 30,
            },
          ],
          total_count: 1,
          tenant_thresholds: {
            pti_green_max: 15,
            pti_amber_max: 20,
            pti_red_min: 21,
            dti_green_max: 36,
            dti_amber_max: 43,
            dti_red_min: 44,
          },
        }),
      });
    });
  });

  test("slash focuses search input", async ({ page }) => {
    await loginFromEnv(page);
    await page.goto(`${PLAYWRIGHT_BASE_URL}/bank/applications/queue`);
    const search = page.getByPlaceholder(/Nombre, dealer o ID/);
    await expect(search).toBeVisible({ timeout: 25_000 });
    await page.keyboard.press("/");
    await expect(search).toBeFocused();
  });
});
