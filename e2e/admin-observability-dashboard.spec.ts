import { test, expect } from "@playwright/test";

const SAMPLE_METRICS = `
http_request_duration_seconds_bucket{handler="/api/health",le="0.05"} 1
http_request_duration_seconds_bucket{handler="/api/health",le="+Inf"} 2
http_requests_total{tenant="e2e-obs",status="200"} 18
http_requests_total{tenant="e2e-obs",status="500"} 2
http_requests_total{tenant="other",status="200"} 50
http_requests_total{tenant="other",status="500"} 0
`;

test.describe("EP-T3-5 admin observability dashboards", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("nadakki_tenant_id", "e2e-obs");
      localStorage.setItem("nadakki_auth", "true");
      localStorage.setItem("nadakki_role", "admin");
    });

    await page.route("**/metrics", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain; version=0.0.4",
        body: SAMPLE_METRICS,
      });
    });

    await page.route("**/api/v1/tenants/e2e-obs/observability/dashboard", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            health: { status: "healthy", uptime_pct: 99.9, region: "test" },
            latency: [],
            error_rate: [],
            fetched_at: new Date().toISOString(),
          },
        }),
      });
    });

    await page.route("**/api/v1/tenants/e2e-obs/observability/audit-trail", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            events: [
              {
                id: "1",
                ts: new Date().toISOString(),
                actor: "qa",
                action: "observability.view",
                resource: "dashboard",
                status: "200",
              },
            ],
            fetched_at: new Date().toISOString(),
          },
        }),
      });
    });

    await page.route("**/api/v1/tenants/e2e-obs/observability/sla", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            breaches: [],
            summary: { met_percent: 100, window: "e2e" },
          },
        }),
      });
    });
  });

  test("dashboard loads histogram and comparison from /metrics", async ({ page }) => {
    await page.goto("/admin/observability/dashboard");
    await expect(page.getByRole("heading", { name: /dashboard de observabilidad/i })).toBeVisible();
    await expect(page.getByTestId("latency-histogram")).toBeVisible();
    await expect(page.getByTestId("tenant-comparison")).toBeVisible();
    await expect(page.getByText(/X-Role/i)).toBeVisible();
  });

  test("audit trail tab shows filter controls", async ({ page }) => {
    await page.goto("/admin/observability/audit-trail");
    await expect(page.getByRole("heading", { name: /audit trail/i })).toBeVisible();
    await expect(page.getByTestId("audit-trail-filter")).toBeVisible();
    await expect(page.getByText("observability.view")).toBeVisible();
  });

  test("SLA page shows green status when no breaches", async ({ page }) => {
    await page.goto("/admin/observability/sla-monitoring");
    await expect(page.getByRole("heading", { name: /SLA monitoring/i })).toBeVisible();
    await expect(page.getByText(/SLA dentro de objetivo/i)).toBeVisible();
  });
});
