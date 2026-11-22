/**
 * Pulido del alta con compra (F4D-5, parte 2/3): formulario y seccion de compra.
 * VIN duplicado en campo, mensajes por reason_code, desplegable de modos de
 * adquisicion, errores que se borran al corregir y grillas sin desborde.
 */
import { fireEvent, render, screen } from "@testing-library/react";

import { VehicleManualForm } from "@/components/dealer-management/VehicleManualForm";
import { VEHICLE_INITIAL_STATUS } from "@/lib/dealer-management/vehicle-manual";

const UUID = "123e4567-e89b-42d3-a456-426614174000";

type Modos = { status: "loading" | "error" | "ok"; items?: { code: string; label: string }[]; retry: () => void };
let modos: Modos;
jest.mock("@/lib/dealer-management/acquisition-modes", () => ({
  useAcquisitionModes: () => modos,
}));
const mockBranding = { data: { locale: "es-AR", currency: "ARS" }, isPending: false, isLoading: false };
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => mockBranding,
}));

const OK: Modos = {
  status: "ok",
  items: [{ code: "compra_directa", label: "Compra directa" }, { code: "permuta", label: "Permuta" }],
  retry: () => {},
};
const escribe = (name: RegExp, value: string) => fireEvent.change(screen.getByLabelText(name), { target: { value } });
const envia = () => fireEvent.submit(screen.getByTestId("vehicle-manual-form"));

function montar(props: { errorReasonCode?: string | null; onSubmit?: jest.Mock } = {}) {
  const onSubmit = props.onSubmit ?? jest.fn();
  const view = render(
    <VehicleManualForm
      status={VEHICLE_INITIAL_STATUS}
      withPurchase
      errorReasonCode={props.errorReasonCode ?? null}
      sellerSelector={(p) => (
        <button type="button" onClick={() => p.onChange(UUID)}>
          Elegir vendedor
        </button>
      )}
      onSubmit={onSubmit}
    />,
  );
  return { onSubmit, view };
}

function rellena() {
  escribe(/^Marca/, "Toyota");
  escribe(/^Modelo/, "Hilux");
  escribe(/^Año/, "2021");
  escribe(/^VIN/, "1HGCM82633A004352");
  escribe(/^Costo de compra/, "1000");
  escribe(/^Fecha de adquisición/, "2026-10-01");
  escribe(/^País de adquisición/, "AR");
  escribe(/^Código de adquisición/, "compra_directa");
  escribe(/^Importe del pago 1/, "1000");
  fireEvent.click(screen.getByRole("button", { name: "Elegir vendedor" }));
}

beforeEach(() => {
  modos = OK;
});

describe("errores del backend", () => {
  it("VIN_DUPLICATE dice que el VIN ya existe y marca el campo", () => {
    montar({ errorReasonCode: "VIN_DUPLICATE" });
    expect(screen.getAllByText(/Ya existe un vehículo con ese VIN/).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/^VIN/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText(/No se pudo guardar el vehículo/)).not.toBeInTheDocument();
  });

  it.each([
    ["SELLER_CONTACT_NOT_FOUND", /contacto vendedor/i],
    ["PAYMENT_SUM_MISMATCH", /suma de los pagos/i],
    ["CAPABILITY_DENIED", /permiso/i],
    ["DEALER_NOT_ASSIGNED", /asignad/i],
    ["IDEMPOTENCY_KEY_REUSED", /ya se envió/i],
  ])("%s tiene mensaje propio con su reason_code", (code, texto) => {
    montar({ errorReasonCode: code });
    expect(screen.getByTestId("vehicle-manual-error")).toHaveTextContent(texto);
    expect(screen.getByTestId("vehicle-manual-error")).toHaveAttribute("data-reason-code", code);
    expect(screen.queryByText(/Revisa los datos e intenta de nuevo/)).not.toBeInTheDocument();
  });

  it("lo desconocido conserva el generico con el reason_code", () => {
    montar({ errorReasonCode: "RARO_XYZ" });
    expect(screen.getByText(/Revisa los datos e intenta de nuevo/)).toBeInTheDocument();
    expect(screen.getByTestId("vehicle-manual-error")).toHaveAttribute("data-reason-code", "RARO_XYZ");
  });

  it("el error del VIN duplicado desaparece al editar el VIN", () => {
    montar({ errorReasonCode: "VIN_DUPLICATE" });
    escribe(/^VIN/, "1HGCM82633A004353");
    expect(screen.getByLabelText(/^VIN/)).not.toHaveAttribute("aria-invalid");
  });
});

describe("codigo de adquisicion", () => {
  it("es un desplegable con los modos del endpoint: pinta el label y envia el code", () => {
    const { onSubmit } = montar();
    const select = screen.getByLabelText(/^Código de adquisición/);
    expect(select.tagName).toBe("SELECT");
    expect(screen.getByRole("option", { name: "Permuta" })).toHaveValue("permuta");
    rellena();
    envia();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][1].acquisition_mode_code).toBe("compra_directa");
  });

  it("si la lectura falla hay error con reintento, sin campo libre ni lista inventada", () => {
    const retry = jest.fn();
    modos = { status: "error", retry };
    montar();
    expect(screen.queryByLabelText(/^Código de adquisición/)).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Compra directa" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("sin modos leidos no se puede enviar la compra", () => {
    modos = { status: "error", retry: () => {} };
    const { onSubmit } = montar();
    envia();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("errores de validacion", () => {
  it("corregir el campo borra su error sin reenviar", () => {
    montar();
    envia();
    expect(screen.getByText("El costo es obligatorio.")).toBeInTheDocument();
    escribe(/^Costo de compra/, "1000");
    expect(screen.queryByText("El costo es obligatorio.")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^Costo de compra/)).not.toHaveAttribute("aria-invalid");
    expect(screen.getByText("El año es obligatorio.")).toBeInTheDocument();
    escribe(/^Año/, "2021");
    expect(screen.queryByText("El año es obligatorio.")).not.toBeInTheDocument();
  });
});

describe("sin desborde horizontal", () => {
  it("las grillas arrancan en una columna y los fieldset pueden encogerse", () => {
    montar();
    const seccion = screen.getByTestId("vehicle-purchase");
    seccion.querySelectorAll(".grid").forEach((g) => expect(g).toHaveClass("grid-cols-1"));
    seccion.querySelectorAll("fieldset").forEach((f) => expect(f).toHaveClass("min-w-0"));
  });
});
