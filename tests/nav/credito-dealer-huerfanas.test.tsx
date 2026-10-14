/**
 * Las 4 páginas de crédito del concesionario que quedaron huérfanas tras #827
 * (notificaciones, perfil, nueva solicitud — codeudor, nueva solicitud — documentos) son alcanzables desde
 * la interfaz REAL de Dealer OS: se monta el DealerShell (el que de verdad pinta app/autos/dealer/layout.tsx),
 * no la lista de datos, y se busca el enlace con ese href.
 *
 * Qué pantalla las abre: el menú "Financiamiento". Codeudor y documentos son además secciones de la pantalla
 * "Revisión y despacho" (DealerWizardReviewStep), pero ese paso no enlaza sus URLs propias: solo el menú lo hace.
 * El menú obedece a los entitlements (fail-closed): sin la capability no se pinta el enlace.
 */
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import fs from "fs";
import path from "path";
import { DEALER_NAV_GROUPS } from "@/components/dealer-management/shell/dealer-nav";
import { DealerShell } from "@/components/dealer-management/shell/DealerShell";

let pathname = "/autos/dealer";
let permitidas = new Set<string>();

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
/** El plan del dealer: solo se concede lo que el test pone en `permitidas`. */
jest.mock("@/lib/access/hooks", () => ({
  useAccessEntitlementsBatch: (keys: string[]) => ({
    isError: false,
    error: null,
    isPending: false,
    isLoading: false,
    data: { results: Object.fromEntries(keys.map((k) => [k, { allowed: permitidas.has(k) }])) },
  }),
}));
jest.mock("@/components/dealer/CoreNavigation", () => ({ isAccessQueryFailClosed: () => false }));
jest.mock("@/lib/dealer/access-context", () => ({
  resolveDealerAccessContext: () => ({ status: "ready", context: { tenantId: "t-mapaal", dealerId: "d-mapaal" } }),
}));
jest.mock("@/lib/dealer/dealer-context-api", () => ({
  DEALER_CONTEXT_PATH: "/api/v1/autos/dealers/me/context",
  syncDealerContextFromBackend: async () => ({ estado: "sincronizado" }),
}));

const BASE = "/autos/dealer/credito";
const HUERFANAS = [
  { href: `${BASE}/notificaciones`, etiqueta: "Notificaciones", capability: "credit.applications.view" },
  { href: `${BASE}/perfil`, etiqueta: "Perfil", capability: "credit.applications.view" },
  { href: `${BASE}/solicitudes/nueva/codeudor`, etiqueta: "Nueva solicitud — codeudor", capability: "credit.applications.submit" },
  { href: `${BASE}/solicitudes/nueva/documentos`, etiqueta: "Nueva solicitud — documentos", capability: "credit.applications.submit" },
] as const;

async function menuDelDealer(conCapabilities: string[]) {
  permitidas = new Set(conCapabilities);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { container } = render(
    <QueryClientProvider client={client}>
      <DealerShell><p>contenido del dealer</p></DealerShell>
    </QueryClientProvider>,
  );
  await screen.findByText("contenido del dealer");
  const nav = container.querySelector('nav[aria-label="Navegación del dealer"]')!;
  expect(nav).not.toBeNull();
  return (href: string) => Array.from(nav.querySelectorAll("a")).filter((a) => a.getAttribute("href") === href);
}

beforeEach(() => { pathname = "/autos/dealer"; });

describe("crédito del dealer: las 4 páginas huérfanas se alcanzan desde el menú de Financiamiento", () => {
  it("con crédito completo (ver + solicitar) cada una tiene su enlace, con nombre en español, dentro de Financiamiento", async () => {
    const enlaces = await menuDelDealer(["credit.applications.view", "credit.applications.submit"]);
    for (const h of HUERFANAS) {
      const a = enlaces(h.href);
      expect([h.href, a.length]).toEqual([h.href, 1]);
      expect(a[0]!.textContent).toContain(h.etiqueta);
    }
  });

  it("con solo 'ver' aparecen Notificaciones y Perfil, y NO los pasos de solicitud (no se amplía ningún permiso)", async () => {
    const enlaces = await menuDelDealer(["credit.applications.view"]);
    expect(enlaces(HUERFANAS[0].href)).toHaveLength(1);
    expect(enlaces(HUERFANAS[1].href)).toHaveLength(1);
    expect(enlaces(HUERFANAS[2].href)).toHaveLength(0);
    expect(enlaces(HUERFANAS[3].href)).toHaveLength(0);
  });

  it("sin el módulo de crédito suscrito no aparece ninguna", async () => {
    const enlaces = await menuDelDealer(["autos.inventory.list"]);
    for (const h of HUERFANAS) expect([h.href, enlaces(h.href).length]).toEqual([h.href, 0]);
  });

  it("cada página existe y su enlace pide la capability prevista (ver o solicitar), nunca una nueva", () => {
    const items = DEALER_NAV_GROUPS.flatMap((g) => g.items);
    for (const h of HUERFANAS) {
      expect([h.href, items.find((i) => i.href === h.href)?.capability]).toEqual([h.href, h.capability]);
      const pagina = path.resolve(__dirname, "..", "..", "app", ...h.href.slice(1).split("/"), "page.tsx");
      expect([h.href, fs.existsSync(pagina)]).toEqual([h.href, true]);
    }
  });
});
