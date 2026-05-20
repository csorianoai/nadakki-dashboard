import type { Page } from "@playwright/test";

export const LOGIN_EMAIL = process.env.E2E_EMAIL ?? "ramon@nadakki.com";
export const LOGIN_PWD = process.env.E2E_PASSWORD ?? "%QvPAyTLk0ERJu0x";
export const TENANT_SLUG = process.env.E2E_TENANT_SLUG ?? "credicefi";

/** Example VIN without I/O/Q; decode fills model year via heuristic. */
export const SAMPLE_VIN = "1HGBH41JXMN109186";

export const MOCK_APP_ID = "e2e-dealer-mock-app-001";

/**
 * Login via `/login` (email, password, tenant slug).
 */
export async function loginAsDealer(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/Email/i).fill(LOGIN_EMAIL);
  await page.getByLabel(/^Password/i).fill(LOGIN_PWD);
  await page.getByLabel(/Tenant/i).fill(TENANT_SLUG);
  await page.getByRole("button", { name: /Iniciar Sesión/i }).click();
  await page.waitForURL(/\/(credit-hub|dashboard)/, { timeout: 90_000 });
}

export type DealerCreditMockHooks = {
  /** True once a POST to create application succeeded. */
  postedCreate: boolean;
};

/**
 * Stubs `/api/v2/credit/*` from the browser (any host) for dealer flows:
 * wizard submit chain, dealer command view reads (GET full, offers, docs, …).
 */
export async function installDealerCreditApiMocks(
  page: Page,
  options: { applicationId?: string; track?: DealerCreditMockHooks } = {}
): Promise<void> {
  const applicationId = options.applicationId ?? MOCK_APP_ID;
  const track = options.track;

  const json = (body: unknown, status = 200) => ({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });

  await page.route(/\/api\/v2\/credit\//, async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    let path = "";
    try {
      path = new URL(url).pathname;
    } catch {
      await route.continue();
      return;
    }

    if (method === "POST" && path === "/api/v2/credit/applications") {
      if (track) track.postedCreate = true;
      await route.fulfill(
        json({
          application_id: applicationId,
          trace_id: "e2e-create",
          state: "DRAFT",
        })
      );
      return;
    }

    if (method === "POST" && path.includes(`/applications/${applicationId}/applicant`)) {
      await route.fulfill(json({}));
      return;
    }
    if (method === "POST" && path.includes(`/applications/${applicationId}/vehicle`)) {
      await route.fulfill(json({}));
      return;
    }
    if (method === "POST" && path.includes(`/applications/${applicationId}/process`)) {
      await route.fulfill(json({ ok: true }));
      return;
    }

    if (method === "GET" && path.includes(`/applications/${applicationId}/full`)) {
      await route.fulfill(
        json({
          application_id: applicationId,
          state: "COMPLETED",
          tenant_id: TENANT_SLUG,
          ai_decision: { score: 0.72, recommendation: "REVIEW", confidence: 0.7 },
          applicant: {
            nombre_completo: "E2E Cliente",
            ingreso_mensual_declarado: 85_000,
            credit_score: 720,
            monthly_income: 85_000,
            monthly_debts: 12_000,
            employment_years: 3,
          },
          vehicle: {
            loan_amount_requested: 400_000,
            vehicle_value: 550_000,
          },
          offers: [],
        })
      );
      return;
    }

    if (method === "GET" && path.endsWith(`/applications/${applicationId}/offers`) && !path.includes("/rank")) {
      await route.fulfill(json({ offers: [] }));
      return;
    }

    if (method === "GET" && path.includes(`/applications/${applicationId}/offers/rank`)) {
      await route.fulfill(
        json({
          best_overall: null,
          ranked_eligible: [],
          scores: [],
          all_offers_count: 0,
        })
      );
      return;
    }

    if (method === "GET" && path.includes(`/applications/${applicationId}/similar-cases`)) {
      await route.fulfill(json({ similar_cases: [], trace_id: "e2e" }));
      return;
    }

    if (method === "GET" && path.includes(`/applications/${applicationId}/optimize`)) {
      await route.fulfill(
        json({
          reference_annual_rate: 0.09,
          top_actions: [],
          metrics: {},
        })
      );
      return;
    }

    if (method === "GET" && path.includes(`/applications/${applicationId}/explanation`)) {
      await route.fulfill(json({ normalized: {}, factors: [], trace_id: "e2e" }));
      return;
    }

    if (method === "GET" && path.includes(`/applications/${applicationId}/narrative`)) {
      await route.fulfill(
        json({
          dealer_narrative: "Resumen dealer E2E.",
          bank_narrative: "Resumen banco E2E.",
          client_narrative: "Resumen cliente E2E.",
          generated_at: new Date().toISOString(),
          application_id: applicationId,
          confidence_label: "MEDIA",
          confidence_score: 0.66,
        })
      );
      return;
    }

    if (method === "GET" && path.endsWith(`/applications/${applicationId}/documents`)) {
      await route.fulfill(json([]));
      return;
    }

    if (method === "GET" && path.includes(`/applications/${applicationId}/documents/completeness`)) {
      await route.fulfill(
        json({
          application_id: applicationId,
          is_complete: false,
          missing_categories: ["IDENTITY"],
          counts_by_category: {},
          total_documents: 0,
          completeness_pct: 40,
          detail: "E2E mock",
        })
      );
      return;
    }

    await route.continue();
  });
}

/** @deprecated Prefer {@link installDealerCreditApiMocks}. */
export async function installMinimalDealerApplicationMocks(
  page: Page,
  applicationId = MOCK_APP_ID
): Promise<void> {
  await installDealerCreditApiMocks(page, { applicationId });
}

/** @deprecated Prefer {@link installDealerCreditApiMocks} with `track`. */
export async function installCompressedWizardSubmitMocks(
  page: Page,
  newApplicationId = MOCK_APP_ID
): Promise<{ postedCreate: boolean }> {
  const track: DealerCreditMockHooks = { postedCreate: false };
  await installDealerCreditApiMocks(page, { applicationId: newApplicationId, track });
  return track;
}
