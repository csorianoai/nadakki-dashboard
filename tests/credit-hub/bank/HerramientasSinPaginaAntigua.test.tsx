import fs from "fs";
import path from "path";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HerramientasPage from "@/app/(forge)/credit-hub/bank-v2/solicitudes/[applicationId]/herramientas/page";

const ID = "APP-12B";
const RUTA = path.join(process.cwd(), "app/(forge)/credit-hub/bank-v2/solicitudes/[applicationId]/herramientas/page.tsx");

jest.mock("next/link", () => ({ __esModule: true, default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: "t-1", tenantId: "t-1", loading: false }) }));
jest.mock("@/app/(forge)/credit-hub/bank-v2/BancoV2Shell", () => ({
  useMarcaBanco: () => jest.requireActual("@/lib/dcc/marca").marcaDesdeBranding({ locale: "es-DO", currency: "DOP" }, "banco"),
}));
jest.mock("@/lib/hooks/useTenantBranding", () => ({ useTenantBranding: () => ({ data: { locale: "es-DO", currency: "DOP" } }) }));
jest.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "analista-1" } }) }));
jest.mock("@/lib/credit-hub/hooks/useCreditHubActor", () => ({ useCreditHubActor: () => ({ can: () => true, roleKey: "bank_analyst" }) }));
jest.mock("@/app/credit/CreditTenantGate", () => ({ CreditTenantGate: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock("@/app/(forge)/credit-hub/bank/_components/BankApplicationOpsPanel", () => ({ BankApplicationOpsPanel: () => <div data-testid="ops-panel" /> }));
jest.mock("@/lib/credit-hub/api/client", () => {
  const real = jest.requireActual("@/lib/credit-hub/api/client");
  return {
    ...real,
    chFetch: jest.fn(async (p: string) => {
      if (p.includes("expediente/full")) throw new real.CHApiError("no", 404);
      if (p.includes("/compliance/")) return { consents_complete: true, documents_complete: true, issues: [] };
      if (p.endsWith("/events")) return { events: [] };
      return {
        application_id: "APP-12B", tenant_id: "t", state: "claimed",
        application_payload: { applicant: { name: "Ana Prueba" }, vehicle: { label: "Auto" }, documents: [], financial: { requested_rate: 12.25, term_months: 60, requested_amount: 100000 } },
      };
    }),
  };
});

const params = Object.assign(Promise.resolve({ applicationId: ID }), { status: "fulfilled", value: { applicationId: ID } }) as Promise<{ applicationId: string }>;

afterEach(cleanup);

it("/herramientas no monta la pagina antigua de bank/applications", () => {
  const src = fs.readFileSync(RUTA, "utf8");
  expect(src).not.toMatch(/bank\/applications\/\[applicationId\]\/page/);
});

it("/herramientas compone los hooks del expediente y pinta el detalle y el panel de operaciones", async () => {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <HerramientasPage params={params} />
    </QueryClientProvider>,
  );
  expect(await screen.findByText("Ana Prueba")).toBeTruthy();
  expect(screen.getByTestId("ops-panel")).toBeTruthy();
  expect(screen.getByTestId("herramientas-volver-expediente")).toBeTruthy();
});
