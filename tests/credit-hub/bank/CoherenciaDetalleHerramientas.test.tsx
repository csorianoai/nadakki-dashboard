import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ExpedienteV2Page from "@/app/(forge)/credit-hub/bank-v2/solicitudes/[applicationId]/page";
import BankApplicationReviewPage from "@/app/(forge)/credit-hub/bank/applications/[applicationId]/page";

const ID = "APP-12";
let respuesta: Record<string, unknown> = {};
jest.mock("next/link", () => ({ __esModule: true, default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: "t-1", tenantId: "t-1", loading: false }) }));
jest.mock("@/app/(forge)/credit-hub/bank-v2/BancoV2Shell", () => ({
  useMarcaBanco: () => jest.requireActual("@/lib/dcc/marca").marcaDesdeBranding({ locale: "es-DO", currency: "DOP" }, "banco"),
}));
jest.mock("@/lib/hooks/useTenantBranding", () => ({ useTenantBranding: () => ({ data: { locale: "es-DO", currency: "DOP" } }) }));
jest.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "analista-1" } }) }));
jest.mock("@/lib/credit-hub/hooks/useCreditHubActor", () => ({ useCreditHubActor: () => ({ can: () => true, roleKey: "bank_analyst" }) }));
jest.mock("@/app/credit/CreditTenantGate", () => ({ CreditTenantGate: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock("@/app/(forge)/credit-hub/bank/_components/BankApplicationOpsPanel", () => ({ BankApplicationOpsPanel: () => null }));
jest.mock("@/lib/credit-hub/api/client", () => {
  const real = jest.requireActual("@/lib/credit-hub/api/client");
  return {
    ...real,
    chFetch: jest.fn(async (p: string) => {
      if (p.includes("expediente/full")) throw new real.CHApiError("no", 404);
      if (p.includes("/compliance/")) return { consents_complete: true, documents_complete: true, issues: [] };
      if (p.endsWith("/events")) return { events: [] };
      return respuesta;
    }),
  };
});

const base = (payload: Record<string, unknown>) => ({
  application_id: ID, tenant_id: "t", state: "claimed",
  application_payload: { applicant: { name: "Ana Prueba" }, vehicle: { label: "Auto" }, documents: [], ...payload },
});
const montar = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);
const params = Object.assign(Promise.resolve({ applicationId: ID }), { status: "fulfilled", value: { applicationId: ID } }) as Promise<{ applicationId: string }>;
const textoPantalla = async (ui: React.ReactElement) => {
  const { container } = montar(ui);
  await screen.findByText("Ana Prueba");
  return (container.textContent ?? "").replace(/\u00a0/g, " ");
};

const INGLES = /\bAudit\b|\bCompliance\b|PENDING|Condición New|DATOS SIMULADOS/;

it("(a)+(d) con la misma respuesta, detalle y /herramientas muestran mismo estado, tasa y riesgo, sin ingles", async () => {
  respuesta = base({
    financial: { requested_rate: 12.25, term_months: 60, requested_amount: 100000 },
    analysis: { score: 700, risk_level: "MEDIO", approval_band: "PREAPROBABLE" },
  });
  const v2 = await textoPantalla(<ExpedienteV2Page params={params} />);
  expect(v2).toContain("12.25 %");
  expect(v2).toMatch(/Riesgo.*Medio/);
  cleanup();
  const h = await textoPantalla(<BankApplicationReviewPage params={params} />);
  expect(h).toContain("12.25 %");
  expect(h).toMatch(/Riesgo: medio/);
  expect(screen.getByTestId("herramientas-estado").textContent).toBe("En revisión");
  expect(h).not.toMatch(INGLES);
  expect(h).not.toMatch(/17[.,]5/);
});

it("(b)+(c) sin tasa ni riesgo: «Próximamente» con la misma nota en los dos sitios; sin claim no hay botones de decisión", async () => {
  respuesta = base({ financial: {}, analysis: { score: 700, approval_band: "PREAPROBABLE" } });
  const v2 = await textoPantalla(<ExpedienteV2Page params={params} />);
  const { NOTA_SIN_DATO } = jest.requireActual("@/components/credit-hub/bank-v2/expediente/hechos");
  expect(v2).toContain("Próximamente");
  expect(v2).toContain(NOTA_SIN_DATO.tasa);
  expect(v2).toContain(NOTA_SIN_DATO.riesgo);
  cleanup();
  const h = await textoPantalla(<BankApplicationReviewPage params={params} />);
  expect(h).toContain("Próximamente");
  expect(screen.getByTestId("herramientas-tasa-nota").textContent).toBe(NOTA_SIN_DATO.tasa);
  expect(screen.getByTestId("herramientas-riesgo-nota").textContent).toBe(NOTA_SIN_DATO.riesgo);
  expect(screen.queryByRole("button", { name: /Aprobar solicitud|Enviar contraoferta|Rechazar solicitud/ })).toBeNull();
  expect(screen.getByTestId("decision-panel-forbidden")).toBeInTheDocument();
});
