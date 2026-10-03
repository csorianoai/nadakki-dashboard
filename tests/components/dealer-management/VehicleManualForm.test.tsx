/**
 * Formulario de alta manual: campos, validacion y lo que NO se puede guardar.
 *
 * Se renderiza el formulario directo porque lo que se mide aqui es el contrato
 * de la UI con el usuario. El cierre por capability y el envio van en el packet
 * de la pantalla, sobre `app/autos/dealer/inventario/nuevo/page.tsx`.
 *
 * El caso que mas importa es el de la moneda: la referencia NO puede decir US$
 * mientras `display_price_currency` no exista.
 */
import { fireEvent, render, screen } from "@testing-library/react";

import { VehicleManualForm } from "@/components/dealer-management/VehicleManualForm";
import { VEHICLE_INITIAL_STATUS } from "@/lib/dealer-management/vehicle-manual";

let branding: { locale?: string | null; currency?: string | null } | undefined;
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: branding, isPending: false, isLoading: false }),
}));

const onSubmit = jest.fn();

function montar(props: Record<string, unknown> = {}) {
  return render(<VehicleManualForm status={VEHICLE_INITIAL_STATUS} onSubmit={onSubmit} {...props} />);
}

function rellenaMinimo() {
  fireEvent.change(screen.getByRole("textbox", { name: /Marca/ }), { target: { value: "Toyota" } });
  fireEvent.change(screen.getByRole("textbox", { name: /Modelo/ }), { target: { value: "Hilux" } });
  fireEvent.change(screen.getByRole("textbox", { name: /Año/ }), { target: { value: "2021" } });
}

beforeEach(() => {
  onSubmit.mockReset();
  branding = { locale: "es-AR", currency: "ARS" };
});

describe("campos del contrato", () => {
  it("los campos reales se editan", () => {
    montar();
    for (const name of [/Marca/, /Modelo/, /Año/, /Versión/, /VIN/, /Tracción/, /Carrocería/]) {
      expect(screen.getByRole("textbox", { name })).toBeEnabled();
    }
    expect(screen.getByRole("combobox", { name: /Condición/ })).toBeEnabled();
  });

  it("nace en BORRADOR y el estado no se edita", () => {
    montar();
    expect(screen.getByTestId("vehicle-status")).toHaveTextContent("BORRADOR");
  });
});

describe("lo que el contrato no acepta no se habilita", () => {
  it("dominio, numero de stock, puertas, cilindrada y cilindros van deshabilitados", () => {
    montar();
    for (const name of [
      /Dominio · Próximamente/,
      /Número de stock · Próximamente/,
      /Puertas · Próximamente/,
      /Cilindrada · Próximamente/,
      /Cilindros · Próximamente/,
    ]) {
      expect(screen.getByRole("textbox", { name })).toBeDisabled();
    }
  });

  it("se dice por que: lo que se escriba ahi no se guardaria", () => {
    montar();
    expect(screen.getByTestId("vehicle-pending-fields")).toHaveTextContent("no se guardaría");
  });
});

describe("moneda de los dos precios", () => {
  it("el oficial toma la moneda funcional del tenant", () => {
    montar();
    expect(screen.getByRole("textbox", { name: /Precio \(ARS\)/ })).toBeDisabled();
  });

  it("la referencia no asume US$: dice que falta su moneda", () => {
    montar();
    expect(screen.queryByRole("textbox", { name: /Precio de referencia \(US\$\)/ })).toBeNull();
    expect(
      screen.getByRole("textbox", { name: /Precio de referencia \(moneda de referencia del tenant\)/ }),
    ).toBeDisabled();
  });

  it("la ayuda no nombra ninguna moneda como autoridad contable", () => {
    montar();
    expect(screen.getByText(/la contabilidad usa el precio oficial/)).toBeInTheDocument();
    expect(screen.queryByText(/precio en pesos/)).toBeNull();
  });

  it("sin moneda del tenant el oficial tampoco inventa una", () => {
    branding = { locale: "es-AR", currency: null };
    montar();
    expect(screen.queryByRole("textbox", { name: /Precio \(ARS\)/ })).toBeNull();
    expect(screen.getByRole("textbox", { name: /moneda funcional del tenant/ })).toBeDisabled();
  });

  it("otra moneda del tenant produce otra etiqueta", () => {
    branding = { locale: "es-DO", currency: "DOP" };
    montar();
    expect(screen.getByRole("textbox", { name: /Precio \(DOP\)/ })).toBeDisabled();
  });

  /**
   * Lo que pide el CHANGE_REQUEST sobre e2bfe678: demostrar que cambiar la moneda
   * del contrato no introduce literales ni altera el payload oficial.
   *
   * El contrato ya lo fija a su nivel (#521). Aqui se mide donde el usuario lo
   * ve y donde el dato sale hacia el padre: se recorren cuatro monedas de tenant
   * y se comprueba que NINGUNA etiqueta ni ayuda del formulario trae un simbolo o
   * nombre de moneda a mano, y que lo que el formulario entrega es IDENTICO en
   * las cuatro. Si alguien vuelve a escribir US$ o "pesos" en la pantalla, o
   * cuela la moneda en el payload, esto se pone rojo.
   */
  it("cambiar la moneda del tenant no introduce literales ni altera lo que se envia", () => {
    const LITERALES = /RD\$|US\$|MX\$|pesos|dolares|dólares/i;
    const entregas: unknown[] = [];

    for (const moneda of ["ARS", "DOP", "USD", null]) {
      branding = { locale: "es-AR", currency: moneda };
      const { unmount } = montar();

      for (const campo of document.querySelectorAll("label")) {
        expect(campo.textContent ?? "").not.toMatch(LITERALES);
      }

      rellenaMinimo();
      fireEvent.submit(screen.getByTestId("vehicle-manual-form"));
      entregas.push(onSubmit.mock.calls.at(-1)?.[0]);
      onSubmit.mockClear();
      unmount();
    }

    expect(entregas).toHaveLength(4);
    for (const entrega of entregas) {
      expect(entrega).toEqual(entregas[0]);
      expect(Object.keys(entrega as object)).not.toContain("price_official");
      expect(Object.keys(entrega as object)).not.toContain("price_reference");
    }
  });
});

describe("validacion antes de llamar al padre", () => {
  it("sin marca ni modelo no se envia nada", () => {
    montar();
    fireEvent.submit(screen.getByTestId("vehicle-manual-form"));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("La marca es obligatoria.")).toBeInTheDocument();
    expect(screen.getByText("El modelo es obligatorio.")).toBeInTheDocument();
  });

  it("un VIN de largo distinto de 17 tampoco pasa", () => {
    montar();
    rellenaMinimo();
    fireEvent.change(screen.getByRole("textbox", { name: /VIN/ }), { target: { value: "ABC123" } });
    fireEvent.submit(screen.getByTestId("vehicle-manual-form"));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("El VIN tiene exactamente 17 caracteres.")).toBeInTheDocument();
  });

  it("con lo minimo valido entrega el formulario al padre", () => {
    montar();
    rellenaMinimo();
    fireEvent.submit(screen.getByTestId("vehicle-manual-form"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ make: "Toyota", model: "Hilux", year: "2021" });
  });
});

describe("estado visible", () => {
  it("el reason_code del backend se pinta en la propia pantalla", () => {
    montar({ errorReasonCode: "UPGRADE_REQUIRED" });
    expect(screen.getByTestId("vehicle-manual-error")).toHaveAttribute("data-reason-code", "UPGRADE_REQUIRED");
  });

  it("mientras guarda, el boton no deja reenviar", () => {
    montar({ busy: true });
    expect(screen.getByRole("button", { name: /Guardando/ })).toBeDisabled();
  });
});
