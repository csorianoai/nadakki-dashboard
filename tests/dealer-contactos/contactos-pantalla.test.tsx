/**
 * F4C-7-CONTACTOS-UI parte 2/2: cliente HTTP, pantalla (vacio/carga/error, baja logica) y selector exportado.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { apiFetch } from "@/lib/api/fetch-client";
import { buscarContactos, darDeBaja, reactivar } from "@/app/autos/dealer/contactos/contactos-api";
import { ContactoSelector } from "@/app/autos/dealer/contactos/ContactoSelector";
import { ContactosPantalla } from "@/app/autos/dealer/contactos/ContactosPantalla";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
const apiFetchMock = apiFetch as jest.Mock;

const C = {
  id: "c-1", kind: "fisica", display_name: "Perez, Juan", first_name: "Juan", last_name: "Perez", business_name: null,
  dni: "*****567", cuit: null, iva_condition: "consumidor_final", iibb_number: null, marital_status: "soltero",
  spouse_first_name: null, spouse_last_name: null, spouse_dni: null, deactivated_at: null, deactivation_reason: null,
  created_at: null, updated_at: null,
};
const ok = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });

beforeEach(() => apiFetchMock.mockReset());

describe("cliente HTTP de contactos", () => {
  it("lista por texto con GET y sin cabecera de tenant", async () => {
    apiFetchMock.mockResolvedValue(ok({ items: [C] }));
    expect(await buscarContactos("Perez")).toEqual([C]);
    const [url, init] = apiFetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/autos/contacts?q=Perez&limit=50");
    expect(JSON.stringify(init)).not.toMatch(/tenant/i);
  });

  it("7-8 digitos busca por DNI y 11 por CUIT con POST /search", async () => {
    apiFetchMock.mockResolvedValue(ok({ items: [] }));
    await buscarContactos("12.345.678");
    await buscarContactos("20-12345678-6");
    expect(apiFetchMock.mock.calls[0][0]).toBe("/api/v1/autos/contacts/search");
    expect(JSON.parse(apiFetchMock.mock.calls[0][1].body)).toEqual({ dni: "12345678" });
    expect(JSON.parse(apiFetchMock.mock.calls[1][1].body)).toEqual({ cuit: "20123456786" });
  });

  it("la baja manda motivo y la reactivacion manda reactivate, con PATCH", async () => {
    apiFetchMock.mockResolvedValue(ok(C));
    await darDeBaja("c-1", "duplicado");
    await reactivar("c-1");
    expect(apiFetchMock.mock.calls[0][1].method).toBe("PATCH");
    expect(JSON.parse(apiFetchMock.mock.calls[0][1].body)).toEqual({ deactivation_reason: "duplicado" });
    expect(JSON.parse(apiFetchMock.mock.calls[1][1].body)).toEqual({ reactivate: true });
  });

  it("nunca usa DELETE", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    expect(Object.keys(require("@/app/autos/dealer/contactos/contactos-api")).join(" ")).not.toMatch(/borrar|eliminar|delete/i);
  });
});

describe("ContactosPantalla", () => {
  it("muestra carga y luego el estado vacio sin inventar contactos", async () => {
    apiFetchMock.mockResolvedValue(ok({ items: [] }));
    render(<ContactosPantalla />);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(await screen.findByText(/no hay contactos/i)).toBeTruthy();
  });

  it("muestra el error del servidor con alerta", async () => {
    apiFetchMock.mockResolvedValue(ok({ detail: { reason_code: "CAPABILITY_DENIED" } }, 403));
    render(<ContactosPantalla />);
    expect((await screen.findAllByRole("alert"))[0].textContent).toMatch(/CAPABILITY_DENIED|permiso/i);
  });

  it("pinta el DNI enmascarado en la ficha y no ofrece borrar", async () => {
    apiFetchMock.mockResolvedValue(ok({ items: [C] }));
    render(<ContactosPantalla />);
    fireEvent.click(await screen.findByRole("button", { name: /Perez, Juan/ }));
    expect(await screen.findByText("*****567")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /borrar|eliminar/i })).toBeNull();
    expect(screen.getByRole("button", { name: /dar de baja/i })).toBeTruthy();
  });

  it("la baja exige motivo y envia PATCH", async () => {
    apiFetchMock.mockResolvedValueOnce(ok({ items: [C] }));
    render(<ContactosPantalla />);
    fireEvent.click(await screen.findByRole("button", { name: /Perez, Juan/ }));
    fireEvent.click(await screen.findByRole("button", { name: /dar de baja/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar baja/i }));
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    apiFetchMock.mockResolvedValueOnce(ok({ ...C, deactivated_at: "2026-11-13", deactivation_reason: "duplicado" }));
    fireEvent.change(screen.getByLabelText(/motivo de la baja/i), { target: { value: "duplicado" } });
    fireEvent.click(screen.getByRole("button", { name: /confirmar baja/i }));
    await waitFor(() => expect(screen.getByText(/dado de baja: duplicado/i)).toBeTruthy());
    expect(JSON.parse(apiFetchMock.mock.calls[1][1].body)).toEqual({ deactivation_reason: "duplicado" });
  });
});

describe("ContactoSelector (exportado para alta y ficha)", () => {
  it("busca, lista enmascarado y entrega el contacto elegido", async () => {
    apiFetchMock.mockResolvedValue(ok({ items: [C] }));
    const onSelect = jest.fn();
    render(<ContactoSelector rol="vendedor" onSelect={onSelect} />);
    fireEvent.change(screen.getByLabelText(/buscar contacto/i), { target: { value: "Perez" } });
    fireEvent.click(screen.getByRole("button", { name: /^buscar$/i }));
    fireEvent.click(await screen.findByRole("option", { name: /Perez, Juan/ }));
    expect(onSelect).toHaveBeenCalledWith(C);
    expect(screen.queryByText(/12345678/)).toBeNull();
  });

  it("sin resultados lo dice", async () => {
    apiFetchMock.mockResolvedValue(ok({ items: [] }));
    render(<ContactoSelector rol="comprador" onSelect={jest.fn()} />);
    fireEvent.change(screen.getByLabelText(/buscar contacto/i), { target: { value: "Nadie" } });
    fireEvent.click(screen.getByRole("button", { name: /^buscar$/i }));
    expect(await screen.findByText(/sin resultados/i)).toBeTruthy();
  });
});
