/**
 * F4A-7 PARTE 1/2 (F-13). F-14 va en la PARTE 2/2.
 * F-13: monitor-gastos y agente-ia llamaban a /reports/gastos-monitor y
 *       /reports/sugerencias-ia, que el backend no tiene. Ahora no llaman y
 *       dicen "no disponible".
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
jest.mock("recharts", () => ({}));

import { MonitorGastosClient } from "@/components/contable/MonitorGastosClient";
import { AgenteFinancieroClient } from "@/components/contable/AgenteFinancieroClient";

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
