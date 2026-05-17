import { test, expect } from "@playwright/test";
import { loginFromEnv, PLAYWRIGHT_BASE_URL } from "./bank-queue-login";

test("shows empty state when queue returns zero rows", async ({ page }) => {
  await page.route("**/api/bank/applications/queue**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        applications: [],
        total_count: 0,
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

  await loginFromEnv(page);
  await page.goto(`${PLAYWRIGHT_BASE_URL}/bank/applications/queue`);
  await expect(page.getByText(/No hay solicitudes en esta vista/i)).toBeVisible({ timeout: 25_000 });
});
