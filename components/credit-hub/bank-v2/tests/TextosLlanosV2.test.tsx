import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnaliticaV2 } from "@/components/credit-hub/bank-v2/analitica/AnaliticaV2";
import { CumplimientoV2 } from "@/components/credit-hub/bank-v2/control/CumplimientoV2";
import { MesaDecisiones } from "@/components/credit-hub/bank-v2/mesa/MesaDecisiones";
import { marcaDesdeBranding } from "@/lib/dcc/marca";

/**
 * AUDIT-COWORK 2/9. Lo que lee el banco (sellos, tooltips y textos para lector
 * de pantalla) va en llano; el detalle tecnico solo en el bloque plegado
 * "Detalle técnico". "parcial" solo cuando el dato es parcial de verdad.
 */
let totalAnalitica = 27;
let colaTotal = 1;
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: "t-1", tenantId: "t-1", loading: false }) }));
jest.mock("@/components/credit-hub/shell/useChromeIdentity", () => ({ useChromeIdentity: () => ({ name: "Laura Méndez", initials: "LM", email: "", role: "" }) }));
jest.mock("next/link", () => ({ __esModule: true, default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
jest.mock("@/lib/credit-hub/api/client", () => ({
  ...jest.requireActual("@/lib/credit-hub/api/client"),
  chFetch: jest.fn(async (path: string) => {
    if (path.includes("applications/queue"))
      return {
        applications: [{ application_id: "a1", tenant_id: "t", state: "submitted", applicant_name: "Ana", requested_amount: 1000, score: 700, priority: "ALTA", approval_band: "PREAPROBABLE", created_at: null, bank_decision: null }],
        total: colaTotal,
        total_count: colaTotal,
      };
    if (path.includes("analytics/dashboard"))
      return {
        applications_by_status: {}, approval_rate: 0, avg_decision_time_hours: null, portfolio_value: 1000, total_applications: totalAnalitica,
        top_dealers: [{ dealer: "Autos del Caribe", volume: 9, approved: 0, approval_rate: 0 }],
        default_prediction: { rule: "score_lt_600", predicted_default_count: 1, predicted_default_rate: 0.03 }, cohort_analysis: [],
      };
    if (path.includes("dealers-ranking")) return { dealers: [{ dealer: "Autos del Caribe", volume: 9, approved: 0, approval_rate: 0 }] };
    if (path.includes("portfolio-health")) return {};
    if (path.includes("/compliance/")) return { application_id: "a1", issues: [] };
    if (path.includes("goals/monthly")) return { goals: [] };
    if (path.includes("kpis/portfolio")) return { total_approved_amount: 5000 };
    return { approved_count: 3, avg_response_hours: null };
  }),
}));

const TECNICO = /applications\/|kpis\/|analytics\/|portfolio-health|[Ee]ndpoint|payload|available|sla_deadline|avg_response|approved_count|cohort|score_distribution|[Bb]ackend|RTBF|DESEMBOLSADO|[Bb]randing|NEXT_PUBLIC/;
const marca = marcaDesdeBranding({ locale: "es-DO", currency: "DOP" }, "banco");

function pintar(ui: React.ReactNode) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);
}

/** Todo lo que el banco lee o escucha FUERA del bloque plegado: texto, title y sr-only. */
function lectura(c: HTMLElement): string {
  const x = c.cloneNode(true) as HTMLElement;
  x.querySelectorAll("[data-testid=detalle-tecnico]").forEach((n) => n.remove());
  const titulos = [...x.querySelectorAll("[title]")].map((n) => n.getAttribute("title"));
  return [x.textContent ?? "", ...titulos].join(" | ");
}

function sellos(c: HTMLElement, estado: string) {
  return c.querySelectorAll(`[data-testid=dcc-sello][data-estado=${estado}]`);
}

describe("Textos llanos y 'parcial' honesto (bank-v2)", () => {
  beforeEach(() => {
    totalAnalitica = 27;
    colaTotal = 1;
  });

  it("Mesa: sin textos tecnicos ni 'parcial' generico; Embudo compacto en Próximamente; detalle tecnico plegado", async () => {
    const { container } = pintar(<MesaDecisiones marca={marca} hrefSolicitud={(id) => `/s/${id}`} hrefBandeja="/b" hrefAnalitica="/a" />);
    expect(await screen.findAllByTestId("cola-tarjeta")).toHaveLength(1);
    await screen.findByText("Autos del Caribe");
    const texto = lectura(container);
    expect(texto).not.toMatch(TECNICO);
    expect(texto).not.toContain("aún no declara la calidad");
    expect(texto).toContain("Esta cifra estará disponible próximamente.");
    expect(sellos(container, "parcial")).toHaveLength(0);
    const embudo = screen.getByTestId("mesa-salud");
    expect(embudo.querySelectorAll("[data-testid=dcc-sello][data-estado=no_disponible]")).toHaveLength(1);
    expect(embudo.textContent).not.toMatch(/→/);
    const detalle = screen.getByTestId("detalle-tecnico");
    expect(detalle).not.toHaveAttribute("open");
    expect(detalle.textContent).toContain("Detalle técnico");
    expect(detalle.textContent).toMatch(/kpis\/funnel/);
    expect(detalle.textContent).toMatch(/sla_deadline/);
    expect(detalle.textContent).toMatch(/avg_response_hours/);
  });

  it("Mesa y Analítica: 'parcial' solo cuando el total alcanza el limite de lectura (500)", async () => {
    totalAnalitica = 500;
    const { container } = pintar(<AnaliticaV2 marca={marca} />);
    await screen.findAllByText("Autos del Caribe");
    const parciales = sellos(container, "parcial");
    expect(parciales.length).toBeGreaterThan(0);
    expect(lectura(container)).toContain("Calculado sobre las 500 solicitudes más recientes.");
    expect(lectura(container)).not.toMatch(TECNICO);
  });

  it("Analítica: con menos de 500 solicitudes, cifras sin sello y nada tecnico a la vista", async () => {
    const { container } = pintar(<AnaliticaV2 marca={marca} />);
    await screen.findAllByText("Autos del Caribe");
    expect(sellos(container, "parcial")).toHaveLength(0);
    expect(lectura(container)).not.toMatch(TECNICO);
    expect(screen.getByTestId("detalle-tecnico").textContent).toMatch(/cohort_analysis/);
  });

  it("Cumplimiento: sin 'parcial' si se revisaron todas; con 'parcial' en llano si la cola trae mas", async () => {
    const uno = pintar(<CumplimientoV2 marca={marca} hrefSolicitud={(id) => id} />);
    await screen.findByText("Solicitudes revisadas");
    expect(sellos(uno.container, "parcial")).toHaveLength(0);
    expect(lectura(uno.container)).not.toMatch(TECNICO);
    expect(screen.getByTestId("detalle-tecnico").textContent).toMatch(/RTBF/);
    uno.unmount();

    colaTotal = 80;
    const dos = pintar(<CumplimientoV2 marca={marca} hrefSolicitud={(id) => id} />);
    await screen.findByText("Solicitudes revisadas");
    expect(sellos(dos.container, "parcial").length).toBeGreaterThan(0);
    expect(lectura(dos.container)).toContain("Se revisan las 50 solicitudes más recientes de la cola.");
    expect(lectura(dos.container)).not.toMatch(TECNICO);
  });
});
