/**
 * Cableado de la pagina 'Nuevo vehiculo' con compra (F4C-5 3/3): el envio sale
 * por POST /vehicles/purchase con Idempotency-Key, el vendedor viene del
 * selector de contactos (F4C-7) y nada se manda si la compra no valida.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import DealerVehicleNuevoPage from "@/app/autos/dealer/inventario/nuevo/page";
import { VEHICLE_WRITE_CAPABILITY } from "@/lib/dealer-management/vehicle-manual";

const UUID = "123e4567-e89b-42d3-a456-426614174000";

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));
const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: jest.fn() }),
  usePathname: () => "/autos/dealer/inventario/nuevo",
}));
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: { locale: "es-AR", currency: "ARS" }, isPending: false, isLoading: false }),
}));
jest.mock("@/lib/access/hooks", () => ({
  useAccessEntitlementsBatch: () => ({
    isLoading: false,
    error: null,
    data: { results: { [VEHICLE_WRITE_CAPABILITY]: { allowed: true, reason_code: "ALLOWED" } } },
  }),
}));
jest.mock("@/lib/dealer/access-context", () => ({
  resolveDealerAccessContext: () => ({ status: "ready", reason_code: null }),
  selectedDealerIdentity: () => ({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: null }),
}));
jest.mock("@/app/autos/dealer/contactos/ContactoSelector", () => ({
  ContactoSelector: ({ onSelect }: { onSelect: (c: { id: string; display_name: string }) => void }) => (
    <button type="button" onClick={() => onSelect({ id: UUID, display_name: "Ana Vendedora" })}>
      Elegir vendedor
    </button>
  ),
}));
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import { apiFetch } from "@/lib/api/fetch-client";
const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

const escribe = (name: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(name), { target: { value } });

function rellena(costo = "1000") {
  escribe(/^Marca/, "Toyota");
  escribe(/^Modelo/, "Hilux");
  escribe(/^Año/, "2021");
  escribe(/^Costo de compra/, costo);
  escribe(/^Fecha de adquisición/, "2026-10-01");
  escribe(/^País de adquisición/, "AR");
  escribe(/^Código de adquisición/, "compra_directa");
  escribe(/^Importe del pago 1/, "1000");
}

beforeEach(() => {
  push.mockReset();
  fetchMock.mockReset();
});

describe("alta con compra", () => {
  it("sin costo no sale ninguna peticion y el error es visible", () => {
    render(<DealerVehicleNuevoPage />);
    rellena("");
    fireEvent.click(screen.getByRole("button", { name: "Elegir vendedor" }));
    fireEvent.submit(screen.getByTestId("vehicle-manual-form"));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("El costo es obligatorio.")).toBeInTheDocument();
  });

  it("sin elegir vendedor no sale ninguna peticion", () => {
    render(<DealerVehicleNuevoPage />);
    rellena();
    fireEvent.submit(screen.getByTestId("vehicle-manual-form"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("valido: POST /vehicles/purchase con Idempotency-Key, vendedor del selector, y navega a la ficha", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: "veh-9" }) } as unknown as Response);
    render(<DealerVehicleNuevoPage />);
    rellena();
    fireEvent.click(screen.getByRole("button", { name: "Elegir vendedor" }));
    fireEvent.submit(screen.getByTestId("vehicle-manual-form"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/v1/autos/tenants/tenant-a/dealers/dealer-a/vehicles/purchase");
    expect(init?.method).toBe("POST");
    const headers = init?.headers as Record<string, string>;
    expect(headers["Idempotency-Key"]).toBeTruthy();
    const body = JSON.parse(String(init?.body)) as { purchase: Record<string, unknown> };
    expect(body.purchase.seller_contact_id).toBe(UUID);
    expect(body.purchase.amount).toBeDefined();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/autos/dealer/inventario/veh-9"));
  });

  it("un error del backend se ve con su reason_code y no navega", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 422, json: async () => ({ reason_code: "COMPRA_INVALIDA" }) } as unknown as Response);
    render(<DealerVehicleNuevoPage />);
    rellena();
    fireEvent.click(screen.getByRole("button", { name: "Elegir vendedor" }));
    fireEvent.submit(screen.getByTestId("vehicle-manual-form"));
    await waitFor(() =>
      expect(screen.getByTestId("vehicle-manual-error")).toHaveAttribute("data-reason-code", "COMPRA_INVALIDA"),
    );
    expect(push).not.toHaveBeenCalled();
  });
});
