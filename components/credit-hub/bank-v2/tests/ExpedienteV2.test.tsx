import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExpedienteV2 } from "@/components/credit-hub/bank-v2/expediente/ExpedienteV2";
import { marcaDesdeBranding } from "@/lib/dcc/marca";

const ID = "7f3c1a10-0000-4000-8000-000000000001";
const ANALISTA = "11111111-1111-4111-8111-111111111111";
const llamadas: string[] = [];
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: "t-1", tenantId: "t-1", loading: false }) }));
jest.mock("next/link", () => ({ __esModule: true, default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
jest.mock("@/lib/credit-hub/api/client", () => {
  const real = jest.requireActual("@/lib/credit-hub/api/client");
  return {
    ...real,
    chFetch: jest.fn(async (path: string) => {
      llamadas.push(path);
      if (path.includes("expediente/full")) throw new real.CHApiError("no", 404);
      if (path.includes("/compliance/")) return { consents_complete: true, documents_complete: false, issues: [{ type: "doc", severity: "MEDIUM", action_required: "Falta la póliza" }] };
      if (path.endsWith("/events"))
        return { events: [{ event_type: "CLAIMED", emitted_at: "2026-10-05T14:12:00Z", payload: { analyst_id: ANALISTA } }, { event_type: "WEIRD_INTERNAL_X", emitted_at: "2026-10-05T14:13:00Z", payload: {} }] };
      return {
        application_id: ID, tenant_id: "t", state: "claimed",
        application_payload: {
          applicant: { name: "Marisol Reyes", rfc: "XAXX010101000" },
          vehicle: { label: "Toyota RAV4 2024", dealer: "Autos del Caribe" },
          financial: { requested_amount: 2150000, term_months: 60 },
          analysis: { score: 742, risk_level: "BAJO", approval_band: "PREAPROBABLE", dti: 0.31, estimated_payment: 48370.57, payment_capacity: 73500, positive_factors: [], negative_factors: [] },
          documents: [{ name: "Cédula", status: "validado" }],
        },
      };
    }),
  };
});

it("expediente v2: mismos endpoints, sin UUID, RFC ni tasa inventada; bitacora en llano", async () => {
  const marca = marcaDesdeBranding({ locale: "es-DO", currency: "DOP" }, "banco");
  const { container } = render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ExpedienteV2 applicationId={ID} marca={marca} hrefVistaActual="/actual" hrefBandeja="/b" />
    </QueryClientProvider>,
  );
  expect(await screen.findByRole("heading", { name: "Marisol Reyes" })).toBeInTheDocument();
  expect(screen.getByTestId("expediente-estado")).toHaveTextContent("En revisión");
  expect(container.textContent).toContain("RD$2,150,000.00");
  expect(container.textContent).toContain("31\u00a0%");
  expect(container.textContent).not.toMatch(/17[.,]5|XAXX|RFC|7f3c1a10|Estado legado/);
  expect(screen.getByRole("link", { name: /Más herramientas/ })).toHaveAttribute("href", "/actual");
  fireEvent.click(screen.getByRole("tab", { name: "Bitácora" }));
  expect(await screen.findByText("Reclamada por un analista")).toBeInTheDocument();
  expect(screen.getByText("Usuario del banco")).toBeInTheDocument();
  expect(screen.getByText("Evento del sistema")).toBeInTheDocument();
  expect(container.textContent).not.toMatch(/11111111|WEIRD_INTERNAL|CLAIMED/);
  fireEvent.click(screen.getByRole("tab", { name: /Cumplimiento/ }));
  expect(await screen.findByText("Falta la póliza")).toBeInTheDocument();
  expect([...new Set(llamadas.map((p) => p.replace(ID, ":id").split("?")[0]))].sort()).toEqual([
    "/api/v2/credit/applications/:id", "/api/v2/credit/applications/:id/events", "/api/v2/credit/applications/:id/expediente/full", "/api/v2/credit/compliance/:id",
  ]);
});
