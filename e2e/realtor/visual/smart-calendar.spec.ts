import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sesion } from "../sesion";

/**
 * O2-P-SMART-CALENDAR sobre el armazón de RE-SHELL: /realtor/smart-calendar (DEMO) frente a la referencia DL10A con el umbral
 * de UMBRAL.md, más el caso sin DEMO (servidor 3101), el acceso denegado y el tenant ajeno.
 */

const THRESHOLD = 0.12;
const NODEMO = "http://127.0.0.1:3101";
const REF = join(__dirname, "../../../docs/design/realtor/DL10A/ref/smart-calendar.png");


test("positivo con DEMO: marca, semana, eventos y filtro por tipo", async ({ page }) => {
  await sesion(page, 200);
  await page.goto("/realtor/smart-calendar");
  await expect(page.getByTestId("smart-calendar-panel")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("demo-banner")).toContainText("DEMO · datos sintéticos");
  await expect(page.getByTestId("demo-pill")).toBeVisible();
  await expect(page.getByTestId("day-col")).toHaveCount(7);
  await expect(page.getByTestId("cal-event")).toHaveCount(6);
  await expect(page.getByTestId("count-visita")).toHaveText("Visita · 4");
  await expect(page.getByTestId("smart-calendar")).toHaveAttribute("href", "/realtor/smart-calendar");
  await page.getByLabel("Tipo").selectOption("cita");
  await expect(page.getByTestId("cal-event")).toHaveCount(2);
});

test("negativo sin DEMO: «Sin datos todavía», ninguna cifra ni marca DEMO", async ({ page }) => {
  await sesion(page, 200);
  await page.goto(`${NODEMO}/realtor/smart-calendar`);
  await expect(page.getByTestId("smart-calendar-empty")).toContainText("Sin datos todavía", { timeout: 30_000 });
  await expect(page.getByTestId("cal-event")).toHaveCount(0);
  await expect(page.getByTestId("kind-counts")).toHaveCount(0);
  await expect(page.getByTestId("demo-banner")).toHaveCount(0);
  await expect(page.getByTestId("demo-pill")).toHaveCount(0);
  // Ninguna cifra fuera del rótulo de fechas de la semana (F2: «26 oct – 1 nov 2026» no es un dato del backend).
  const sinRango = await page.getByTestId("smart-calendar-panel").evaluate((el) => {
    const c = el.cloneNode(true) as HTMLElement;
    c.querySelector('[data-testid="week-range"]')?.remove();
    return c.innerText ?? c.textContent ?? "";
  });
  expect(sinRango).not.toMatch(/\d/);
  await expect(page.getByTestId("smart-calendar-empty")).toHaveCount(1);
  await expect(page.getByTestId("day-col")).toHaveCount(0);
});

// Cuerpo con la forma de C-RE-OLA3 (CalendarEvent): registros SYNTH del tenant QA, un evento cancelado que no debe verse.
function semanaReal() {
  const lunes = new Date();
  lunes.setUTCDate(lunes.getUTCDate() - ((lunes.getUTCDay() + 6) % 7) + 2);
  const dia = lunes.toISOString().slice(0, 10);
  const base = { tenant_id: "00000000-0000-4000-8000-0000000000a1", timezone: "UTC", all_day: false, organizer_user_id: "00000000-0000-4000-8000-000000009001",
    created_at: "2000-01-01T00:00:00Z", updated_at: "2000-01-01T00:00:00Z" };
  const ev = (n: number, kind: string, hh: string, status = "scheduled") =>
    ({ ...base, id: `00000000-0000-4000-8000-00000000300${n}`, kind, status, title: `SYNTH Evento ${n}`, starts_at: `${dia}T${hh}:00Z`, ends_at: `${dia}T${hh.slice(0, 2)}:59:00Z` });
  return { items: [ev(1, "showing", "10:00"), ev(2, "signing", "12:00"), ev(3, "open_house", "15:00"), ev(4, "meeting", "16:00", "cancelled")], next_cursor: null };
}

test("datos reales (sin DEMO): eventos del contrato, cancelados fuera y sin tenant del cliente", async ({ page }) => {
  const pedidos: string[] = [];
  page.on("request", (r) => { if (r.url().includes("/realestate/calendar/events")) pedidos.push(`${r.url()} ${JSON.stringify(r.headers())}`); });
  await sesion(page, 200);
  await page.route(/\/api\/v1\/realestate\/calendar\/events/, (route) => route.fulfill({ json: semanaReal() }));
  await page.goto(`${NODEMO}/realtor/smart-calendar`);
  await expect(page.getByTestId("cal-event")).toHaveCount(3, { timeout: 30_000 });
  await expect(page.getByTestId("count-visita")).toHaveText("Visita · 2");
  await expect(page.getByTestId("count-cita")).toHaveText("Cita · 1");
  await expect(page.getByTestId("smart-calendar-panel")).toContainText("SYNTH Evento 1");
  await expect(page.getByTestId("smart-calendar-empty")).toHaveCount(0);
  await expect(page.getByTestId("demo-banner")).toHaveCount(0);
  await page.getByLabel("Tipo").selectOption("cita");
  await expect(page.getByTestId("cal-event")).toHaveCount(1);
  expect(pedidos.length).toBeGreaterThan(0);
  for (const p of pedidos) expect(p.toLowerCase()).not.toMatch(/x-tenant|tenant_id|tenant=/);
});

test("F2 sin DEMO: semana con fechas, hoy, menú «…» con teclado, panel lateral y navegación de semana", async ({ page }) => {
  const desde: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/realestate/calendar/events")) desde.push(new URL(r.url()).searchParams.get("from") ?? "");
  });
  await sesion(page, 200);
  await page.route(/\/api\/v1\/realestate\/calendar\/events/, (route) => route.fulfill({ json: semanaReal() }));
  await page.goto(`${NODEMO}/realtor/smart-calendar`);
  await expect(page.getByTestId("cal-event")).toHaveCount(3, { timeout: 30_000 });
  await expect(page.getByTestId("day-col")).toHaveCount(7);
  await expect(page.locator('[data-testid="day-col"][aria-current="date"]')).toHaveCount(1);
  await expect(page.getByTestId("now-line")).toHaveCount(1);
  await expect(page.getByTestId("week-range")).toContainText(/\d{4}/);
  const menu = page.getByTestId("visit-menu").first();
  await expect(menu).toHaveAttribute("aria-haspopup", "menu");
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(menu).toBeFocused();
  await page.getByTestId("visit-open").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("Título")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByTestId("visit-open")).toBeFocused();
  const antes = desde.length;
  await page.getByRole("button", { name: "Semana siguiente" }).click();
  await expect.poll(() => desde.length).toBeGreaterThan(antes);
  expect(new Set(desde.slice(antes)).size).toBe(1);
  expect(desde.slice(antes)[0]).not.toBe(desde[0]);
});

for (const ancho of [768, 390]) {
  test(`F2 responsive a ${ancho} px: la semana desplaza su contenedor, no el panel`, async ({ page }) => {
    await page.setViewportSize({ width: ancho, height: 900 });
    await sesion(page, 200);
    await page.goto("/realtor/smart-calendar");
    await expect(page.getByTestId("cal-event")).toHaveCount(6, { timeout: 30_000 });
    // La semana desplaza su propio contenedor (week-scroll); el panel no se desborda. La barra lateral de 288 px del
    // armazón (fuera de esta zona) sigue fija a 390 px: el ancho de la página no se mide aquí.
    const desborde = await page.getByTestId("smart-calendar-panel").evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(desborde).toBeLessThanOrEqual(1);
    const col = await page.getByTestId("day-col").first().evaluate((el) => el.getBoundingClientRect().width);
    if (ancho === 768) expect(col).toBeGreaterThanOrEqual(146);
    else {
      const dir = await page.getByTestId("week-grid").evaluate((el) => getComputedStyle(el).flexDirection);
      expect(dir).toBe("column");
    }
  });
}

test("sin DEMO con 503 o lista vacía: sigue «Sin datos todavía»", async ({ page }) => {
  await sesion(page, 200);
  await page.route(/\/api\/v1\/realestate\/calendar\/events/, (route) => route.fulfill({ status: 503, json: { detail: "down" } }));
  await page.goto(`${NODEMO}/realtor/smart-calendar`);
  await expect(page.getByTestId("smart-calendar-empty")).toContainText("Sin datos todavía", { timeout: 30_000 });
  await expect(page.getByTestId("cal-event")).toHaveCount(0);
  await page.route(/\/api\/v1\/realestate\/calendar\/events/, (route) => route.fulfill({ json: { items: [], next_cursor: null } }));
  await page.reload();
  await expect(page.getByTestId("smart-calendar-empty")).toContainText("Sin datos todavía");
  await expect(page.getByTestId("cal-event")).toHaveCount(0);
});

test("acceso denegado (403): nada de la pantalla ni del armazón", async ({ page }) => {
  await sesion(page, 403);
  await page.goto("/realtor/smart-calendar");
  await expect(page.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "sin-acceso", { timeout: 30_000 });
  await expect(page.getByTestId("smart-calendar-panel")).toHaveCount(0);
  await expect(page.getByTestId("realtor-shell")).toHaveCount(0);
  await expect(page.getByText(/SYNTH/)).toHaveCount(0);
});

test("tenant ajeno: ninguna petición del cliente lleva tenant", async ({ page }) => {
  const peticiones: string[] = [];
  page.on("request", (r) => { if (r.url().includes("/realestate/")) peticiones.push(`${r.url()} ${JSON.stringify(r.headers())}`); });
  await sesion(page, 200);
  await page.goto("/realtor/smart-calendar");
  await expect(page.getByTestId("smart-calendar-panel")).toBeVisible({ timeout: 30_000 });
  expect(peticiones.length).toBeGreaterThan(0);
  // Traslado ROP-UX-HORA-TENANT: GET /alta/tenant/profile es ruta del backend (el tenant sale del token); se quita
  // solo esa ruta exacta antes de buscar «tenant». Cabeceras y cualquier otra URL siguen igual de vigiladas.
  for (const p of peticiones) expect(p.toLowerCase().replace("/api/v1/realestate/alta/tenant/profile ", " ")).not.toMatch(/tenant/);
});

test("captura a 1440×900 de /realtor/smart-calendar (DEMO) frente a la referencia DL10A", async ({ page }, info) => {
  await sesion(page, 200);
  await page.goto("/realtor/smart-calendar");
  await expect(page.getByTestId("shell-sidebar")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("cal-event")).toHaveCount(6);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const shot = await page.screenshot();
  await info.attach("smart-calendar", { body: shot, contentType: "image/png" });

  // Misma reducción que shell.spec.ts: canvas 144×90, escala de grises, diferencia media absoluta (0–1).
  const diff = await page.evaluate(async ({ a, b }) => {
    const gray = async (b64: string) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = 144; c.height = 90;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, 144, 90);
      const d = ctx.getImageData(0, 0, 144, 90).data;
      const out: number[] = [];
      for (let i = 0; i < d.length; i += 4) out.push(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
      return out;
    };
    const [x, y] = [await gray(a), await gray(b)];
    return x.reduce((s, v, i) => s + Math.abs(v - y[i]), 0) / x.length / 255;
  }, { a: shot.toString("base64"), b: readFileSync(REF).toString("base64") });
  console.log(`DIFF_MEDIA=${(diff * 100).toFixed(2)}%`);
  expect(diff).toBeLessThanOrEqual(THRESHOLD);
});
