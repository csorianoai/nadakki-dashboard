import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuditoriaV2 } from "@/components/credit-hub/bank-v2/control/AuditoriaV2";
import { CumplimientoV2 } from "@/components/credit-hub/bank-v2/control/CumplimientoV2";
import { EscalacionesV2 } from "@/components/credit-hub/bank-v2/control/EscalacionesV2";
import { VehiculosV2 } from "@/components/credit-hub/bank-v2/control/VehiculosV2";
import { marcaDesdeBranding } from "@/lib/dcc/marca";

const ID = "7f3c1a10-0000-4000-8000-000000000001";
const llamadas: string[] = [];
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: "t-1", tenantId: "t-1", loading: false }) }));
jest.mock("next/link", () => ({ __esModule: true, default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
jest.mock("@/lib/credit-hub/hooks/useNotifications", () => ({ useNotifications: () => ({ items: [], isLoading: false, hidden: true }) }));
jest.mock("@/lib/api/fetch-client", () => ({
  apiFetch: jest.fn(async (path: string) => {
    llamadas.push(path);
    return { ok: true, status: 200, text: async () => JSON.stringify({ anomaly_count: 1, anomalies: [{ type: "ODOMETER_ROLLBACK", severity: "HIGH", detail: "Kilometraje menor que en la inspección anterior" }] }) };
  }),
}));
jest.mock("@/lib/credit-hub/api/client", () => ({
  ...jest.requireActual("@/lib/credit-hub/api/client"),
  chFetch: jest.fn(async (path: string) => {
    llamadas.push(path.replace(ID, ":id"));
    if (path.includes("applications/queue")) return { applications: [{ application_id: ID }], total_count: 1 };
    if (path.includes("/compliance/")) return { application_id: ID, issues: [{ type: "LEY_172_13_CONSENT", severity: "HIGH", action_required: "Falta el consentimiento de buró" }] };
    return { events: [{ event_type: "BANK_DECISION_MADE", emitted_at: "2026-10-05T14:12:00Z", payload: { analyst_id: "11111111-1111-4111-8111-111111111111", decision: "RECHAZADO" } }] };
  }),
}));

const marca = marcaDesdeBranding({ locale: "es-DO", currency: "DOP" }, "banco");
const envolver = (ui: React.ReactNode) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);
const visible = (c: HTMLElement) => {
  const x = c.cloneNode(true) as HTMLElement;
  x.querySelectorAll(".sr-only, [data-testid=detalle-tecnico]").forEach((n) => n.remove());
  return x.textContent ?? "";
};

describe("Cumplimiento y Auditoria v2 (B6)", () => {
  beforeEach(() => (llamadas.length = 0));

  it("cumplimiento: mismo agregado; incidencia en llano con enlace al expediente v2; sin 'Resolver' mudo", async () => {
    const { container } = envolver(<CumplimientoV2 marca={marca} hrefSolicitud={(id) => `/v2/${id}`} />);
    expect(await screen.findByText("Falta el consentimiento de buró")).toBeInTheDocument();
    expect(screen.getByText("Severidad alta")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver solicitud" })).toHaveAttribute("href", `/v2/${ID}`);
    expect(screen.queryByRole("button", { name: "Resolver" })).toBeNull();
    expect(visible(container)).not.toMatch(/LEY_172_13_CONSENT|7f3c1a10|—/);
    expect(llamadas).toEqual(expect.arrayContaining(["/api/v2/credit/applications/queue?limit=50", "/api/v2/credit/compliance/:id"]));
  });

  it("auditoria: quien y que en llano, filtro por accion", async () => {
    const { container } = envolver(<AuditoriaV2 marca={marca} hrefSolicitud={(id) => `/v2/${id}`} />);
    expect(await screen.findByText("Decisión registrada · Rechazada")).toBeInTheDocument();
    expect(screen.getByText("Usuario del banco", { selector: "span" })).toBeInTheDocument();
    expect(visible(container)).not.toMatch(/BANK_DECISION_MADE|11111111|RECHAZADO/);
    fireEvent.change(screen.getByLabelText("Qué"), { target: { value: "Decisión registrada" } });
    expect(screen.getByText("Decisión registrada · Rechazada")).toBeInTheDocument();
    expect(llamadas).toContain("/api/v2/credit/applications/:id/events");
  });

  it("escalaciones sin fuente: Proximamente, sin nombres de variables a la vista", () => {
    const { container } = envolver(<EscalacionesV2 marca={marca} hrefSolicitud={(id) => id} />);
    expect(visible(container)).toContain("Próximamente");
    expect(visible(container)).not.toMatch(/NEXT_PUBLIC|PENDING_MANUAL_REVIEW|flag/);
    // El nombre del flag solo dentro del bloque plegado "Detalle técnico".
    const detalle = screen.getByTestId("detalle-tecnico");
    expect(detalle).not.toHaveAttribute("open");
    expect(detalle.textContent).toMatch(/NEXT_PUBLIC_/);
  });

  it("vehiculos: misma consulta; anomalia en llano, sin JSON ni campos crudos", async () => {
    const { container } = envolver(<VehiculosV2 marca={marca} />);
    fireEvent.change(screen.getByLabelText("VIN"), { target: { value: "1hgbh41jxmn109186" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));
    expect(await screen.findByText("Kilometraje menor que en la inspección anterior")).toBeInTheDocument();
    expect(llamadas).toContain("/api/v2/credit/vehicles/vin/1HGBH41JXMN109186/anomalies");
    expect(visible(container)).not.toMatch(/ODOMETER_ROLLBACK|anomaly_count|\{"/);
  });
});
