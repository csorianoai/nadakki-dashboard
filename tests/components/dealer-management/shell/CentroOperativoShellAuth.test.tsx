/**
 * D9 (regresion): el Centro Operativo NO se cae al pintarse dentro del panel
 * del dealer.
 *
 * Lo medido en produccion (RESULT_D9=FAIL, run 37177945156 de
 * superloop-evidence): menu del dealer -> "Centro Operativo" y la pagina entera
 * pasaba a "This page couldn't load", con
 *
 *   Error: useAuth must be used within AuthProvider
 *
 * `DealerSidebar` lee la marca con `useDealerManagementBranding`, que llama al
 * `useAuth` de `@/lib/auth-context`. Ese provider solo lo montaba
 * `app/autos/layout.tsx`, y `/centro-operativo` (#576) monta `DealerShell`
 * fuera de `app/autos`. Los tests del shell mockeaban ese hook, asi que nadie
 * veia que faltaba el provider.
 *
 * Por eso aqui se monta el layout y la pagina REALES del Centro Operativo, sin
 * `app/autos/layout.tsx` y con `useDealerManagementBranding` SIN mockear: solo
 * la red, el acceso y el `useAuth` global (el de la pagina, que ya tiene su
 * provider en `AppProviders`) son de mentira. Quitando el provider de
 * `DealerShell`, los dos casos caen con el mismo error de produccion.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import CentroOperativoLayout from "@/app/centro-operativo/layout";
import CentroOperativoPage from "@/app/centro-operativo/page";
import { contenidoCentroOperativo } from "@/app/centro-operativo/contenido";
import { DEALER_CONTEXT_PATH } from "@/lib/dealer/dealer-context-api";
import { resetDealerAccessMemoryForTests } from "@/lib/dealer/access-context";

// Rompe la cadena de imports antes de `lib/config/backend-url`, que lanza
// BackendUrlNotConfiguredError al cargarse sin backend declarado.
jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/centro-operativo",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

/** El `useAuth` GLOBAL (`@/hooks/useAuth`), el que lee la pagina. No es el del defecto. */
jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ tenant: { id: TENANT } }),
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

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn(), getAuthHeaders: jest.fn(() => ({})) }));

import { apiFetch } from "@/lib/api/fetch-client";

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

const TENANT = "9a9a0001-0000-4000-8000-000000000001";
const DEALER = "1bc6a6cd-2592-442a-9d70-2d1b630762fc";

function respuesta(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response;
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CentroOperativoLayout>
        <CentroOperativoPage />
      </CentroOperativoLayout>
    </QueryClientProvider>,
  );
}

let errorDeConsola: jest.SpyInstance;

beforeEach(() => {
  window.localStorage.clear();
  resetDealerAccessMemoryForTests();
  fetchMock.mockReset();
  window.localStorage.setItem("nadakki_tenant_id", TENANT);
  window.localStorage.setItem("user_id", "qa-user");
  window.localStorage.setItem("nadakki_sic_token", "token-qa");
  fetchMock.mockImplementation(async (path: string) => {
    if (path === DEALER_CONTEXT_PATH)
      return respuesta(200, {
        assignments: [{ dealer_id: DEALER, organization_unit_id: null, dealer_name: "Mapaal QA" }],
      });
    if (path.endsWith("/branding")) return respuesta(200, { display_name: "Mapaal QA" });
    return respuesta(404, { detail: `ruta no sembrada: ${path}` });
  });
  // React escribe en consola el error que tumba el arbol; aqui no debe haber ninguno.
  errorDeConsola = jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => errorDeConsola.mockRestore());

it("pinta la guia dentro del panel del dealer sin app/autos/layout encima", async () => {
  montar();

  const contenido = contenidoCentroOperativo(TENANT);
  expect(await screen.findByRole("heading", { level: 1, name: contenido.titulo })).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "Navegación del dealer" })).toBeInTheDocument();
  const sinProvider = errorDeConsola.mock.calls.flat().map(String).filter((m) => m.includes("within AuthProvider"));
  expect(sinProvider).toEqual([]);
});

it("el sidebar lee la marca del tenant de la sesion (el hook del defecto, sin mockear)", async () => {
  montar();

  await waitFor(() => {
    expect(fetchMock.mock.calls.map(([path]) => path)).toContain(
      `/api/v2/tenants/${encodeURIComponent(TENANT)}/branding`,
    );
  });
  const nav = screen.getByRole("navigation", { name: "Navegación del dealer" });
  await waitFor(() => expect(within(nav.closest("aside") ?? nav).getAllByText(/Mapaal QA/).length).toBeGreaterThan(0));
});
