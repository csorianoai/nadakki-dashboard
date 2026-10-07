import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KpisBancoV2 } from "@/components/credit-hub/bank-v2/kpis/KpisBancoV2";
import { marcaDesdeBranding } from "@/lib/dcc/marca";

const llamadas: Array<{ path: string; tenant?: string }> = [];
let lendersFalla = false;
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: "t-1", tenantId: "t-1", loading: false }) }));
jest.mock("@/lib/api/fetch-client", () => ({
  apiFetch: jest.fn(async (path: string, init: { headers: Record<string, string> }) => {
    llamadas.push({ path, tenant: init.headers["X-Tenant-ID"] });
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
  });

  it("solo consulta prestamistas (con su tenant); Resumen y Tendencia en Próximamente, sin aviso de error", async () => {
    const { container } = pintar();
    expect(await screen.findByText("Banco Ejemplo")).toBeInTheDocument();
    expect(llamadas.map((l) => `${l.path}|${l.tenant}`)).toEqual(["/api/v2/credit/bank/kpis/lenders|t-1"]);
    for (const id of ["kpis-resumen", "kpis-tendencia"]) {
      const s = screen.getByTestId(id);
      expect(s.querySelector("[data-testid=dcc-sello][data-estado=no_disponible]")).not.toBeNull();
      expect(s.querySelector("[role=alert]")).toBeNull();
    }
    const texto = lectura(container);
    expect(texto).not.toMatch(/no respondió|available|backend|summary|trends|Error HTTP/);
    // Nada inventado: no hay cifras sueltas de resumen.
    expect(container.querySelectorAll("[data-testid=dcc-kpi-valor]")).toHaveLength(0);
    const detalle = screen.getByTestId("detalle-tecnico");
    expect(detalle).not.toHaveAttribute("open");
    expect(detalle.textContent).toMatch(/\/credit\/dashboard\/summary/);
  });

  it("prestamistas con available:false: Próximamente en llano; el motivo tecnico solo plegado", async () => {
    lendersFalla = true;
    const { container } = pintar();
    expect(await screen.findByText(/kpis\/lenders no respondió/)).toBeInTheDocument();
    expect(lectura(container)).not.toMatch(/available|backend|kpis\//);
  });
});
