/**
 * Libro mayor, Periodos y Balance pintan el periodo con nombre, fechas en
 * dd/mm/aaaa y el estado en espanol (auditoria Mapaal QA, P1). El mapeo de la
 * fila real se fija en periodos-mapeo-fila-real.test.ts.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { BalanceComprobacionClient } from "@/components/contable/BalanceComprobacionClient";
import { LibroMayorClient } from "@/components/contable/LibroMayorClient";
import { PeriodosClient } from "@/components/contable/PeriodosClient";

jest.mock("@/app/hooks/contable", () => ({
  ContableApiError: class ContableApiError extends Error {},
  listPeriodos: jest.fn(async () => [
    {
      id: "per-7",
      tenant_id: "mapaal",
      fiscal_year: 2026,
      period_number: 7,
      label: "Julio 2026",
      status: "open",
      fecha_inicio: "2026-07-01",
      fecha_fin: "2026-07-31",
    },
  ]),
  listCuentas: jest.fn(async () => []),
  lockPeriodo: jest.fn(),
  reopenPeriodo: jest.fn(),
  getLibroMayor: jest.fn(),
  getBalanceComprobacion: jest.fn(async () => ({
    periodo_id: "per-7",
    rows: [],
    totals: { total_debe: 0, total_haber: 0, cuadra: true },
  })),
}));

jest.mock("@/components/forge", () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  Select: ({ label, options }: { label: string; options: { value: string; label: string }[] }) => (
    <label>
      {label}
      <select>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));

jest.mock("@/components/contable/useContableTenantId", () => ({
  useContableTenantId: () => "mapaal",
}));

// La cabecera arrastra fetch-client, que exige backend declarado bajo jest.
jest.mock("@/components/contable/ContablePageShell", () => ({
  ContablePageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/proyectos/finanzas/JustificationModal", () => ({
  JustificationModal: () => null,
}));

jest.mock("sonner", () => ({ toast: { error: jest.fn(), success: jest.fn(), warning: jest.fn() } }));

jest.mock("@/lib/hooks/useTenantBranding", () => ({
  useTenantBranding: () => ({ data: { locale: "es-AR", currency: "ARS" } }),
}));

describe("pantallas", () => {
  it("Periodos: nombre, inicio y fin en dd/mm/aaaa y estado en espanol", async () => {
    render(<PeriodosClient />);
    expect(await screen.findByText("Julio 2026")).toBeInTheDocument();
    expect(screen.getByText("01/07/2026")).toBeInTheDocument();
    expect(screen.getByText("31/07/2026")).toBeInTheDocument();
    expect(screen.getByText("Abierto")).toBeInTheDocument();
  });

  it("Balance: la opcion del periodo ya no es solo (open)", async () => {
    render(<BalanceComprobacionClient />);
    await waitFor(() => expect(screen.getByRole("option", { name: "Julio 2026 (abierto)" })).toBeInTheDocument());
    expect(screen.queryByText(/\(open\)/)).toBeNull();
  });

  it("Libro mayor: la opcion del periodo lleva su nombre", async () => {
    render(<LibroMayorClient />);
    await waitFor(() => expect(screen.getByRole("option", { name: "Julio 2026" })).toBeInTheDocument());
  });
});
