/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import BillingDashboard from "@/components/billing/BillingDashboard";
import InvoiceTable from "@/components/billing/InvoiceTable";

function res(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function mockFetch(handler: (url: string) => ReturnType<typeof res>) {
  (global as any).fetch = jest.fn(async (url: string) => handler(String(url)));
}

describe("Facturación: estados de carga", () => {
  afterEach(() => jest.restoreAllMocks());

  it("respuesta válida: muestra el plan", async () => {
    mockFetch(() => res(200, { plan: "starter", subscription_status: "active" }));
    render(<BillingDashboard tenantId="t1" />);
    await waitFor(() => expect(screen.getByText("starter")).toBeTruthy());
    expect(screen.queryByText(/No se pudo/i)).toBeNull();
  });

  it("respuesta vacía (404 sin suscripción): 'Sin datos', no error", async () => {
    mockFetch(() => res(404, { detail: "Not Found" }));
    render(<BillingDashboard tenantId="t1" />);
    await waitFor(() => expect(screen.getByText(/Sin datos/i)).toBeTruthy());
    expect(screen.queryByText(/No se pudo|Error de red/i)).toBeNull();
    expect(screen.queryByText(/Cargando facturación/i)).toBeNull();
  });

  it("fallo del backend (500): mensaje con acción y sin volcar el error crudo", async () => {
    mockFetch(() => res(500, { detail: "Traceback: psycopg2 boom" }));
    render(<BillingDashboard tenantId="t1" />);
    await waitFor(() => expect(screen.getByText(/Reintentar/i)).toBeTruthy());
    expect(screen.queryByText(/psycopg2|Traceback/)).toBeNull();
    expect(screen.queryByText(/Cargando facturación/i)).toBeNull();
  });

  it("facturas: vacía muestra estado vacío, 500 muestra aviso con acción", async () => {
    mockFetch(() => res(200, { invoices: [] }));
    const { unmount } = render(<InvoiceTable tenantId="t1" />);
    await waitFor(() => expect(screen.getByText(/Sin datos|No hay facturas/i)).toBeTruthy());
    unmount();
    mockFetch(() => res(500, { detail: "Traceback: boom" }));
    render(<InvoiceTable tenantId="t1" />);
    await waitFor(() => expect(screen.getByText(/Reintentar/i)).toBeTruthy());
    expect(screen.queryByText(/Traceback/)).toBeNull();
  });
});
