import { test, expect, type Page, type Request } from "@playwright/test";
import { sesion as sesionBase } from "../sesion";

/**
 * O3-D-BROKER: /realtor/broker con respuestas simuladas según C-RE-ALTA (G2-BROKER-DESK). Solo lectura.
 * Corre con la config común de e2e/realtor: 3100 = build con DEMO; 3101 = build sin DEMO. El filtro por rol es del
 * cliente, no una barrera del servidor.
 */
const NODEMO = "http://127.0.0.1:3101";
const BROKER = "broker_supervisor";

const DESK = { id: "d1", tenant_id: "t1", brokerage_id: "b1", created_at: "2026-01-05T12:00:00Z" };
const SUMMARY = {
  desk_id: "d1", brokerage_id: "b1", brokerage_status: "active",
  pending_by_kind: { agent_activation: 3, brand_publication: 1 },
  agents_by_status: { draft: 0, pending_approval: 3, active: 5, suspended: 1, offboarded: 0 },
  supervised_agent_counts: [{ supervisor_agent_id: "a1", active_supervised: 4 }, { supervisor_agent_id: "a2", active_supervised: 2 }],
  generated_at: "2026-10-14T15:00:00Z",
};
const item = (id: string, over: Record<string, unknown> = {}) => ({
  id, tenant_id: "t1", desk_id: "d1", kind: "agent_activation", subject_id: `s-${id}`, subject_label: `Solicitud ${id}`,
  requested_by: "u9", status: "pending", decided_by: null, decision_reason: null, decided_at: null, created_at: "2026-10-12T14:00:00Z", ...over,
});

type Opts = { acceso?: number; roles?: string[]; desk?: number; items?: unknown[]; next?: string | null };

async function sesion(page: Page, o: Opts = {}) {
  const peticiones: Request[] = [];
  page.on("request", (r) => { if (r.url().includes("/broker-desk")) peticiones.push(r); });
  await sesionBase(page, o.acceso ?? 200, { roles: o.roles ?? [BROKER] });
  const desk = o.desk ?? 200;
  const lista = o.items ?? [];
  await page.route(/\/api\/v1\/realestate\/broker-desk/, (route) => {
    const u = new URL(route.request().url());
    const p = u.pathname.replace(/^.*\/broker-desk/, "");
    if (desk !== 200) return route.fulfill({ status: desk, json: { detail: "no" } });
    if (p === "" || p === "/") return route.fulfill({ json: DESK });
    if (p === "/summary") return route.fulfill({ json: SUMMARY });
    if (p === "/items") {
      const st = u.searchParams.get("status");
      const rows = lista.filter((i) => !st || (i as { status: string }).status === st);
      if (u.searchParams.get("cursor") === "c2") return route.fulfill({ json: { items: [item("9")], next_cursor: null } });
      return route.fulfill({ json: { items: rows, next_cursor: o.next ?? null } });
    }
    const id = decodeURIComponent(p.replace("/items/", ""));
    const f = lista.find((i) => (i as { id: string }).id === id);
    return route.fulfill(f ? { json: f } : { status: 404, json: { detail: "no" } });
  });
  return peticiones;
}

test("con rol y datos: mesa, resumen, lista, filtro, paginación y detalle; solo GET y sin tenant", async ({ page }) => {
  const reqs = await sesion(page, { items: [item("1"), item("2", { status: "rejected", decision_reason: "Falta documentación", decided_at: "2026-10-13T10:00:00Z", subject_label: null })], next: "c2" });
  await page.goto("/realtor/broker");
  await expect(page.getByTestId("broker-panel")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("broker-desk")).toBeVisible();
  await expect(page.getByTestId("brokerage-status")).toHaveText("Activa");
  await expect(page.getByTestId("pending-agent_activation")).toContainText("3");
  await expect(page.getByTestId("agents-active")).toContainText("5");
  await expect(page.getByTestId("supervisors")).toContainText("2");
  await expect(page.getByTestId("supervisors")).toContainText("6");
  await expect(page.getByTestId("demo-banner")).toHaveCount(0);
  await expect(page.getByTestId("item-row")).toHaveCount(2);
  await expect(page.getByTestId("broker-readonly")).toBeVisible();
  await expect(page.getByRole("button", { name: /aprobar|rechazar|approve|reject/i })).toHaveCount(0);

  await page.getByTestId("items-more").click();
  await expect(page.getByTestId("item-row")).toHaveCount(3);
  await expect(page.getByTestId("items-more")).toHaveCount(0);

  await page.getByTestId("filter-status").selectOption("rejected");
  await expect(page.getByTestId("item-row")).toHaveCount(1);
  await page.getByTestId("item-row").click();
  await expect(page.getByTestId("item-detail")).toContainText("Falta documentación");
  await page.getByTestId("detail-close").click();
  await expect(page.getByTestId("item-detail")).toHaveCount(0);

  await page.getByTestId("lang-en").click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Broker desk");

  expect(reqs.length).toBeGreaterThan(3);
  for (const r of reqs) {
    expect(r.method()).toBe("GET");
    expect(r.url().toLowerCase()).not.toContain("tenant");
    expect(JSON.stringify(await r.allHeaders()).toLowerCase()).not.toContain("tenant");
    expect(r.postData()).toBeNull();
  }
});

test("404 de ruta con DEMO: rótulo DEMO y datos sintéticos", async ({ page }) => {
  await sesion(page, { desk: 404 });
  await page.goto("/realtor/broker");
  await expect(page.getByTestId("demo-banner")).toContainText("DEMO · datos sintéticos", { timeout: 30_000 });
  await expect(page.getByTestId("item-row")).toHaveCount(3);
});

test("404 de ruta sin DEMO: «Sin datos todavía», ninguna cifra ni marca DEMO", async ({ page }) => {
  await sesion(page, { desk: 404 });
  await page.goto(`${NODEMO}/realtor/broker`);
  await expect(page.getByTestId("broker-empty")).toContainText("Sin datos todavía", { timeout: 30_000 });
  await expect(page.getByTestId("item-row")).toHaveCount(0);
  await expect(page.getByTestId("broker-summary")).toHaveCount(0);
  await expect(page.getByTestId("demo-banner")).toHaveCount(0);
  expect(await page.getByTestId("broker-panel").innerText()).not.toMatch(/\d/);
});

test("mesa con lista vacía sin DEMO: «Sin datos todavía» en la lista", async ({ page }) => {
  await sesion(page, { items: [] });
  await page.goto(`${NODEMO}/realtor/broker`);
  await expect(page.getByTestId("items-empty")).toContainText("Sin datos todavía", { timeout: 30_000 });
  await expect(page.getByTestId("demo-banner")).toHaveCount(0);
});

test("sin el rol broker_supervisor: no se pinta la bandeja ni se pide nada", async ({ page }) => {
  const reqs = await sesion(page, { roles: ["agent"], items: [item("1")] });
  await page.goto("/realtor/broker");
  await expect(page.getByTestId("realtor-notice")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("broker-panel")).toHaveCount(0);
  await expect(page.getByTestId("item-row")).toHaveCount(0);
  expect(reqs).toHaveLength(0);
});

for (const acceso of [401, 403]) {
  test(`acceso ${acceso}: nada de la bandeja`, async ({ page }) => {
    const reqs = await sesion(page, { acceso, items: [item("1")] });
    await page.goto("/realtor/broker");
    await expect(page.getByTestId("realtor-notice")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("broker-panel")).toHaveCount(0);
    await expect(page.getByTestId("item-row")).toHaveCount(0);
    await expect(page.getByText(/Solicitud 1/)).toHaveCount(0);
    expect(reqs).toHaveLength(0);
  });
}
