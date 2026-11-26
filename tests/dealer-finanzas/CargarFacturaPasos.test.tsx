/**
 * "Cargar una factura" (pedido de César, 26-nov): la pantalla de finanzas muestra el recorrido completo de una factura
 * de taller (costo Reparación por /repair-invoices) desde que se abre, marca lo que ya está bien cargado con la misma
 * validación que «Registrar costo» y, al registrar, muestra lo que pasó, avisa el progreso y ofrece el libro mayor.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import DealerFinanzasPage from "@/app/autos/dealer/finanzas/page";
import { pasosCargarFactura, textoFinalFactura } from "@/app/autos/dealer/finanzas/pasos-factura";
import { EVENTO_PROGRESO } from "@/lib/dealer/pasos-tarea";
import { COSTS_CAPABILITY, COSTS_VEHICLE_CAPABILITY } from "@/lib/dealer-management/vehicle-costs";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/autos/dealer/finanzas",
}));

jest.mock("@/lib/dealer-management/inventory", () => ({
  fetchDealerInventory: jest.fn(async () => [
    { id: "veh-1", make: "Toyota", model: "Hilux", year: "2021", status: "draft" },
  ]),
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
jest.mock("@/lib/dealer/access-context", () => ({
  resolveDealerAccessContext: () => resolution,
}));

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import { apiFetch } from "@/lib/api/fetch-client";

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

const READY = {
  status: "ready",
  reason_code: null,
  context: { tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" },
};

function entry(allowed: boolean, reason?: string) {
  const reason_code =
    reason ?? (allowed ? "ALLOWED" : "DEFAULT_DENY");
  return { allowed, reason_code, limit: null, current_usage: null };
}

function batch(state: { isLoading?: boolean; error?: unknown; vehiculos?: boolean; costos?: boolean; reason?: string }) {
  return {
    isLoading: state.isLoading ?? false,
    isPending: state.isLoading ?? false,
    isError: Boolean(state.error),
    error: state.error ?? null,
    data: state.error
      ? undefined
      : {
          results: {
            [COSTS_VEHICLE_CAPABILITY]: entry(state.vehiculos ?? true),
            [COSTS_CAPABILITY]: entry(state.costos ?? true, state.reason),
          },
        },
  };
}


function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DealerFinanzasPage />
    </QueryClientProvider>,
  );
}

function responde(postOk = true) {
  fetchMock.mockImplementation(async (path: string, init?: RequestInit) => {
    if (path.endsWith("/costs/total")) {
      return { ok: true, status: 200, json: async () => [] } as unknown as Response;
    }
    if (path.endsWith("/documents")) {
      return { ok: true, status: 201, json: async () => ({ id: "doc-1" }) } as unknown as Response;
    }
    if (init?.method === "POST" && !postOk) {
      return { ok: false, status: 500, json: async () => ({ detail: { reason_code: "INTERNAL" } }) } as unknown as Response;
    }
    return { ok: true, status: 201, json: async () => ({ id: "cost-1", cost_type: "repair" }) } as unknown as Response;
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  responde();
  branding = { locale: "es-AR", currency: "ARS" };
  resolution = READY;
  batchMock.mockReturnValue(batch({}));
});

const lista = () => screen.getByRole("region", { name: "Cargar una factura" });
const hecho = (id: string) => within(screen.getByTestId(`paso-${id}`)).queryByText("Hecho:") !== null;

async function eligeAuto() {
  fireEvent.change(await screen.findByTestId("finanzas-vehiculo"), { target: { value: "veh-1" } });
  await screen.findByTestId("costo-alta-form");
}

async function completaFactura() {
  fireEvent.change(screen.getByRole("combobox", { name: /Tipo de costo/ }), { target: { value: "repair" } });
  fireEvent.change(screen.getByRole("textbox", { name: /Monto/ }), { target: { value: "1500,50" } });
  fireEvent.change(screen.getByLabelText(/^Fecha/), { target: { value: "30/09/2026" } });
  fireEvent.change(screen.getByRole("textbox", { name: /Proveedor/ }), { target: { value: "Taller Sur" } });
  fireEvent.change(screen.getByRole("textbox", { name: /N\.º de factura/ }), { target: { value: "A-1" } });
  const pdf = new File(["%PDF"], "factura.pdf", { type: "application/pdf" });
  fireEvent.change(screen.getByLabelText(/Subir factura/), { target: { files: [pdf] } });
  await screen.findByText("Factura subida: factura.pdf");
}

describe("Cargar una factura: pasos en finanzas", () => {
  it("desde que se abre muestra el recorrido y el primer paso es elegir el auto", async () => {
    montar();
    await screen.findByTestId("finanzas-vehiculo");
    expect(lista()).toHaveTextContent("Cargar una factura: 0 de 8");
    for (const id of ["auto", "tipo", "proveedor", "monto", "numero", "fecha", "archivo", "guardar"]) {
      expect(hecho(id)).toBe(false);
    }
    expect(screen.getByTestId("paso-siguiente-aqui")).toHaveTextContent("Elegir el auto");
  });

  it("sin permiso no muestra la lista", () => {
    batchMock.mockReturnValue(batch({ costos: false }));
    montar();
    expect(screen.queryByRole("region", { name: "Cargar una factura" })).toBeNull();
  });

  it("marca cada paso con el estado real del formulario", async () => {
    montar();
    await eligeAuto();
    expect(hecho("auto")).toBe(true);
    expect(hecho("tipo")).toBe(false);
    // El tipo por defecto es Compra: proveedor y archivo no aplican todavía.
    fireEvent.change(screen.getByRole("combobox", { name: /Tipo de costo/ }), { target: { value: "repair" } });
    expect(hecho("tipo")).toBe(true);
    expect(hecho("proveedor")).toBe(false);
    fireEvent.change(screen.getByRole("textbox", { name: /Monto/ }), { target: { value: "-3" } });
    expect(hecho("monto")).toBe(false);
    fireEvent.change(screen.getByRole("textbox", { name: /Monto/ }), { target: { value: "1500,50" } });
    expect(hecho("monto")).toBe(true);
    fireEvent.change(screen.getByLabelText(/^Fecha/), { target: { value: "31/02/2026" } });
    expect(hecho("fecha")).toBe(false);
    await completaFactura();
    for (const id of ["auto", "tipo", "proveedor", "monto", "numero", "fecha", "archivo"]) expect(hecho(id)).toBe(true);
    expect(hecho("guardar")).toBe(false);
    expect(lista()).toHaveTextContent("7 de 8");
    expect(screen.getByTestId("paso-siguiente-aqui")).toHaveTextContent("Registrar costo");
  });

  it("al registrar muestra lo que pasó, avisa el progreso y ofrece el libro mayor", async () => {
    const avisos: string[] = [];
    const oir = (e: Event) => avisos.push((e as CustomEvent<{ motivo: string }>).detail.motivo);
    window.addEventListener(EVENTO_PROGRESO, oir);
    montar();
    await eligeAuto();
    await completaFactura();
    await act(async () => {
      fireEvent.submit(screen.getByTestId("costo-alta-form"));
    });
    const final = await screen.findByTestId("pasos-completos");
    window.removeEventListener(EVENTO_PROGRESO, oir);
    expect(avisos).toEqual(["factura_cargada"]);
    expect(final).toHaveTextContent("Listo: factura cargada");
    expect(final).toHaveTextContent("Taller Sur");
    expect(final).toHaveTextContent("factura A-1");
    expect(final.textContent).toContain("1.500,50");
    expect(lista()).toHaveTextContent("8 de 8");
    expect(screen.getByRole("link", { name: "libro mayor" })).toHaveAttribute("href", "/contable/libro-mayor");

    // Empezar otra factura vuelve a la lista de pasos.
    fireEvent.change(screen.getByRole("textbox", { name: /Monto/ }), { target: { value: "10" } });
    expect(screen.queryByTestId("pasos-completos")).toBeNull();
    expect(screen.queryByTestId("factura-cargada-siguiente")).toBeNull();
  });

  it("un costo que no es factura no se anuncia como factura cargada", async () => {
    const oir = jest.fn();
    window.addEventListener(EVENTO_PROGRESO, oir);
    montar();
    await eligeAuto();
    fireEvent.change(screen.getByRole("combobox", { name: /Tipo de costo/ }), { target: { value: "transport" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Monto/ }), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText(/^Fecha/), { target: { value: "30/09/2026" } });
    await act(async () => {
      fireEvent.submit(screen.getByTestId("costo-alta-form"));
    });
    await screen.findByTestId("costo-alta-ack");
    window.removeEventListener(EVENTO_PROGRESO, oir);
    expect(oir).not.toHaveBeenCalled();
    expect(screen.queryByTestId("pasos-completos")).toBeNull();
  });

  it("si el registro falla no hay final ni aviso", async () => {
    responde(false);
    const oir = jest.fn();
    window.addEventListener(EVENTO_PROGRESO, oir);
    montar();
    await eligeAuto();
    await completaFactura();
    await act(async () => {
      fireEvent.submit(screen.getByTestId("costo-alta-form"));
    });
    await screen.findByTestId("costo-alta-error");
    window.removeEventListener(EVENTO_PROGRESO, oir);
    expect(oir).not.toHaveBeenCalled();
    expect(hecho("guardar")).toBe(false);
  });
});

describe("pasosCargarFactura", () => {
  it("sin auto elegido nada está hecho", () => {
    expect(pasosCargarFactura(false, null, null).every((p) => !p.hecho)).toBe(true);
  });
  it("el texto final dice qué quedó registrado", () => {
    expect(textoFinalFactura({ monto: "$ 10,00", proveedor: "Taller", numero: "7" })).toMatch(
      /costo de reparación por \$ 10,00 de Taller \(factura 7\)/,
    );
  });
});
