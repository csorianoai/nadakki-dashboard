/**
 * Las tres pantallas contables que quedaban formateando como RD.
 *
 * El backend ya habilito la contabilidad de Mapaal (ARS) en produccion, y estas
 * seguian con `toLocaleString("es-DO")` a nivel de modulo:
 *
 *   ResumenContableClient.tsx:33     (destino de /contable)
 *   EstadoResultadosClient.tsx:33
 *   SituacionFinancieraClient.tsx:29
 *
 * Numeros sin moneda y con agrupacion dominicana en un tenant argentino. Ahora
 * usan el MISMO mecanismo que PlanCuentas, LibroMayor y BalanceComprobacion desde
 * #532 --`useMonedaFuncional` + `formateaImporteContable` + `MonedaFuncionalNota`--
 * en vez de un formateador propio por pantalla.
 *
 * Se mide contra las PANTALLAS, no contra el helper: el helper ya estaba bien y
 * aun asi estas tres publicaban pesos dominicanos.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ResumenContableClient } from "@/components/contable/ResumenContableClient";
import { EstadoResultadosClient } from "@/components/contable/EstadoResultadosClient";
import { SituacionFinancieraClient } from "@/components/contable/SituacionFinancieraClient";
import { TENANT_CURRENCY_NOT_CONFIGURED } from "@/components/contable/monedaFuncional";

/** Un numero cuya agrupacion delata el locale: es-AR 1.234.567,50 / es-DO 1,234,567.50 */
const MONTO = 1234567.5;

const BALANCE = {
  periodo_id: "p1",
  rows: [
    { cuenta_id: "c1", codigo: "4101", nombre: "Ventas", tipo_cuenta: "ingreso", debe: 0, haber: MONTO, saldo: MONTO },
    { cuenta_id: "c2", codigo: "5101", nombre: "Sueldos", tipo_cuenta: "gasto", debe: 1000, haber: 0, saldo: 1000 },
  ],
  totals: { total_debe: MONTO, total_haber: MONTO, cuadra: true },
};

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
  activos: { total: MONTO, corriente: MONTO, no_corriente: 0, detalle: [{ codigo: "1101", nombre: "Caja", saldo: MONTO, corriente: true }] },
  pasivos: { total: 0, corriente: 0, no_corriente: 0, detalle: [] },
  patrimonio: { total: MONTO, detalle: [{ codigo: "3101", nombre: "Capital", saldo: MONTO }] },
  ecuacion_cuadra: true,
};

jest.mock("@/app/hooks/contable", () => ({
  ContableApiError: class ContableApiError extends Error {},
  getBalanceComprobacion: jest.fn(async () => BALANCE),
  getEstadoResultados: jest.fn(async () => RESULTADOS),
  getSituacionFinanciera: jest.fn(async () => SITUACION),
  listAsientos: jest.fn(async () => []),
  listPeriodos: jest.fn(async () => [{ id: "p1", label: "2026-09", status: "open" }]),
}));

jest.mock("@/components/contable/useContableTenantId", () => ({
  useContableTenantId: () => "tenant-a",
}));

let branding: { locale?: string | null; currency?: string | null } | null = null;
jest.mock("@/lib/hooks/useTenantBranding", () => ({
  useTenantBranding: () => ({ data: branding }),
}));

/**
 * `@/components/forge` reexporta GlobalForgeAppShell, que llama a next/font al
 * importarse. Fuera de Next eso no existe.
 */
jest.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--inter", className: "inter" }),
  JetBrains_Mono: () => ({ variable: "--mono", className: "mono" }),
  Source_Serif_4: () => ({ variable: "--serif", className: "serif" }),
  Manrope: () => ({ variable: "--manrope", className: "manrope" }),
}));

jest.mock("sonner", () => ({ toast: { error: jest.fn(), success: jest.fn() } }));

/**
 * `ContablePageShell` monta `FacturacionElectronicaAviso`, que consulta el estado
 * fiscal con react-query (#538). En la aplicacion el cliente lo provee
 * `AppProviders`; aqui hay que declararlo o el shell revienta al renderizar.
 */
function montar(nodo: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{nodo}</QueryClientProvider>);
}

/**
 * Resultados y Situacion no cargan solos: piden el rango y un boton --"Generar reporte"
 * en Resultados, "Generar" en Situacion--. El Resumen si
 * carga al montarse. `pinta` cubre las tres sin que el test tenga que saber cual es
 * cual, y espera a que el importe aparezca.
 */
async function pinta(nodo: React.ReactElement) {
  const vista = montar(nodo);
  const boton = screen.queryByRole("button", { name: /^Generar/i });
  if (boton) fireEvent.click(boton);
  return vista;
}

const PANTALLAS = [
  { nombre: "Resumen Contable", nodo: <ResumenContableClient /> },
  { nombre: "Estado de Resultados", nodo: <EstadoResultadosClient /> },
  { nombre: "Situación Financiera", nodo: <SituacionFinancieraClient /> },
];

describe.each(PANTALLAS)("$nombre, tenant argentino", ({ nodo }) => {
  beforeEach(() => {
    branding = { locale: "es-AR", currency: "ARS" };
  });

  it("declara la moneda funcional del tenant", async () => {
    await pinta(nodo);
    await waitFor(() =>
      expect(screen.getByTestId("contable-moneda-funcional")).toHaveTextContent("ARS"),
    );
    expect(screen.queryByTestId("contable-sin-moneda")).toBeNull();
  });

  it("agrupa con el separador es-AR, no con el dominicano", async () => {
    const { container } = await pinta(nodo);
    await waitFor(() => expect(screen.getByTestId("contable-moneda-funcional")).toBeInTheDocument());
    await waitFor(() => expect(container.textContent).toContain("1.234.567,50"));
    expect(container.textContent).not.toContain("1,234,567.50");
  });

  it("no publica ningun simbolo escrito a mano", async () => {
    const { container } = await pinta(nodo);
    await waitFor(() => expect(screen.getByTestId("contable-moneda-funcional")).toBeInTheDocument());
    await waitFor(() => expect(container.textContent).toContain("1.234.567,50"));
    for (const inventado of ["RD$", "MX$", "DOP", "MXN"]) {
      expect(container.textContent).not.toContain(inventado);
    }
  });
});

describe.each(PANTALLAS)("$nombre, tenant sin moneda configurada", ({ nodo }) => {
  beforeEach(() => {
    branding = { locale: "es-AR", currency: null };
  });

  it("avisa, y publica el reason_code del contrato", async () => {
    await pinta(nodo);
    const aviso = await screen.findByTestId("contable-sin-moneda");
    expect(aviso).toHaveAttribute("data-reason-code", TENANT_CURRENCY_NOT_CONFIGURED);
    expect(screen.getByTestId("contable-sin-moneda-codigo")).toHaveTextContent(
      TENANT_CURRENCY_NOT_CONFIGURED,
    );
    expect(screen.queryByTestId("contable-moneda-funcional")).toBeNull();
  });

  it("no pinta ningun monto con una moneda inventada, y la pagina no revienta", async () => {
    const { container } = await pinta(nodo);
    await screen.findByTestId("contable-sin-moneda");
    for (const inventado of ["RD$", "MX$", "DOP", "MXN", "1,234,567.50", "1.234.567,50"]) {
      expect(container.textContent).not.toContain(inventado);
    }
    expect(container.textContent).toContain("—");
  });
});
