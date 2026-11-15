/**
 * F4D-6 PARTE 1/2: filtro de dados de baja, error de campo que se borra al corregir, y ficha que pinta lo que entrega
 * el backend (GET de detalle, sin cachear lo recibido en el alta). Telefono/email/direccion van en la PARTE 2/2.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { apiFetch } from "@/lib/api/fetch-client";
import { ContactoForm } from "@/app/autos/dealer/contactos/ContactoForm";
import { ContactosPantalla } from "@/app/autos/dealer/contactos/ContactosPantalla";
import type { Contacto } from "@/app/autos/dealer/contactos/contactos-tipos";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
const apiFetchMock = apiFetch as jest.Mock;

const base: Contacto = {
  id: "c-1", kind: "fisica", display_name: "Perez, Juan", first_name: "Juan", last_name: "Perez", business_name: null,
  dni: "*****567", cuit: "*******6786", iva_condition: "consumidor_final", iibb_number: null, marital_status: "soltero",
  spouse_first_name: null, spouse_last_name: null, spouse_dni: null, deactivated_at: null, deactivation_reason: null,
  created_at: null, updated_at: null,
};
const ok = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });

type Ruta = Record<string, (url: string, init?: RequestInit) => unknown>;
/** Enruta por "METODO ruta-sin-query"; lo no previsto responde 500 para que el test lo delate. */
function servidor(rutas: Ruta) {
  apiFetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    const clave = `${init?.method ?? "GET"} ${url.split("?")[0]}`;
    const h = rutas[clave];
    return h ? ok(h(url, init)) : ok({ detail: { reason_code: `SIN_RUTA ${clave}` } }, 500);
  });
}
const llamadas = (metodo: string, ruta: string) =>
  apiFetchMock.mock.calls.filter(([u, i]) => `${i?.method ?? "GET"} ${String(u).split("?")[0]}` === `${metodo} ${ruta}`);
const cuerpo = (c: unknown[]) => JSON.parse((c[1] as RequestInit).body as string);

beforeEach(() => apiFetchMock.mockReset());

describe("contactos dados de baja", () => {
  const baja = { ...base, id: "c-2", display_name: "Gomez, Ana", deactivated_at: "2026-11-01", deactivation_reason: "duplicado" };

  it("'Ver dados de baja' usa include_inactive, marca 'Dado de baja' y permite reactivar", async () => {
    servidor({
      "GET /api/v1/autos/contacts": (u) => ({ items: u.includes("include_inactive=true") ? [base, baja] : [base] }),
      "GET /api/v1/autos/contacts/c-2": () => baja,
      "PATCH /api/v1/autos/contacts/c-2": () => ({ ...baja, deactivated_at: null, deactivation_reason: null }),
    });
    render(<ContactosPantalla />);
    await screen.findByRole("button", { name: /Perez, Juan/ });
    expect(screen.queryByText(/Gomez, Ana/)).toBeNull();
    fireEvent.click(screen.getByLabelText(/ver dados de baja/i));
    const item = await screen.findByRole("button", { name: /Gomez, Ana/ });
    expect(within(item).getByText(/dado de baja/i)).toBeTruthy();
    expect(apiFetchMock.mock.calls.some(([u]) => String(u).includes("include_inactive=true"))).toBe(true);

    fireEvent.click(item);
    fireEvent.click(await screen.findByRole("button", { name: /reactivar/i }));
    await waitFor(() => expect(llamadas("PATCH", "/api/v1/autos/contacts/c-2")).toHaveLength(1));
    expect(cuerpo(llamadas("PATCH", "/api/v1/autos/contacts/c-2")[0])).toEqual({ reactivate: true });
  });

  it("sin el filtro no pide inactivos", async () => {
    servidor({ "GET /api/v1/autos/contacts": () => ({ items: [base] }) });
    render(<ContactosPantalla />);
    await screen.findByRole("button", { name: /Perez, Juan/ });
    expect(apiFetchMock.mock.calls.some(([u]) => String(u).includes("include_inactive"))).toBe(false);
  });
});

describe("errores de campo", () => {
  it("corregir el CUIT borra su error", () => {
    render(<ContactoForm onSubmit={jest.fn()} />);
    fireEvent.change(screen.getByLabelText(/^nombre$/i), { target: { value: "Juan" } });
    fireEvent.change(screen.getByLabelText(/^apellido$/i), { target: { value: "Perez" } });
    fireEvent.change(screen.getByLabelText(/condición de iva/i), { target: { value: "consumidor_final" } });
    fireEvent.change(screen.getByLabelText(/cuit/i), { target: { value: "20123456780" } });
    fireEvent.click(screen.getByRole("button", { name: /^guardar$/i }));
    expect(screen.getByText(/CUIT\/CUIL no válido/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/cuit/i), { target: { value: "20123456786" } });
    expect(screen.queryByText(/CUIT\/CUIL no válido/)).toBeNull();
    expect(screen.getByLabelText(/cuit/i).getAttribute("aria-invalid")).toBeNull();
    expect(screen.queryByText(/revise los campos/i)).toBeNull();
  });
});

describe("ficha", () => {
  it("pinta el DNI en claro si el backend lo entrega al reabrir", async () => {
    servidor({
      "GET /api/v1/autos/contacts": () => ({ items: [base] }), // el listado siempre llega enmascarado
      "GET /api/v1/autos/contacts/c-1": () => ({ ...base, dni: "12345678", cuit: "20123456786" }),
    });
    render(<ContactosPantalla />);
    fireEvent.click(await screen.findByRole("button", { name: /Perez, Juan/ }));
    expect(await screen.findByText("12345678")).toBeTruthy();
    expect(screen.getByText("20123456786")).toBeTruthy();
  });
});
