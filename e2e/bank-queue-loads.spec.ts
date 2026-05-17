import { test, expect } from "@playwright/test";
import { loginFromEnv, PLAYWRIGHT_BASE_URL } from "./bank-queue-login";

test.describe("bank queue loads", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/bank/applications/queue**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          applications: [
            {
              application_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              dealer_name: "Playwright Dealer",
              borrower_name: "Cliente PW",
              amount: 250000,
              created_at: new Date().toISOString(),
              sla_deadline: new Date().toISOString(),
              hours_until_sla: 8,
              status: "pending",
              claimed_by: null,
              claimed_at: null,
              pti: 14,
              dti: 33,
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

  test("renders heading and mocked queue row", async ({ page }) => {
    await loginFromEnv(page);
    await page.goto(`${PLAYWRIGHT_BASE_URL}/bank/applications/queue`);
    await expect(page.getByRole("heading", { name: /Bandeja de solicitudes/i })).toBeVisible({
      timeout: 25_000,
    });
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByText(/Cliente PW/)).toBeVisible();
  });
});
