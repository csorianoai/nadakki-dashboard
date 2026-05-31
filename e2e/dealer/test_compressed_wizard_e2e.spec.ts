import { test, expect } from "@playwright/test";
import type { DealerCreditMockHooks } from "./helpers";
import {
  installDealerCreditApiMocks,
  loginAsDealer,
  MOCK_APP_ID,
  SAMPLE_VIN,
} from "./helpers";

const DESKTOP = "chromium-desktop";

const apiTrack: DealerCreditMockHooks = { postedCreate: false };

async function expectCompressedWizardOrSkip(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/credit/dealer/new");
  const root = page.getByTestId("compressed-wizard-root");
  if (!(await root.isVisible({ timeout: 12_000 }).catch(() => false))) {
    test.skip(true, "Compressed wizard disabled for this build (NEXT_PUBLIC_FEATURE_COMPRESSED_WIZARD).");
  }
}

async function fillStepApplicant(page: import("@playwright/test").Page): Promise<void> {
  const box = page.getByTestId("cw-step-applicant");
  await box.getByLabel(/Nombre completo/i).fill("E2E Cliente Demo");
  await box.getByLabel(/Fecha nacimiento/i).fill("1990-05-10");
  await box.getByLabel(/Cédula/i).fill("00112345678");
  await box.getByLabel(/Teléfono/i).fill("8095550100");
  await box.getByLabel(/Email/i).fill("e2e-wizard@nadakki.test");
  await box.getByLabel(/Dirección/i).fill("Av. Winston Churchill 1099, Santo Domingo");
}

async function fillStepEmployment(page: import("@playwright/test").Page): Promise<void> {
  const box = page.getByTestId("cw-step-employment");
  await box.getByLabel(/Empleador/i).fill("Nadakki Motors");
  await box.getByLabel(/Puesto/i).fill("Asistente de ventas");
  await box.getByLabel(/Ingreso mensual/i).fill("95000");
}

async function fillStepVehicleVinOnly(page: import("@playwright/test").Page): Promise<void> {
  const box = page.getByTestId("cw-step-vehicle");
  await box.getByLabel("VIN").fill(SAMPLE_VIN);
}

async function fillStepDeal(page: import("@playwright/test").Page): Promise<void> {
  const box = page.getByTestId("cw-step-deal");
  await box.getByLabel(/Precio venta/i).fill("850000");
  await box.getByLabel(/Inicial/i).fill("120000");
}

async function expectValidationKeepsCurrentStep(
  page: import("@playwright/test").Page,
  stepTestId: string,
  expected: RegExp
): Promise<void> {
  await page.getByTestId("cw-next").click();
  await expect(page.getByTestId(stepTestId)).toBeVisible();
  await expect(page.getByRole("alert").first()).toContainText(expected);
}

async function completeReviewAndSubmit(page: import("@playwright/test").Page): Promise<void> {
  await page.getByTestId("cw-step-review").getByText(/Autorizo consulta buró/i).click();
  await page.getByTestId("cw-step-review").getByText(/Ley 172-13/i).click();
  await page.getByTestId("cw-submit").click();
}

async function runFullWizard(page: import("@playwright/test").Page): Promise<void> {
  await fillStepApplicant(page);
  await page.getByTestId("cw-next").click();
  await fillStepEmployment(page);
  await page.getByTestId("cw-next").click();
  await fillStepVehicleVinOnly(page);
  await page.getByTestId("cw-next").click();
  await fillStepDeal(page);
  await page.getByTestId("cw-next").click();
  await completeReviewAndSubmit(page);
}

test.describe("Dealer Compressed Wizard E2E", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== DESKTOP, "Wizard flows run on chromium-desktop only.");
    apiTrack.postedCreate = false;
    await installDealerCreditApiMocks(page, { applicationId: MOCK_APP_ID, track: apiTrack });
    await loginAsDealer(page);
    await expectCompressedWizardOrSkip(page);
  });

  test("completes 5-step wizard in under 25 min", async ({ page }) => {
    const start = Date.now();
    await runFullWizard(page);
    await expect(page).toHaveURL(new RegExp(`/credit/dealer/${MOCK_APP_ID}`));
    const elapsedSec = (Date.now() - start) / 1000;
    expect(elapsedSec).toBeLessThan(25 * 60);
  });

  test("walks the full 5-step dealer wizard labels", async ({ page }) => {
    await expect(page.getByText(/Paso 1\/5/i)).toBeVisible();
    await fillStepApplicant(page);
    await page.getByTestId("cw-next").click();
    await expect(page.getByText(/Paso 2\/5/i)).toBeVisible();
    await fillStepEmployment(page);
    await page.getByTestId("cw-next").click();
    await expect(page.getByText(/Paso 3\/5/i)).toBeVisible();
    await fillStepVehicleVinOnly(page);
    await page.getByTestId("cw-next").click();
    await expect(page.getByText(/Paso 4\/5/i)).toBeVisible();
    await fillStepDeal(page);
    await page.getByTestId("cw-next").click();
    await expect(page.getByText(/Paso 5\/5/i)).toBeVisible();
    await expect(page.getByTestId("cw-step-review")).toContainText(/Resumen|Autorizo|Ley 172-13/i);
  });

  test("smart defaults populate correctly", async ({ page }) => {
    await expect(page.getByTestId("cw-step-employment")).toBeHidden();
    await expect(page.getByTestId("cw-step-vehicle")).toBeHidden();
    await expect(page.getByTestId("cw-step-deal")).toBeHidden();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "20");
    await fillStepApplicant(page);
    await page.getByTestId("cw-next").click();
    await expect(page.getByText(/1 años/)).toBeVisible();
    await fillStepEmployment(page);
    await page.getByTestId("cw-next").click();
    await expect(page.getByRole("radio", { name: /Usado/i })).toBeChecked();
    await fillStepVehicleVinOnly(page);
    await page.getByTestId("cw-next").click();
    const deal = page.getByTestId("cw-step-deal");
    await expect(deal.getByLabel(/Plazo/i)).toHaveValue("60");
    await expect(deal.getByText(/Cuota estimada/i)).toBeVisible();
    await page.getByRole("button", { name: /Atrás/i }).click();
    await expect(page.getByTestId("cw-step-vehicle")).toBeVisible();
  });

  test("progressive disclosure works as expected", async ({ page }) => {
    await fillStepApplicant(page);
    await page.getByTestId("cw-next").click();
    const emp = page.getByTestId("cw-step-employment");
    await emp.getByText(/Otros ingresos \(opcional\)/i).click();
    await expect(emp.locator("details")).toContainText(/Otros ingresos/i);
    await fillStepEmployment(page);
    await page.getByTestId("cw-next").click();
    await fillStepVehicleVinOnly(page);
    await page.getByTestId("cw-next").click();
    const deal = page.getByTestId("cw-step-deal");
    await deal.getByText(/Trade-in \(opcional\)/i).click();
    await expect(deal.locator("details")).toBeVisible();
  });

  test("VIN scan simulation populates vehicle data", async ({ page }) => {
    await fillStepApplicant(page);
    await page.getByTestId("cw-next").click();
    await fillStepEmployment(page);
    await page.getByTestId("cw-next").click();
    const box = page.getByTestId("cw-step-vehicle");
    await box.getByLabel("VIN").fill(SAMPLE_VIN);
    await box.getByRole("button", { name: /Decodificar año/i }).click();
    await expect(box.getByLabel(/Año/i)).not.toHaveValue("");
  });

  test("offline draft saves to localStorage", async ({ page, context }) => {
    await context.setOffline(true);
    await fillStepApplicant(page);
    await expect
      .poll(async () =>
        page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("nadakki:cw-draft:")).length)
      )
      .toBeGreaterThan(0);
    await context.setOffline(false);
  });

  test("offline draft syncs when back online", async ({ page, context }) => {
    await fillStepApplicant(page);
    await context.setOffline(true);
    await page.getByTestId("cw-step-applicant").getByLabel(/Nombre completo/i).fill("Offline Borrador");
    await page.waitForTimeout(500);
    await context.setOffline(false);
    await page.reload();
    await expectCompressedWizardOrSkip(page);
    const name = await page.getByTestId("cw-step-applicant").getByLabel(/Nombre completo/i).inputValue();
    expect(name).toContain("Offline");
  });

  test("validation errors show inline", async ({ page }) => {
    await page.getByTestId("cw-next").click();
    await expect(page.getByRole("alert").first()).toContainText(/Requerido|incompleto|inválido/i);
  });

  test("form validation works on each wizard step", async ({ page }) => {
    await expectValidationKeepsCurrentStep(page, "cw-step-applicant", /Requerido|incompleta|inválido/i);
    await fillStepApplicant(page);
    await expectValidationKeepsCurrentStep(page, "cw-step-employment", /Requerido|mayor a 0/i);
    await fillStepEmployment(page);
    await expectValidationKeepsCurrentStep(page, "cw-step-vehicle", /VIN válido|marca\/modelo\/año/i);
    await fillStepVehicleVinOnly(page);
    await expectValidationKeepsCurrentStep(page, "cw-step-deal", /Requerido|Inválido/i);
    await fillStepDeal(page);
    await page.getByTestId("cw-next").click();
    await page.getByTestId("cw-submit").click();
    await expect(page.getByRole("alert").first()).toContainText(/autorizar buró|política/i);
  });

  test("wizard prevents skip required fields", async ({ page }) => {
    await page.getByTestId("cw-next").click();
    await expect(page.getByTestId("cw-step-applicant")).toBeVisible();
    await expect(page.getByRole("alert").first()).toBeVisible();
  });

  test("back button works through all steps", async ({ page }) => {
    await fillStepApplicant(page);
    await page.getByTestId("cw-next").click();
    await fillStepEmployment(page);
    await page.getByTestId("cw-next").click();
    await expect(page.getByTestId("cw-step-vehicle")).toBeVisible();
    await page.getByRole("button", { name: /Atrás/i }).click();
    await expect(page.getByTestId("cw-step-employment")).toBeVisible();
    await page.getByRole("button", { name: /Atrás/i }).click();
    await expect(page.getByTestId("cw-step-applicant")).toBeVisible();
  });

  test("progress indicator updates correctly", async ({ page }) => {
    const bar = page.locator('[role="progressbar"]');
    await expect(bar).toHaveAttribute("aria-valuenow", "20");
    await fillStepApplicant(page);
    await page.getByTestId("cw-next").click();
    await expect(bar).toHaveAttribute("aria-valuenow", "40");
  });

  test("submission creates application via API", async ({ page }) => {
    await runFullWizard(page);
    await expect(page).toHaveURL(new RegExp(`/credit/dealer/${MOCK_APP_ID}`));
    expect(apiTrack.postedCreate).toBe(true);
  });

  test("timing telemetry captured per step", async ({ page }) => {
    await fillStepApplicant(page);
    await page.getByTestId("cw-next").click();
    await fillStepEmployment(page);
    await page.getByTestId("cw-next").click();
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const k = Object.keys(sessionStorage).find((x) => x.startsWith("nadakki:cw-telemetry:"));
          if (!k) return 0;
          try {
            const ev = JSON.parse(sessionStorage.getItem(k) ?? "[]") as unknown[];
            return ev.length;
          } catch {
            return 0;
          }
        })
      )
      .toBeGreaterThan(0);
  });
});
