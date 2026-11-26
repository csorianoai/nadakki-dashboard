/**
 * "Cargar un auto" (pedido de César, 26-nov): la pantalla de alta muestra el recorrido completo desde que se abre,
 * marca lo que el formulario ya tiene bien cargado (misma validacion que el boton Crear) y, al crear, avisa el
 * progreso y lleva a la ficha del auto, donde se suben las fotos y se publica.
 */
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import DealerVehicleNuevoPage from "@/app/autos/dealer/inventario/nuevo/page";
import { pasosAltaAuto } from "@/components/dealer-management/VehicleManualForm";
import { EVENTO_PROGRESO } from "@/lib/dealer/pasos-tarea";
import { VEHICLE_WRITE_CAPABILITY } from "@/lib/dealer-management/vehicle-manual";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("@/lib/dealer-management/inventory", () => ({
  fetchDealerInventory: jest.fn(async () => []),
}));

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: jest.fn() }),
  usePathname: () => "/autos/dealer/inventario/nuevo",
}));

let branding: { locale?: string | null; currency?: string | null } | undefined;
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: branding, isPending: false, isLoading: false }),
}));

const batchMock = jest.fn();
jest.mock("@/lib/access/hooks", () => ({
  useAccessEntitlementsBatch: (keys: string[]) => batchMock(keys),
}));

let resolution: unknown;
/**
 * La pagina del inventario ya NO decide por el contexto local: lo hace por el
 * batch (#562), y del contexto solo saca el `dealerId` con el que CONSTRUIR la
 * peticion, via `selectedDealerIdentity`. El mock tenia solo
 * `resolveDealerAccessContext`, asi que al rebasar sobre staging la pagina
 * llamaba a una funcion que el mock no exporta.
 */
let identidad: { tenantId: string; dealerId: string; organizationUnitId: string | null } | null = null;
jest.mock("@/lib/dealer/access-context", () => ({
  resolveDealerAccessContext: () => resolution,
  selectedDealerIdentity: () => identidad,
}));

/** El selector de varias asignaciones no se ejercita aqui: con binding escrito
 *  la pagina no pide la lista. Vive en tests/app/InventarioSelectorDealer. */
jest.mock("@/lib/dealer/dealer-context-api", () => ({
  ...jest.requireActual("@/lib/dealer/dealer-context-api"),
  fetchMyDealerContext: jest.fn(async () => []),
}));

jest.mock("@/lib/dealer-management/acquisition-modes", () => ({
  useAcquisitionModes: () => ({ status: "ok", items: [{ code: "compra_directa", label: "Compra directa" }], retry: () => {} }),
}));
jest.mock("@/lib/api/fetch-client", () => ({
  apiFetch: jest.fn(),
}));

/** El selector de contactos (F4C-7) se prueba en tests/dealer-contactos; aqui solo entrega un vendedor. */
jest.mock("@/app/autos/dealer/contactos/ContactoSelector", () => ({
  ContactoSelector: ({ onSelect }: { onSelect: (c: { id: string; display_name: string }) => void }) => (
    <button type="button" onClick={() => onSelect({ id: "123e4567-e89b-42d3-a456-426614174000", display_name: "Ana" })}>
      Elegir vendedor
    </button>
  ),
}));

import { apiFetch } from "@/lib/api/fetch-client";

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

const READY = {
  status: "ready",
  reason_code: null,
  context: { tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" },
};

function batch(state: Partial<{ isLoading: boolean; error: unknown; allowed: boolean; reason: string }>) {
  return {
    isLoading: state.isLoading ?? false,
    isPending: state.isLoading ?? false,
    isError: Boolean(state.error),
    error: state.error ?? null,
    data: state.error
      ? undefined
      : {
          results: {
            [VEHICLE_WRITE_CAPABILITY]: {
              allowed: state.allowed ?? false,
              reason_code: state.reason ?? (state.allowed ? "ALLOWED" : "DEFAULT_DENY"),
              limit: null,
              current_usage: null,
            },
          },
        },
  };
}

function rellenaMinimo() {
  fireEvent.change(screen.getByRole("textbox", { name: /Marca/ }), { target: { value: "Toyota" } });
  fireEvent.change(screen.getByRole("textbox", { name: /Modelo/ }), { target: { value: "Hilux" } });
  fireEvent.change(screen.getByRole("textbox", { name: /Año/ }), { target: { value: "2021" } });
}

/** El alta ahora lleva la compra (F4C-5 3/3): costo, pago por el mismo importe y vendedor. */
function rellenaCompra() {
  const escribe = (name: RegExp, value: string) => fireEvent.change(screen.getByLabelText(name), { target: { value } });
  escribe(/^Costo de compra/, "1000");
  escribe(/^Fecha de adquisición/, "2026-10-01");
  escribe(/^País de adquisición/, "AR");
  escribe(/^Código de adquisición/, "compra_directa");
  escribe(/^Importe del pago 1/, "1000");
  fireEvent.click(screen.getByRole("button", { name: "Elegir vendedor" }));
}


beforeEach(() => {
  push.mockReset();
  fetchMock.mockReset();
  batchMock.mockReset();
  branding = { locale: "es-AR", currency: "ARS" };
  resolution = READY;
  identidad = { tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" };
  batchMock.mockReturnValue(batch({ allowed: true }));
});

function lista() {
  return screen.getByRole("region", { name: "Cargar un auto" });
}
function hecho(id: string) {
  return within(screen.getByTestId(`paso-${id}`)).queryByText("Hecho:") !== null;
}

describe("Cargar un auto: pasos en la pantalla de alta", () => {
  it("desde que se abre muestra todo el recorrido con nada hecho", () => {
    render(<DealerVehicleNuevoPage />);
    expect(lista()).toHaveTextContent("Cargar un auto: 0 de 7");
    for (const id of ["datos", "precio", "compra", "modo", "vendedor", "pagos", "factura", "crear", "fotos"]) {
      expect(screen.getByTestId(`paso-${id}`)).toBeInTheDocument();
      expect(hecho(id)).toBe(false);
    }
    expect(screen.getByTestId("paso-siguiente-aqui")).toHaveTextContent("Datos del auto");
  });

  it("sin permiso de carga no muestra la lista ni el formulario", () => {
    batchMock.mockReturnValue(batch({ allowed: false }));
    render(<DealerVehicleNuevoPage />);
    expect(screen.queryByRole("region", { name: "Cargar un auto" })).toBeNull();
  });

  it("marca cada paso a medida que el formulario queda bien cargado", () => {
    render(<DealerVehicleNuevoPage />);
    rellenaMinimo();
    expect(hecho("datos")).toBe(true);
    expect(hecho("compra")).toBe(false);
    // Un año fuera de rango deshace el paso: sale de la validacion real, no de que el campo tenga algo.
    fireEvent.change(screen.getByRole("textbox", { name: /Año/ }), { target: { value: "1800" } });
    expect(hecho("datos")).toBe(false);
    fireEvent.change(screen.getByRole("textbox", { name: /Año/ }), { target: { value: "2021" } });

    rellenaCompra();
    expect(hecho("compra")).toBe(true);
    expect(hecho("modo")).toBe(true);
    expect(hecho("vendedor")).toBe(true);
    expect(hecho("pagos")).toBe(true);
    expect(lista()).toHaveTextContent("Cargar un auto: 5 de 7");
    expect(screen.getByTestId("paso-siguiente-aqui")).toHaveTextContent("Tocar «Crear vehículo»");

    // Si los pagos dejan de sumar el costo, el paso vuelve a pendiente.
    fireEvent.change(screen.getByLabelText(/^Importe del pago 1/), { target: { value: "900" } });
    expect(hecho("pagos")).toBe(false);
  });

  it("el precio es opcional: se marca si se carga, pero no cuenta para el total", () => {
    render(<DealerVehicleNuevoPage />);
    fireEvent.change(screen.getByRole("textbox", { name: /^Precio \(ARS\)/ }), { target: { value: "25000000" } });
    expect(hecho("precio")).toBe(true);
    expect(lista()).toHaveTextContent("0 de 7");
  });

  it("al crear avisa el progreso y lleva a la ficha del auto", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: "veh-9" }) } as unknown as Response);
    const avisos: string[] = [];
    const oir = (e: Event) => avisos.push((e as CustomEvent<{ motivo: string }>).detail.motivo);
    window.addEventListener(EVENTO_PROGRESO, oir);
    render(<DealerVehicleNuevoPage />);
    rellenaMinimo();
    rellenaCompra();
    await act(async () => {
      fireEvent.submit(screen.getByTestId("vehicle-manual-form"));
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/autos/dealer/inventario/veh-9"));
    window.removeEventListener(EVENTO_PROGRESO, oir);
    expect(avisos).toEqual(["auto_creado"]);
    expect(hecho("crear")).toBe(true);
    const siguiente = screen.getByRole("link", { name: /Siguiente paso: Subir fotos y publicarlo/ });
    expect(siguiente).toHaveAttribute("href", "/autos/dealer/inventario/veh-9");
  });

  it("si el alta falla no avisa progreso ni marca el paso de crear", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ detail: { reason_code: "CAPABILITY_DENIED" } }),
    } as unknown as Response);
    const oir = jest.fn();
    window.addEventListener(EVENTO_PROGRESO, oir);
    render(<DealerVehicleNuevoPage />);
    rellenaMinimo();
    rellenaCompra();
    await act(async () => {
      fireEvent.submit(screen.getByTestId("vehicle-manual-form"));
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    window.removeEventListener(EVENTO_PROGRESO, oir);
    expect(oir).not.toHaveBeenCalled();
    expect(hecho("crear")).toBe(false);
    expect(push).not.toHaveBeenCalled();
  });
});

describe("pasosAltaAuto", () => {
  it("creado sin id manda a buscarlo al inventario, sin inventar una ficha", () => {
    const fotos = pasosAltaAuto(null, { creado: true, vehicleId: null }).find((p) => p.id === "fotos");
    expect(fotos?.enlace).toBe("/autos/dealer/inventario");
    expect(fotos?.titulo).toMatch(/Buscar el auto en el inventario/);
  });
  it("antes de crear el paso de fotos no tiene enlace", () => {
    expect(pasosAltaAuto(null).find((p) => p.id === "fotos")?.enlace).toBeUndefined();
  });
});
