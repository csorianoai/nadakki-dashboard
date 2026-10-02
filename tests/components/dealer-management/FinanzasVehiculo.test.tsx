/**
 * Finanzas por vehiculo: el CIERRE y la eleccion de unidad.
 *
 * La ruta /autos/dealer/finanzas estaba en el menu del dealer y daba 404. Lo
 * primero que se mide no es el total: es el cierre. Un panel de costos que se
 * pinta cuando el batch falla es peor que un 404, porque un usuario de caja
 * veria costos y margenes que no le corresponden.
 *
 * El total y el alta se miden en el packet del panel; aqui no se repiten.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ACCESS_UNVERIFIED_MESSAGE } from "@/lib/access/reason-codes";

/** Centinela para pedirle al helper un item SIN reason_code, distinto de "no pasé ninguno". */
const SIN_CODIGO = "__sin_codigo__";

import DealerFinanzasPage from "@/app/autos/dealer/finanzas/page";
import { COSTS_CAPABILITY, COSTS_CAPABILITY_KEYS, COSTS_VEHICLE_CAPABILITY } from "@/lib/dealer-management/vehicle-costs";

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
    reason === SIN_CODIGO ? null : (reason ?? (allowed ? "ALLOWED" : "DEFAULT_DENY"));
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

function respondeTotales(body: unknown) {
  fetchMock.mockImplementation(async (path: string) => {
    if (path.endsWith("/costs/total")) {
      return { ok: true, status: 200, json: async () => body } as unknown as Response;
    }
    return { ok: true, status: 201, json: async () => ({ id: "cost-1" }) } as unknown as Response;
  });
}

async function eligeVehiculo() {
  const select = await screen.findByTestId("finanzas-vehiculo");
  fireEvent.change(select, { target: { value: "veh-1" } });
}

beforeEach(() => {
  fetchMock.mockReset();
  batchMock.mockReset();
  branding = { locale: "es-AR", currency: "ARS" };
  resolution = READY;
  batchMock.mockReturnValue(batch({}));
  respondeTotales([]);
});

describe("cierre", () => {
  it("pide al batch las dos claves del catalogo", () => {
    montar();
    expect(batchMock).toHaveBeenCalledWith(COSTS_CAPABILITY_KEYS);
  });

  it("sin contexto de dealer no pinta costos", () => {
    resolution = { status: "no_organization_unit", reason_code: "NO_ORGANIZATION_UNIT", tenantId: "t", dealerId: "d" };
    montar();
    expect(screen.queryByTestId("costo-alta-form")).toBeNull();
    expect(screen.getByTestId("finanzas-sin-contexto")).toHaveTextContent("NO_ORGANIZATION_UNIT");
  });

  it("mientras el batch carga no pinta costos", () => {
    batchMock.mockReturnValue(batch({ isLoading: true }));
    montar();
    expect(screen.queryByTestId("finanzas-vehiculo")).toBeNull();
    expect(screen.queryByTestId("costo-alta-form")).toBeNull();
  });

  it("si el batch falla cierra en vez de conceder", () => {
    batchMock.mockReturnValue(batch({ error: new Error("red caida") }));
    montar();
    expect(screen.getByTestId("finanzas-bloqueado")).toHaveAttribute("data-allowed", "false");
    expect(screen.queryByTestId("finanzas-vehiculo")).toBeNull();
  });

  it("sin la capability de costos no se ve ni el selector, y se dice cual falta", () => {
    batchMock.mockReturnValue(batch({ costos: false, reason: "UPGRADE_REQUIRED" }));
    montar();
    expect(screen.queryByTestId("finanzas-vehiculo")).toBeNull();
    const bloqueo = screen.getByTestId("finanzas-bloqueado");
    expect(bloqueo).toHaveAttribute("data-reason-code", "UPGRADE_REQUIRED");
    expect(bloqueo).toHaveTextContent(COSTS_CAPABILITY);
  });

  it("con costos pero sin ver inventario tampoco se abre", () => {
    batchMock.mockReturnValue(batch({ vehiculos: false }));
    montar();
    expect(screen.queryByTestId("finanzas-vehiculo")).toBeNull();
  });
});

describe("seleccion de unidad", () => {
  it("sin unidad elegida no se lee ningun total", async () => {
    montar();
    await screen.findByTestId("finanzas-vehiculo");
    expect(screen.getByTestId("finanzas-sin-vehiculo")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("al elegir una unidad aparece su panel de costos", async () => {
    montar();
    await eligeVehiculo();
    expect(await screen.findByTestId("costos-total")).toBeInTheDocument();
    expect(screen.getByTestId("costo-alta-form")).toBeInTheDocument();
  });
});

/**
 * "No pude evaluarte" no es "no tienes derecho" (#550).
 *
 * El motor deniega con `no_organization_unit` o `no_beneficiary_entitlement`
 * cuando no llego a comprobar el acceso --sin `organization_unit_id` la cadena
 * BENEFICIARY deniega cerrado antes de consultar nada,
 * services/access/entitlements.py:330-339--. Nombrar la capability ahi manda al
 * usuario a pedir un permiso que quiza ya tiene.
 *
 * Los codigos llegan EN MINUSCULAS dentro de un 200, no como error HTTP.
 */
describe("acceso que no se pudo verificar", () => {
  for (const codigo of ["no_organization_unit", "no_beneficiary_entitlement"]) {
    it(`con ${codigo} dice que no se pudieron verificar los accesos, no que falte la capability`, () => {
      batchMock.mockReturnValue(batch({ costos: false, reason: codigo }));
      montar();
      const bloqueo = screen.getByTestId("finanzas-bloqueado");
      expect(bloqueo).toHaveAttribute("data-no-verificado", "true");
      expect(bloqueo).toHaveTextContent(ACCESS_UNVERIFIED_MESSAGE);
      expect(bloqueo.textContent).not.toContain("reservados a quien tenga la capability");
      expect(bloqueo).toHaveAttribute("data-reason-code", codigo);
    });
  }

  it("no distingue la caja del codigo: el motor los emite en minuscula", () => {
    batchMock.mockReturnValue(batch({ costos: false, reason: "NO_ORGANIZATION_UNIT" }));
    montar();
    expect(screen.getByTestId("finanzas-bloqueado")).toHaveAttribute("data-no-verificado", "true");
    expect(screen.getByTestId("finanzas-bloqueado")).toHaveTextContent(ACCESS_UNVERIFIED_MESSAGE);
  });

  it("una denegacion normal sigue nombrando la capability que falta", () => {
    batchMock.mockReturnValue(batch({ costos: false, reason: "UPGRADE_REQUIRED" }));
    montar();
    const bloqueo = screen.getByTestId("finanzas-bloqueado");
    expect(bloqueo).toHaveAttribute("data-no-verificado", "false");
    expect(bloqueo).toHaveTextContent("reservados a quien tenga la capability");
    expect(bloqueo.textContent).not.toContain(ACCESS_UNVERIFIED_MESSAGE);
  });

  it("sin reason_code del motor no se inventa ninguno", () => {
    batchMock.mockReturnValue(batch({ costos: false, reason: SIN_CODIGO }));
    montar();
    const bloqueo = screen.getByTestId("finanzas-bloqueado");
    expect(bloqueo).not.toHaveAttribute("data-reason-code");
    expect(bloqueo.textContent).not.toContain("DEFAULT_DENY");
    expect(bloqueo.textContent).not.toContain("reason_code");
  });
});
