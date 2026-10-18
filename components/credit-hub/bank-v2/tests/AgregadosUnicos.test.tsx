import { render, screen, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MesaDecisiones } from "@/components/credit-hub/bank-v2/mesa/MesaDecisiones";
import { KpisBancoV2 } from "@/components/credit-hub/bank-v2/kpis/KpisBancoV2";
import { AnaliticaV2 } from "@/components/credit-hub/bank-v2/analitica/AnaliticaV2";
import { marcaDesdeBranding } from "@/lib/dcc/marca";

const llamadas: string[] = [];
let sinDatos = false;
const CON_DATOS = { portfolio: { pending_offers: 37, total_approved_amount: 284180000, accepted_offers: 12 }, approval: { approval_rate_pct: 61.7, approved_count: 196, declined_count: 8, avg_response_hours: 4.5 } };
// Un analytics/dashboard con cifras DISTINTAS: si una pantalla las usa, el test lo delata.
const ANALYTICS = { applications_by_status: { submitted: 99 }, approval_rate: 0.11, avg_decision_time_hours: 77, portfolio_value: 1000, total_applications: 5, top_dealers: [], default_prediction: { predicted_default_count: 1, predicted_default_rate: 0.1 }, cohort_analysis: [] };

jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: "t-1", tenantId: "t-1", loading: false }) }));
jest.mock("@/components/credit-hub/shell/useChromeIdentity", () => ({ useChromeIdentity: () => ({ name: "Laura Méndez", initials: "LM", email: "", role: "" }) }));
jest.mock("next/link", () => ({ __esModule: true, default: ({ children, href, ...r }: { children: React.ReactNode; href: string }) => <a href={href} {...r}>{children}</a> }));
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn(async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ metricas: {}, serie: [], lenders: [] }) })) }));
jest.mock("@/lib/credit-hub/api/client", () => ({
  ...jest.requireActual("@/lib/credit-hub/api/client"),
  chFetch: jest.fn(async (path: string) => {
    llamadas.push(path.split("?")[0]);
    if (path.includes("kpis/portfolio")) return sinDatos ? {} : CON_DATOS.portfolio;
    if (path.includes("kpis/approval")) return sinDatos ? {} : CON_DATOS.approval;
    if (path.includes("analytics/dashboard")) return ANALYTICS;
    if (path.includes("applications/queue")) return { applications: [], total: 0, tenant_id: "t" };
    return {};
  }),
}));

const marca = marcaDesdeBranding({ locale: "es-DO", currency: "DOP" }, "banco");
const ETIQUETAS = ["Solicitudes pendientes", "Tasa de aprobación", "Monto aprobado"];

function montar(pantalla: "mesa" | "indicadores" | "analitica") {
  const ui =
    pantalla === "mesa" ? <MesaDecisiones marca={marca} hrefSolicitud={(id) => `/s/${id}`} hrefBandeja="/b" hrefAnalitica="/a" /> :
    pantalla === "indicadores" ? <KpisBancoV2 marca={marca} /> : <AnaliticaV2 marca={marca} />;
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);
}

/** etiqueta -> valor pintado, leido de los DccKpiTile (null si el mosaico no tiene cifra). */
function tiles(): Record<string, string | null> {
  const r: Record<string, string | null> = {};
  for (const t of screen.getAllByTestId("dcc-kpi-tile")) {
    const etiqueta = t.querySelector("p")?.textContent ?? "";
    r[etiqueta] = within(t).queryByTestId("dcc-kpi-valor")?.textContent?.replace(/[\u00a0\u202f]/g, " ") ?? null;
  }
  return r;
}
const PANTALLAS = ["mesa", "indicadores", "analitica"] as const;

describe("Agregados unicos del banco (DB-CODEX-24B)", () => {
  beforeEach(() => { llamadas.length = 0; sinDatos = false; });
  afterEach(cleanup);

  it("(a) Mesa, Indicadores y Analitica muestran los mismos textos de pendientes, tasa y monto", async () => {
    const lecturas: Array<Record<string, string | null>> = [];
    for (const p of PANTALLAS) {
      const { unmount } = montar(p);
      await screen.findByText("61.7 %");
      lecturas.push(tiles());
      unmount();
    }
    for (const e of ETIQUETAS) {
      expect(lecturas.map((l) => l[e])).toEqual([lecturas[0][e], lecturas[0][e], lecturas[0][e]]);
      expect(lecturas[0][e]).toBeTruthy();
    }
    expect(lecturas[0]).toMatchObject({ "Solicitudes pendientes": "37", "Tasa de aprobación": "61.7 %", "Monto aprobado": "RD$284.2 M" });
  });

  it("(b) ninguna pide analytics/dashboard para esos campos: sus cifras no aparecen", async () => {
    for (const p of PANTALLAS) {
      const { unmount, container } = montar(p);
      await screen.findByText("61.7 %");
      const texto = (container.textContent ?? "").replace(/[  ]/g, " ");
      expect(texto).not.toMatch(/\b99\b|11 %|\b77\b|RD\$1,000/);
      unmount();
    }
    // Indicadores no necesita analytics/dashboard en absoluto.
    cleanup(); llamadas.length = 0;
    montar("indicadores");
    await screen.findByText("61.7 %");
    expect(llamadas).not.toContain("/api/v2/credit/analytics/dashboard");
    // Una sola queryKey: los agregados se piden una vez por pantalla.
    expect(llamadas.filter((p) => p.endsWith("kpis/approval"))).toHaveLength(1);
  });

  it("(c) sin datos no aparece ningun 0 en los mosaicos", async () => {
    sinDatos = true;
    for (const p of PANTALLAS) {
      const { unmount } = montar(p);
      await screen.findAllByTestId("dcc-kpi-tile");
      await new Promise((r) => setTimeout(r, 50));
      const t = tiles();
      for (const e of ETIQUETAS.filter((x) => x in t)) expect(t[e]).toBeNull();
      expect(Object.values(t).filter((v) => v !== null && /^0(\s|$|%)/.test(v.replace(/ /g, " ")))).toEqual([]);
      unmount();
    }
  });
});
