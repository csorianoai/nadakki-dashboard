/**
 * @jest-environment jsdom
 *
 * P2 (QA Mapaal AR): Estado de modulos ensenaba reason_code, readiness y notas
 * del catalogo ("Seeded by migration 097") y marcaba READY modulos que
 * rebotaban. Ahora: solo "Disponible" / "No incluido en tu plan", con accion.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import DealerCoreStatusPage from "@/app/autos/dealer/estado/page";
import { visibleDealerNavGroups } from "@/components/dealer-management/shell/dealer-nav";

type Decision = { allowed: boolean; reason_code: string | null };
let batch: { isPending: boolean; isLoading: boolean; error: unknown; data?: { results: Record<string, Decision> }; refetch: jest.Mock };

jest.mock("@/lib/access/client", () => ({
  getAccessClientContext: () => ({ tenantId: "tenant-mapaal" }),
  AccessApiError: class AccessApiError extends Error {},
}));
jest.mock("@/lib/access/hooks", () => ({
  useAccessEntitlementsBatch: () => batch,
  useAccessPlans: () => ({ isPending: true, isLoading: true, error: null }),
}));

const MODULOS = visibleDealerNavGroups((cap) => cap !== null).flatMap((g) => g.items);
const SI: Decision = { allowed: true, reason_code: "ALLOWED" };

/** Todo el menu con `base`, mas excepciones. Credit y Marketing llegan permitidos, como en Mapaal. */
function responder(base: Decision, excepciones: Record<string, Decision> = {}) {
  const results: Record<string, Decision> = { "credit.applications.view": SI, "credit.applications.submit": SI, "marketing.email.campaigns": SI };
  for (const m of MODULOS) results[m.capability as string] = base;
  batch = { isPending: false, isLoading: false, error: null, data: { results: { ...results, ...excepciones } }, refetch: jest.fn() };
}
const tarjeta = (label: string) => screen.getAllByTestId("dealer-core-card").find((el) => el.dataset.module === label);

describe("Estado de modulos", () => {
  it("no renderiza internals y cada modulo tiene solo uno de los dos estados", () => {
    responder({ allowed: false, reason_code: "DEFAULT_DENY" }, { "autos.inventory.list": SI, "autos.leads.crm": { allowed: false, reason_code: "UPGRADE_REQUIRED" } });
    const { container } = render(<DealerCoreStatusPage />);
    for (const interno of ["reason_code", "readiness", "Seeded by migration", "UPGRADE_REQUIRED", "DEFAULT_DENY", "ALLOWED", "READY", "usable"]) {
      expect(container.innerHTML).not.toContain(interno);
    }
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Estado de módulos");
    const tarjetas = screen.getAllByTestId("dealer-core-card");
    expect(tarjetas).toHaveLength(MODULOS.length);
    for (const t of tarjetas) {
      const estados = within(t).queryAllByText(/^(Disponible|No incluido en tu plan)$/);
      expect(estados).toHaveLength(1);
    }
  });

  it("los modulos que rebotan no aparecen aunque el plan los permita", () => {
    responder(SI);
    render(<DealerCoreStatusPage />);
    for (const label of ["Dealer-Bank", "Solicitudes", "Marketing"]) expect(tarjeta(label)).toBeUndefined();
    for (const link of screen.getAllByRole("link")) expect(link.getAttribute("href")).not.toMatch(/^\/(credit-hub|marketing)/);
  });

  it("Disponible lleva el enlace; No incluido lleva como pedirlo", () => {
    responder({ allowed: false, reason_code: "DEFAULT_DENY" }, { "autos.inventory.list": SI, "autos.leads.crm": { allowed: false, reason_code: "UPGRADE_REQUIRED" } });
    render(<DealerCoreStatusPage />);
    const inventario = tarjeta("Inventario")!;
    expect(within(inventario).getByText("Disponible")).toBeInTheDocument();
    expect(within(inventario).getByRole("link", { name: "Abrir Inventario" })).toHaveAttribute("href", "/autos/dealer/inventario");
    const leads = tarjeta("Leads")!;
    expect(within(leads).getByText("No incluido en tu plan")).toBeInTheDocument();
    expect(within(leads).queryByRole("link")).toBeNull();
    fireEvent.click(within(leads).getByRole("button", { name: "Ver planes" }));
    expect(within(tarjeta("Conexiones")!).getByText(/administrador de tu cuenta/)).toBeInTheDocument();
  });

  it("sin acceso verificado no dice 'No incluido': lo explica y ofrece reintentar", () => {
    responder({ allowed: false, reason_code: "no_organization_unit" });
    render(<DealerCoreStatusPage />);
    expect(screen.queryAllByTestId("dealer-core-card")).toHaveLength(0);
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos comprobar tus módulos");
    expect(screen.getByRole("alert")).not.toHaveTextContent("no_organization_unit");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(batch.refetch).toHaveBeenCalled();
  });
});
