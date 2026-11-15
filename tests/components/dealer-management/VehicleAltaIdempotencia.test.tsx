/**
 * Pulido del alta (F4D-5 3/3): la clave de idempotencia es UNA por intento de
 * alta (se reutiliza en cada reintento del mismo contenido, cambia si el
 * contenido cambia y se descarta tras un 201), el 409 VIN_DUPLICATE marca el
 * campo VIN y el boton queda deshabilitado mientras hay un envio en curso.
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
// Objeto estable: el efecto del formulario depende de `branding.data` y uno nuevo por render lo haria ciclar.
const mockBranding = { data: { locale: "es-AR", currency: "ARS" }, isPending: false, isLoading: false };
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => mockBranding,
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
jest.mock("@/lib/dealer-management/acquisition-modes", () => ({
  useAcquisitionModes: () => ({ status: "ok", items: [{ code: "compra_directa", label: "Compra directa" }], retry: () => {} }),
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


const res = (status: number, json: unknown) =>
  ({ ok: status < 300, status, json: async () => json }) as unknown as Response;
const keyOf = (i: number) => (fetchMock.mock.calls[i][1]?.headers as Record<string, string>)["Idempotency-Key"];

function envia() {
  fireEvent.click(screen.getByRole("button", { name: "Elegir vendedor" }));
  fireEvent.submit(screen.getByTestId("vehicle-manual-form"));
}

describe("alta: clave de idempotencia y errores", () => {
  it("dos envios del mismo contenido usan la misma clave", async () => {
    fetchMock.mockResolvedValue(res(500, { reason_code: "BOOM" }));
    render(<DealerVehicleNuevoPage />);
    rellena();
    envia();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId("vehicle-manual-error")).toBeInTheDocument());
    fireEvent.submit(screen.getByTestId("vehicle-manual-form"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(keyOf(1)).toBe(keyOf(0));
  });

  it("si cambia el contenido, la clave es otra", async () => {
    fetchMock.mockResolvedValue(res(500, { reason_code: "BOOM" }));
    render(<DealerVehicleNuevoPage />);
    rellena();
    envia();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId("vehicle-manual-error")).toBeInTheDocument());
    escribe(/^Costo de compra/, "2000");
    escribe(/^Importe del pago 1/, "2000");
    fireEvent.submit(screen.getByTestId("vehicle-manual-form"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(keyOf(1)).not.toBe(keyOf(0));
  });

  it("tras un 201 la siguiente alta usa otra clave", async () => {
    fetchMock.mockResolvedValue(res(201, { id: "veh-1" }));
    render(<DealerVehicleNuevoPage />);
    rellena();
    envia();
    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    fireEvent.submit(screen.getByTestId("vehicle-manual-form"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(keyOf(1)).not.toBe(keyOf(0));
  });

  it("siempre viaja una clave (IDEMPOTENCY_KEY_REQUIRED no puede ocurrir)", async () => {
    fetchMock.mockResolvedValue(res(201, { id: "veh-1" }));
    render(<DealerVehicleNuevoPage />);
    rellena();
    envia();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(keyOf(0)).toMatch(/\S+/);
  });

  it("mientras hay un envio en curso el boton esta deshabilitado", async () => {
    let fin: (r: Response) => void = () => {};
    fetchMock.mockReturnValue(new Promise<Response>((r) => (fin = r)));
    render(<DealerVehicleNuevoPage />);
    rellena();
    envia();
    await waitFor(() => expect(screen.getByRole("button", { name: /Guardando/ })).toBeDisabled());
    fin(res(500, { reason_code: "BOOM" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Crear vehículo" })).toBeEnabled());
  });

  it("409 VIN_DUPLICATE: mensaje de VIN y campo marcado", async () => {
    fetchMock.mockResolvedValue(res(409, { reason_code: "VIN_DUPLICATE" }));
    render(<DealerVehicleNuevoPage />);
    rellena();
    envia();
    await waitFor(() => expect(screen.getByText(/Ya existe un vehículo con ese VIN/)).toBeInTheDocument());
    expect(screen.getByLabelText(/^VIN/)).toHaveAttribute("aria-invalid", "true");
  });

  it("409 IDEMPOTENCY_KEY_REUSED se explica en pantalla", async () => {
    fetchMock.mockResolvedValue(res(409, { reason_code: "IDEMPOTENCY_KEY_REUSED" }));
    render(<DealerVehicleNuevoPage />);
    rellena();
    envia();
    await waitFor(() => expect(screen.getByText(/ya se envió antes con otros datos/)).toBeInTheDocument());
  });
});
