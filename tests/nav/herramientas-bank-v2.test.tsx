/**
 * DASH-NAV: las herramientas del expediente bancario v1 son alcanzables dentro de bank-v2, sin bucle.
 *
 * Defecto que corrige: «Más herramientas» enlazaba /credit-hub/bank/applications/:id y next.config.js (#826)
 * redirige esa ruta a /credit-hub/bank-v2/solicitudes/:id: el usuario volvía al expediente y las herramientas
 * (contraoferta, ofertas, estipulaciones, operaciones) eran inalcanzables.
 *
 * Qué prueba:
 *  1. Renderiza el expediente bank-v2 REAL y recoge cada href que genera.
 *  2. Renderiza la pantalla de herramientas REAL (envoltorio + página v1) y recoge cada href.
 *  3. Escanea el código fuente de toda la pantalla v1 reutilizada: no puede haber más enlaces de los que se trazan aquí.
 *  4. Aplica las redirects de next.config.js (mismo emparejador que Next) a cada href: ninguno puede acabar en
 *     /credit-hub/bank-v2/solicitudes/:id sin haber mostrado las herramientas, y /herramientas no redirige.
 */
import fs from "fs";
import { execFileSync } from "child_process";
import path from "path";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import ExpedienteV2Page from "@/app/(forge)/credit-hub/bank-v2/solicitudes/[applicationId]/page";
import HerramientasPage from "@/app/(forge)/credit-hub/bank-v2/solicitudes/[applicationId]/herramientas/page";

const ID = "APP-42";
const EXPEDIENTE = `/credit-hub/bank-v2/solicitudes/${ID}`;
const HERRAMIENTAS = `${EXPEDIENTE}/herramientas`;
const BANDEJA = "/credit-hub/bank-v2/solicitudes";
const BANDEJA_BOTON = "/credit-hub/bank-v2"; // «Volver a la bandeja» del detalle (DB-CODEX-27)

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: "t-1", tenantId: "t-1", loading: false }) }));
jest.mock("@/app/(forge)/credit-hub/bank-v2/BancoV2Shell", () => ({
  useMarcaBanco: () => jest.requireActual("@/lib/dcc/marca").marcaDesdeBranding({ locale: "es-DO", currency: "DOP" }, "banco"),
}));
jest.mock("@/lib/credit-hub/api/client", () => {
  const real = jest.requireActual("@/lib/credit-hub/api/client");
  return {
    ...real,
    chFetch: jest.fn(async (p: string) => {
      if (p.includes("expediente/full")) throw new real.CHApiError("no", 404);
      if (p.includes("/compliance/")) return { consents_complete: true, documents_complete: true, issues: [] };
      if (p.endsWith("/events")) return { events: [] };
      return {
        application_id: "APP-42", tenant_id: "t", state: "claimed",
        application_payload: { applicant: { name: "Marisol Reyes" }, vehicle: { label: "Toyota RAV4" }, financial: { requested_amount: 1, term_months: 12 }, documents: [] },
      };
    }),
  };
});
// Pantalla v1: el diseño real de BankDetailLayout se comprueba por escaneo de código fuente (abajo); aquí se
// sustituye por un cuerpo que pinta SU enlace «Volver a la bandeja» tal cual, para renderizar la página real.
jest.mock("@/lib/credit-hub/hooks/useBankDecision", () => ({
  useBankApplication: () => ({ isLoading: false, error: null, data: { application_id: "APP-42", state: "claimed", application_payload: { applicant: { name: "Marisol Reyes" }, vehicle: { label: "Toyota RAV4" }, financial: { requested_amount: 1, term_months: 12 }, documents: [] } }, refetch: jest.fn() }),
  useBankCompliance: () => ({ data: undefined, isLoading: false }),
  useBankAuditTrail: () => ({ data: undefined, isLoading: false }),
}));
// BarraDecision no genera enlaces (sin href en su fuente): se sustituye para no simular la mutación de decisión.
jest.mock("@/components/credit-hub/bank-v2/expediente/BarraDecision", () => ({ BarraDecision: () => null }));
jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ isLoading: false, isAuthenticated: true, activeRole: { role_key: "bank_analyst" }, user: { id: "u-1" } }),
}));
jest.mock("@/app/credit/CreditTenantGate", () => ({ CreditTenantGate: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock("@/app/(forge)/credit-hub/bank/_components/BankApplicationOpsPanel", () => ({
  BankApplicationOpsPanel: () => <div data-testid="ops-panel" />,
}));
jest.mock("@/components/credit-hub/bank/BankDetailLayout", () => ({
  BankDetailLayout: () => <div data-testid="detalle-v1" />,
}));

const resuelto = <T,>(v: T): Promise<T> => Object.assign(Promise.resolve(v), { status: "fulfilled", value: v }) as Promise<T>;
const params = () => ({ params: resuelto({ applicationId: ID }) });
const hrefsDe = (c: HTMLElement) => [...c.querySelectorAll("a[href]")].map((a) => a.getAttribute("href") ?? "");
const conCliente = (ui: React.ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>
);

// ── Redirects de next.config.js, con el emparejador de Next ──────────────────────────────────────

type Redirect = { source: string; destination: string; has?: unknown[]; missing?: unknown[] };
let redirects: Redirect[] = [];
beforeAll(() => {
  // next.config.js (next-pwa) no carga bajo jsdom: se evalúa en un proceso Node y se lee su redirects() real.
  const salida = execFileSync(
    process.execPath,
    ["-e", 'require(process.argv[1]).redirects().then((r) => process.stdout.write(JSON.stringify(r)))', path.join(process.cwd(), "next.config.js")],
    { env: { ...process.env, NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://backend.invalid" }, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  );
  redirects = JSON.parse(salida) as Redirect[];
  expect(redirects.length).toBeGreaterThan(20);
});

const matchers = new Map<string, ReturnType<typeof getPathMatch>>();
function emparejar(source: string, ruta: string): Record<string, string | string[]> | false {
  let m = matchers.get(source);
  if (!m) matchers.set(source, (m = getPathMatch(source, { removeUnnamedParams: true, strict: true })));
  return m(ruta) as Record<string, string | string[]> | false;
}
const aplicar = (destino: string, p: Record<string, string | string[]>) =>
  destino.replace(/:([A-Za-z0-9_]+)\*?/g, (_, n: string) => (Array.isArray(p[n]) ? (p[n] as string[]).join("/") : ((p[n] as string) ?? "")));

/** Cadena de saltos de una URL interna (sin query/hash) hasta que ninguna regla empareja. */
function seguir(href: string): string[] {
  const visitadas = [href.split(/[?#]/)[0]!];
  for (;;) {
    const actual = visitadas[visitadas.length - 1]!;
    const r = redirects.filter((x) => !x.has && !x.missing).find((x) => emparejar(x.source, actual));
    if (!r) return visitadas;
    const sig = aplicar(r.destination, emparejar(r.source, actual) as Record<string, string>);
    if (visitadas.includes(sig)) throw new Error(`ciclo de redirecciones: ${[...visitadas, sig].join(" -> ")}`);
    visitadas.push(sig);
  }
}
const internos = (hrefs: string[]) => hrefs.filter((h) => h.startsWith("/"));

describe("expediente bank-v2 -> «Más herramientas»", () => {
  it("apunta a la ruta nueva dentro de bank-v2 (no a la ruta v1 que redirige de vuelta)", async () => {
    const { container } = render(conCliente(<ExpedienteV2Page {...params()} />));
    await screen.findByRole("heading", { name: "Marisol Reyes" });
    for (const a of screen.getAllByRole("link", { name: "Abrir expediente completo" })) expect(a).toHaveAttribute("href", HERRAMIENTAS);
    expect(hrefsDe(container).filter((h) => h.startsWith("/credit-hub/bank/"))).toEqual([]);
  });

  it("ningún enlace del expediente acaba en un bucle; «Abrir expediente completo» llega SIN redirección", async () => {
    const { container } = render(conCliente(<ExpedienteV2Page {...params()} />));
    await screen.findByRole("heading", { name: "Marisol Reyes" });
    const hrefs = internos(hrefsDe(container));
    expect(hrefs).toEqual(expect.arrayContaining([HERRAMIENTAS, BANDEJA_BOTON]));
    for (const h of hrefs) expect(() => seguir(h)).not.toThrow();
    // Ningún enlace del expediente puede devolver al propio expediente (el bucle del defecto).
    for (const h of hrefs) expect([h, seguir(h).pop()]).not.toEqual([h, EXPEDIENTE]);
    expect(seguir(HERRAMIENTAS)).toEqual([HERRAMIENTAS]);
    expect(seguir(BANDEJA_BOTON)).toEqual([BANDEJA_BOTON]);
  });

  it("la ruta v1 SÍ redirige al expediente (por eso no servía de enlace)", () => {
    expect(seguir(`/credit-hub/bank/applications/${ID}`)).toEqual([`/credit-hub/bank/applications/${ID}`, EXPEDIENTE]);
  });
});

describe("pantalla de herramientas: todos sus enlaces de ida y vuelta", () => {
  it("renderiza la página v1 reutilizada y su enlace «Volver al expediente» va directo, sin redirección", () => {
    const { container } = render(conCliente(<HerramientasPage {...params()} />));
    expect(screen.getByTestId("detalle-v1")).toBeInTheDocument();
    expect(screen.getByTestId("ops-panel")).toBeInTheDocument();
    // DB-CODEX-23: las clases ch-* solo se estilan dentro del ambito del portal del banco.
    const portal = screen.getByTestId("herramientas-portal");
    expect(portal).toHaveClass("credit-hub-forge", "credit-hub-bank-portal");
    expect(portal).toHaveAttribute("data-persona", "bank");
    expect(portal).toContainElement(screen.getByTestId("detalle-v1"));
    const volver = screen.getByTestId("herramientas-volver-expediente");
    expect(volver).toHaveAttribute("href", EXPEDIENTE);
    expect(seguir(EXPEDIENTE)).toEqual([EXPEDIENTE]);
    for (const h of internos(hrefsDe(container))) expect(() => seguir(h)).not.toThrow();
  });

  const RAIZ = process.cwd();
  /** Toda la pantalla v1 que se monta en /herramientas: la página, el panel de operaciones y BankDetailLayout con sus pestañas. */
  const FUENTES = [
    "app/(forge)/credit-hub/bank/applications/[applicationId]/page.tsx",
    "app/(forge)/credit-hub/bank/_components/BankApplicationOpsPanel.tsx",
    "app/credit/CreditTenantGate.tsx",
    "components/credit-hub/bank/BankDetailLayout.tsx",
    ...fs.readdirSync(path.join(RAIZ, "components/credit-hub/bank/sections")).filter((f) => /\.tsx$/.test(f) && !/\.test\./.test(f)).map((f) => `components/credit-hub/bank/sections/${f}`),
    "components/credit-hub/bank/AssignedAnalystSection.tsx",
    "components/credit-hub/bank/PrintExportActions.tsx",
    "components/credit-hub/bank/EscalateKycButton.tsx",
    "components/credit-hub/bank/ModifiedFieldBadge.tsx",
    "components/credit-hub/dealer/AmortizationTable.tsx",
    "components/credit-hub/dealer/ApplicationMessageThread.tsx",
    "components/credit-hub/bank-v2/expediente/Asignacion.tsx",
  ];

  /** Cada destino de navegación que escribe el código: href="…", href={`…`}, router.push/replace("…"), redirect("…"). */
  function destinos(fuente: string): string[] {
    const texto = fs.readFileSync(path.join(RAIZ, fuente), "utf8");
    const out: string[] = [];
    for (const m of texto.matchAll(/(?:href\s*=\s*\{?\s*|\.(?:push|replace)\(\s*|redirect\(\s*)["'`](\/[^"'`]*)["'`]/g)) out.push(m[1]!);
    return out;
  }
  /** Destinos conocidos y trazados; si alguien añade un enlace nuevo a la pantalla v1 este test obliga a trazarlo. */
  const TRAZADOS: Record<string, string> = {
    "/credit-hub/bank/applications": BANDEJA, // BankDetailLayout «Volver a la bandeja» (307 -> bandeja)
    "/tenants": "/tenants", // CreditTenantGate «elegir tenant»
  };

  it("los enlaces de la pantalla v1 son exactamente los trazados", () => {
    const hallados = new Set<string>();
    for (const f of FUENTES) {
      expect(fs.existsSync(path.join(RAIZ, f))).toBe(true);
      for (const d of destinos(f)) hallados.add(d);
    }
    expect([...hallados].sort()).toEqual(Object.keys(TRAZADOS).sort());
  });

  it.each(Object.entries(TRAZADOS))("%s acaba en %s: nunca en el expediente sin haber mostrado las herramientas", (href, final) => {
    const cadena = seguir(href);
    expect(cadena[cadena.length - 1]).toBe(final);
    expect(cadena[cadena.length - 1]).not.toMatch(/^\/credit-hub\/bank-v2\/solicitudes\/[^/]+$/);
  });
});
