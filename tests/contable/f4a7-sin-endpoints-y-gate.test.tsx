/**
 * F4A-7 (F-13, F-14).
 * F-13: monitor-gastos y agente-ia llamaban a /reports/gastos-monitor y
 *       /reports/sugerencias-ia, que el backend no tiene. Ahora no llaman y
 *       dicen "no disponible".
 * F-14: "Nuevo asiento" y su pantalla exigen la capacidad contable.
 */
import { render, screen } from "@testing-library/react";

const getGastosMonitor = jest.fn();
const getSugerenciasAgente = jest.fn();
jest.mock("@/app/hooks/contable", () => ({
  ContableApiError: class extends Error {
    status = 0;
  },
  getGastosMonitor: (...a: unknown[]) => getGastosMonitor(...a),
  getSugerenciasAgente: (...a: unknown[]) => getSugerenciasAgente(...a),
  listPeriodos: jest.fn(async () => []),
}));
jest.mock("@/components/contable/useContableTenantId", () => ({
  useContableTenantId: () => "tenant-1",
}));
jest.mock("@/components/contable/ContablePageShell", () => ({
  ContablePageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock("@/components/contable/CrearAsientoClient", () => ({
  CrearAsientoClient: () => <div data-testid="form-asiento" />,
}));
jest.mock("recharts", () => ({}));

const batchMock = jest.fn();
jest.mock("@/lib/access/hooks", () => ({
  useAccessEntitlementsBatch: (keys: string[]) => batchMock(keys),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => "/contable/resumen",
  useRouter: () => ({ push: jest.fn() }),
}));

import { MonitorGastosClient } from "@/components/contable/MonitorGastosClient";
import { AgenteFinancieroClient } from "@/components/contable/AgenteFinancieroClient";
import { ContableSubNav } from "@/components/contable/ContableSubNav";
import CrearAsientoPage from "@/app/contable/asientos/nuevo/page";

function batch(allowed: boolean | "loading" | "error") {
  if (allowed === "loading") return { isLoading: true, error: null, data: undefined };
  if (allowed === "error") return { isLoading: false, error: new Error("x"), data: undefined };
  return {
    isLoading: false,
    error: null,
    data: { results: { "accounting.ledger.entries": { allowed, reason_code: "X" } } },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn() as unknown as typeof fetch;
});

describe("F-13 pantallas sin endpoint", () => {
  it("monitor de gastos no llama al backend y dice no disponible", async () => {
    render(<MonitorGastosClient />);
    expect(await screen.findByText(/no disponible/i)).toBeTruthy();
    expect(getGastosMonitor).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("consultor IA no llama al backend y dice no disponible", async () => {
    render(<AgenteFinancieroClient />);
    expect(await screen.findByText(/no disponible/i)).toBeTruthy();
    expect(getSugerenciasAgente).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("F-14 gate de capacidad", () => {
  it("con la capacidad se ve Nuevo Asiento y el formulario", () => {
    batchMock.mockReturnValue(batch(true));
    render(<ContableSubNav />);
    expect(screen.getByText("Nuevo Asiento")).toBeTruthy();
    render(<CrearAsientoPage />);
    expect(screen.getByTestId("form-asiento")).toBeTruthy();
  });

  it.each([false, "loading", "error"] as const)("sin capacidad (%s) no hay boton ni formulario", (estado) => {
    batchMock.mockReturnValue(batch(estado));
    render(<ContableSubNav />);
    expect(screen.queryByText("Nuevo Asiento")).toBeNull();
    expect(screen.getByText("Libro Mayor")).toBeTruthy();
    render(<CrearAsientoPage />);
    expect(screen.queryByTestId("form-asiento")).toBeNull();
  });
});
