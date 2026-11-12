/**
 * F4C-7-CONTACTOS-UI. Tres pruebas de hecho: casado sin conyuge no envia, el DNI se pinta tal como llega
 * (enmascarado) y no hay boton de borrado. Mas la validacion de DNI/CUIT en pantalla.
 */
import { fireEvent, render, screen } from "@testing-library/react";

import { ContactoForm } from "@/app/autos/dealer/contactos/ContactoForm";
import { ContactoFicha } from "@/app/autos/dealer/contactos/ContactoFicha";
import { validarCuit, validarDni } from "@/app/autos/dealer/contactos/contactos-validar";

const ENMASCARADO = {
  id: "c-1",
  kind: "fisica",
  display_name: "Perez, Juan",
  first_name: "Juan",
  last_name: "Perez",
  business_name: null,
  dni: "*****567",
  cuit: "********123",
  iva_condition: "consumidor_final",
  iibb_number: null,
  marital_status: "soltero",
  spouse_first_name: null,
  spouse_last_name: null,
  spouse_dni: null,
  deactivated_at: null,
  deactivation_reason: null,
  created_at: "2026-11-01T10:00:00Z",
  updated_at: "2026-11-01T10:00:00Z",
};

function llenar(label: RegExp | string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("validacion en pantalla", () => {
  it("DNI: 7 u 8 digitos, con o sin puntos de millar", () => {
    expect(validarDni("12345678")).toBeNull();
    expect(validarDni("12.345.678")).toBeNull();
    expect(validarDni("12.345.67")).not.toBeNull();
    expect(validarDni("abc")).not.toBeNull();
  });
  it("CUIT: 11 digitos y digito verificador", () => {
    expect(validarCuit("20-12345678-6")).toBeNull();
    expect(validarCuit("20-12345678-5")).not.toBeNull();
    expect(validarCuit("123")).not.toBeNull();
  });
});

describe("formulario", () => {
  it("casado sin conyuge no envia y muestra el error", () => {
    const onSubmit = jest.fn();
    render(<ContactoForm onSubmit={onSubmit} />);
    llenar(/^nombre$/i, "Juan");
    llenar(/^apellido$/i, "Perez");
    llenar(/^DNI$/i, "12345678");
    llenar(/condici[oó]n de iva/i, "consumidor_final");
    llenar(/estado civil/i, "casado");
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByRole("alert")[0]).toBeTruthy();
    expect(screen.getAllByText(/c[oó]nyuge/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/DNI del c[oó]nyuge/i).getAttribute("aria-invalid")).toBe("true");
  });

  it("casado con conyuge completo envia el cuerpo con DNI sin puntos", () => {
    const onSubmit = jest.fn();
    render(<ContactoForm onSubmit={onSubmit} />);
    llenar(/^nombre$/i, "Juan");
    llenar(/^apellido$/i, "Perez");
    llenar(/^DNI$/i, "12.345.678");
    llenar(/condici[oó]n de iva/i, "consumidor_final");
    llenar(/estado civil/i, "casado");
    llenar(/nombre del c[oó]nyuge/i, "Ana");
    llenar(/apellido del c[oó]nyuge/i, "Gomez");
    llenar(/DNI del c[oó]nyuge/i, "23456789");
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      kind: "fisica",
      dni: "12345678",
      marital_status: "casado",
      spouse_first_name: "Ana",
      spouse_dni: "23456789",
    });
  });

  it("CUIT con digito verificador malo no envia", () => {
    const onSubmit = jest.fn();
    render(<ContactoForm onSubmit={onSubmit} />);
    llenar(/^nombre$/i, "Juan");
    llenar(/^apellido$/i, "Perez");
    llenar(/^CUIT/i, "20-12345678-5");
    llenar(/condici[oó]n de iva/i, "consumidor_final");
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^CUIT/i).getAttribute("aria-invalid")).toBe("true");
  });

  it("al editar no reenvia el enmascarado como si fuera un DNI", () => {
    const onSubmit = jest.fn();
    render(<ContactoForm inicial={ENMASCARADO} onSubmit={onSubmit} />);
    expect((screen.getByLabelText(/^DNI$/i) as HTMLInputElement).value).toBe("");
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("dni");
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("cuit");
  });
});

describe("ficha", () => {
  it("pinta el DNI enmascarado tal como llega, sin el rol", () => {
    const { container } = render(<ContactoFicha contacto={ENMASCARADO} />);
    expect(screen.getByText("*****567")).toBeTruthy();
    expect(container.textContent).not.toMatch(/\d{7,8}/);
  });
  it("sin boton de borrado: solo baja logica", () => {
    render(<ContactoFicha contacto={ENMASCARADO} onBaja={jest.fn()} />);
    expect(screen.queryByRole("button", { name: /borrar|eliminar|delete|suprimir/i })).toBeNull();
    expect(screen.getByRole("button", { name: /dar de baja/i })).toBeTruthy();
  });
});
