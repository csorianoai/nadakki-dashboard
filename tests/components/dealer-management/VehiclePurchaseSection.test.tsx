/**
 * Alta con compra en pantalla (F4C-5 2/3): el formulario 'Nuevo vehiculo' con
 * `withPurchase` valida costo, suma de pagos, cheque, fuente 'otra' y contacto
 * vendedor ANTES de enviar. Sin selector de contactos la compra se muestra
 * deshabilitada ("Disponible cuando ...") y no se envia nada.
 */
import { fireEvent, render, screen } from "@testing-library/react";

import { VehicleManualForm } from "@/components/dealer-management/VehicleManualForm";
import { VEHICLE_INITIAL_STATUS } from "@/lib/dealer-management/vehicle-manual";

let branding: { locale?: string | null; currency?: string | null } | undefined;
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: branding, isPending: false, isLoading: false }),
}));

const UUID = "123e4567-e89b-42d3-a456-426614174000";
const onSubmit = jest.fn();

const selector = ({ onChange }: { value: string; onChange: (id: string) => void; error?: string }) => (
  <button type="button" onClick={() => onChange(UUID)}>
    Elegir vendedor
  </button>
);

function montar(props: Record<string, unknown> = {}) {
  return render(
    <VehicleManualForm
      status={VEHICLE_INITIAL_STATUS}
      withPurchase
      sellerSelector={selector}
      onSubmit={onSubmit}
      {...props}
    />,
  );
}

const escribe = (name: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(name), { target: { value } });

function rellenaVehiculo() {
  escribe(/^Marca/, "Toyota");
  escribe(/^Modelo/, "Hilux");
  escribe(/^Año/, "2021");
}

function rellenaCompraValida() {
  escribe(/^Costo de compra/, "1000");
  escribe(/^Fecha de adquisición/, "2026-10-01");
  escribe(/^País de adquisición/, "AR");
  escribe(/^Código de adquisición/, "compra_directa");
  escribe(/^Importe del pago 1/, "1000");
  fireEvent.click(screen.getByRole("button", { name: "Elegir vendedor" }));
}

const enviar = () => fireEvent.click(screen.getByRole("button", { name: /Crear vehículo/ }));

beforeEach(() => {
  onSubmit.mockReset();
  branding = { locale: "es-AR", currency: "ARS" };
});

describe("compra en el alta", () => {
  it("sin costo no envia y muestra el error", () => {
    montar();
    rellenaVehiculo();
    rellenaCompraValida();
    escribe(/^Costo de compra/, "");
    enviar();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("El costo es obligatorio.")).toBeInTheDocument();
  });

  it("suma de pagos distinta del costo bloquea y lo dice en pantalla", () => {
    montar();
    rellenaVehiculo();
    rellenaCompraValida();
    escribe(/^Importe del pago 1/, "900");
    expect(screen.getByTestId("purchase-sum")).toHaveTextContent(/900/);
    enviar();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("La suma de los pagos no coincide con el costo.")).toBeInTheDocument();
  });

  it("cheque sin fecha de cobro bloquea", () => {
    montar();
    rellenaVehiculo();
    rellenaCompraValida();
    fireEvent.change(screen.getByLabelText(/^Medio de pago 1/), { target: { value: "cheque" } });
    escribe(/^Número del cheque 1/, "0001");
    escribe(/^Banco del cheque 1/, "Nación");
    enviar();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Falta la fecha de cobro del cheque.")).toBeInTheDocument();
  });

  it("fuente 'otra' sin detalle bloquea", () => {
    montar();
    rellenaVehiculo();
    rellenaCompraValida();
    escribe(/^Moneda de la compra/, "USD");
    escribe(/^Tipo de cambio/, "1000");
    escribe(/^Fecha del tipo de cambio/, "2026-10-01");
    fireEvent.change(screen.getByLabelText(/^Fuente del tipo de cambio/), { target: { value: "otra" } });
    enviar();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Falta el detalle de la fuente del tipo de cambio.")).toBeInTheDocument();
  });

  it("con todo valido envia vehiculo y compra", () => {
    montar();
    rellenaVehiculo();
    rellenaCompraValida();
    escribe(/^Número de motor/, "ABC123");
    enviar();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [vehiculo, compra] = onSubmit.mock.calls[0];
    expect(vehiculo.make).toBe("Toyota");
    expect(compra).toMatchObject({ cost: "1000", seller_contact_id: UUID, engine_number: "ABC123", currency: "ARS" });
  });

  it("el checklist de documentacion es informativo y no se envia como pago", () => {
    montar();
    for (const doc of [/Título/, /Formulario 08/, /Cédula/, /VTV/, /Cheque \(documentación\)/]) {
      expect(screen.getByRole("checkbox", { name: doc })).toBeEnabled();
    }
  });

  it("sin selector de contactos la compra va deshabilitada y no envia", () => {
    montar({ sellerSelector: undefined });
    rellenaVehiculo();
    expect(screen.getByTestId("purchase-unavailable")).toHaveTextContent(/Disponible cuando/);
    expect(screen.getByLabelText(/^Costo de compra/)).toBeDisabled();
    enviar();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("sin withPurchase no aparece la compra", () => {
    montar({ withPurchase: false });
    expect(screen.queryByTestId("vehicle-purchase")).not.toBeInTheDocument();
  });
});
