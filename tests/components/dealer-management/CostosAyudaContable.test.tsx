/**
 * Las reglas contables de carga de costos se leen DONDE se cargan.
 *
 * D4 las pide, y medido no estaban: grep de IVA, comisión, RT 54 y FACPCE en
 * `CostosVehiculoPanel.tsx` y `vehicle-costs.ts` daba cero. La diferencia que
 * hacen no es cosmética: decide si se capitaliza el neto gravado o el IVA
 * recuperable, y si la comisión que se carga es la de compra o la de venta.
 *
 * El texto es VERBATIM de GUIA-CARGA-MAPAAL (#1501, comentario 5952253812,
 * secciones 3 y 4). Por eso los casos comparan contra las constantes del módulo
 * y además contra fragmentos literales: si alguien "mejora" la redacción, la
 * comparación literal se pone roja y hay que volver a la fuente.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";

import { CostosVehiculoPanel } from "@/app/autos/dealer/finanzas/CostosVehiculoPanel";
import {
  AYUDA_POR_TIPO_DE_COSTO,
  AYUDA_REVERSIONES,
  REGLAS_CONTABLES,
  REGLAS_CONTABLES_BASE,
  REGLAS_CONTABLES_CIERRE,
} from "@/app/autos/dealer/finanzas/ayuda-contable";
import { localeDeTenant } from "@/lib/dealer-management/formato";
import { COST_TYPES } from "@/lib/dealer-management/vehicle-costs";

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import { apiFetch } from "@/lib/api/fetch-client";

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

const ARGENTINA = localeDeTenant({ locale: "es-AR", currency: "ARS" });

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CostosVehiculoPanel vehicleId="v-1" locale={ARGENTINA} />
    </QueryClientProvider>,
  );
}

function elegirTipo(valor: string) {
  fireEvent.change(screen.getByRole("combobox", { name: /tipo/i }), { target: { value: valor } });
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ totals: [] }),
  } as unknown as Response);
});

describe("las cinco reglas de carga, verbatim", () => {
  it("se pintan todas, con su base y su cierre", () => {
    montar();

    const bloque = screen.getByTestId("reglas-contables-costos");
    expect(bloque).toHaveTextContent(REGLAS_CONTABLES_BASE);
    for (const regla of REGLAS_CONTABLES) {
      expect(bloque).toHaveTextContent(regla);
    }
    expect(bloque).toHaveTextContent(REGLAS_CONTABLES_CIERRE);
    expect(bloque).toHaveTextContent(AYUDA_REVERSIONES);
  });

  it("la regla del IVA está literal: es la que evita capitalizar el crédito fiscal", () => {
    montar();

    const bloque = screen.getByTestId("reglas-contables-costos");
    expect(bloque).toHaveTextContent("SIN IVA recuperable");
    expect(bloque).toHaveTextContent("registrá el neto gravado cuando el IVA sea recuperable");
    expect(bloque).toHaveTextContent("El IVA recuperable no forma parte del costo del vehículo");
  });

  it("la de comisión distingue compra de venta, que es donde se equivoca uno", () => {
    montar();

    const bloque = screen.getByTestId("reglas-contables-costos");
    expect(bloque).toHaveTextContent("significa exclusivamente comisión de compra");
    expect(bloque).toHaveTextContent("Las comisiones de venta no aumentan el costo del vehículo");
    expect(bloque).toHaveTextContent("son gasto de venta");
  });

  it("cita la base del criterio y no se la inventa", () => {
    montar();

    expect(screen.getByTestId("reglas-contables-costos")).toHaveTextContent("RT 54 FACPCE");
  });
});

describe("la ayuda del tipo elegido", () => {
  it("empieza mostrando la del tipo por defecto del formulario", () => {
    montar();

    const ayuda = screen.getByTestId("ayuda-tipo-de-costo");
    const tipo = ayuda.getAttribute("data-cost-type") as string;
    expect(AYUDA_POR_TIPO_DE_COSTO[tipo]).toBeDefined();
    expect(ayuda).toHaveTextContent(AYUDA_POR_TIPO_DE_COSTO[tipo] as string);
  });

  it("cambia con el tipo: cada código muestra SU texto y no el de otro", () => {
    montar();

    for (const { value } of COST_TYPES) {
      elegirTipo(value);
      const ayuda = screen.getByTestId("ayuda-tipo-de-costo");
      expect(ayuda.getAttribute("data-cost-type")).toBe(value);
      expect(ayuda.textContent).toBe(AYUDA_POR_TIPO_DE_COSTO[value] as string);
    }
  });

  it("en Impuesto dice NO recuperables, que es la condición para capitalizarlo", () => {
    montar();

    elegirTipo("tax");
    // Igualdad EXACTA, no subcadena: `toHaveTextContent` deja pasar que se
    // antepongan frases, y "Impuestos: tributos. Impuestos no recuperables..."
    // invita justo a capitalizar el IVA recuperable. Medido por mutacion.
    expect(screen.getByTestId("ayuda-tipo-de-costo").textContent).toBe(
      "Impuestos no recuperables: tributos que forman parte del costo porque no generan crédito fiscal recuperable.",
    );
  });

  it("en Reparación dice que proveedor y factura son obligatorios", () => {
    montar();

    elegirTipo("repair");
    expect(screen.getByTestId("ayuda-tipo-de-costo")).toHaveTextContent(
      "Proveedor y factura son obligatorios",
    );
  });

  it("hay ayuda para los siete tipos que el backend acepta: ninguno se queda sin regla", () => {
    for (const { value } of COST_TYPES) {
      expect(AYUDA_POR_TIPO_DE_COSTO[value]).toBeDefined();
    }
  });

  it("un tipo sin ayuda no pinta un texto de relleno", () => {
    montar();

    // `registration` (Gestoría) está descrito en la guía pero el backend aún no
    // lo acepta, así que no está en COST_TYPES ni tiene ayuda todavía.
    expect(AYUDA_POR_TIPO_DE_COSTO.registration).toBeUndefined();
  });
});
