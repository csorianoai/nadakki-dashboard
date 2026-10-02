/** @jest-environment jsdom */

/**
 * "Primeros pasos" en el Inicio del dealer (D9).
 *
 * Lo que se protege aqui, por orden de importancia:
 *
 *  1. El bloque se pinta SOLO con el inventario vacio de verdad. Cargando, con
 *     error de red o sin acceso verificado NO se pinta: ensenarle "Primeros
 *     pasos" a un dealer que ya tiene stock le diria que su trabajo se perdio.
 *  2. El texto sale del archivo de datos de D9, no del componente. El test
 *     compara contra `contenidoCentroOperativo`, asi que si alguien duplica el
 *     texto en el JSX y luego corrigen la guia, esto se rompe.
 *  3. El boton lleva a la SECCION de primeros pasos, no al principio de la guia.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import DealerDashboardPage from "@/app/autos/dealer/page";
import { contenidoCentroOperativo } from "@/app/centro-operativo/contenido";
import { tokenStorage } from "@/lib/auth/token-storage";
import { resetDealerAccessMemoryForTests, setDealerAccessContext } from "@/lib/dealer/access-context";

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ isAuthenticated: true, role: "dealer", tenantId: "tenant-a" }),
}));
// Sin `AuthProvider` a proposito: el bloque no debe exigirlo. Sin tenant,
// `contenidoCentroOperativo` entrega la guia de Mapaal, que es la unica
// validada contablemente — y es la que este test compara.
jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));
jest.mock("@/lib/dealer/post-sale", () => ({
  fetchPostSaleSnapshot: jest.fn(async () => ({ cases: [], asientos: [], listings: [], heartbeat: {} })),
}));

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}
function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}
function client() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}
function seedDealer() {
  window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
  setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
}

const PERMITIDO = {
  results: {
    "autos.inventory.create": { allowed: true, reason_code: "ALLOWED" },
    "autos.leads.crm": { allowed: true, reason_code: "ALLOWED" },
    "autos.analytics.basic": { allowed: true, reason_code: "ALLOWED" },
    "autos.inventory.list": { allowed: true, reason_code: "ALLOWED" },
  },
};

/** `inventario` decide que contesta el endpoint del inventario privado. */
function mockFetch(inventario: () => ReturnType<typeof response> | Promise<never>) {
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/branding")) return response({ display_name: "Dealer A" });
    if (url.includes("/sponsorship")) return response({ sponsorships: [] });
    if (url.includes("/subscription")) return response({ has_subscription: false, subscription: null });
    if (url.includes("/entitlements/batch")) return response(PERMITIDO);
    if (url.includes("inventory") || url.includes("vehicles")) return inventario();
    return response({}, 404);
  }) as unknown as typeof fetch;
}

const BLOQUE = contenidoCentroOperativo("mapaal").bloques.find((b) => b.id === "primeros-pasos")!;

describe("el bloque Primeros pasos solo aparece con el inventario vacio", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    seedDealer();
  });

  test("inventario vacio: se pinta, con el boton que pide Cesar", async () => {
    mockFetch(() => response([]));

    render(<DealerDashboardPage />, { wrapper: wrapper(client()) });

    const bloque = await screen.findByTestId("dealer-primeros-pasos");
    expect(bloque).toBeInTheDocument();

    const cta = screen.getByTestId("dealer-primeros-pasos-cta");
    expect(cta).toHaveTextContent("Empezar: cargar mi stock");
    // A la SECCION de primeros pasos, no al principio de la guia.
    expect(cta).toHaveAttribute("href", "/centro-operativo#primeros-pasos");
  });

  test("con stock cargado NO se pinta", async () => {
    mockFetch(() =>
      response([{ id: "v1", make: "Toyota", model: "Hilux", year: "2020", status: "available" }]),
    );

    render(<DealerDashboardPage />, { wrapper: wrapper(client()) });

    await waitFor(() => expect(screen.getByTestId("dealer-quick-links")).toBeInTheDocument());
    expect(screen.queryByTestId("dealer-primeros-pasos")).not.toBeInTheDocument();
  });

  test("si el inventario falla NO se pinta: un error de red no es un inventario vacio", async () => {
    mockFetch(() => response({ detail: "boom" }, 500));

    render(<DealerDashboardPage />, { wrapper: wrapper(client()) });

    await waitFor(() => expect(screen.getByTestId("dealer-quick-links")).toBeInTheDocument());
    expect(screen.queryByTestId("dealer-primeros-pasos")).not.toBeInTheDocument();
  });

  test("sin acceso verificado al inventario NO se pinta", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/branding")) return response({ display_name: "Dealer A" });
      if (url.includes("/sponsorship")) return response({ sponsorships: [] });
      if (url.includes("/subscription")) return response({ has_subscription: false, subscription: null });
      if (url.includes("/entitlements/batch")) return response({}, 403);
      if (url.includes("inventory") || url.includes("vehicles")) return response([]);
      return response({}, 404);
    }) as unknown as typeof fetch;

    render(<DealerDashboardPage />, { wrapper: wrapper(client()) });

    await waitFor(() =>
      expect(screen.getByTestId("dealer-quick-links")).toHaveAttribute("data-fail-closed", "true"),
    );
    expect(screen.queryByTestId("dealer-primeros-pasos")).not.toBeInTheDocument();
  });
});

describe("el texto sale del archivo de datos de D9, no del componente", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    seedDealer();
    mockFetch(() => response([]));
  });

  test("el titulo es el del bloque primeros-pasos de la guia", async () => {
    render(<DealerDashboardPage />, { wrapper: wrapper(client()) });

    const bloque = await screen.findByTestId("dealer-primeros-pasos");
    expect(bloque).toHaveTextContent(BLOQUE.titulo);
  });

  test("los pasos son los de la guia, con el saldo inicial y la cuenta 3020", async () => {
    render(<DealerDashboardPage />, { wrapper: wrapper(client()) });

    const bloque = await screen.findByTestId("dealer-primeros-pasos");
    for (const paso of BLOQUE.pasos ?? []) {
      expect(bloque).toHaveTextContent(paso);
    }
    // La regla contable que valida Cesar: contrapartida 3020, no Proveedores.
    expect(bloque).toHaveTextContent("3020");
    expect(bloque).toHaveTextContent("is_opening=true");
  });
});

describe("la tarjeta del Centro Operativo en Inicio", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    seedDealer();
  });

  test("esta en Accesos rapidos y lleva al Centro Operativo", async () => {
    mockFetch(() => response([]));

    render(<DealerDashboardPage />, { wrapper: wrapper(client()) });

    const tarjeta = await screen.findByTestId("open-quick-link");
    expect(tarjeta).toHaveAttribute("href", "/centro-operativo");
    expect(tarjeta).toHaveTextContent("Centro Operativo");
  });

  test("sigue visible con fail-closed: la guia no depende del plan", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/branding")) return response({ display_name: "Dealer A" });
      if (url.includes("/sponsorship")) return response({ sponsorships: [] });
      if (url.includes("/subscription")) return response({ has_subscription: false, subscription: null });
      if (url.includes("/entitlements/batch")) return response({}, 403);
      return response({}, 404);
    }) as unknown as typeof fetch;

    render(<DealerDashboardPage />, { wrapper: wrapper(client()) });

    await waitFor(() =>
      expect(screen.getByTestId("dealer-quick-links")).toHaveAttribute("data-fail-closed", "true"),
    );
    // Cero privilegiadas, pero la guia sigue ahi.
    expect(screen.queryAllByTestId("privileged-quick-link")).toHaveLength(0);
    expect(screen.getByTestId("open-quick-link")).toBeInTheDocument();
  });
});
