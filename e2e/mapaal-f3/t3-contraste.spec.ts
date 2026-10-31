/**
 * MF3-T3 — Contabilidad: Plan de cuentas, Libro mayor, Asientos y Balance legibles.
 *
 * Mide el contraste REAL (color calculado del texto contra el primer fondo opaco de sus ancestros) de todo texto
 * visible en las 4 pantallas, en tema claro y oscuro, y exige >= 4.5:1. Solo lectura, tenant QA.
 *
 *   npx playwright test e2e/mapaal-f3/t3-contraste.spec.ts --reporter=line
 */
import { expect, test, type Page } from "@playwright/test";

import { iniciarSesionQA } from "../mapaal/sesion-qa";

const BASE_URL = (process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "").replace(/\/$/, "");
const QA_USER = process.env.QA_USER ?? "";
const QA_PASSWORD = process.env.QA_PASSWORD ?? "";

test.use({ baseURL: BASE_URL || undefined });

const PANTALLAS = [
  { nombre: "Plan de cuentas", ruta: "/contable/plan-cuentas", titulo: "Plan de cuentas", listo: null },
  { nombre: "Libro mayor", ruta: "/contable/libro-mayor", titulo: "Libro mayor", listo: null },
  // "Crear asiento" tambien es el h1 del estado "Cargando catalogo"; la descripcion final lo distingue.
  { nombre: "Asientos", ruta: "/contable/asientos/nuevo", titulo: "Crear asiento", listo: "Doble partida" },
  { nombre: "Balance", ruta: "/contable/balance", titulo: "Balance de comprobación", listo: null }, // redirige a balance-comprobacion
] as const;

type Malo = { contraste: number; color: string; fondo: string; etiqueta: string; texto: string };

async function peoresContrastes(page: Page): Promise<{ revisados: number; controles: number; malos: Malo[] }> {
  return page.evaluate(() => {
    const parse = (s: string) => {
      const m = s.match(/[\d.]+/g)!.map(Number);
      return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 };
    };
    const lum = (c: { r: number; g: number; b: number }) => {
      const f = (x: number) => {
        const v = x / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    };
    const fondoDe = (el: Element) => {
      // Capas translucidas se componen sobre el fondo opaco que tengan debajo.
      const capas: Array<{ r: number; g: number; b: number; a: number }> = [];
      for (let e: Element | null = el; e; e = e.parentElement) {
        const c = parse(getComputedStyle(e).backgroundColor);
        if (c.a > 0) capas.push(c);
        if (c.a >= 1) break;
      }
      let base = capas.length && capas[capas.length - 1].a >= 1 ? capas.pop()! : { r: 255, g: 255, b: 255, a: 1 };
      while (capas.length) {
        const c = capas.pop()!;
        base = {
          r: c.r * c.a + base.r * (1 - c.a),
          g: c.g * c.a + base.g * (1 - c.a),
          b: c.b * c.a + base.b * (1 - c.a),
          a: 1,
        };
      }
      return base;
    };
    const malos: Malo[] = [];
    let revisados = 0;
    let controles = 0;
    const visto = new Set<string>();
    const medir = (el: Element, fgStr: string, texto: string, etiqueta: string) => {
      const fg = parse(fgStr);
      const bg = fondoDe(el);
      const fgOpaco = {
        r: fg.r * fg.a + bg.r * (1 - fg.a),
        g: fg.g * fg.a + bg.g * (1 - fg.a),
        b: fg.b * fg.a + bg.b * (1 - fg.a),
      };
      const [a, b] = [lum(fgOpaco), lum(bg)].sort((x, y) => y - x);
      const ratio = (a + 0.05) / (b + 0.05);
      revisados++;
      const clave = `${etiqueta}|${fgStr}|${bg.r}|${bg.g}|${bg.b}|${texto.slice(0, 20)}`;
      if (ratio < 4.5 && !visto.has(clave)) {
        visto.add(clave);
        malos.push({ contraste: Math.round(ratio * 100) / 100, color: fgStr, fondo: `rgb(${bg.r | 0},${bg.g | 0},${bg.b | 0})`, etiqueta, texto: texto.slice(0, 40) });
      }
    };
    // Campos: el texto que el usuario ve dentro (valor, opcion elegida, placeholder) no son nodos de texto hijos.
    for (const el of Array.from(document.body.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), textarea, select"))) {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (cs.display === "none" || cs.visibility === "hidden" || r.width === 0 || r.height === 0) continue;
      if ((el as HTMLInputElement).disabled) continue;
      const tag = el.tagName.toLowerCase();
      const valor =
        tag === "select"
          ? ((el as HTMLSelectElement).selectedOptions[0]?.text ?? "")
          : (el as HTMLInputElement | HTMLTextAreaElement).value;
      if (valor.trim()) {
        controles++;
        medir(el, cs.color, valor, tag);
      } else if ((el as HTMLInputElement).placeholder) {
        controles++;
        medir(el, getComputedStyle(el, "::placeholder").color, (el as HTMLInputElement).placeholder, `${tag}::placeholder`);
      }
    }
    for (const el of Array.from(document.body.querySelectorAll("*"))) {
      const propio = Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent ?? "")
        .join(" ")
        .trim();
      if (!propio) continue;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (cs.display === "none" || cs.visibility === "hidden" || r.width === 0 || r.height === 0) continue;
      if (el.closest("[disabled], option, script, style, noscript, nextjs-portal")) continue;
      medir(el, cs.color, propio, el.tagName.toLowerCase());
    }
    return { revisados, controles, malos };
  });
}

test.describe("MF3-T3 contable legible", () => {
  test.beforeAll(() => {
    expect(BASE_URL, "falta BASE_URL").not.toBe("");
    expect(QA_USER, "falta QA_USER").not.toBe("");
    expect(QA_PASSWORD, "falta QA_PASSWORD").not.toBe("");
  });

  test("Plan de cuentas, Libro mayor, Asientos y Balance >= 4.5:1 en claro y oscuro", async ({ browser }) => {
    test.setTimeout(300_000);
    const page = await iniciarSesionQA(browser, { baseUrl: BASE_URL, usuario: QA_USER, clave: QA_PASSWORD });

    for (const tema of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: tema });
      let camposTema = 0;
      for (const p of PANTALLAS) {
        await test.step(`${p.nombre} (${tema})`, async () => {
          await page.goto(p.ruta);
          await page.addStyleTag({ content: "*{transition:none!important;animation:none!important}" });
          await page.evaluate((t) => {
            document.documentElement.classList.toggle("dark", t === "dark");
            document.documentElement.setAttribute("data-theme", t);
          }, tema);
          await expect(page.getByRole("heading", { level: 1, name: p.titulo })).toBeVisible({ timeout: 45_000 });
          if (p.listo) await expect(page.getByText(p.listo).first()).toBeVisible({ timeout: 45_000 });
          await page.waitForLoadState("networkidle").catch(() => {});
          const { revisados, controles, malos } = await peoresContrastes(page);
          expect(revisados, `${p.nombre}: no se reviso ningun texto`).toBeGreaterThan(5);
          camposTema += controles;
          expect(malos, `${p.nombre} (${tema}) tiene texto con contraste < 4.5:1`).toEqual([]);
        });
      }
      expect(camposTema, `(${tema}) ningun campo revisado en las 4 pantallas`).toBeGreaterThan(0);
    }
    console.log("RESULT_MF3_T3=PASS");
  });
});
