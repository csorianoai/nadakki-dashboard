import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Legal OS — Mi despacho (PR #1320, revisión de César 22-nov): una sola navegación, bandeja de prioridades unificada,
 * «Continuar» hasta la próxima acción del expediente, tarjetas en móvil, teclado y accesibilidad (axe).
 * Backend simulado (backend.invalid) con datos equivalentes al tenant QA; abogado con perfil de validador.
 */
const B = process.env.VISUAL_BACKEND ?? "http://backend.invalid";
const T = "b95c2363-b74d-4364-bc88-c8d6f5799932";
const dia = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

const caso = (case_id: string, n: string, title: string, state: string, priority: string) => ({
  case_id, case_number_internal: n, tenant_id: T, case_type: "defensa_civil_cobro_pesos", legal_jurisdiction: "do", state, title,
  priority, practice_area_tags: [], client_roles: ["demandado"], related_case_ids: [], has_expired_critical_deadline_at_ingestion: false,
  actors: [], documents: [], deadlines: [], strategies: [], open_issues_count: 0, created_at: "2026-11-18T10:00:00Z", updated_at: "2026-11-22T10:00:00Z",
});
const CASOS = [
  caso("c1", "CIVIL-APELACION-001", "QA AUDITORIA cobro de pesos", "APPEAL", "high"),
  caso("c2", "EXP-20261120-3eaf70", "Inversiones Caribe Prueba c/ Almonte", "EVALUACION_INICIAL", "normal"),
];
const PLAZO = { deadline_id: "d1", case_id: "c1", case_title: CASOS[0].title, case_number_internal: "CIVIL-APELACION-001", deadline_db_id: "d1",
  deadline_category: "Recurso de apelación", deadline_sub_category: "", trigger_event: "", effective_deadline_date: dia(1),
  auto_calculated_deadline_date: dia(1), legal_basis: "Código de Procedimiento Civil, art. 443", is_peremptory: true, status: "pending",
  acknowledged_at: null, acknowledged_by: null, overdue: false, catalog_validated: true };
const REVISION = { queue_item_id: "q1", case_id: "c2", document_id: "doc1", priority: "high", status: "pending",
  sla_deadline: `${dia(2)}T18:00:00Z`, sla_breached: false, assigned_to: null, created_at: "2026-11-22T10:00:00Z" };
const AUDIENCIA = { id: "h1", tenant_id: T, case_id: "c1", external_ref: null, title: "Audiencia de conciliación", description: null,
  hearing_type: "conciliacion", status: "scheduled", hearing_date: `${dia(4)}T14:00:00Z`, duration_minutes: 60, location: "Cámara Civil",
  courtroom: "Sala 3", judge_name: null, jurisdiction: "do", timezone: "America/Santo_Domingo" };

async function sesion(page: Page) {
  await page.route("**/*", (route) => {
    const u = new URL(route.request().url());
    const p = u.pathname;
    const json = (body: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (!u.href.startsWith(B) && !p.startsWith("/api/")) return route.continue();
    if (p.endsWith("/auth/refresh")) return json({ access_token: "a.b.c", refresh_token: "r", expires_in: 3600 });
    if (p.endsWith("/auth/me")) {
      const tenant = { id: T, slug: "qa-legal-audit1", display_name: "QA Legal Audit", subscribed_cores: ["legal"] };
      return json({ user: { id: "u1", email: "qa@nadakki.test", name: "QA", is_active: true, mfa_enabled: false }, current_tenant: tenant,
        all_tenants: [tenant], active_roles: [{ core_name: "legal", role_key: "tenant_attorney", display_name: "Abogado" }] });
    }
    if (p.includes("branding")) return json({ display_name: "QA Legal Audit", locale: "es-DO", currency: "DOP", timezone: "America/Santo_Domingo" });
    if (p.endsWith("/modules")) return json({ tenant_id: T, plan: "pro", modules: ["legal"] });
    const m = p.match(/^\/api\/legal\/cases\/([^/]+)$/);
    if (m) {
      const c = CASOS.find((x) => x.case_id === m[1]) ?? CASOS[0];
      const dl = c.case_id === "c1" ? [{ deadline_id: "d1", deadline_db_id: "d1", deadline_category: "Recurso de apelación", trigger_event: "", trigger_date: dia(-7),
        auto_calculated_deadline_date: dia(1), has_human_override: false, effective_deadline_date: dia(1), status: "active",
        legal_basis: PLAZO.legal_basis, is_peremptory: true, is_extendable: false }] : [];
      return json({ ...c, deadlines: dl });
    }
    if (p === "/api/legal/cases") return json({ total: CASOS.length, offset: 0, limit: 50, cases: CASOS });
    if (p.startsWith("/api/legal/deadlines/upcoming")) return json({ deadlines: [PLAZO], count: 1, horizon_days: 7, include_overdue: true, as_of_date_rd: dia(0) });
    if (p === "/api/legal/validation-queue/summary") return json({ total: 1, pending: 1, assigned: 0, sla_breached: 0, assigned_to_me: 0, attorney_profile: true });
    if (p === "/api/legal/validation-queue") return json({ items: [REVISION], total: 1, has_more: false });
    if (p.includes("/hearings/kpis")) return json({ upcoming_7d: 1, overdue: 0, completed_30d: 0, cancelled_30d: 0, by_status: {}, by_type: {}, next_hearing: AUDIENCIA, demo_data: false });
    if (p.includes("/hearings")) return json({ hearings: [AUDIENCIA], total: 1 });
    if (p === "/api/legal/tasks") return json({ tasks: [] });
    if (p === "/api/legal/audit-trail") return json({ tenant_id: T, entries: [] });
    return json({});
  });
  await page.addInitScript(() => {
    localStorage.setItem("nadakki_refresh_token_v2", "r");
    localStorage.setItem("nadakki_tenant_id", "b95c2363-b74d-4364-bc88-c8d6f5799932");
    sessionStorage.setItem("nadakki:legal:aviso-ley91-visto", "1");
  });
}

test.describe("Mi despacho escritorio 1440x900", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("una sola navegación y bandeja con plazo, audiencia y revisión, cada uno con su acción", async ({ page }) => {
    await sesion(page);
    await page.goto("/legal");
    const bandeja = page.locator("#atencion-prioritaria");
    await expect(bandeja.getByRole("button", { name: "Todo (3)" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("pestanas-grupo")).toHaveCount(0);
    await expect(page.getByTestId("menu-modulo").getByText("Espacio jurídico")).toBeVisible();
    await expect(bandeja.getByRole("link", { name: /^Abrir plazos/ })).toHaveAttribute("href", "/legal/cases/c1/deadlines");
    await expect(bandeja.getByRole("link", { name: /^Revisar documento/ })).toHaveAttribute("href", "/legal/cases/c2/documents");
    await expect(bandeja.getByRole("link", { name: /^Abrir expediente/ })).toHaveAttribute("href", "/legal/cases/c1");
    // controles compactos: las filas no se estiran a 44 px con ratón
    const alto = await bandeja.getByRole("link", { name: /^Abrir plazos/ }).evaluate((e) => e.getBoundingClientRect().height);
    expect(alto).toBeLessThan(40);
    await page.screenshot({ path: "test-results/legal-mi-despacho-escritorio.png", fullPage: true });
  });

  test("Continuar → plazos del expediente: acto, perentorio, días y próxima acción con aviso honesto", async ({ page }) => {
    await sesion(page);
    await page.goto("/legal");
    const fila = page.getByRole("row", { name: /QA AUDITORIA cobro de pesos/ });
    await expect(fila).toBeVisible({ timeout: 30_000 });
    await fila.getByRole("link", { name: /Continuar/ }).click();
    await expect(page).toHaveURL(/\/legal\/cases\/c1\/deadlines$/, { timeout: 30_000 });
    await expect(page.getByText("Recurso de apelación").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Perentorio").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/día restante|días restantes|vence hoy/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Preparar escrito con IA" })).toHaveAccessibleDescription(/no recibe este expediente/);
    await expect(page.getByRole("navigation", { name: "Secciones del expediente" }).locator('[aria-current="page"]')).toHaveText("Plazos");
    await page.screenshot({ path: "test-results/legal-continuar-plazos.png" });
  });

  test("teclado: los filtros de la bandeja se activan con Enter y muestran foco", async ({ page }) => {
    await sesion(page);
    await page.goto("/legal");
    const audiencias = page.getByRole("button", { name: "Audiencias (1)" });
    await expect(audiencias).toBeVisible({ timeout: 30_000 });
    await audiencias.focus();
    const anillo = await audiencias.evaluate((e) => getComputedStyle(e).boxShadow);
    expect(anillo).not.toBe("none");
    await page.keyboard.press("Enter");
    await expect(audiencias).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#atencion-prioritaria li")).toHaveCount(1);
  });

  test("accesibilidad (axe): sin infracciones graves ni críticas en Mi despacho", async ({ page }) => {
    await sesion(page);
    await page.goto("/legal");
    await expect(page.getByRole("button", { name: "Todo (3)" })).toBeVisible({ timeout: 30_000 });
    const r = await new AxeBuilder({ page }).include("#main-content").withTags(["wcag2a", "wcag2aa"]).analyze();
    const graves = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(graves.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});

test.describe("Mi despacho móvil 390x844", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("tarjetas con plazo y Continuar dentro de la pantalla; sin scroll horizontal; 44 px táctiles", async ({ page }) => {
    await sesion(page);
    await page.goto("/legal");
    const tarjetas = page.getByRole("list", { name: "Mis expedientes recientes" });
    await expect(tarjetas).toBeVisible({ timeout: 30_000 });
    const continuar = tarjetas.getByRole("link", { name: /Continuar con QA AUDITORIA/ });
    const caja = (await continuar.boundingBox())!;
    expect(caja.x + caja.width).toBeLessThanOrEqual(390);
    expect(caja.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.screenshot({ path: "test-results/legal-mi-despacho-movil.png", fullPage: true });
  });
});
