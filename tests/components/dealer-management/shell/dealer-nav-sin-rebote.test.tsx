/**
 * P1-3 (QA Mapaal AR): Dealer-Bank, Solicitudes y Marketing rebotaban a
 * /autos/dealer por DealerSuiteGate. Regla: un enlace del menu se abre o no
 * aparece; nunca un rebote mudo.
 */
import { act, render, waitFor } from "@testing-library/react";
import { DealerSuiteGate, isDealerReachableSuitePath } from "@/components/dealer/DealerSuiteGate";
import { DEALER_NAV_GROUPS, isDealerNavItemOpenable, visibleDealerNavGroups } from "@/components/dealer-management/shell/dealer-nav";
import { isDealerChromePath } from "@/lib/autos-portal/routes";
import { fetchMyDealerContext } from "@/lib/dealer/dealer-context-api";

const replace = jest.fn();
let pathname = "/";
jest.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ replace, push: jest.fn() }) }));
jest.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u-dealer" } }) }));
jest.mock("@/lib/dealer/dealer-context-api", () => ({ fetchMyDealerContext: jest.fn() }));

const fetchMock = fetchMyDealerContext as jest.MockedFunction<typeof fetchMyDealerContext>;
const REBOTABAN = ["/credit-hub/dealer", "/credit-hub/dealer/applications", "/marketing/campaigns"];
const TODO_PERMITIDO = () => true;
const visibles = () => visibleDealerNavGroups(TODO_PERMITIDO).flatMap((g) => g.items);

/** Monta el gate de la Suite en `href` como lo haria AppGate para un dealer. */
async function gateRebota(href: string): Promise<boolean> {
  pathname = href;
  replace.mockReset();
  fetchMock.mockResolvedValue([{ dealerId: "d1", organizationUnitId: null, dealerName: "Mapaal" }]);
  const { unmount } = render(<DealerSuiteGate>pantalla</DealerSuiteGate>);
  // Si el gate consulta, se espera a que resuelva y aplique su efecto.
  if (!isDealerReachableSuitePath(href)) await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  await act(() => new Promise((r) => setTimeout(r, 0)));
  unmount();
  return replace.mock.calls.some(([destino]) => destino === "/autos/dealer");
}

beforeEach(() => {
  fetchMock.mockReset();
  jest.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe("menu del dealer sin rebotes mudos", () => {
  it("la regla del menu coincide con la del gate y el chrome del dealer", () => {
    for (const item of DEALER_NAV_GROUPS.flatMap((g) => g.items)) {
      expect([item.href, isDealerNavItemOpenable(item.href)]).toEqual([
        item.href,
        isDealerChromePath(item.href) || isDealerReachableSuitePath(item.href),
      ]);
    }
  });

  it("Dealer-Bank, Solicitudes y Marketing no aparecen aunque el plan los permita", () => {
    const labels = visibles().map((i) => i.label);
    for (const label of ["Dealer-Bank", "Solicitudes", "Marketing"]) expect(labels).not.toContain(label);
    for (const href of REBOTABAN) expect(visibles().map((i) => i.href)).not.toContain(href);
    // El grupo vacio desaparece; Crecimiento conserva Insights. El plan sigue restringiendo.
    expect(visibleDealerNavGroups(TODO_PERMITIDO).map((g) => g.id)).not.toContain("financiamiento");
    expect(labels).toContain("Insights");
    expect(visibleDealerNavGroups((cap) => cap === null).flatMap((g) => g.items).every((i) => i.capability === null)).toBe(true);
  });

  it("las tres rutas ocultas son justo las que el gate devuelve a /autos/dealer", async () => {
    for (const href of REBOTABAN) {
      expect(isDealerChromePath(href)).toBe(false);
      await expect(gateRebota(href)).resolves.toBe(true);
    }
  });

  it("ningun enlace visible fuera del panel rebota en el gate", async () => {
    const fueraDelPanel = visibles().filter((i) => !isDealerChromePath(i.href));
    expect(fueraDelPanel.length).toBeGreaterThan(0);
    for (const item of fueraDelPanel) {
      await expect(gateRebota(item.href)).resolves.toBe(false);
    }
  });
});
