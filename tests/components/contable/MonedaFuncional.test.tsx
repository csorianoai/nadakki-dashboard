/**
 * Contabilidad en la moneda funcional del tenant.
 *
 * Los reportes contables devuelven importes "base" --ya convertidos a la moneda
 * funcional-- pero el contrato no dice CUAL es: ni `LibroMayorReport` ni
 * `BalanceComprobacionReport` traen campo de moneda. Las pantallas lo tapaban
 * con `toFixed(2)` y `toLocaleString("es-DO")`: numeros sin moneda y con
 * agrupacion dominicana, en un tenant argentino.
 *
 * Aqui se mide que la moneda sale del branding, que la agrupacion sigue al
 * locale del tenant, y que sin moneda no se publica un importe con una
 * inventada.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  MonedaFuncionalNota,
  SIN_MONEDA_FUNCIONAL,
  formateaImporteContable,
} from "@/components/contable/monedaFuncional";
import { LibroMayorClient } from "@/components/contable/LibroMayorClient";
import { localeDeTenant } from "@/lib/dealer-management/formato";

/**
 * `@/components/forge` reexporta GlobalForgeAppShell, que llama a next/font en
 * tiempo de import. Fuera de Next eso no existe, asi que se neutraliza aqui: no
 * es parte de lo que mide este packet.
 */
const MAYOR = {
  cuenta_id: "c1",
  cuenta_codigo: "1101",
  cuenta_nombre: "Caja",
  periodo_id: "p1",
  saldo_inicial: 0,
  saldo_final: 1234567.5,
  movimientos: [
    {
      id: "m1",
      fecha: "2026-09-30",
      numero_asiento: "A-1",
      asiento_id: "asiento-1",
      descripcion: "Venta",
      debe_base: 1234567.5,
      haber_base: 0,
      saldo_acumulado: 1234567.5,
    },
  ],
};

jest.mock("@/app/hooks/contable", () => ({
  ContableApiError: class ContableApiError extends Error {},
  getLibroMayor: jest.fn(async () => MAYOR),
  listCuentas: jest.fn(async () => [{ id: "c1", codigo: "1101", nombre: "Caja" }]),
  listPeriodos: jest.fn(async () => [{ id: "p1", label: "2026-09", status: "open" }]),
}));

jest.mock("@/components/contable/useContableTenantId", () => ({
  useContableTenantId: () => "tenant-a",
}));

let brandingPantalla: { locale?: string | null; currency?: string | null } | null = null;
jest.mock("@/lib/hooks/useTenantBranding", () => ({
  useTenantBranding: () => ({ data: brandingPantalla }),
}));

jest.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--inter", className: "inter" }),
  JetBrains_Mono: () => ({ variable: "--mono", className: "mono" }),
  Source_Serif_4: () => ({ variable: "--serif", className: "serif" }),
  Manrope: () => ({ variable: "--manrope", className: "manrope" }),
}));

const ARGENTINA = localeDeTenant({ locale: "es-AR", currency: "ARS" });
const DOMINICANA = localeDeTenant({ locale: "es-DO", currency: "DOP" });
const SIN_MONEDA = localeDeTenant({ locale: "es-AR", currency: null });

describe("formateaImporteContable", () => {
  it("usa la moneda del tenant, no una escrita a mano", () => {
    const valor = formateaImporteContable(1234567.5, ARGENTINA);
    expect(valor).toContain("1.234.567,50");
    expect(valor).not.toContain("RD$");
  });

  it("un tenant dominicano sigue viendo su moneda", () => {
    expect(formateaImporteContable(1234567.5, DOMINICANA)).toContain("1,234,567.50");
  });

  it("mantiene los dos decimales que exige un importe contable", () => {
    expect(formateaImporteContable(10, ARGENTINA)).toContain("10,00");
    expect(formateaImporteContable(0, ARGENTINA)).toContain("0,00");
  });

  it("sin moneda funcional no publica importe", () => {
    expect(formateaImporteContable(1000, SIN_MONEDA)).toBe("—");
  });

  it("un importe ausente o no numerico queda como em dash", () => {
    expect(formateaImporteContable(null, ARGENTINA)).toBe("—");
    expect(formateaImporteContable(undefined, ARGENTINA)).toBe("—");
    expect(formateaImporteContable(Number.NaN, ARGENTINA)).toBe("—");
  });

  it("un saldo negativo se formatea, no se oculta", () => {
    expect(formateaImporteContable(-500, ARGENTINA)).toContain("500,00");
  });
});

describe("MonedaFuncionalNota", () => {
  // React avisa una sola vez por mensaje: el espia vigila todo el describe, no un test suelto.
  let espia: jest.SpyInstance;
  beforeEach(() => {
    espia = jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    // Un bloque dentro de <p> rompe la hidratacion del primer render (currency=null).
    expect(espia).not.toHaveBeenCalled();
    espia.mockRestore();
  });

  it("deja dicho en que moneda esta todo lo que sigue", () => {
    render(<MonedaFuncionalNota locale={ARGENTINA} />);
    expect(screen.getByTestId("contable-moneda-funcional")).toHaveTextContent("ARS");
  });

  it("sin moneda avisa en vez de callarse", () => {
    render(<MonedaFuncionalNota locale={SIN_MONEDA} />);
    expect(screen.getByTestId("contable-sin-moneda")).toHaveTextContent(SIN_MONEDA_FUNCIONAL);
    expect(screen.queryByTestId("contable-moneda-funcional")).toBeNull();
  });
});


/**
 * Cierre contra la PANTALLA. El helper correcto no sirve de nada si el cliente
 * del mayor sigue llamando a `toFixed(2)`: ese era justo el defecto.
 *
 * `ContablePageShell` pasa a montar `FacturacionElectronicaAviso`, que consulta
 * el estado fiscal con react-query, asi que el cliente del mayor ya no se puede
 * renderizar fuera de un `QueryClientProvider`. En la aplicacion lo provee
 * `AppProviders`; aqui hay que declararlo. El gate de regresion del CI es el que
 * lo encontro: en local el suite no llegaba a cargar por falta de
 * NEXT_PUBLIC_BACKEND_URL, y sin esa variable el fallo queda escondido.
 */
function renderBajoQueryClient(nodo: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{nodo}</QueryClientProvider>);
}
describe("LibroMayorClient", () => {
  it("publica los importes con la moneda del tenant y su agrupacion", async () => {
    brandingPantalla = { locale: "es-AR", currency: "ARS" };
    renderBajoQueryClient(<LibroMayorClient />);

    await waitFor(() =>
      expect(screen.getByTestId("contable-moneda-funcional")).toHaveTextContent("ARS"),
    );
    await waitFor(() => expect(screen.getAllByText(/1\.234\.567,50/).length).toBeGreaterThan(0));
    expect(screen.queryByText("1234567.50")).toBeNull();
  });

  it("sin moneda del tenant avisa y no pinta importes inventados", async () => {
    brandingPantalla = { locale: "es-AR", currency: null };
    renderBajoQueryClient(<LibroMayorClient />);

    await waitFor(() => expect(screen.getByTestId("contable-sin-moneda")).toBeInTheDocument());
    expect(screen.queryByText(/1\.234\.567/)).toBeNull();
    expect(screen.queryByText("1234567.50")).toBeNull();
  });
});
