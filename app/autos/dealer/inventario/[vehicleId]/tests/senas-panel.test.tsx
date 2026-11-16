jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("@/lib/access/client", () => ({
  ...jest.requireActual("@/lib/access/client"),
  getAccessClientContext: () => ({ tenantId: "t1", dealerId: null, organizationUnitId: null }),
}));

import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetch-client";
import { SenasPanel } from "../SenasPanel";

function renderSenas() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <SenasPanel vehicleId="v1" currency="ARS" />
    </QueryClientProvider>,
  );
}

describe("senas en la ficha", () => {
  beforeEach(() => (apiFetch as jest.Mock).mockReset());

  it("lista las senas con su estado", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({
      ok: true, status: 200,
      json: async () => [
        { id: "1", amount: "1000.00", currency: "ARS", received_at: "2026-11-01", status: "recibida" },
        { id: "2", amount: "500.00", currency: "ARS", received_at: "2026-11-02", status: "aplicada" },
      ],
    });
    renderSenas();
    expect(await screen.findByText(/recibida/i)).toBeInTheDocument();
    expect(screen.getByText(/aplicada a la venta/i)).toBeInTheDocument();
  });

  it("si el endpoint aun no esta activo lo dice en vez de fallar en silencio", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ ok: false, status: 503, json: async () => ({ detail: { reason_code: "ESQUEMA_FISCAL_NO_APLICADO" } }) });
    renderSenas();
    await waitFor(() => expect(screen.getByTestId("senas-no-disponible")).toHaveTextContent("Disponible cuando se active la contabilidad fiscal"));
  });
});
