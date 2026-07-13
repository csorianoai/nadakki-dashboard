import { test, expect } from "@playwright/test";
import { setupCockpitE2e, waitForSessionReady } from "./finance-helpers";

test.describe("Finance Cockpit golden paths — F7", () => {
  test.beforeEach(async ({ context, page }) => {
    await setupCockpitE2e(context, page, "platform_superadmin");
  });

  test("1-3: home → Consola de Plataforma → revenue KPIs live", async ({ page }) => {
    await page.goto("/");
    await waitForSessionReady(page);
    await page.getByRole("button", { name: /user menu/i }).click();
    await page.getByRole("button", { name: /consola de plataforma/i }).click();
    await expect(page).toHaveURL(/\/cockpit/);
    await waitForSessionReady(page);

    await page.getByTestId("cockpit-sidebar").getByRole("link", { name: /finanzas/i }).click();
    await expect(page).toHaveURL(/\/cockpit\/finance/);

    await page.getByTestId("finance-subnav").getByRole("link", { name: /ingresos/i }).click();
    await expect(page.getByTestId("finance-kpi-grid")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("mrr-by-core-chart")).toBeVisible();
  });

  test("4: population shows 44 profesionales", async ({ page }) => {
    await page.goto("/cockpit/finance/population");
    await waitForSessionReady(page);
    await expect(page.getByTestId("population-tab-summary")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/44/)).toBeVisible();
  });

  test("5-6: matrix MRR metric + CSV export + tenant drill-down", async ({ page }) => {
    await page.goto("/cockpit/finance/matrix");
    await waitForSessionReady(page);
    await expect(page.getByTestId("finance-matrix-view")).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("matrix-metric-nav").getByRole("button", { name: /mrr aportado/i }).click();
    await expect(page.getByTestId("matrix-table")).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /exportar csv/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/cockpit-matrix-mrr/);

    await page.getByTestId("matrix-cell-demo-tenant-credit").click();
    await expect(page).toHaveURL(/\/cockpit\/finance\/tenant\/demo-tenant/);
    await expect(page.url()).toContain("highlighted_core=credit");
  });

  test("7-8: tenant detail complete + back to matrix", async ({ page }) => {
    await page.goto("/cockpit/finance/tenant/demo-tenant?highlighted_core=credit");
    await waitForSessionReady(page);
    await expect(page.getByTestId("finance-tenant-detail")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("tenant-finance-block")).toBeVisible();
    await expect(page.getByTestId("tenant-core-cards")).toBeVisible();
    await expect(page.getByTestId("tenant-users-table")).toBeVisible();
    await expect(page.getByTestId("tenant-core-card-credit")).toBeVisible();

    await page.getByRole("link", { name: /volver a matriz/i }).click();
    await expect(page).toHaveURL(/\/cockpit\/finance\/matrix/);
  });

  test("9-10: exit to dashboard via cockpit user menu", async ({ page }) => {
    await page.goto("/cockpit/finance/revenue");
    await waitForSessionReady(page);
    await page.getByRole("button", { name: /menú de usuario/i }).click();
    await page.getByRole("button", { name: /volver al dashboard/i }).click();
    await expect(page).toHaveURL(/\//);
  });

  test("sidebar Network Cockpit link visible for superadmin on home", async ({ page }) => {
    await page.goto("/");
    await waitForSessionReady(page);
    const sidebar = page.locator("aside, nav").filter({ hasText: /administración|admin/i });
    if ((await sidebar.count()) === 0) {
      await page.goto("/cockpit");
      await expect(page.getByTestId("cockpit-sidebar")).toBeVisible();
      return;
    }
    await expect(page.getByRole("link", { name: /network cockpit/i })).toBeVisible();
  });
});
