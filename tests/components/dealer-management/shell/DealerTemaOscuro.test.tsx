/**
 * Auditoria Mapaal QA (P1): tema oscuro tambien en la barra superior y la
 * lateral, desde CUALQUIER pantalla del dealer.
 *
 * Medido antes del cambio: en paginas DCC el shell ya seguia al tema, pero el
 * conmutador solo existia dentro de esas paginas. En inventario, ficha,
 * finanzas o el Centro Operativo no habia como pasar a oscuro. Aqui el hijo es
 * una pagina SIN DccPage y el conmutador es el de la barra superior.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DealerShell } from "@/components/dealer-management/shell/DealerShell";
import { DCC_TOKENS } from "@/lib/dcc/tokens";


let pathname = "/autos/dealer";

// `DealerShell` monta el AuthProvider de `@/lib/auth-context`: se corta aqui la
// cadena de imports antes de `lib/config/backend-url`, que lanza sin backend.
jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: { display_name: "Mapaal" } }),
}));

/** El acceso es red: aqui se concede todo. El filtrado por entitlements es
 *  contrato de DealerSidebarTopbar.test.tsx; esto mide los dos anchos. */
jest.mock("@/lib/access/hooks", () => ({
  useAccessEntitlementsBatch: (keys: string[]) => ({
    isError: false,
    error: null,
    isPending: false,
    isLoading: false,
    data: { results: Object.fromEntries(keys.map((k) => [k, { allowed: true }])) },
  }),
}));

jest.mock("@/components/dealer/CoreNavigation", () => ({
  isAccessQueryFailClosed: () => false,
}));

/** El binding del dealer no es lo que se mide: se da por resuelto para que el
 *  shell pinte los hijos en vez del "Verificando". */
jest.mock("@/lib/dealer/access-context", () => ({
  resolveDealerAccessContext: () => ({
    status: "ready",
    context: { tenantId: "tenant-mapaal", dealerId: "dealer-mapaal" },
  }),
}));

jest.mock("@/lib/dealer/dealer-context-api", () => ({
  DEALER_CONTEXT_PATH: "/api/v1/autos/dealers/me/context",
  syncDealerContextFromBackend: async () => ({ estado: "sincronizado" }),
}));


function montar() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <DealerShell>
        <main>Inventario</main>
      </DealerShell>
    </QueryClientProvider>,
  );
}

it("la barra superior ofrece el tema oscuro aunque la pagina no sea DCC", async () => {
  montar();
  expect(await screen.findByTestId("dealer-theme-toggle")).toHaveAccessibleName("Cambiar a tema oscuro");
});

it("al pasar a oscuro, la raiz del shell (barra superior y lateral) toma los tokens oscuros", async () => {
  const { container } = montar();
  const raiz = container.querySelector('[data-portal="dealer"]') as HTMLElement;
  expect(raiz.style.getPropertyValue("--dcc-surface")).toBe(DCC_TOKENS.light["--dcc-surface"]);

  fireEvent.click(await screen.findByTestId("dealer-theme-toggle"));

  await waitFor(() => expect(raiz).toHaveAttribute("data-dcc-theme", "dark"));
  expect(raiz.style.getPropertyValue("--dcc-surface")).toBe(DCC_TOKENS.dark["--dcc-surface"]);
  expect(raiz.style.getPropertyValue("--dcc-navy")).toBe(DCC_TOKENS.dark["--dcc-navy"]);
  // La barra superior y la lateral pintan con esas variables, no con colores fijos.
  expect(container.querySelector("header")?.className).toContain("bg-[var(--dcc-surface)]");
  expect(container.querySelector("aside")?.className).toContain("bg-[var(--nav-bg)]");
  expect(screen.getByTestId("dealer-theme-toggle")).toHaveAccessibleName("Cambiar a tema claro");
});
