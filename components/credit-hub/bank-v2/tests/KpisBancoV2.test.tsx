import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KpisBancoV2 } from "@/components/credit-hub/bank-v2/kpis/KpisBancoV2";
import { marcaDesdeBranding } from "@/lib/dcc/marca";

const llamadas: Array<{ path: string; tenant?: string }> = [];
let lendersFalla = false;
let resumenBody: unknown;
let tendenciaBody: unknown;
const resumenOk = {
  periodo: "2026-10",
  metricas: {
    embudo: { recibidas: { value: 120 }, ofertadas: { value: 74 } },
    tasa_aprobacion: { value: 61.7 },
    tasa_desembolso: { value: null },
    tiempo_medio_respuesta: { value: 4.5 },
  },
};
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: "t-1", tenantId: "t-1", loading: false }) }));
jest.mock("@/lib/api/fetch-client", () => ({
  apiFetch: jest.fn(async (path: string, init: { headers: Record<string, string> }) => {
    llamadas.push({ path, tenant: init.headers["X-Tenant-ID"] });
    if (path.includes("kpis/resumen")) return { ok: true, status: 200, text: async () => JSON.stringify(resumenBody) };
    if (path.includes("kpis/tendencia")) return { ok: true, status: 200, text: async () => JSON.stringify(tendenciaBody) };
    const body = lendersFalla ? { available: false } : { lenders: [{ lender_name: "Banco Ejemplo", applications: 120, approved: 74 }] };
    return { ok: true, status: 200, text: async () => JSON.stringify(body) };
  }),
}));

function pintar() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <KpisBancoV2 marca={marcaDesdeBranding({ locale: "es-DO", currency: "DOP" }, "banco")} />
    </QueryClientProvider>,
  );
}

/** Lo que el banco lee fuera del bloque plegado: texto, title y sr-only. */
function lectura(c: HTMLElement): string {
  const x = c.cloneNode(true) as HTMLElement;
  x.querySelectorAll("[data-testid=detalle-tecnico]").forEach((n) => n.remove());
  return [x.textContent ?? "", ...[...x.querySelectorAll("[title]")].map((n) => n.getAttribute("title"))].join(" | ");
}

describe("KPIs v2 (AUDIT-COWORK 3/9)", () => {
  beforeEach(() => {
    llamadas.length = 0;
    lendersFalla = false;
    resumenBody = resumenOk;
    tendenciaBody = { serie: [{ periodo: "2026-09", metricas: { embudo: { recibidas: { value: 88 } }, tasa_aprobacion: { value: 55 } } }, { periodo: "2026-10", metricas: {} }] };
  });

  it("consulta lenders, resumen y tendencia (con su tenant) y muestra las cifras, no el sello", async () => {
    const { container } = pintar();
    expect(await screen.findByText("Banco Ejemplo")).toBeInTheDocument();
    const rutas = llamadas.map((l) => `${l.path.split("?")[0]}|${l.tenant}`).sort();
    expect(rutas).toEqual(["/api/v2/credit/bank/kpis/lenders|t-1", "/api/v2/credit/bank/kpis/resumen|t-1", "/api/v2/credit/bank/kpis/tendencia|t-1"]);
    expect(llamadas.find((l) => l.path.includes("tendencia"))?.path).toMatch(/\?desde=\d{4}-\d{2}&hasta=\d{4}-\d{2}$/);
    const resumen = await screen.findByTestId("kpis-resumen");
    await screen.findByText("61.7 %");
    expect(resumen.textContent).toContain("120");
    expect(resumen.textContent).toContain("4.5");
    // Tasa de desembolso sin valor: sin cifra ni 0, con motivo llano.
    expect(resumen.textContent).not.toMatch(/\b0 %/);
    expect(resumen.textContent).toContain("Sin solicitudes evaluadas");
    const tendencia = screen.getByTestId("kpis-tendencia");
    expect(tendencia.textContent).toContain("2026-09");
    expect(tendencia.textContent).toMatch(/55\s%/);
    expect(tendencia.textContent).toContain("88");
    expect(lectura(container)).not.toMatch(/próximamente|no respondió|available|backend|Error HTTP/i);
    expect(screen.queryByTestId("detalle-tecnico")).toBeNull();
  });

  it("resumen y tendencia con available:false: sello en llano y sin motivo tecnico en pantalla", async () => {
    resumenBody = { available: false };
    tendenciaBody = { available: false };
    const { container } = pintar();
    expect(await screen.findByText("Banco Ejemplo")).toBeInTheDocument();
    for (const id of ["kpis-resumen", "kpis-tendencia"]) {
      expect((await screen.findByTestId(id)).querySelector("[data-testid=dcc-sello][data-estado=no_disponible]")).not.toBeNull();
    }
    expect(container.querySelectorAll("[data-testid=dcc-kpi-valor]")).toHaveLength(0);
    expect(lectura(container)).not.toMatch(/available|backend|kpis\//);
    expect(screen.queryByTestId("detalle-tecnico")).toBeNull();
  });

  it("prestamistas con available:false: Próximamente en llano; el sin motivo tecnico en pantalla", async () => {
    lendersFalla = true;
    const { container } = pintar();
    expect(await screen.findByText("Esta información estará disponible próximamente.")).toBeInTheDocument();
    expect(screen.queryByTestId("detalle-tecnico")).toBeNull();
    expect(lectura(container)).not.toMatch(/available|backend|kpis\//);
  });
});
