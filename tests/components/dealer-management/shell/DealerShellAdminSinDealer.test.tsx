/**
 * Administrador sin concesionario en Dealer OS (DASH-NAV, tras #827).
 *
 * Comportamiento que se fija:
 *  - Sin asignacion de dealer, el shell NO pinta los hijos (D1, sin cambios) para
 *    cualquier rol, incluidos tenant_admin y platform_superadmin.
 *  - Un usuario de dealer sigue sin enlace de salida (protocolo de D1).
 *  - Un administrador ve ademas "Ir a la Suite" (/), y no queda atrapado.
 *  - Solo el administrador, y solo en /autos/dealer/credito/**, ve los hijos: el
 *    credito del concesionario es de ambito tenant y antes de #827 vivia fuera
 *    del shell (/credit-hub/dealer). En el resto de Dealer OS sigue el aviso.
 *  - Con dealer asignado nada cambia; con roles ajenos (banco) tampoco.
 * Red mockeada; el sync del dealer es el REAL.
 */
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import DealerLayout from "@/app/autos/dealer/layout";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";
import { DEALER_CONTEXT_PATH } from "@/lib/dealer/dealer-context-api";
import { resetDealerAccessMemoryForTests } from "@/lib/dealer/access-context";

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

let mockPathname = "/autos/dealer";
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: undefined, isPending: false, isLoading: false }),
}));

jest.mock("@/lib/access/hooks", () => ({
  useAccessEntitlementsBatch: (keys: string[]) => ({
    isError: false,
    error: null,
    isPending: false,
    isLoading: false,
    data: { results: Object.fromEntries(keys.map((k) => [k, { allowed: true }])) },
  }),
}));

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import { apiFetch } from "@/lib/api/fetch-client";

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

function respuesta(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

const SIN_DEALER = { assignments: [] };
const CON_DEALER = { assignments: [{ dealer_id: "d-1", organization_unit_id: "u-1", dealer_name: "Mapaal" }] };

function montar(roles: string[], pathname: string, contexto: unknown = SIN_DEALER) {
  mockPathname = pathname;
  fetchMock.mockImplementation(async (path: string) =>
    path === DEALER_CONTEXT_PATH ? respuesta(contexto) : ({ ok: false, status: 404, json: async () => ({}) } as unknown as Response),
  );
  const auth = { allRoles: roles.map((r) => ({ role_key: r, core_name: "x", display_name: r })) } as unknown as AuthContextValue;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrap = (children: ReactNode) => (
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={auth}>
        <DealerLayout>{children}</DealerLayout>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
  return render(wrap(<p>contenido del hijo</p>));
}

beforeEach(() => {
  window.localStorage.clear();
  resetDealerAccessMemoryForTests();
  fetchMock.mockReset();
  window.localStorage.setItem("nadakki_tenant_id", "tenant-x");
});

describe.each(["tenant_admin", "platform_superadmin"])("%s sin concesionario", (rol) => {
  it("en Dealer OS ve el aviso (no el hijo) y una salida a la Suite", async () => {
    montar([rol], "/autos/dealer/inventario");
    const aviso = await screen.findByTestId("dealer-context-aviso");
    expect(aviso).toHaveTextContent("Tu usuario no está asignado a ningún concesionario");
    expect(screen.queryByText("contenido del hijo")).toBeNull();
    expect(screen.getByTestId("dealer-context-salida-admin")).toHaveAttribute("href", "/");
  });

  it("en el credito del concesionario SI llegan los hijos (como antes de #827)", async () => {
    montar([rol], "/autos/dealer/credito/solicitudes");
    expect(await screen.findByText("contenido del hijo")).toBeInTheDocument();
    expect(screen.queryByTestId("dealer-context-aviso")).toBeNull();
  });
});

describe("quien no es administrador", () => {
  it("un dealer sin asignacion sigue sin enlace y sin hijos, tambien en credito", async () => {
    montar(["dealer_user"], "/autos/dealer/credito");
    const aviso = await screen.findByTestId("dealer-context-aviso");
    expect(aviso.querySelector("a")).toBeNull();
    expect(screen.queryByText("contenido del hijo")).toBeNull();
  });

  it("un rol de banco no gana nada", async () => {
    montar(["bank_analyst"], "/autos/dealer/credito");
    await screen.findByTestId("dealer-context-aviso");
    expect(screen.queryByTestId("dealer-context-salida-admin")).toBeNull();
    expect(screen.queryByText("contenido del hijo")).toBeNull();
  });

  it("sin AuthContext (rol desconocido) se cierra como antes", async () => {
    montar([], "/autos/dealer/credito");
    await screen.findByTestId("dealer-context-aviso");
    expect(screen.queryByText("contenido del hijo")).toBeNull();
  });
});

describe("administrador CON concesionario", () => {
  it("pinta los hijos y no muestra la salida", async () => {
    montar(["tenant_admin"], "/autos/dealer/inventario", CON_DEALER);
    expect(await screen.findByText("contenido del hijo")).toBeInTheDocument();
    expect(screen.queryByTestId("dealer-context-salida-admin")).toBeNull();
  });
});
