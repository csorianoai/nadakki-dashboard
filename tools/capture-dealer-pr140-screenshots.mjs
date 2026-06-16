/**
 * PR #140 — Dealer Portal screenshot capture (1280 desktop + 375 mobile).
 * Uses Playwright + init-script fetch mocks (works on Windows without live backend).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "docs", "credit-hub", "pr-140-screenshots");

const BASE = process.env.BASE_URL || "http://127.0.0.1:3020";
const DETAIL_ID = process.env.E2E_DEALER_APP_ID ?? "APP-1847";

const ROUTES = [
  { name: "01-dealer-dashboard", url: "/credit-hub/dealer" },
  { name: "02-dealer-applications", url: "/credit-hub/dealer/applications" },
  { name: "03-dealer-application-detail", url: `/credit-hub/dealer/applications/${DETAIL_ID}` },
  { name: "04-dealer-new-redirect", url: "/credit-hub/dealer/applications/new" },
  { name: "05-wizard-applicant", url: "/credit-hub/dealer/applications/new/applicant" },
  { name: "06-wizard-co-borrower", url: "/credit-hub/dealer/applications/new/co-borrower" },
  { name: "07-wizard-vehicle", url: "/credit-hub/dealer/applications/new/vehicle" },
  { name: "08-wizard-documents", url: "/credit-hub/dealer/applications/new/documents" },
  { name: "09-wizard-consent", url: "/credit-hub/dealer/applications/new/consent" },
  { name: "10-wizard-complete", url: "/credit-hub/dealer/applications/new/complete?id=e2e-screenshot-app" },
  { name: "11-dealer-preapproval", url: "/credit-hub/dealer/preapproval" },
  { name: "12-dealer-notifications", url: "/credit-hub/dealer/notifications" },
  { name: "13-dealer-profile", url: "/credit-hub/dealer/profile" },
];

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 375, height: 812 },
};

const INIT_SCRIPT = `
(() => {
  const MOCK_TENANT = { id: "credicefi", slug: "credicefi", display_name: "Auto Plaza · TestBank", subscribed_cores: ["credit"] };
  const MOCK_ROLE = { core_name: "credit", role_key: "credit_admin", display_name: "Credit Admin" };
  const MOCK_USER = { id: "screenshot-dealer", email: "dealer-screenshot@nadakki.test", name: "Jorge Salinas", is_active: true, mfa_enabled: false };
  const MOCK_APPLICATIONS = ${JSON.stringify([
    {
      application_id: "APP-1847",
      id: "APP-1847",
      applicant_name: "María González",
      status: "processing",
      requested_amount: "850000",
      vehicle_make: "Nissan",
      vehicle_model: "Sentra",
      vehicle_year: 2024,
      score: 712,
      applicant_email: "maria@example.com",
      applicant_phone: "+1 809 555 0100",
      created_at: "2026-06-10T14:30:00.000Z",
      updated_at: "2026-06-14T09:15:00.000Z",
    },
    {
      application_id: "APP-1832",
      id: "APP-1832",
      applicant_name: "Carlos Méndez",
      status: "submitted",
      requested_amount: "620000",
      vehicle_make: "Toyota",
      vehicle_model: "Corolla",
      vehicle_year: 2023,
      score: 688,
      created_at: "2026-06-12T11:00:00.000Z",
      updated_at: "2026-06-13T16:45:00.000Z",
    },
    {
      application_id: "APP-1801",
      id: "APP-1801",
      applicant_name: "Ana Rodríguez",
      status: "approved",
      requested_amount: "1200000",
      vehicle_make: "Honda",
      vehicle_model: "CR-V",
      vehicle_year: 2025,
      score: 745,
      decision: "approved",
      created_at: "2026-06-01T08:00:00.000Z",
      updated_at: "2026-06-08T10:00:00.000Z",
    },
    {
      application_id: "APP-1790",
      id: "APP-1790",
      applicant_name: "Luis Pérez",
      status: "draft",
      requested_amount: "450000",
      vehicle_make: "Kia",
      vehicle_model: "Rio",
      created_at: "2026-06-15T18:00:00.000Z",
      updated_at: "2026-06-15T18:00:00.000Z",
    },
  ])};
  const MOCK_STATS = ${JSON.stringify({
    total_applications: 24,
    draft_applications: 2,
    submitted_applications: 8,
    processing_applications: 5,
    approved_applications: 6,
    rejected_applications: 3,
    applications_this_week: 7,
    average_score: 698,
    approval_rate: 0.67,
  })};
  const MOCK_EVENTS = ${JSON.stringify([
    {
      id: "ev-1",
      application_id: DETAIL_ID,
      type: "submitted",
      title: "Solicitud enviada",
      description: "Enviada al banco para análisis",
      created_at: "2026-06-10T14:35:00.000Z",
      actor: "dealer",
      metadata: null,
    },
    {
      id: "ev-2",
      application_id: DETAIL_ID,
      type: "scored",
      title: "Análisis completado",
      description: "Score 712 · banda media",
      created_at: "2026-06-11T10:00:00.000Z",
      actor: "system",
      metadata: null,
    },
  ])};

  localStorage.setItem("nadakki_refresh_token_v2", "mock-refresh");
  localStorage.setItem("nadakki_auth", "true");
  localStorage.setItem("nadakki_tenant_id", "credicefi");
  localStorage.setItem("nadakki_tenant_name", "Auto Plaza · TestBank");
  localStorage.setItem("nadakki_role", "credit_admin");
  localStorage.setItem("nadakki_sic_token", "mock-access");

  const orig = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.url;
    const json = (body) => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    if (url.includes("/api/v2/auth/refresh")) return json({ access_token: "mock-access", refresh_token: "mock-refresh", expires_in: 3600 });
    if (url.includes("/api/v2/auth/me")) return json({ user: MOCK_USER, current_tenant: MOCK_TENANT, all_tenants: [MOCK_TENANT], active_roles: [MOCK_ROLE] });
    if (url.includes("/api/v2/auth/login")) return json({ access_token: "mock-access", refresh_token: "mock-refresh", token_type: "Bearer", expires_in: 3600, user_info: MOCK_USER, tenant_info: MOCK_TENANT, active_role: MOCK_ROLE, mfa_required: false });
    if (url.includes("/api/v2/credit/stats")) return json(MOCK_STATS);
    if (url.includes("/api/v2/credit/applications") && (!init || init.method === "GET" || !init.method)) {
      if (url.includes("/events")) return json({ events: MOCK_EVENTS });
      const idMatch = url.match(/\\/applications\\/([^/?]+)/);
      if (idMatch && idMatch[1] !== "applications" && !url.endsWith("/applications")) {
        const app = MOCK_APPLICATIONS.find((a) => a.application_id === idMatch[1]) || MOCK_APPLICATIONS[0];
        return json(app);
      }
      return json({ applications: MOCK_APPLICATIONS });
    }
    if (url.includes("/api/v2/tenants/") && url.includes("/branding")) {
      return json({ institution_name: "Auto Plaza · TestBank", locale: "es-DO", currency_code: "DOP", country_code: "DO", branding: { logo_url: null }, features_enabled: { preapproval_simulator: true, garante_required: false }, document_types: { primary_id: "CEDULA" } });
    }
    return orig(input, init);
  };
})();
`;

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "msedge", headless: true });
  } catch (e) {
    console.warn("msedge launch failed, trying bundled chromium:", e.message);
    return await chromium.launch({ headless: true });
  }
}

async function captureRoute(page, route, filepath) {
  const target = `${BASE}${route.url}`;
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 90_000 });
  if (route.url.endsWith("/applications/new")) {
    await page.waitForURL(/\/applications\/new\/applicant/, { timeout: 20_000 }).catch(() => {});
  }
  const wizard = route.url.includes("/applications/new");
  const selector = wizard
    ? ".ch-btn-persona, .ch-btn, .StepperWizard, [data-testid='preapproval-simulator'], .ch-serif"
    : ".credit-hub-forge[data-persona='dealer'], .credit-hub-forge, .ch-serif";
  await page.waitForSelector(selector, { timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(wizard ? 2500 : 1800);
  await page.screenshot({ path: filepath, fullPage: true });
}

async function captureAll(browser) {
  const failures = [];
  let captured = 0;

  for (const [subdir, viewport] of Object.entries(VIEWPORTS)) {
    const dir = path.join(OUT, subdir);
    fs.mkdirSync(dir, { recursive: true });

    for (const route of ROUTES) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript(INIT_SCRIPT);
      const page = await context.newPage();
      const filepath = path.join(dir, `${route.name}.png`);
      try {
        console.log(`[${subdir}] ${route.url}`);
        await captureRoute(page, route, filepath);
        const kb = (fs.statSync(filepath).size / 1024).toFixed(1);
        console.log(`  -> OK (${kb} KB)`);
        captured++;
      } catch (err) {
        console.error(`  -> FAIL: ${err.message}`);
        failures.push({ route: `${subdir}/${route.name}`, error: err.message });
      } finally {
        await context.close();
      }
    }
  }

  return { captured, failures };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  console.log("Output:", OUT);
  console.log("Base URL:", BASE);

  const browser = await launchBrowser();
  const { captured, failures } = await captureAll(browser);
  await browser.close();

  fs.writeFileSync(
    path.join(OUT, "manifest.json"),
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        baseUrl: BASE,
        method: "Playwright msedge + init-script fetch mocks (Windows local)",
        viewports: VIEWPORTS,
        routes: ROUTES,
        captured,
        failures,
      },
      null,
      2,
    ),
  );

  console.log(`\nCaptured: ${captured} / ${ROUTES.length * 2}`);
  if (failures.length) failures.forEach((f) => console.log(`FAIL ${f.route}: ${f.error}`));
  if (captured < 10) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
