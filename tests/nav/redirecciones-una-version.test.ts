/**
 * @jest-environment node
 *
 * UNA-VERSION (César, «una sola interfaz», PR 1): una versión por pantalla.
 * Carga next.config.js y recorre TODAS sus redirects con el mismo emparejador
 * que usa Next (path-match):
 *   - ninguna cadena de redirecciones vuelve a una ruta ya visitada (sin ciclos);
 *   - cada destino final es una página que existe en app/;
 *   - cada pantalla del panel anterior del banco acaba en su pantalla de bank-v2;
 *   - las copias antiguas, la consola de autos, las v2 del Dealer OS y las páginas
 *     vacías van a la pantalla vigente, con 307 (temporales, para poder volver).
 */
import fs from "fs";
import path from "path";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import { RUTA_V2_POR_RUTA_BANCO } from "@/lib/credit-hub/bank/panel-v2-por-defecto";

type Redirect = {
  source: string;
  destination: string;
  permanent?: boolean;
  statusCode?: number;
  has?: unknown[];
  missing?: unknown[];
};

const ROOT = process.cwd();
const APP = path.join(ROOT, "app");

let redirects: Redirect[] = [];

beforeAll(async () => {
  // next.config.js exige un backend declarado para la CSP (CI usa este mismo valor).
  process.env.NEXT_PUBLIC_BACKEND_URL ||= "http://backend.invalid";
  const config = require(path.join(ROOT, "next.config.js"));
  redirects = await config.redirects();
});

// ── Emparejar y aplicar como Next ────────────────────────────────────────────────────────────────

const matchers = new Map<string, ReturnType<typeof getPathMatch>>();
function emparejar(source: string, ruta: string): Record<string, string | string[]> | false {
  let m = matchers.get(source);
  if (!m) {
    m = getPathMatch(source, { removeUnnamedParams: true, strict: true });
    matchers.set(source, m);
  }
  return m(ruta) as Record<string, string | string[]> | false;
}

function aplicar(destination: string, params: Record<string, string | string[]>): string {
  return destination.replace(/:([A-Za-z0-9_]+)\*?/g, (_, nombre: string) => {
    const v = params[nombre];
    return Array.isArray(v) ? v.join("/") : (v ?? "");
  });
}

/** Solo las redirects sin condición de host/cabecera: las que aplican a cualquier petición. */
const incondicionales = () => redirects.filter((r) => !r.has && !r.missing);

/** Sigue la cadena de redirecciones. Falla si vuelve a una ruta ya visitada. */
function seguir(ruta: string): { final: string; saltos: string[] } {
  const visitadas = [ruta];
  let actual = ruta;
  for (;;) {
    const r = incondicionales().find((x) => emparejar(x.source, actual));
    if (!r) return { final: actual, saltos: visitadas };
    const siguiente = aplicar(r.destination, emparejar(r.source, actual) as Record<string, string>);
    if (visitadas.includes(siguiente)) {
      throw new Error(`ciclo de redirecciones: ${[...visitadas, siguiente].join(" -> ")}`);
    }
    visitadas.push(siguiente);
    actual = siguiente;
  }
}

/** Una ruta concreta que empareja con el source (parámetros con un valor de ejemplo). */
function ejemplo(source: string): string {
  return source
    .replace(/:([A-Za-z0-9_]+)\*/g, "a/b")
    .replace(/:([A-Za-z0-9_]+)(\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\))?/g, "x123");
}

// ── Páginas que existen en app/ ──────────────────────────────────────────────────────────────────

function paginas(dir: string, segs: string[] = []): string[][] {
  const out: string[][] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (e.name === "api" && segs.length === 0) continue;
      out.push(...paginas(path.join(dir, e.name), [...segs, e.name]));
    } else if (/^page\.(t|j)sx?$/.test(e.name)) {
      out.push(segs.filter((s) => !/^\(.+\)$/.test(s)));
    }
  }
  return out;
}
const PAGINAS = paginas(APP);

function existePagina(ruta: string): boolean {
  const partes = ruta.split(/[?#]/)[0]!.split("/").filter(Boolean);
  return PAGINAS.some((p) => {
    for (let i = 0; i < p.length; i++) {
      const seg = p[i]!;
      if (/^\[\[?\.\.\..+\]\]?$/.test(seg)) return partes.length > i || seg.startsWith("[[");
      if (i >= partes.length) return false;
      if (!/^\[.+\]$/.test(seg) && seg !== partes[i]) return false;
    }
    return p.length === partes.length;
  });
}

// ── Pruebas ──────────────────────────────────────────────────────────────────────────────────────

describe("next.config.js: ninguna redirección en bucle", () => {
  it("carga las redirects", () => {
    expect(redirects.length).toBeGreaterThan(20);
  });

  it("desde el source de cada redirect, la cadena termina sin volver atrás", () => {
    for (const r of incondicionales()) {
      expect(() => seguir(ejemplo(r.source))).not.toThrow();
    }
  });

  it("ningún destino es a su vez origen de una redirect que lleve de vuelta", () => {
    for (const r of incondicionales()) {
      const desde = ejemplo(r.source);
      const { saltos } = seguir(desde);
      expect([r.source, saltos.slice(1).includes(desde)]).toEqual([r.source, false]);
    }
  });

  it("cada redirect de UNA-VERSION acaba en una página que existe en app/", () => {
    for (const r of incondicionales()) {
      const { final } = seguir(ejemplo(r.source));
      // Las redirects anteriores con :path* (p. ej. /legal-agents/:path*) se miden en la raíz.
      if (r.source.includes(":path*")) continue;
      expect([r.source, final, existePagina(final)]).toEqual([r.source, final, true]);
    }
  });
});

describe("bank-v2 es el banco", () => {
  const V1 = path.join(APP, "(forge)", "credit-hub", "bank");

  it("cada página del panel anterior (app/(forge)/credit-hub/bank/**) acaba en una página de bank-v2", () => {
    const v1 = paginas(V1, ["credit-hub", "bank"]).map((segs) =>
      "/" + segs.map((s) => (/^\[.+\]$/.test(s) ? "x123" : s)).join("/"),
    );
    expect(v1.length).toBe(8);
    for (const ruta of v1) {
      const { final, saltos } = seguir(ruta);
      expect([ruta, final.startsWith("/credit-hub/bank-v2"), existePagina(final)]).toEqual([ruta, true, true]);
      expect([ruta, saltos.length]).toEqual([ruta, 2]);
    }
  });

  it("el detalle de una solicitud conserva su id", () => {
    expect(seguir("/credit-hub/bank/applications/APP-42").final).toBe("/credit-hub/bank-v2/solicitudes/APP-42");
  });

  it.each(Object.entries(RUTA_V2_POR_RUTA_BANCO))("%s -> %s (mismo mapa que la app)", (viejo, nuevo) => {
    expect(seguir(viejo).final).toBe(nuevo);
  });

  it.each([
    ["/credit/dashboard", "/credit-hub/bank-v2/kpis"],
    ["/credit/bank/kpis", "/credit-hub/bank-v2/kpis"],
    ["/credit/bank/queue", "/credit-hub/bank-v2/solicitudes"],
    ["/credit/pool-filters", "/credit-hub/bank-v2/filtros"],
    ["/credit/APP-7", "/credit-hub/bank-v2/solicitudes/APP-7"],
    ["/credit/bank/APP-7", "/credit-hub/bank-v2/solicitudes/APP-7"],
    ["/credit/bank", "/credit-hub/bank-v2"],
    ["/credit-hub/bank/queue", "/credit-hub/bank-v2/solicitudes"],
    ["/bank/applications/APP-7", "/credit-hub/bank-v2/solicitudes/APP-7"],
    ["/bank/applications/APP-7/stipulations", "/credit-hub/bank-v2/solicitudes/APP-7"],
    ["/workflow-real", "/credit-hub/bank-v2/solicitudes"],
    ["/bank/analytics", "/credit-hub/bank-v2/analitica"],
  ])("copia antigua %s -> %s", (viejo, nuevo) => {
    expect(seguir(viejo).final).toBe(nuevo);
  });

  it("/credit/:id no se traga las otras pantallas de /credit", () => {
    // El crédito del concesionario vive ahora en Dealer OS (PR credito-dealer).
    expect(seguir("/credit/new").final).toBe("/autos/dealer/credito/solicitudes/nueva");
    expect(seguir("/credit").final).toBe("/credit-hub");
    expect(seguir("/credit/dealer").final).toBe("/autos/dealer/credito");
    expect(seguir("/credit/applications/new").final).toBe("/credit/applications/new");
    expect(seguir("/credit/status/APP-7").final).toBe("/autos/dealer/credito/solicitudes/APP-7");
  });

  it("bank-v2 no redirige a ningún sitio", () => {
    for (const ruta of Object.values(RUTA_V2_POR_RUTA_BANCO)) expect(seguir(ruta).saltos).toEqual([ruta]);
  });
});

describe("Dealer OS, consola antigua y páginas vacías", () => {
  it.each([
    ["/autos/dealer/inicio-v2", "/autos/dealer"],
    ["/autos/dealer/reportes-v2", "/autos/dealer/insights"],
    ["/autos/console", "/autos/dealer"],
    ["/autos/finance", "/autos/dealer/finanzas"],
    ["/autos/inventory", "/autos/dealer/inventario"],
    ["/autos/leads", "/autos/dealer/leads"],
    ["/credit-agents", "/"],
    ["/institutions", "/"],
  ])("%s -> %s", (viejo, nuevo) => {
    expect(seguir(viejo).final).toBe(nuevo);
    expect(existePagina(nuevo)).toBe(true);
  });

  it("/credit-hub/dealer/** ya lleva a Dealer OS (PR credito-dealer)", () => {
    expect(seguir("/credit-hub/dealer").saltos).toEqual(["/credit-hub/dealer", "/autos/dealer/credito"]);
    expect(seguir("/credit-hub/dealer/applications").final).toBe("/autos/dealer/credito/solicitudes");
  });
});

describe("todas las redirecciones nuevas son temporales (307)", () => {
  it.each([
    "/credit-hub/bank", "/credit-hub/bank/applications/:applicationId", "/credit/dashboard", "/credit/bank/kpis",
    "/credit/pool-filters", "/bank/applications/:id", "/workflow-real", "/bank/analytics", "/autos/console",
    "/autos/dealer/inicio-v2", "/autos/dealer/reportes-v2", "/credit-agents", "/institutions",
  ])("%s", (source) => {
    const r = redirects.find((x) => x.source === source);
    expect(r).toBeDefined();
    expect(r!.permanent).toBe(false);
  });
});
