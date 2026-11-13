import { fireEvent, render, screen } from "@testing-library/react";
import { VehicleManualForm } from "../VehicleManualForm";
import { VEHICLE_FORM_EMPTY } from "@/lib/dealer-management/vehicle-manual";
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({ useDealerManagementBranding: () => ({ data: { locale: "es-AR", currency: "ARS" } }) }));
jest.mock("@/app/autos/dealer/contactos/ContactoSelector", () => ({ ContactoSelector: ({ onChange }: { onChange: (id: string) => void }) => <button type="button" onClick={() => onChange("11111111-1111-4111-8111-111111111111")}>Elegir vendedor</button> }));
const submit = jest.fn();
const change = (name: string, value: string) => fireEvent.change(screen.getByLabelText(name), { target: { value } });
beforeEach(() => { submit.mockReset(); render(<VehicleManualForm purchase onSubmit={submit} initial={{ ...VEHICLE_FORM_EMPTY, make: "Toyota", model: "Hilux", year: "2021" }} />); });
function send() { fireEvent.submit(screen.getByTestId("vehicle-manual-form")); }
function fill() {
  change("Costo de compra", "100"); change("Moneda de compra (3 letras)", "ARS"); change("Fecha de adquisición", "2026-11-01");
  change("País de adquisición (2 letras)", "AR"); change("Modo de adquisición", "stock_inicial"); change("Importe del pago", "100");
  fireEvent.click(screen.getByText("Elegir vendedor"));
}
test("sin costo no envía y muestra error", () => { send(); expect(submit).not.toHaveBeenCalled(); expect(screen.getByRole("alert")).toHaveTextContent("costo es obligatorio"); });
test("suma distinta bloquea", () => { fill(); change("Importe del pago", "99"); send(); expect(submit).not.toHaveBeenCalled(); expect(screen.getByRole("alert")).toHaveTextContent("suma"); });
test("cheque sin fecha bloquea", () => { fill(); change("Medio de pago", "cheque"); send(); expect(submit).not.toHaveBeenCalled(); expect(screen.getByRole("alert")).toHaveTextContent("fecha de cobro"); });
test("otra fuente sin detalle bloquea", () => { fill(); change("Tasa manual", "1"); change("Fuente del tipo de cambio", "otra"); change("Fecha del tipo de cambio", "2026-11-01"); send(); expect(submit).not.toHaveBeenCalled(); expect(screen.getByRole("alert")).toHaveTextContent("Falta el detalle"); });
test("compra válida comparte submit con vehículo y documentos deshabilitados", () => { fill(); send(); expect(submit).toHaveBeenCalledTimes(1); expect(submit.mock.calls[0][1].seller_contact_id).toMatch(/^1111/); expect(screen.getByLabelText("Título")).toBeDisabled(); });
