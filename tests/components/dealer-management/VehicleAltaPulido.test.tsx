/**
 * Pulido del alta con compra (F4D-5): VIN duplicado visible, clave de
 * idempotencia estable por intento, modos de adquisicion del tenant,
 * sin desborde horizontal y errores que desaparecen al corregir.
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
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import { apiFetch } from "@/lib/api/fetch-client";
const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

const res = (status: number, body: unknown) =>
  ({ ok: status < 400, status, json: async () => body }) as unknown as Response;
const MODOS = { items: [{ code: "compra_directa", label: "Compra directa" }, { code: "permuta", label: "Permuta" }] };

/** GET de modos por URL; los POST salen de la cola `posts`. */
let modosRespuesta: () => Response;
let posts: Response[];
const postCalls = () => fetchMock.mock.calls.filter(([, init]) => init?.method === "POST");
const keyDe = (i: number) => (postCalls()[i][1]?.headers as Record<string, string>)["Idempotency-Key"];

const escribe = (name: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(name), { target: { value } });

async function rellena() {
  escribe(/^Marca/, "Toyota");
  escribe(/^Modelo/, "Hilux");
  escribe(/^Año/, "2021");
  escribe(/^VIN/, "1HGCM82633A004352");
  escribe(/^Costo de compra/, "1000");
  escribe(/^Fecha de adquisición/, "2026-10-01");
  escribe(/^País de adquisición/, "AR");
  await screen.findByRole("option", { name: "Compra directa" });
  escribe(/^Código de adquisición/, "compra_directa");
  escribe(/^Importe del pago 1/, "1000");
  fireEvent.click(screen.getByRole("button", { name: "Elegir vendedor" }));
}
const envia = () => fireEvent.submit(screen.getByTestId("vehicle-manual-form"));

beforeEach(() => {
  push.mockReset();
  fetchMock.mockReset();
  modosRespuesta = () => res(200, MODOS);
  posts = [];
  fetchMock.mockImplementation(async (path, init) => {
    if (init?.method === "POST") return posts.shift() ?? res(201, { id: "veh-1" });
    if (String(path).endsWith("/api/v1/autos/acquisition-modes")) return modosRespuesta();
    throw new Error(`peticion inesperada ${String(path)}`);
  });
});

describe("errores del backend", () => {
  it("409 VIN_DUPLICATE dice que el VIN ya existe y marca el campo", async () => {
    posts = [res(409, { reason_code: "VIN_DUPLICATE" })];
    render(<DealerVehicleNuevoPage />);
    await rellena();
    envia();
    await waitFor(() => expect(screen.getAllByText(/Ya existe un vehículo con ese VIN/).length).toBeGreaterThan(0));
    expect(screen.getByLabelText(/^VIN/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText(/No se pudo guardar el vehículo/)).not.toBeInTheDocument();
  });

  it.each([
    ["SELLER_CONTACT_NOT_FOUND", 422, /contacto vendedor/i],
    ["PAYMENT_SUM_MISMATCH", 422, /suma de los pagos/i],
    ["CAPABILITY_DENIED", 403, /permiso/i],
    ["DEALER_NOT_ASSIGNED", 403, /asignad/i],
    ["IDEMPOTENCY_KEY_REUSED", 409, /ya se envió/i],
  ])("%s tiene mensaje propio", async (code, status, texto) => {
    posts = [res(status, { reason_code: code })];
    render(<DealerVehicleNuevoPage />);
    await rellena();
    envia();
    await waitFor(() => expect(screen.getByTestId("vehicle-manual-error")).toHaveTextContent(texto));
    expect(screen.getByTestId("vehicle-manual-error")).toHaveAttribute("data-reason-code", code);
    expect(screen.queryByText(/Revisa los datos e intenta de nuevo/)).not.toBeInTheDocument();
  });

  it("un codigo desconocido conserva el generico con su reason_code", async () => {
    posts = [res(422, { reason_code: "RARO_XYZ" })];
    render(<DealerVehicleNuevoPage />);
    await rellena();
    envia();
    await waitFor(() => expect(screen.getByText(/Revisa los datos e intenta de nuevo/)).toBeInTheDocument());
    expect(screen.getByTestId("vehicle-manual-error")).toHaveAttribute("data-reason-code", "RARO_XYZ");
  });
});

describe("clave de idempotencia", () => {
  it("el reintento del mismo contenido reutiliza la clave y tras 201 la siguiente alta usa otra", async () => {
    posts = [res(500, { reason_code: "BOOM" }), res(201, { id: "veh-1" })];
    render(<DealerVehicleNuevoPage />);
    await rellena();
    envia();
    await waitFor(() => expect(postCalls()).toHaveLength(1));
    await waitFor(() => expect(screen.getByRole("button", { name: "Crear vehículo" })).toBeEnabled());
    envia();
    await waitFor(() => expect(postCalls()).toHaveLength(2));
    expect(keyDe(1)).toBe(keyDe(0));
    await waitFor(() => expect(push).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole("button", { name: "Crear vehículo" })).toBeEnabled());
    envia();
    await waitFor(() => expect(postCalls()).toHaveLength(3));
    expect(keyDe(2)).not.toBe(keyDe(0));
  });

  it("si cambia el contenido es otra compra y lleva otra clave", async () => {
    posts = [res(500, { reason_code: "BOOM" })];
    render(<DealerVehicleNuevoPage />);
    await rellena();
    envia();
    await waitFor(() => expect(postCalls()).toHaveLength(1));
    await waitFor(() => expect(screen.getByRole("button", { name: "Crear vehículo" })).toBeEnabled());
    escribe(/^Costo de compra/, "2000");
    escribe(/^Importe del pago 1/, "2000");
    envia();
    await waitFor(() => expect(postCalls()).toHaveLength(2));
    expect(keyDe(1)).not.toBe(keyDe(0));
  });

  it("con un envio en curso el boton queda deshabilitado y un segundo envio no sale", async () => {
    let suelta: (r: Response) => void = () => {};
    posts = [new Promise<Response>((r) => { suelta = r; }) as unknown as Response];
    render(<DealerVehicleNuevoPage />);
    await rellena();
    envia();
    envia();
    await waitFor(() => expect(screen.getByRole("button", { name: /Guardando/ })).toBeDisabled());
    expect(postCalls()).toHaveLength(1);
    suelta(res(201, { id: "veh-1" }));
    await waitFor(() => expect(push).toHaveBeenCalled());
  });

  it("toda peticion de alta lleva Idempotency-Key (IDEMPOTENCY_KEY_REQUIRED no puede ocurrir)", async () => {
    render(<DealerVehicleNuevoPage />);
    await rellena();
    envia();
    await waitFor(() => expect(postCalls()).toHaveLength(1));
    expect(keyDe(0)).toMatch(/^[0-9a-f-]{36}$/i);
  });
});

describe("codigo de adquisicion", () => {
  it("es un desplegable con los modos del endpoint: pinta el label y envia el code", async () => {
    render(<DealerVehicleNuevoPage />);
    await rellena();
    const select = screen.getByLabelText(/^Código de adquisición/);
    expect(select.tagName).toBe("SELECT");
    expect(screen.getByRole("option", { name: "Permuta" })).toHaveValue("permuta");
    envia();
    await waitFor(() => expect(postCalls()).toHaveLength(1));
    const body = JSON.parse(String(postCalls()[0][1]?.body)) as { purchase: { acquisition_mode_code: string } };
    expect(body.purchase.acquisition_mode_code).toBe("compra_directa");
  });

  it("si la lectura falla hay error con reintento y ningun campo libre ni lista inventada", async () => {
    modosRespuesta = () => res(500, { reason_code: "BOOM" });
    render(<DealerVehicleNuevoPage />);
    const reintentar = await screen.findByRole("button", { name: /Reintentar/ });
    expect(screen.queryByLabelText(/^Código de adquisición/)).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Compra directa" })).not.toBeInTheDocument();
    modosRespuesta = () => res(200, MODOS);
    fireEvent.click(reintentar);
    expect(await screen.findByRole("option", { name: "Compra directa" })).toBeInTheDocument();
  });
});

describe("errores de validacion", () => {
  it("corregir el campo borra su error sin reenviar", async () => {
    render(<DealerVehicleNuevoPage />);
    await screen.findByRole("option", { name: "Compra directa" });
    envia();
    expect(screen.getByText("El costo es obligatorio.")).toBeInTheDocument();
    escribe(/^Costo de compra/, "1000");
    expect(screen.queryByText("El costo es obligatorio.")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^Costo de compra/)).not.toHaveAttribute("aria-invalid");
    expect(screen.getByText("El año es obligatorio.")).toBeInTheDocument();
    escribe(/^Año/, "2021");
    expect(screen.queryByText("El año es obligatorio.")).not.toBeInTheDocument();
  });

  it("el error del VIN duplicado desaparece al editar el VIN", async () => {
    posts = [res(409, { reason_code: "VIN_DUPLICATE" })];
    render(<DealerVehicleNuevoPage />);
    await rellena();
    envia();
    await waitFor(() => expect(screen.getByLabelText(/^VIN/)).toHaveAttribute("aria-invalid", "true"));
    escribe(/^VIN/, "1HGCM82633A004353");
    expect(screen.getByLabelText(/^VIN/)).not.toHaveAttribute("aria-invalid");
  });
});

describe("sin desborde horizontal", () => {
  it("las grillas arrancan en una columna y los fieldset pueden encogerse", async () => {
    render(<DealerVehicleNuevoPage />);
    await screen.findByRole("option", { name: "Compra directa" });
    const seccion = screen.getByTestId("vehicle-purchase");
    seccion.querySelectorAll(".grid").forEach((g) => expect(g).toHaveClass("grid-cols-1"));
    seccion.querySelectorAll("fieldset").forEach((f) => expect(f).toHaveClass("min-w-0"));
    expect(screen.getByRole("main")).not.toHaveClass("overflow-x-hidden");
  });
});
