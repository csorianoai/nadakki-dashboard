/** PS-6-DEMO-SIC-REPORTES: sin datos de demostración disfrazados de datos del tenant. */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

jest.mock("recharts", () => {
  const React = require("react");
  const Pass = ({ children }: any) => React.createElement("div", null, children);
  return new Proxy({}, { get: () => Pass });
});
jest.mock("@/contexts/TenantContext", () => ({ useTenant: () => ({ tenantId: "t-qa" }) }));

const mockFetchExp = jest.fn();
jest.mock("@/lib/api/sic", () => ({
  fetchExpedientes: (...a: any[]) => mockFetchExp(...a),
  fetchExportacionesGlobal: jest.fn().mockResolvedValue([]),
  fetchKpisEjecutivo: jest.fn().mockRejectedValue(new Error("x")),
  fetchAlertasEjecutivo: jest.fn().mockRejectedValue(new Error("x")),
  fetchResumenPortafolio: jest.fn().mockRejectedValue(new Error("x")),
  fetchExpediente: jest.fn(),
  fetchTimeline: jest.fn(),
  fetchNotas: jest.fn(),
  fetchReporteIndividual: jest.fn(),
  fetchComparativoExpVsPortafolio: jest.fn(),
  fetchComparativoPeriodos: jest.fn(),
  fetchExportStatus: jest.fn(),
  fetchExportHistorial: jest.fn(),
  downloadCsvBatch: jest.fn(),
  downloadPdfBatch: jest.fn(),
  downloadSnapshot: jest.fn(),
}));

import SicReportesPage from "@/app/sic/reportes/page";

const real = [
  { expediente_id: "E-1", referencia_cliente: "REF-A", estado_expediente: "APROBADO", decision_actual: "APROBADO", confianza_decision: 0.9, fecha_creacion: "2026-03-01" },
];

describe("SIC › Reportes", () => {
  beforeEach(() => mockFetchExp.mockReset());

  it("(b) con la API simulada muestra los datos de la respuesta", async () => {
    mockFetchExp.mockResolvedValue(real);
    render(<SicReportesPage />);
    await waitFor(() => expect(screen.getAllByText(/REF-A/).length).toBeGreaterThan(0));
    expect(screen.queryByText(/CLI-00\d/)).toBeNull();
    expect(screen.queryByText(/EXP-MOCK/)).toBeNull();
  });

  it("(c) con respuesta vacía muestra ausencia explícita y ningún literal de demostración", async () => {
    mockFetchExp.mockResolvedValue([]);
    const { container } = render(<SicReportesPage />);
    await waitFor(() => expect(screen.getByText(/no hay datos que reportar/i)).toBeTruthy());
    expect(container.textContent).not.toMatch(/CLI-00\d|EXP-MOCK|Salario|Inversiones/);
  });

  it("(d) con error muestra mensaje y no datos inventados", async () => {
    mockFetchExp.mockRejectedValue(new Error("fallo 500"));
    const { container } = render(<SicReportesPage />);
    await waitFor(() => expect(screen.getByText(/fallo 500/)).toBeTruthy());
    expect(container.textContent).not.toMatch(/CLI-00\d|EXP-MOCK|Salario|Inversiones|datos de respaldo/i);
  });

  it("(a) todo literal de demostración renderizado lleva badge DEMO", async () => {
    mockFetchExp.mockResolvedValue([]);
    const { container } = render(<SicReportesPage />);
    await waitFor(() => expect(screen.getByText(/no hay datos que reportar/i)).toBeTruthy());
    const demoLiteral = /CLI-00\d|EXP-MOCK|Salario|Inversiones/;
    const walk = (el: Element): void => {
      if (demoLiteral.test(el.textContent || "")) {
        expect(el.closest("[data-demo]") || el.querySelector("[data-demo]")).toBeTruthy();
      }
    };
    walk(container);
  });
});
