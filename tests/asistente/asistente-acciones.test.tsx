/**
 * Acciones con confirmacion: el asistente propone, el usuario confirma o cancela (decision de Cesar 26-nov).
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { apiFetch } from "@/lib/api/fetch-client";
import { AsistenteContable } from "@/components/ai/AsistenteContable";
import { RUTA_CONFIRMAR, confirmarAccion, enviarMensaje } from "@/lib/agents/contable/asistente-client";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
const apiFetchMock = apiFetch as jest.Mock;
const ok = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });
const PROPUESTA = {
  response: "Crear el contacto Persona: Juan (apellido Perez), DNI 30123456.\nTenes que confirmar.",
  links: [], modo: "fijo", motivo: "accion_propuesta",
  accion_propuesta: { id: "tok-1", tipo: "crear_contacto", resumen: "Crear el contacto Juan Perez", args: {}, vence_en_s: 600 },
};

beforeEach(() => apiFetchMock.mockReset());

async function pedir() {
  render(<AsistenteContable />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "crea el proveedor Juan Perez" } });
  fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
  return screen.findByRole("button", { name: "Confirmar" });
}

describe("acciones propuestas", () => {
  it("muestra Confirmar y Cancelar; al confirmar hace UN POST con {id} y muestra el resultado con su enlace", async () => {
    apiFetchMock.mockResolvedValueOnce(ok(PROPUESTA)).mockResolvedValueOnce(
      ok({ ok: true, response: "Listo: cree el contacto Perez, Juan.", links: ["/autos/dealer/contactos"] }));
    const boton = await pedir();
    expect(screen.getByRole("group", { name: /Crear el contacto Juan Perez/ })).toBeTruthy();
    fireEvent.click(boton);
    fireEvent.click(boton);  // doble toque: una sola confirmacion
    expect(await screen.findByText("Listo: cree el contacto Perez, Juan.")).toBeTruthy();
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = apiFetchMock.mock.calls[1];
    expect(url).toBe(RUTA_CONFIRMAR);
    expect(JSON.parse(init.body)).toEqual({ id: "tok-1" });
    expect(JSON.stringify(init)).not.toMatch(/tenant/i);
    expect(screen.getByRole("link", { name: "/autos/dealer/contactos" }).getAttribute("href")).toBe("/autos/dealer/contactos");
    expect(screen.queryByRole("button", { name: "Confirmar" })).toBeNull();
  });

  it("cancelar no llama al servidor y saca los botones", async () => {
    apiFetchMock.mockResolvedValueOnce(ok(PROPUESTA));
    await pedir();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(await screen.findByText("Listo, no hice nada.")).toBeTruthy();
    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Confirmar" })).toBeNull();
  });

  it("un rechazo del servidor muestra su motivo", async () => {
    apiFetchMock.mockResolvedValueOnce(ok(PROPUESTA)).mockResolvedValueOnce(
      ok({ detail: { reason_code: "PROPUESTA_VENCIDA", response: "La propuesta vencio (duran 10 minutos)." } }, 410));
    fireEvent.click(await pedir());
    expect(await screen.findByText("La propuesta vencio (duran 10 minutos).")).toBeTruthy();
  });

  it("sin accion_propuesta no hay botones", async () => {
    apiFetchMock.mockResolvedValueOnce(ok({ response: "Hola", links: [] }));
    render(<AsistenteContable />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "hola" } });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    await screen.findByText("Hola");
    expect(screen.queryByRole("button", { name: "Confirmar" })).toBeNull();
  });
});

describe("cliente", () => {
  it("descarta una accion_propuesta mal formada", async () => {
    apiFetchMock.mockResolvedValueOnce(ok({ response: "x", links: [], accion_propuesta: { id: 3 } }));
    const r = await enviarMensaje("x");
    expect(r.ok && r.data.accionPropuesta).toBeFalsy();
  });

  it("confirmarAccion falla cerrado ante error de red", async () => {
    apiFetchMock.mockRejectedValueOnce(new Error("red"));
    await waitFor(async () => expect((await confirmarAccion("t")).ok).toBe(false));
  });
});
