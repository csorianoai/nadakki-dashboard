/**
 * El Dashboard Ejecutivo Financiero, en la moneda funcional del tenant.
 *
 * Era el peor de los cuatro sitios que quedaban: no solo el locale estaba fijo,
 * la MONEDA tambien (DashboardEjecutivoClient.tsx:69-71):
 *
 *   new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", ... })
 *
 * O sea que un tenant argentino veia sus ingresos, gastos, utilidad, activos,
 * pasivos y patrimonio etiquetados como pesos dominicanos. No es un numero sin
 * moneda: es un numero con la moneda de otro pais, que parece correcto.
 *
 * Ahora usa el mismo mecanismo que #532, igual que las otras seis pantallas.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DashboardEjecutivoClient } from "@/components/contable/DashboardEjecutivoClient";
import { SIN_MONEDA_FUNCIONAL } from "@/components/contable/monedaFuncional";

const MONTO = 1234567.5;

const RESULTADOS = {
  desde: "2026-09-01",
  hasta: "2026-09-30",
  ingresos: [{ cuenta_id: "c1", codigo: "4101", nombre: "Ventas", total: MONTO }],
  total_ingresos: MONTO,
  costos: [],
  total_costos: 0,
  utilidad_bruta: MONTO,
  gastos: [],
  total_gastos: 0,
  utilidad_neta: MONTO,
  margen_bruto_pct: 100,
  margen_neto_pct: 100,
};

const SITUACION = {
  fecha: "2026-09-30",
  activos: { total: MONTO, corriente: MONTO, no_corriente: 0, detalle: [] },
  pasivos: { total: 0, corriente: 0, no_corriente: 0, detalle: [] },
  patrimonio: { total: MONTO, detalle: [] },
  ecuacion_cuadra: true,
};

const GASTOS = {
  periodo_id: "p1",
  periodo_nombre: "2026-09",
  gastos: [
    {
      cuenta_id: "c9",
      codigo: "5101",
      nombre: "Sueldos",
      periodo_actual: MONTO,
      periodo_anterior: 1000,
      variacion_pct: 12.5,
      alerta: false,
    },
  ],
  total_gastos: MONTO,
  variacion_total_pct: 12.5,
  alertas_count: 0,
};

const AGENTE = {
  tenant_id: "tenant-a",
  generado_en: "2026-09-30T12:00:00Z",
  periodo_analizado: "2026-09",
  sugerencias: [
    {
      id: "s1",
      tipo: "reduccion_gasto",
      prioridad: "alta",
      titulo: "Bajar sueldos",
      descripcion: "Revisar la nomina",
      impacto_estimado_dop: 50000,
    },
  ],
  resumen_ejecutivo: "Todo bien",
  score_salud_financiera: 80,
};

jest.mock("@/app/hooks/contable", () => ({
  ContableApiError: class ContableApiError extends Error {},
  getEstadoResultados: jest.fn(async () => RESULTADOS),
  getSituacionFinanciera: jest.fn(async () => SITUACION),
  getGastosMonitor: jest.fn(async () => GASTOS),
  getSugerenciasAgente: jest.fn(async () => AGENTE),
  listPeriodos: jest.fn(async () => [{ id: "p1", label: "2026-09", status: "open" }]),
}));

jest.mock("@/components/contable/useContableTenantId", () => ({
  useContableTenantId: () => "tenant-a",
}));

let branding: { locale?: string | null; currency?: string | null } | null = null;
jest.mock("@/lib/hooks/useTenantBranding", () => ({
  useTenantBranding: () => ({ data: branding }),
}));

jest.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--inter", className: "inter" }),
  JetBrains_Mono: () => ({ variable: "--mono", className: "mono" }),
  Source_Serif_4: () => ({ variable: "--serif", className: "serif" }),
  Manrope: () => ({ variable: "--manrope", className: "manrope" }),
}));

jest.mock("sonner", () => ({ toast: { error: jest.fn(), success: jest.fn() } }));

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DashboardEjecutivoClient />
    </QueryClientProvider>,
  );
}

describe("Dashboard Ejecutivo, tenant argentino", () => {
  beforeEach(() => {
    branding = { locale: "es-AR", currency: "ARS" };
  });

  it("declara la moneda funcional del tenant", async () => {
    montar();
    await waitFor(() =>
      expect(screen.getByTestId("contable-moneda-funcional")).toHaveTextContent("ARS"),
    );
    expect(screen.queryByTestId("contable-sin-moneda")).toBeNull();
  });

  it("los importes salen en ARS con separador es-AR, no en DOP", async () => {
    const { container } = montar();
    await waitFor(() => expect(container.textContent).toContain("1.234.567"));
    expect(container.textContent).toContain("ARS");
    /**
     * La palabra "DOP" aparece a proposito en la frase del impacto del agente
     * --"el contrato lo devuelve en DOP"--, asi que no se puede prohibir en toda la
     * pagina: se prohibe en lo que NO es esa frase. Prohibirla entera era un error
     * mio, y el test lo dijo.
     */
    const sinLaFrase = (container.textContent ?? "").replace(
      /Impacto estimado no publicado:[^]*?es otra\./g,
      "",
    );
    for (const inventado of ["RD$", "DOP", "1,234,567"]) {
      expect(sinLaFrase).not.toContain(inventado);
    }
  });

  it("no publica el impacto del agente, porque el contrato lo da en DOP", async () => {
    montar();
    const aviso = await screen.findByTestId("ejecutivo-impacto-sin-moneda");
    expect(aviso).toBeInTheDocument();
    expect(aviso.textContent).toContain("DOP");
    expect(aviso.textContent).not.toContain("50.000");
  });
});

describe("Dashboard Ejecutivo, tenant dominicano", () => {
  beforeEach(() => {
    branding = { locale: "es-DO", currency: "DOP" };
  });

  it("sigue viendo su moneda, con su agrupacion", async () => {
    const { container } = montar();
    await waitFor(() => expect(container.textContent).toContain("1,234,567"));
    expect(screen.getByTestId("contable-moneda-funcional")).toHaveTextContent("DOP");
    expect(container.textContent).not.toContain("1.234.567,50");
  });

  it("y SI ve el impacto del agente, porque las dos monedas coinciden", async () => {
    montar();
    await waitFor(() => expect(screen.queryByTestId("ejecutivo-impacto-sin-moneda")).toBeNull());
    await waitFor(() => expect(screen.getByText(/Impacto estimado:/)).toBeInTheDocument());
  });
});

describe("Dashboard Ejecutivo, tenant sin moneda configurada", () => {
  beforeEach(() => {
    branding = { locale: "es-AR", currency: null };
  });

  /**
   * El aviso es el de #532, el mismo que ya usan las otras seis pantallas. El
   * reason_code TENANT_CURRENCY_NOT_CONFIGURED se hace visible en ESE componente
   * compartido, en el packet (a); esta pantalla lo hereda cuando (a) entre. Aqui
   * no se afirma, para que este packet no dependa del otro y los dos puedan ir con
   * base staging y CI propio.
   */
  it("avisa, y la pagina no revienta", async () => {
    montar();
    const aviso = await screen.findByTestId("contable-sin-moneda");
    expect(aviso).toHaveTextContent(SIN_MONEDA_FUNCIONAL);
    expect(screen.queryByTestId("contable-moneda-funcional")).toBeNull();
  });

  it("no pinta ningun monto con una moneda inventada", async () => {
    const { container } = montar();
    await screen.findByTestId("contable-sin-moneda");
    await waitFor(() => expect(container.textContent).toContain("—"));
    for (const inventado of ["RD$", "DOP $", "1.234.567,50", "1,234,567.50"]) {
      expect(container.textContent).not.toContain(inventado);
    }
  });
});
