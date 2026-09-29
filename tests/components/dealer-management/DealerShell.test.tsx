/** @jest-environment jsdom */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { DealerModuleGrid } from "@/components/dealer-management/DealerModuleGrid";
import { DealerShell } from "@/components/dealer-management/shell/DealerShell";
import {
  DEALER_NAV_CAPABILITY_KEYS,
  dealerBreadcrumbFor,
  isDealerNavItemActive,
} from "@/components/dealer-management/shell/dealer-nav";
import { tokenStorage } from "@/lib/auth/token-storage";
import { resetDealerAccessMemoryForTests, setDealerAccessContext } from "@/lib/dealer/access-context";

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ isAuthenticated: true, role: "dealer", tenantId: "tenant-a" }),
}));
jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

let pathname = "/autos/dealer";
jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: jest.fn() }),
}));

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function testClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function seedDealer() {
  window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
  setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
}

/**
 * Responde el batch devolviendo una decision por CADA clave que el llamante
 * pidio de verdad (se leen de `?capabilities=`). Asi el test distingue quien
 * pregunto que, que es justo donde estaba la regresion.
 */
function mockBatch(allowedKeys: string[], seen?: string[][]) {
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (!url.includes("/api/v1/access/entitlements/batch")) return jsonResponse({}, 404);
    const requested = (new URL(url, "http://localhost").searchParams.get("capabilities") ?? "")
      .split(",")
      .filter(Boolean);
    seen?.push(requested);
    const results = Object.fromEntries(
      requested.map((cap) => [
        cap,
        {
          allowed: allowedKeys.includes(cap),
          reason_code: allowedKeys.includes(cap) ? "ALLOWED" : "DEFAULT_DENY",
        },
      ]),
    );
    return jsonResponse({ results });
  }) as unknown as typeof fetch;
}

describe("DealerShell — navegación única filtrada por entitlements", () => {
  beforeEach(() => {
    pathname = "/autos/dealer";
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    seedDealer();
  });

  test("solo pinta en el menú los módulos que el plan habilita", async () => {
    mockBatch(["autos.inventory.list"]);
    render(<DealerShell>contenido</DealerShell>, { wrapper: wrapper(testClient()) });

    await waitFor(() => expect(screen.getByRole("link", { name: "Inventario" })).toBeInTheDocument());
    // Inicio no depende del plan; Leads sí, y está denegado.
    expect(screen.getByRole("link", { name: "Inicio" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Leads" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Marketing" })).toBeNull();
  });

  test("falla cerrado: si el batch da error no se pinta ningún módulo del plan", async () => {
    global.fetch = jest.fn(async () => jsonResponse({ detail: "denied" }, 403)) as unknown as typeof fetch;
    render(<DealerShell>contenido</DealerShell>, { wrapper: wrapper(testClient()) });

    await waitFor(() => expect(screen.getByRole("link", { name: "Inicio" })).toBeInTheDocument());
    expect(screen.queryByRole("link", { name: "Inventario" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Dealer-Bank" })).toBeNull();
  });

  test("la acción primaria y las notificaciones siguen al entitlement", async () => {
    mockBatch(["autos.inventory.create"]);
    render(<DealerShell>contenido</DealerShell>, { wrapper: wrapper(testClient()) });

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Publicar vehículo" })).toHaveAttribute(
        "href",
        "/autos/dealer/publicar-rapido",
      ),
    );
    expect(screen.queryByRole("link", { name: "Notificaciones" })).toBeNull();
  });

  test("no muestra ningún contador de notificaciones (el agregado llega en F3)", async () => {
    mockBatch(["credit.applications.view"]);
    render(<DealerShell>contenido</DealerShell>, { wrapper: wrapper(testClient()) });

    const bell = await screen.findByRole("link", { name: "Notificaciones" });
    expect(bell.textContent?.trim()).toBe("");
  });

  test("la marca cae a «Nadakki» mientras no hay branding (BRANDING-PRELOGIN-01)", async () => {
    mockBatch([]);
    render(<DealerShell>contenido</DealerShell>, { wrapper: wrapper(testClient()) });

    await waitFor(() => expect(screen.getByText("Nadakki")).toBeInTheDocument());
    expect(screen.getByText("Powered by Nadakki")).toBeInTheDocument();
  });

  test("el menú no se queda sin decisiones cuando la página también consulta el batch", async () => {
    // Regresion medida en local: `accessQueryKey` no incluye las claves, asi que
    // shell y pagina compartian entrada de cache y ganaba la pagina (los efectos
    // de montaje corren de hijo a padre). El menu se quedaba en fail-closed.
    const seen: string[][] = [];
    mockBatch(["autos.inventory.list", "autos.leads.crm"], seen);

    render(
      <DealerShell>
        <DealerModuleGrid />
      </DealerShell>,
      { wrapper: wrapper(testClient()) },
    );

    await waitFor(() => expect(screen.getByRole("link", { name: "Inventario" })).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Leads" })).toBeInTheDocument();

    // El shell pregunta por sus propias claves, no hereda las de la rejilla.
    const askedForNavKeys = seen.some((keys) => keys.includes("accounting.reports.financial"));
    expect(askedForNavKeys).toBe(true);
  });

  test("el contenedor del panel usa el scope de tokens del dealer", async () => {
    mockBatch([]);
    const { container } = render(<DealerShell>contenido</DealerShell>, {
      wrapper: wrapper(testClient()),
    });

    await waitFor(() => expect(container.querySelector('[data-portal="dealer"]')).not.toBeNull());
    // El marketplace público conserva su propio scope: aquí no aparece.
    expect(container.querySelector('[data-portal="autos"]')).toBeNull();
  });
});

describe("dealer-nav — rutas y migas", () => {
  test("Inicio solo está activo en la ruta exacta", () => {
    expect(isDealerNavItemActive("/autos/dealer", "/autos/dealer")).toBe(true);
    expect(isDealerNavItemActive("/autos/dealer", "/autos/dealer/inventario")).toBe(false);
    expect(isDealerNavItemActive("/autos/dealer/inventario", "/autos/dealer/inventario/abc")).toBe(
      true,
    );
  });

  test("las migas son Inicio + la pantalla actual, sin niveles inventados", () => {
    expect(dealerBreadcrumbFor("/autos/dealer")).toEqual([
      { label: "Inicio", href: "/autos/dealer" },
    ]);
    expect(dealerBreadcrumbFor("/autos/dealer/inventario/abc")).toEqual([
      { label: "Inicio", href: "/autos/dealer" },
      { label: "Inventario", href: "/autos/dealer/inventario" },
    ]);
  });

  test("el menú declara al menos una capacidad por dominio de negocio", () => {
    expect(DEALER_NAV_CAPABILITY_KEYS).toEqual(expect.arrayContaining(["autos.inventory.list"]));
    expect(DEALER_NAV_CAPABILITY_KEYS).toEqual(expect.arrayContaining(["credit.applications.view"]));
    expect(DEALER_NAV_CAPABILITY_KEYS).toEqual(
      expect.arrayContaining(["accounting.reports.financial"]),
    );
  });
});
