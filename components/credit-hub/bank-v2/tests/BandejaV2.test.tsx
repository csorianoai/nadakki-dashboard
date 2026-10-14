import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BandejaV2 } from "@/components/credit-hub/bank-v2/bandeja/BandejaV2";
import { marcaDesdeBranding } from "@/lib/dcc/marca";

const llamadas: Array<{ path: string; body?: string }> = [];
const ID = "7f3c1a10-0000-4000-8000-000000000001";
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: "t-1", tenantId: "t-1", loading: false }) }));
jest.mock("next/link", () => ({ __esModule: true, default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
jest.mock("@/lib/credit-hub/api/client", () => ({
  ...jest.requireActual("@/lib/credit-hub/api/client"),
  chFetch: jest.fn(async (path: string, init: { body?: string }) => {
    llamadas.push({ path, body: init.body });
    if (path.includes("bulk-decide")) return { processed: 1, skipped: 0, errors: 0, results: [] };
    return {
      total_count: 41,
      applications: [{ application_id: ID, tenant_id: "t", state: "SUBMITTED", estado_bandeja: "en_revision", applicant_name: "Marisol Reyes", dealer_name: "Autos del Caribe", vehicle_label: "Toyota RAV4 2024", requested_amount: 2150000, score: 742, risk_level: "BAJO", approval_band: "PREAPROBABLE", priority: "ALTA", created_at: null, bank_decision: null }],
    };
  }),
}));

function pintar(q = "") {
  const onParams = jest.fn();
  const marca = marcaDesdeBranding({ display_name: "Banco Ejemplo", locale: "es-DO", currency: "DOP" }, "banco");
  const r = render(
    <QueryClientProvider client={new QueryClient()}>
      <BandejaV2 marca={marca} q={q} page={1} onParams={onParams} hrefSolicitud={(id) => `/s/${id}`} analistaId="analista-1" />
    </QueryClientProvider>,
  );
  return { ...r, onParams };
}

describe("Bandeja v2 (B3)", () => {
  beforeEach(() => (llamadas.length = 0));

  it("misma consulta paginada con busqueda; estados traducidos, monto del branding y sin UUID", async () => {
    const { container } = pintar("reyes");
    expect(await screen.findAllByTestId("bandeja-fila")).toHaveLength(1);
    // BANK-V2-05: el estado se pide al backend (todas por defecto) junto con la busqueda.
    expect(llamadas[0].path).toBe("/api/v2/credit/applications/queue?limit=20&offset=0&estado=todas&q=reyes");
    expect(container.textContent).toContain("En revisión");
    expect(container.textContent).toContain("RD$2,150,000.00");
    expect(container.textContent).toContain("Página 1 de 3");
    expect(container.textContent).not.toMatch(/claimed|SUBMITTED|en_revision|ALTA|PREAPROBABLE|Error HTTP|DEMO|7f3c1a10/);
    expect(screen.getByRole("link", { name: "Marisol Reyes" })).toHaveAttribute("href", `/s/${ID}`);
  });

  it("el filtro de estado lo resuelve el backend y vuelve a la pagina 1 (BANK-V2-05)", async () => {
    const { onParams } = pintar("reyes");
    expect(await screen.findAllByTestId("bandeja-fila")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Decididas" }));
    await waitFor(() => expect(llamadas.some((l) => l.path.includes("estado=decididas"))).toBe(true));
    expect(llamadas.find((l) => l.path.includes("estado=decididas"))!.path).toBe("/api/v2/credit/applications/queue?limit=20&offset=0&estado=decididas&q=reyes");
    expect(onParams).toHaveBeenCalledWith("reyes", 1);
    // La fila que trae el backend no se vuelve a filtrar en el cliente por un estado que no existe.
    expect(await screen.findAllByTestId("bandeja-fila")).toHaveLength(1);
  });

  it("accion masiva: misma regla, analista y justificacion que la Bandeja actual, tras confirmar", async () => {
    pintar();
    fireEvent.click(await screen.findByRole("checkbox", { name: "Seleccionar Marisol Reyes" }));
    fireEvent.click(screen.getByRole("button", { name: "Aplicar regla" }));
    expect(llamadas.some((l) => l.path.includes("bulk-decide"))).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(llamadas.find((l) => l.path.includes("bulk-decide"))).toBeDefined());
    const cuerpo = JSON.parse(llamadas.find((l) => l.path.includes("bulk-decide"))!.body!);
    expect(cuerpo).toMatchObject({ application_ids: [ID], rule: "APROBAR_SCORE_GTE_800", analyst_id: "analista-1", justification: "Acción masiva desde bandeja" });
    expect(await screen.findByRole("status")).toHaveTextContent("1 procesadas");
  });

  it("exportar: misma ruta; si el backend no la tiene, lo dice en llano", async () => {
    const fetchSpy = jest.fn(async () => ({ ok: false, status: 404 }));
    global.fetch = fetchSpy as unknown as typeof fetch;
    pintar();
    fireEvent.click(await screen.findByRole("button", { name: /Exportar Excel/ }));
    expect(await screen.findByText("La exportación a Excel aún no está disponible.")).toBeInTheDocument();
    expect(String((fetchSpy.mock.calls[0] as unknown[])[0])).toContain("/api/v2/credit/bank/export/queue.xlsx");
  });
});
