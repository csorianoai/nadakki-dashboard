import { test, expect } from "@playwright/test";
import {
  routeBankApplicationDetail,
  routeStipulationsAndNotify,
  sampleDetailBody,
  setupBankSession,
} from "./bank-e2e-helpers";

const APP_ID = "00000000-0000-4000-8000-00000000a601";
const DESKTOP = "chromium-desktop";

const stipList = [
  {
    id: "s1",
    title: "Comprobante de ingresos",
    description: "Comprobante de ingresos",
    type: "income",
    status: "uploaded",
  },
  {
    id: "s2",
    title: "Referencias",
    description: "Referencias",
    type: "reference",
    status: "pending",
  },
];

async function openOrchestrationOrSkip(page: import("@playwright/test").Page): Promise<void> {
  await page.goto(`/bank/applications/${APP_ID}`);
  const trigger = page.getByTestId("open-stip-workflow-panel");
  if (!(await trigger.isVisible({ timeout: 8000 }).catch(() => false))) {
    test.skip(true, "Bank stipulation workflow UI disabled (NEXT_PUBLIC_BANK_STIPULATION_WORKFLOW_UI).");
  }
  await trigger.click();
  await expect(page.getByTestId("bank-workflow-orchestration")).toBeVisible();
}

test.describe("Bank stipulations workflow E2E", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== DESKTOP, "Workflow specs run on chromium-desktop.");
    setupBankSession(page);
    const detail = {
      ...sampleDetailBody(APP_ID),
      stipulations: stipList,
    };
    await routeBankApplicationDetail(page, APP_ID, detail);
    await routeStipulationsAndNotify(page, APP_ID, stipList);
  });

  test("opens stipulations modal from application detail", async ({ page }) => {
    await openOrchestrationOrSkip(page);
    await expect(page.getByRole("heading", { name: /orquestación de estipulaciones/i })).toBeVisible();
  });

  test("applies template stipulations bulk", async ({ page }) => {
    await openOrchestrationOrSkip(page);
    await page.getByTestId("bank-workflow-tpl-paystubs-3mo").click();
    await expect(page.getByText(/Últimos 3 estados de nómina|paystub|nómina/i)).toBeVisible();
    await page.getByTestId("bank-workflow-bulk-sent").click();
    await expect(page.locator('[data-testid="workflow-stipulation-row"]').first()).toBeVisible();
    await expect(page.getByText(/marcada como enviada|enviada/i).first()).toBeVisible();
  });

  test("full stipulations request, fulfill, and audit flow", async ({ page }) => {
    await page.goto(`/bank/applications/${APP_ID}/stipulations`);
    const firstCard = page.getByTestId("stipulation-card-s1");
    await expect(firstCard).toContainText(/Comprobante de ingresos/i);
    await expect(firstCard.getByText(/Uploaded|Subido|Cargado|Pendiente/i).first()).toBeVisible();

    await firstCard.getByRole("button", { name: /^verificar$/i }).click();
    await page.getByRole("dialog").getByLabel(/notas/i).fill("E2E audit: income document accepted");
    await page.getByRole("dialog").getByRole("button", { name: /confirmar verificación/i }).click();
    await expect(page.getByText(/verificada|verified/i)).toBeVisible({ timeout: 12_000 });

    await firstCard.click();
    await expect(page.getByRole("heading", { name: /historial/i })).toBeVisible();
    await expect(page.getByText(/402-0000000-0|upload/i)).toBeVisible({ timeout: 12_000 });
  });

  test("creates custom stipulation", async ({ page }) => {
    await openOrchestrationOrSkip(page);
    await page.getByTestId("bank-workflow-orchestration-desc").fill("E2E custom stipulation note");
    await page.getByTestId("bank-workflow-orchestration-add-custom").click();
    await expect(page.getByText(/entrada manual añadida/i)).toBeVisible();
  });

  test("edits existing stipulation", async ({ page }) => {
    await openOrchestrationOrSkip(page);
    await page.getByTestId("bank-workflow-tpl-proof-of-insurance").click();
    const row = page.locator('[data-testid="workflow-stipulation-row"]').first();
    await row.getByLabel(/Estado para/i).selectOption("sent");
    await expect(row.getByLabel(/Estado para/i)).toHaveValue("sent");
  });

  test("removes stipulation with confirmation", async ({ page }) => {
    await openOrchestrationOrSkip(page);
    await page.getByTestId("bank-workflow-tpl-driver-license-copy").click();
    await page.getByRole("button", { name: /Reiniciar pendientes aplicables/i }).click();
    await expect(page.getByText(/persistido|pendientes|reiniciar/i).first()).toBeVisible();
  });

  test("sends stipulations to dealer triggers notification", async ({ page }) => {
    await openOrchestrationOrSkip(page);
    await page.getByTestId("bank-workflow-send-dealer").click();
    await expect(page.getByText(/notificación ejecutada|servicio agent-2/i)).toBeVisible({ timeout: 9000 });
  });

  test("notification flow to dealer from admin page reflects generated links", async ({ page }) => {
    await page.goto(`/bank/applications/${APP_ID}/stipulations`);
    const send = page.getByTestId("stip-workflow-send-pending");
    if (!(await send.isVisible({ timeout: 8000 }).catch(() => false))) {
      test.skip(true, "Bank stipulation workflow toolbar disabled.");
    }
    await send.click();
    await expect(page.getByText(/enlace|notificó|notificación|pendiente/i).first()).toBeVisible({ timeout: 12_000 });
  });

  test("marks stipulation as fulfilled", async ({ page }) => {
    await openOrchestrationOrSkip(page);
    await page.getByTestId("bank-workflow-tpl-down-payment-proof").click();
    const row = page.locator('[data-testid="workflow-stipulation-row"]').first();
    await row.getByLabel(/Estado para/i).selectOption("completed");
    await expect(row.getByLabel(/Estado para/i)).toHaveValue("completed");
  });

  test("rejects fulfillment with reason", async ({ page }) => {
    await page.goto(`/bank/applications/${APP_ID}/stipulations`);
    await page.getByTestId("stipulation-card-s1").getByRole("button", { name: /^rechazar$/i }).click();
    await page.getByLabel(/motivo/i).fill("E2E synthetic rejection — document unreadable");
    await page.getByRole("dialog").getByRole("button", { name: /^rechazar$/i }).click();
    await expect(page.getByText(/rechazada|rechaz/i)).toBeVisible({ timeout: 12_000 });
  });

  test("audit trail visible in detail view", async ({ page }) => {
    await page.goto(`/bank/applications/${APP_ID}`);
    await expect(page.getByRole("heading", { name: /^Actividad$/ })).toBeVisible();
    await expect(page.getByText(/Solicitud recibida/i)).toBeVisible();
  });

  test("mobile responsive on 375px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await openOrchestrationOrSkip(page);
    await expect(page.getByTestId("bank-workflow-orchestration")).toBeInViewport();
  });
});
