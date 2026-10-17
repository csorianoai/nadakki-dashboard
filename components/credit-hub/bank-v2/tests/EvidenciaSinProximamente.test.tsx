import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExpedienteV2 } from "@/components/credit-hub/bank-v2/expediente/ExpedienteV2";
import { TarjetaCola } from "@/components/credit-hub/bank-v2/mesa/TarjetaCola";
import { marcaDesdeBranding } from "@/lib/dcc/marca";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";

let analysis: Record<string, unknown> | undefined;
const aplicacion = () => ({ data: { application_id: "a1", tenant_id: "t", state: "submitted", application_payload: { analysis } }, isError: false, isLoading: false, refetch: jest.fn() });

jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: "t-1", tenantId: "t-1", loading: false }) }));
jest.mock("@/lib/credit-hub/hooks/useBankDecision", () => ({
  useBankApplication: () => aplicacion(),
  useBankCompliance: () => ({ data: { issues: [] } }),
}));
jest.mock("@/lib/credit-hub/api/bankClient", () => ({ getAuditTrail: jest.fn(async () => ({ events: [] })) }));
jest.mock("next/link", () => ({ __esModule: true, default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

const marca = marcaDesdeBranding({ locale: "es-DO", currency: "DOP" }, "banco");
const item: BankQueueItem = {
  application_id: "a1", tenant_id: "t", state: "submitted", applicant_name: "Persona Uno", dealer_id: null, dealer_name: null, vehicle_label: null,
  requested_amount: 1000000, score: 700, risk_level: "BAJO", approval_band: "PREAPROBABLE", priority: "ALTA", created_at: null, bank_decision: null,
};
const cliente = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function tarjeta() {
  const r = render(
    <QueryClientProvider client={cliente()}>
      <TarjetaCola item={item} formato={marca.formato} href="/s/a1" />
    </QueryClientProvider>,
  );
  const det = r.container.querySelector("details")!;
  det.open = true;
  fireEvent(det, new Event("toggle"));
  return r;
}

describe("DB-CODEX-22: evidencia con dato real, sin 'Próximamente'", () => {
  it("TarjetaCola muestra ingreso, deuda / ingreso y regla del motor del expediente", () => {
    analysis = { score: 700, dti: 0.31, explanation: "Cumple la regla de capacidad de pago.", metrics: { monthly_income: 85000 } };
    const { container } = tarjeta();
    const t = container.textContent ?? "";
    expect(t).toContain("RD$85,000.00");
    expect(t).toMatch(/31\s%/);
    expect(t).toContain("Cumple la regla de capacidad de pago.");
    expect(t).not.toMatch(/próximamente/i);
  });

  it("TarjetaCola sin esos campos: '—' con motivo llano, sin 0 ni cifra inventada", () => {
    analysis = { score: 700 };
    const { container } = tarjeta();
    const campos = screen.getAllByTestId("cola-evidencia-campo");
    expect(campos).toHaveLength(3);
    for (const c of campos) {
      expect(c.querySelector("dd")?.textContent).toMatch(/^—La solicitud no trae este dato\.$/);
    }
    expect(container.textContent).not.toMatch(/próximamente/i);
    expect(container.textContent).not.toMatch(/RD\$0|\b0 %/);
  });

  it("ExpedienteV2 con los mismos datos los muestra, sin 'Próximamente'", () => {
    analysis = { score: 700, risk_level: "BAJO", approval_band: "PREAPROBABLE", dti: 0.31, estimated_payment: 1, payment_capacity: 2, metrics: { monthly_income: 85000 }, positive_factors: [], negative_factors: [] };
    const { container } = render(
      <QueryClientProvider client={cliente()}>
        <ExpedienteV2 applicationId="a1" marca={marca} hrefVistaActual="/v" hrefBandeja="/b" />
      </QueryClientProvider>,
    );
    const resumen = screen.getByText("Resumen del motor").closest("section")!;
    expect(resumen.textContent).toContain("RD$85,000.00");
    expect(resumen.textContent).toMatch(/31\s%/);
    expect(resumen.textContent).not.toMatch(/Ingreso mensual\s*Próximamente|Deuda \/ ingreso\s*Próximamente/);
    expect(container.textContent).not.toMatch(/Deuda \/ ingreso[^A-Z]*Próximamente/);
  });
});
