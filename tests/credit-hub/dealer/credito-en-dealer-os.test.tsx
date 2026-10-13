/**
 * PR 2 de "una sola interfaz" (decisión de César): el crédito del concesionario vive DENTRO de
 * Dealer OS. Antes vivía en /credit-hub/dealer/**, bajo el GlobalForgeAppShell, cuyo
 * DealerSuiteGate devolvía a /autos/dealer a todo usuario con concesionario asignado: el
 * concesionario real no podía pedir crédito.
 *
 * Cada bloque intenta romper una promesa:
 *   (1) cada página vieja tiene su ruta nueva, que pinta la MISMA pantalla;
 *   (2) cada redirección de /credit-hub/dealer/** llega a una página que existe, sin ciclos y
 *       dentro del chrome del dealer (donde DealerSuiteGate no actúa);
 *   (3) el menú de Dealer OS muestra Crédito con el entitlement y lo oculta sin él;
 *   (4) los enlaces internos del asistente de nueva solicitud apuntan a /autos/dealer/credito;
 *   (5) las pantallas nuevas llevan los mismos guards de tenant y rol que las viejas.
 */
import fs from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import {
  DEALER_CREDIT_BASE,
  DEALER_CREDIT_LEGACY_REDIRECTS,
  DEALER_WIZARD_URL_SEGMENTS,
  dealerCreditWizardHref,
  isDealerWizardCompletePath,
} from "@/lib/credit-hub/dealer/dealerCreditRoutes";
import {
  DEALER_WIZARD_STEP_PATHS,
  dealerWizardStepHref,
  dealerWizardStepIndexFromPathname,
} from "@/components/forge/credit-hub/dealer/dealerWizardPaths";
import { DEALER_NAV_ROUTES, dealerDetailHref, dealerNewApplicationHref } from "@/lib/credit-hub/dealer/dealerFormat";
import { forgeDealerApplicationDetailHref } from "@/lib/credit-hub/dealerRoutes";
import { portalFromPathname } from "@/lib/credit-hub/hooks/usePortal";
import { isDealerChromePath } from "@/lib/autos-portal/routes";
import {
  DEALER_NAV_CAPABILITY_KEYS,
  isDealerNavItemActive,
  isDealerNavItemOpenable,
  visibleDealerNavGroups,
} from "@/components/dealer-management/shell/dealer-nav";

jest.mock("@/app/credit-hub/credit-hub.css", () => ({}));
// next.config.js envuelve la config con next-pwa, que no carga en jsdom; aquí solo importan las redirecciones.
jest.mock("@ducanh2912/next-pwa", () => ({ __esModule: true, default: () => (config: unknown) => config }));
jest.mock("@/components/credit-hub/system/CreditHubI18nBootstrap", () => ({ CreditHubI18nBootstrap: () => null }));
jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: jest.fn() }));
jest.mock("next/navigation", () => ({ usePathname: () => "/autos/dealer/credito/solicitudes" }));

import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { DealerCreditOsFrame } from "@/components/credit-hub/dealer/DealerCreditOsFrame";

const ROOT = path.resolve(__dirname, "../../..");
const OLD_DIR = path.join(ROOT, "app", "(forge)", "credit-hub", "dealer");
const NEW_DIR = path.join(ROOT, "app", "autos", "dealer", "credito");

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}

/** Archivos de ruta (page/layout) de /credit-hub/dealer/** como [url, archivo relativo]. */
function oldRouteFiles(kind: "page" | "layout"): Array<{ url: string; rel: string }> {
  return walk(OLD_DIR)
    .filter((f) => path.basename(f) === `${kind}.tsx`)
    .map((f) => {
      const rel = path.relative(OLD_DIR, path.dirname(f)).split(path.sep).filter(Boolean);
      return { url: ["/credit-hub/dealer", ...rel].join("/"), rel: rel.join("/") };
    })
    .filter(({ rel }) => !(kind === "layout" && rel === ""));
}

// ── Redirecciones de next.config.js, con el mismo emparejamiento que Next.js para estas formas ──

type Redirect = { source: string; destination: string; permanent: boolean; has?: unknown };

function loadRedirects(): Promise<Redirect[]> {
  process.env.NEXT_PUBLIC_BACKEND_URL ||= "http://backend.invalid";
  const config = require(path.join(ROOT, "next.config.js")) as { redirects: () => Promise<Redirect[]> };
  return config.redirects();
}

function sourceRegex(source: string): RegExp {
  const body = source
    .replace(/:([A-Za-z_]+)\(((?:[^()]|\([^()]*\))*)\)/g, "($2)")
    .replace(/:([A-Za-z_]+)\*/g, "(.*)")
    .replace(/:([A-Za-z_]+)/g, "([^/]+)");
  return new RegExp(`^${body}$`);
}

function apply(redirects: Redirect[], url: string): string | null {
  for (const r of redirects) {
    if (r.has) continue;
    const m = sourceRegex(r.source).exec(url);
    if (!m) continue;
    let i = 1;
    return r.destination.replace(/:([A-Za-z_]+)\*?/g, () => m[i++] ?? "");
  }
  return null;
}

function follow(redirects: Redirect[], url: string): { final: string; hops: number } {
  let current = url;
  for (let hops = 0; hops <= 10; hops++) {
    const next = apply(redirects, current);
    if (next === null) return { final: current, hops };
    current = next;
  }
  throw new Error(`ciclo de redirecciones desde ${url}`);
}

/** Página que sirve `url` bajo /autos/dealer/credito (o null). */
function newPageFor(url: string): string | null {
  if (url !== DEALER_CREDIT_BASE && !url.startsWith(`${DEALER_CREDIT_BASE}/`)) return null;
  const segs = url.slice(DEALER_CREDIT_BASE.length).split("/").filter(Boolean);
  let dir = NEW_DIR;
  for (const seg of segs) {
    if (fs.existsSync(path.join(dir, seg))) dir = path.join(dir, seg);
    else if (fs.existsSync(path.join(dir, "[applicationId]"))) dir = path.join(dir, "[applicationId]");
    else return null;
  }
  const page = path.join(dir, "page.tsx");
  return fs.existsSync(page) ? page : null;
}

const sample = (url: string) => url.replace("[applicationId]", "app-123");

describe("(1) cada página vieja tiene su ruta nueva con la misma pantalla", () => {
  const pages = oldRouteFiles("page");

  it("se miden las 14 páginas de /credit-hub/dealer/**", () => {
    expect(pages.length).toBe(14);
  });

  it.each(pages.map((p) => [p.url, p.rel]))("%s", async (url, rel) => {
    const { final } = follow(await loadRedirects(), sample(url));
    const page = newPageFor(final);
    expect([url, page && path.relative(ROOT, page)]).toEqual([url, expect.stringContaining("app/autos/dealer/credito")]);
    // Reutiliza el componente de la página vieja; no duplica su lógica.
    const oldModule = ["@/app/(forge)/credit-hub/dealer", rel, "page"].filter(Boolean).join("/");
    expect(fs.readFileSync(page!, "utf8")).toContain(`export { default } from "${oldModule}";`);
  });

  it("el layout del asistente también es el mismo", () => {
    for (const { rel } of oldRouteFiles("layout")) {
      expect(rel).toBe("applications/new");
      const nuevo = fs.readFileSync(path.join(NEW_DIR, "solicitudes", "nueva", "layout.tsx"), "utf8");
      expect(nuevo).toContain('export { default } from "@/app/(forge)/credit-hub/dealer/applications/new/layout";');
    }
  });
});

describe("(2) redirecciones de /credit-hub/dealer/**", () => {
  it("next.config.js declara exactamente DEALER_CREDIT_LEGACY_REDIRECTS, temporales y en el mismo orden", async () => {
    const dealer = (await loadRedirects()).filter((r) => r.source.startsWith("/credit-hub/dealer"));
    expect(dealer.map(({ source, destination }) => ({ source, destination }))).toEqual([...DEALER_CREDIT_LEGACY_REDIRECTS]);
    expect(dealer.every((r) => r.permanent === false)).toBe(true);
    // Sin query en el destino: Next.js pasa la query original (p. ej. ?new=1, ?preset=, ?application_id=).
    expect(dealer.every((r) => !r.destination.includes("?"))).toBe(true);
  });

  it("cada destino es una página que existe, dentro del chrome del dealer", () => {
    for (const { source, destination } of DEALER_CREDIT_LEGACY_REDIRECTS) {
      const url = destination.replace(":applicationId", "app-123");
      expect([source, newPageFor(url) !== null]).toEqual([source, true]);
      // AppGate pinta isDealerChromePath solo con ProtectedRoute: DealerSuiteGate no corre ahí.
      expect([source, isDealerChromePath(url)]).toEqual([source, true]);
    }
  });

  it("conserva el applicationId", async () => {
    const redirects = await loadRedirects();
    expect(follow(redirects, "/credit-hub/dealer/applications/app-123").final).toBe(`${DEALER_CREDIT_BASE}/solicitudes/app-123`);
    expect(follow(redirects, "/credit/status/app-9").final).toBe(`${DEALER_CREDIT_BASE}/solicitudes/app-9`);
  });

  it("ningún redirect del archivo entra en ciclo (simulator y /credit/* incluidos) y los del dealer llegan en un salto", async () => {
    const redirects = await loadRedirects();
    for (const r of redirects.filter((x) => !x.has)) {
      const url = r.source
        .replace(/:([A-Za-z_]+)\(((?:[^()]|\([^()]*\))*)\)/g, "x1")
        .replace(/:([A-Za-z_]+)\*/g, "a/b")
        .replace(/:([A-Za-z_]+)/g, "x1");
      const { final, hops } = follow(redirects, url);
      expect(apply(redirects, final)).toBeNull();
      if (r.source.startsWith("/credit-hub/dealer") || r.destination.startsWith(DEALER_CREDIT_BASE)) {
        expect([r.source, hops, final.startsWith(DEALER_CREDIT_BASE)]).toEqual([r.source, 1, true]);
      }
    }
  });

  it("simulator va directo a preaprobación", async () => {
    expect(follow(await loadRedirects(), "/credit-hub/dealer/simulator")).toEqual({ final: `${DEALER_CREDIT_BASE}/preaprobacion`, hops: 1 });
  });
});

describe("(3) menú de Dealer OS: Crédito con su entitlement", () => {
  const CREDITO = ["credit.applications.view", "credit.applications.submit"];
  const items = (allows: (c: string | null) => boolean) => visibleDealerNavGroups(allows).flatMap((g) => g.items);

  it("las claves de crédito entran en el batch del menú", () => {
    for (const key of CREDITO) expect(DEALER_NAV_CAPABILITY_KEYS).toContain(key);
  });

  it("con el entitlement se ven Crédito, Solicitudes, Nueva solicitud y Preaprobación en /autos/dealer/credito", () => {
    const visibles = items((c) => c === null || CREDITO.includes(c));
    const credito = visibles.filter((i) => i.href.startsWith(DEALER_CREDIT_BASE));
    expect(credito.map((i) => [i.label, i.href])).toEqual([
      ["Crédito", DEALER_CREDIT_BASE],
      ["Solicitudes", `${DEALER_CREDIT_BASE}/solicitudes`],
      ["Nueva solicitud", `${DEALER_CREDIT_BASE}/solicitudes/nueva?new=1`],
      ["Preaprobación", `${DEALER_CREDIT_BASE}/preaprobacion`],
    ]);
    for (const i of credito) expect(isDealerNavItemOpenable(i.href)).toBe(true);
    expect(visibles.some((i) => i.href.startsWith("/credit-hub"))).toBe(false);
  });

  it("sin el entitlement no aparece nada de crédito; solo con ver, no aparece Nueva solicitud", () => {
    expect(items((c) => c === null).some((i) => i.href.startsWith(DEALER_CREDIT_BASE))).toBe(false);
    expect(visibleDealerNavGroups((c) => c === null).map((g) => g.id)).not.toContain("financiamiento");
    const soloVer = items((c) => c === null || c === "credit.applications.view").map((i) => i.label);
    expect(soloVer).toEqual(expect.arrayContaining(["Crédito", "Solicitudes", "Preaprobación"]));
    expect(soloVer).not.toContain("Nueva solicitud");
  });

  it("marca el item más específico", () => {
    const sol = `${DEALER_CREDIT_BASE}/solicitudes`;
    expect(isDealerNavItemActive(DEALER_CREDIT_BASE, DEALER_CREDIT_BASE)).toBe(true);
    expect(isDealerNavItemActive(DEALER_CREDIT_BASE, `${sol}/app-1`)).toBe(false);
    expect(isDealerNavItemActive(sol, `${sol}/app-1`)).toBe(true);
    expect(isDealerNavItemActive(`${sol}/nueva?new=1`, `${sol}/nueva/vehiculo`)).toBe(true);
    expect(isDealerNavItemActive(sol, `${sol}/nueva/vehiculo`)).toBe(false);
  });
});

describe("(4) los enlaces del asistente y del portal apuntan a /autos/dealer/credito", () => {
  it("pasos del asistente: URL en español, id interno de siempre", () => {
    expect(DEALER_WIZARD_STEP_PATHS.map((s) => dealerWizardStepHref(s))).toEqual([
      `${DEALER_CREDIT_BASE}/solicitudes/nueva/solicitante`,
      `${DEALER_CREDIT_BASE}/solicitudes/nueva/consentimiento`,
      `${DEALER_CREDIT_BASE}/solicitudes/nueva/vehiculo`,
      `${DEALER_CREDIT_BASE}/solicitudes/nueva/revision`,
    ]);
    expect(dealerWizardStepHref("consent", "a b")).toBe(`${DEALER_CREDIT_BASE}/solicitudes/nueva/consentimiento?application_id=a%20b`);
    DEALER_WIZARD_STEP_PATHS.forEach((s, i) => {
      expect(dealerWizardStepIndexFromPathname(dealerWizardStepHref(s))).toBe(i);
    });
    for (const step of Object.keys(DEALER_WIZARD_URL_SEGMENTS) as Array<keyof typeof DEALER_WIZARD_URL_SEGMENTS>) {
      expect(newPageFor(dealerCreditWizardHref(step))).not.toBeNull();
    }
    expect(isDealerWizardCompletePath(dealerCreditWizardHref("complete"))).toBe(true);
    expect(isDealerWizardCompletePath(dealerCreditWizardHref("review"))).toBe(false);
  });

  it("los helpers de rutas del dealer ya no apuntan a /credit-hub/dealer", () => {
    const hrefs = [
      ...Object.values(DEALER_NAV_ROUTES),
      dealerNewApplicationHref(),
      dealerDetailHref("app-1"),
      forgeDealerApplicationDetailHref("dealer/applications/app-1"),
    ];
    for (const href of hrefs) {
      expect(href.startsWith(DEALER_CREDIT_BASE)).toBe(true);
      expect(newPageFor(href.split("?")[0]!)).not.toBeNull();
    }
    expect(dealerNewApplicationHref()).toBe(`${DEALER_CREDIT_BASE}/solicitudes/nueva/solicitante?new=1`);
  });

  it("ningún componente del crédito del dealer enlaza a /credit-hub/dealer", () => {
    const archivos = [
      ...walk(path.join(ROOT, "components", "credit-hub", "dealer")),
      ...["dealerWizardPaths.ts", "DealerWizardProvider.tsx", "DealerNewApplicationLayoutClient.tsx", "DealerWizardReviewStep.tsx"].map((f) =>
        path.join(ROOT, "components", "forge", "credit-hub", "dealer", f),
      ),
      path.join(OLD_DIR, "applications", "new", "page.tsx"),
    ].filter((f) => /\.tsx?$/.test(f));
    const conEnlaceViejo = archivos.filter((f) => /["'`]\/credit-hub\/dealer/.test(fs.readFileSync(f, "utf8")));
    expect(conEnlaceViejo.map((f) => path.relative(ROOT, f))).toEqual([]);
  });

  it("las llamadas al API se hacen como portal dealer también en Dealer OS", () => {
    expect(portalFromPathname(`${DEALER_CREDIT_BASE}/solicitudes/nueva/vehiculo`)).toBe("dealer");
    expect(portalFromPathname(DEALER_CREDIT_BASE)).toBe("dealer");
    expect(portalFromPathname("/autos/dealer/creditos")).toBeNull();
    expect(portalFromPathname("/credit-hub/dealer")).toBe("dealer");
  });
});

describe("(5) mismos guards de tenant y rol que /credit-hub/dealer", () => {
  const auth = useAuth as jest.Mock;
  const tenant = useTenant as jest.Mock;
  const pintar = () =>
    render(
      <DealerCreditOsFrame>
        <p>pantalla de crédito</p>
      </DealerCreditOsFrame>,
    );

  beforeEach(() => {
    tenant.mockReturnValue({ apiTenantId: "t-1", tenantId: "t-1", tenantSlug: "t-1", loading: false });
  });

  it("el concesionario ve la pantalla dentro del ámbito credit-hub-forge con persona dealer", () => {
    auth.mockReturnValue({ isLoading: false, isAuthenticated: true, activeRole: { role_key: "dealer" } });
    pintar();
    const frame = screen.getByTestId("dealer-credito-frame");
    expect(frame).toHaveClass("credit-hub-forge");
    expect(frame).toHaveAttribute("data-persona", "dealer");
    expect(screen.getByText("pantalla de crédito")).toBeInTheDocument();
  });

  it("un rol del banco recibe 403 del portal dealer", () => {
    auth.mockReturnValue({ isLoading: false, isAuthenticated: true, activeRole: { role_key: "bank_analyst" } });
    pintar();
    expect(screen.getByTestId("ch-portal-forbidden")).toHaveAttribute("data-portal", "dealer");
    expect(screen.queryByText("pantalla de crédito")).not.toBeInTheDocument();
  });

  it("sin tenant no se pinta la pantalla", () => {
    tenant.mockReturnValue({ apiTenantId: null, tenantId: null, tenantSlug: null, loading: false });
    auth.mockReturnValue({ isLoading: false, isAuthenticated: true, activeRole: { role_key: "dealer" } });
    pintar();
    expect(screen.getByTestId("ch-tenant-guard-blocked")).toBeInTheDocument();
    expect(screen.queryByText("pantalla de crédito")).not.toBeInTheDocument();
  });
});
