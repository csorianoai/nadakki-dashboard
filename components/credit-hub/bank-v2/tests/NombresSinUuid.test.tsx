import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AssignedAnalystSection } from "@/components/credit-hub/bank/AssignedAnalystSection";
import { BankDetailLayout } from "@/components/credit-hub/bank/BankDetailLayout";
import { BandejaV2 } from "@/components/credit-hub/bank-v2/bandeja/BandejaV2";
import { ExpedienteV2 } from "@/components/credit-hub/bank-v2/expediente/ExpedienteV2";
import { nombreOIdentificadorOculto } from "@/components/credit-hub/bank-v2/comun/nombres";
import { marcaDesdeBranding } from "@/lib/dcc/marca";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const APP = "7f3c1a10-0000-4000-8000-000000000001";
const DEALER = "d3a1e500-1111-4222-8333-444455556666";
const ANALISTA = "a9b8c7d6-1111-4222-8333-444455556666";
let conNombres = false;

jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: "t-1", tenantId: "t-1", loading: false }) }));
jest.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "yo" }, activeRole: { role_key: "bank_analyst" } }) }));
jest.mock("@/lib/credit-hub/hooks/useCreditHubActor", () => ({ useCreditHubActor: () => ({ roleKey: "bank_analyst", can: () => true }) }));
jest.mock("next/link", () => ({ __esModule: true, default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
jest.mock("@/lib/credit-hub/api/client", () => {
  const real = jest.requireActual("@/lib/credit-hub/api/client");
  return {
    ...real,
    chFetch: jest.fn(async (path: string) => {
      if (path.includes("assignment")) return { current: { analyst_id: ANALISTA, analyst_name: conNombres ? "Lucía Peña" : ANALISTA }, history: [{ analyst_name: ANALISTA, assigned_at: "2026-10-05T14:12:00Z" }] };
      if (path.includes("/queue")) {
        return { total_count: 1, applications: [{ application_id: APP, tenant_id: "t", state: "SUBMITTED", estado_bandeja: "en_revision", applicant_name: "Marisol Reyes", dealer_id: DEALER, dealer_name: conNombres ? "Autos del Caribe" : DEALER, vehicle_label: "Toyota RAV4", requested_amount: 1, score: 700, risk_level: "BAJO", approval_band: "PREAPROBABLE", priority: "ALTA", created_at: null, bank_decision: null }] };
      }
      if (path.includes("expediente/full")) throw new real.CHApiError("no", 404);
      if (path.endsWith("/events") || path.includes("/compliance/")) return { events: [], issues: [] };
      return {
        application_id: APP, tenant_id: "t", state: "claimed",
        application_payload: {
          applicant: { name: "Marisol Reyes" },
          vehicle: { label: "Toyota RAV4", dealer: conNombres ? "Autos del Caribe" : DEALER, dealer_id: DEALER },
          financial: { requested_amount: 1, term_months: 60 },
          analysis: { score: 700, risk_level: "BAJO", approval_band: "PREAPROBABLE", positive_factors: [], negative_factors: [] },
          documents: [],
        },
      };
    }),
  };
});

const marca = marcaDesdeBranding({ locale: "es-DO", currency: "DOP" }, "banco");
const envolver = (ui: React.ReactNode) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>;
const claim = { analyst_id: ANALISTA, claimed_at: "2026-10-05T14:12:00Z" } as never;

beforeEach(() => { conNombres = false; });

it("nombreOIdentificadorOculto: nombre si hay; si no, 'Sin nombre', nunca el id", () => {
  expect(nombreOIdentificadorOculto("Lucía Peña", ANALISTA)).toBe("Lucía Peña");
  expect(nombreOIdentificadorOculto(null, ANALISTA)).toBe("Sin nombre");
  expect(nombreOIdentificadorOculto("  ", ANALISTA)).toBe("Sin nombre");
  expect(nombreOIdentificadorOculto(ANALISTA, ANALISTA)).toBe("Sin nombre");
});

it("AssignedAnalystSection sin analyst_name no muestra UUID (el id solo en data-*)", async () => {
  const { container } = render(envolver(<AssignedAnalystSection applicationId={APP} roleKey="bank_analyst" claim={claim} />));
  expect(await screen.findByTestId("assigned-analyst-name")).toHaveTextContent("Sin nombre");
  expect(container.textContent).not.toMatch(UUID);
});

it("AssignedAnalystSection con nombre en el claim lo muestra", async () => {
  render(envolver(<AssignedAnalystSection applicationId={APP} roleKey="bank_analyst" claim={{ analyst_id: ANALISTA, analyst_name: "Lucía Peña" } as never} />));
  expect(await screen.findByTestId("assigned-analyst-name")).toHaveTextContent("Lucía Peña");
});

it("AssignedAnalystSection toma el nombre de la asignación cuando el claim no lo trae", async () => {
  conNombres = true;
  render(envolver(<AssignedAnalystSection applicationId={APP} roleKey="bank_analyst" claim={claim} />));
  expect(await screen.findByText("Lucía Peña")).toBeInTheDocument();
});

it("Bandeja: dealer_id y dealer_name con forma de UUID no se pintan; con nombre, se pinta", async () => {
  const { container, unmount } = render(envolver(<BandejaV2 marca={marca} q="" page={1} onParams={jest.fn()} hrefSolicitud={(id) => `/s/${id}`} analistaId="x" />));
  await screen.findAllByTestId("bandeja-fila");
  expect(container.textContent).toContain("Sin nombre");
  expect(container.textContent).not.toContain(DEALER);
  unmount();
  conNombres = true;
  render(envolver(<BandejaV2 marca={marca} q="" page={1} onParams={jest.fn()} hrefSolicitud={(id) => `/s/${id}`} analistaId="x" />));
  expect(await screen.findByText("Autos del Caribe")).toBeInTheDocument();
});

it("Expediente: el dealer que llega como UUID no se pinta", async () => {
  const { container } = render(envolver(<ExpedienteV2 applicationId={APP} marca={marca} hrefVistaActual="/a" hrefBandeja="/b" />));
  expect(await screen.findByRole("heading", { name: "Marisol Reyes" })).toBeInTheDocument();
  expect(container.textContent).not.toContain(DEALER);
  expect(container.textContent).not.toContain(ANALISTA);
});

it("Herramientas (BankDetailLayout v1): sin UUID de dealer ni de analista en el texto", async () => {
  const application = {
    application_id: "solicitud-1", tenant_id: "t", state: "claimed", bank_claim: { analyst_id: ANALISTA, claimed_at: "2026-10-05T14:12:00Z" },
    application_payload: { applicant: { name: "Marisol Reyes" }, vehicle: { label: "Toyota RAV4", dealer: DEALER }, financial: { requested_amount: 1 }, analysis: { score: 700 }, documents: [] },
  } as never;
  const { container } = render(envolver(<BankDetailLayout application={application} compliance={undefined} audit={undefined} isComplianceLoading={false} />));
  expect(await screen.findByText("Concesionario")).toBeInTheDocument();
  expect(container.textContent).not.toMatch(UUID);
});
