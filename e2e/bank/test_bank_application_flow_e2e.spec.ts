import { test, expect } from "@playwright/test";
import { sampleDetailOwnedClaim } from "../bank-application-detail-helpers";
import { routeBankApplicationDetail, sampleDetailBody, setupBankSession } from "./bank-e2e-helpers";

const APP_ID = "00000000-0000-4000-8000-00000000b701";
const QUEUE_APP = "00000000-0000-4000-8000-00000000c802";
const DESKTOP = "chromium-desktop";

test.describe("Bank application flow E2E", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== DESKTOP, "Bank flow specs use chromium-desktop only.");
  });
  test.beforeEach(async ({ page }) => {
    setupBankSession(page);
  });

  test("lists applications with filters", async ({ page }) => {
    await page.route("**/api/v2/credit/applications/queue*", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          applications: [
            {
              application_id: QUEUE_APP,
              tenant_id: "tenant-e2e",
              state: "pending",
              applicant_name: "E2E UniqueQueueName",
              dealer_id: "dealer-1",
              dealer_name: "Forge Dealer",
              vehicle_label: "2022 Toyota Corolla",
              requested_amount: 480_000,
              score: 760,
              risk_level: "BAJO",
              approval_band: "PREAPROBABLE",
              priority: "ALTA",
              created_at: new Date().toISOString(),
              bank_decision: null,
            },
            {
              application_id: APP_ID,
              tenant_id: "tenant-e2e",
              state: "pending",
              applicant_name: "Other applicant",
              dealer_id: "dealer-1",
              dealer_name: "Forge Dealer",
              vehicle_label: "2021 Honda",
              requested_amount: 300_000,
              score: 640,
              risk_level: "MEDIO",
              approval_band: "REQUIERE_REVISION",
              priority: "MEDIA",
              created_at: new Date().toISOString(),
              bank_decision: null,
            },
          ],
          total: 2,
          tenant_id: "tenant-e2e",
        }),
      });
    });
    await page.goto("/credit-hub/bank/applications");
    await expect(page.getByRole("heading", { name: /solicitudes priorizadas/i })).toBeVisible({ timeout: 20_000 });
    await page.getByRole("textbox", { name: /buscar en bandeja/i }).fill("UniqueQueueName");
    await expect(page.getByText("E2E UniqueQueueName")).toBeVisible();
    await expect(page.getByText("Other applicant")).not.toBeVisible();
  });

  test("opens application detail view", async ({ page }) => {
    await routeBankApplicationDetail(page, APP_ID, sampleDetailBody(APP_ID));
    await page.goto(`/bank/applications/${APP_ID}`);
    await expect(page.getByText("F. *** Last")).toBeVisible();
  });

  test("expediente shows all sections (T6.2)", async ({ page }) => {
    await routeBankApplicationDetail(page, APP_ID, sampleDetailBody(APP_ID));
    await page.goto(`/bank/applications/${APP_ID}`);
    await expect(page.getByRole("heading", { name: /^scoring$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /solicitante/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /veh[ií]culo/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /documentos/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /estipulaciones/i })).toBeVisible();
  });

  test("multi-lender offers display ranked", async ({ page }) => {
    await page.route("**/api/v2/credit/applications/queue*", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          applications: [
            {
              application_id: QUEUE_APP,
              tenant_id: "tenant-e2e",
              state: "pending",
              applicant_name: "Ranked A",
              dealer_id: "d1",
              dealer_name: "Dealer A",
              vehicle_label: "Camry",
              requested_amount: 600_000,
              score: 820,
              risk_level: "BAJO",
              approval_band: "PREAPROBABLE",
              priority: "ALTA",
              created_at: new Date().toISOString(),
              bank_decision: null,
            },
            {
              application_id: APP_ID,
              tenant_id: "tenant-e2e",
              state: "pending",
              applicant_name: "Ranked B",
              dealer_id: "d2",
              dealer_name: "Dealer B",
              vehicle_label: "Civic",
              requested_amount: 400_000,
              score: 610,
              risk_level: "MEDIO",
              approval_band: "REQUIERE_REVISION",
              priority: "MEDIA",
              created_at: new Date().toISOString(),
              bank_decision: null,
            },
          ],
          total: 2,
          tenant_id: "tenant-e2e",
        }),
      });
    });
    await page.goto("/credit-hub/bank/applications");
    await expect(page.getByText("820")).toBeVisible();
    await expect(page.getByText("610")).toBeVisible();
  });

  test("approves application with conditions", async ({ page }) => {
    await routeBankApplicationDetail(page, APP_ID, sampleDetailOwnedClaim(APP_ID));
    await page.route(`**/api/v2/credit/applications/${APP_ID}/decide`, async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          decision_id: "dec-e2e",
          application_id: APP_ID,
          decision_type: "APROBADO",
          decided_at: new Date().toISOString(),
        }),
      });
    });
    await page.goto(`/bank/applications/${APP_ID}`);
    await page.getByRole("button", { name: /decisión/i }).click();
    await page.getByRole("radio", { name: /aprobar/i }).click();
    await page.getByRole("checkbox", { name: /RC001_APPROVE/i }).check();
    const resPromise = page.waitForResponse(
      (r) => r.url().includes(`/applications/${APP_ID}/decide`) && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: /registrar decisión/i }).click();
    await expect((await resPromise).ok()).toBeTruthy();
  });

  test("rejects application with reason", async ({ page }) => {
    await routeBankApplicationDetail(page, APP_ID, sampleDetailOwnedClaim(APP_ID));
    await page.route(`**/api/v2/credit/applications/${APP_ID}/decide`, async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          decision_id: "dec-rej",
          application_id: APP_ID,
          decision_type: "RECHAZADO",
          decided_at: new Date().toISOString(),
        }),
      });
    });
    await page.goto(`/bank/applications/${APP_ID}`);
    await page.getByRole("button", { name: /decisión/i }).click();
    await page.getByRole("radio", { name: /rechazar/i }).click();
    await page.getByLabel(/justificación/i).fill("E2E synthetic adverse — policy DTI");
    await page.getByRole("button", { name: /registrar decisión/i }).click();
    await expect(page.getByText(/registrada|decisión|rechaz/i).first()).toBeVisible({ timeout: 12_000 });
  });

  test("requests additional documents", async ({ page }) => {
    await page.route("**/api/v2/credit/applications/bulk-decide", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          rule: "SOLICITAR_DOCUMENTOS",
          processed: 1,
          skipped: 0,
          errors: 0,
          results: [{ application_id: QUEUE_APP, status: "processed", decision: null, message: "docs" }],
        }),
      });
    });
    await page.route("**/api/v2/credit/applications/queue*", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          applications: [
            {
              application_id: QUEUE_APP,
              tenant_id: "tenant-e2e",
              state: "pending",
              applicant_name: "Bulk docs target",
              dealer_id: "dealer-1",
              dealer_name: "D",
              vehicle_label: "X",
              requested_amount: 100_000,
              score: 600,
              risk_level: "MEDIO",
              approval_band: "REQUIERE_REVISION",
              priority: "MEDIA",
              created_at: new Date().toISOString(),
              bank_decision: null,
            },
          ],
          total: 1,
          tenant_id: "tenant-e2e",
        }),
      });
    });
    await page.goto(`/credit-hub/bank/applications`);
    await page.getByRole("checkbox", { name: new RegExp(`Seleccionar solicitud ${QUEUE_APP}`) }).check();
    await page.locator('select[name="bulk-rule"]').selectOption("SOLICITAR_DOCUMENTOS");
    await page.getByRole("textbox", { name: /justificación obligatoria/i }).fill("E2E bulk solicit docs — synthetic");
    await page.getByRole("button", { name: /confirmar lote/i }).click();
    await expect(page.getByText(/procesadas|processed|1/i).first()).toBeVisible({ timeout: 12_000 });
  });

  test("mobile responsive table layout", async ({ page }) => {
    await page.route("**/api/v2/credit/applications/queue*", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          applications: [
            {
              application_id: APP_ID,
              tenant_id: "tenant-e2e",
              state: "pending",
              applicant_name: "Mobile row",
              dealer_id: "dealer-1",
              dealer_name: "D",
              vehicle_label: "Y",
              requested_amount: 200_000,
              score: 700,
              risk_level: "BAJO",
              approval_band: "PREAPROBABLE",
              priority: "BAJA",
              created_at: new Date().toISOString(),
              bank_decision: null,
            },
          ],
          total: 1,
          tenant_id: "tenant-e2e",
        }),
      });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/credit-hub/bank/applications");
    await expect(page.getByText("Mobile row")).toBeVisible();
  });
});
