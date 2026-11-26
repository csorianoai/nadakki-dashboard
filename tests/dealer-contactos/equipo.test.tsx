/**
 * EQUIPO-DEALER: cliente HTTP del equipo y pantalla (lista, invitar con clave temporal una sola vez, desactivar con
 * confirmacion, errores en castellano).
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { apiFetch } from "@/lib/api/fetch-client";
import {
  desactivarMiembro,
  invitarVendedor,
  listarEquipo,
  mensajeError,
  validarEmail,
} from "@/app/autos/dealer/contactos/equipo/equipo-api";
import { EquipoPantalla } from "@/app/autos/dealer/contactos/equipo/EquipoPantalla";
import { AccessApiError } from "@/lib/access/client";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
const apiFetchMock = apiFetch as jest.Mock;
const ok = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });

const DUENO = { user_id: "u-1", email: "dueno@a.com", is_active: true, autos_role: "dealer_gerente", is_admin: true, is_self: true };
const VENDE = { user_id: "u-2", email: "vende@a.com", is_active: true, autos_role: "dealer_vendedor", is_admin: false, is_self: false };
const BAJA = { user_id: "u-3", email: "baja@a.com", is_active: false, autos_role: "ninguno", is_admin: false, is_self: false };

beforeEach(() => apiFetchMock.mockReset());

describe("cliente HTTP del equipo", () => {
  it("lista con GET /team/members, sin tenant ni dealer en la peticion", async () => {
    apiFetchMock.mockResolvedValue(ok({ dealer_id: "d", items: [DUENO] }));
    expect(await listarEquipo()).toEqual([DUENO]);
    const [url, init] = apiFetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/autos/team/members");
    expect(JSON.stringify(init)).not.toMatch(/tenant/i);
  });

  it("invita con POST y solo el correo; desactiva con POST, nunca DELETE", async () => {
    apiFetchMock.mockResolvedValue(ok({ status: "created" }, 201));
    await invitarVendedor("  nuevo@a.com ");
    await desactivarMiembro("u/2");
    expect(apiFetchMock.mock.calls[0][0]).toBe("/api/v1/autos/team/invitations");
    expect(apiFetchMock.mock.calls[0][1].method).toBe("POST");
    expect(JSON.parse(apiFetchMock.mock.calls[0][1].body)).toEqual({ email: "nuevo@a.com" });
    expect(apiFetchMock.mock.calls[1][0]).toBe("/api/v1/autos/team/u%2F2/deactivate");
    expect(apiFetchMock.mock.calls[1][1].method).toBe("POST");
  });

  it("un error del servidor se lanza con su motivo y se traduce", async () => {
    apiFetchMock.mockResolvedValue(ok({ detail: { reason_code: "TENANT_ADMIN_REQUIRED" } }, 403));
    const e = await invitarVendedor("x@a.com").catch((err) => err);
    expect(e).toBeInstanceOf(AccessApiError);
    expect(mensajeError(e)).toMatch(/solo el dueño/i);
  });

  it("mensajes: texto del servidor primero, tabla despues, y sin respuesta", () => {
    const conTexto = new AccessApiError({ status: 409, reason_code: "EMAIL_IN_OTHER_TENANT", endpoint: "x",
      detail: { reason_code: "EMAIL_IN_OTHER_TENANT", error: "Texto del servidor." } });
    expect(mensajeError(conTexto)).toBe("Texto del servidor.");
    const sinTexto = new AccessApiError({ status: 409, reason_code: "CANNOT_DEACTIVATE_SELF", endpoint: "x", detail: {} });
    expect(mensajeError(sinTexto)).toMatch(/tu propio usuario/);
    const validacion = new AccessApiError({ status: 422, reason_code: null, endpoint: "x", detail: [{ loc: ["body"] }] });
    expect(mensajeError(validacion)).toMatch(/correo/i);
    expect(mensajeError(new Error("red"))).toMatch(/no hubo respuesta/i);
  });

  it("valida el correo en pantalla", () => {
    expect(validarEmail("")).not.toBeNull();
    expect(validarEmail("sin-arroba")).not.toBeNull();
    expect(validarEmail(" ok@a.com ")).toBeNull();
  });
});

describe("pantalla Equipo", () => {
  it("lista con rol y estado; no ofrece desactivarse a si mismo, a un admin ni a un desactivado", async () => {
    apiFetchMock.mockResolvedValue(ok({ items: [DUENO, VENDE, BAJA] }));
    render(<EquipoPantalla />);
    expect(await screen.findByText("vende@a.com")).toBeInTheDocument();
    expect(screen.getByText("dueno@a.com (vos)")).toBeInTheDocument();
    expect(screen.getByText("Vendedor")).toBeInTheDocument();
    expect(screen.getByText("Desactivado")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Desactivar" })).toHaveLength(1);
  });

  it("estado vacio y error de carga en castellano", async () => {
    apiFetchMock.mockResolvedValueOnce(ok({ items: [] }));
    const { unmount } = render(<EquipoPantalla />);
    expect(await screen.findByText(/todavía no hay nadie/i)).toBeInTheDocument();
    unmount();
    apiFetchMock.mockResolvedValueOnce(ok({ detail: { reason_code: "TENANT_ADMIN_REQUIRED" } }, 403));
    render(<EquipoPantalla />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/solo el dueño/i);
  });

  it("correo invalido no envia", async () => {
    apiFetchMock.mockResolvedValue(ok({ items: [] }));
    render(<EquipoPantalla />);
    await screen.findByText(/todavía no hay nadie/i);
    fireEvent.change(screen.getByLabelText(/correo del vendedor/i), { target: { value: "mal" } });
    fireEvent.click(screen.getByRole("button", { name: "Invitar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/no parece válido/i);
    expect(apiFetchMock).toHaveBeenCalledTimes(1); // solo la carga de la lista
  });

  it("invitar muestra la clave temporal una vez y al cerrarla desaparece", async () => {
    apiFetchMock
      .mockResolvedValueOnce(ok({ items: [DUENO] }))
      .mockResolvedValueOnce(ok({ status: "created", user_id: "u-9", email: "nuevo@a.com", dealer_id: "d", is_active: true,
        must_change_password: true, temporary_password: "Temp-123-abc" }, 201))
      .mockResolvedValue(ok({ items: [DUENO, { ...VENDE, user_id: "u-9", email: "nuevo@a.com" }] }));
    render(<EquipoPantalla />);
    await screen.findByText("dueno@a.com (vos)");
    fireEvent.change(screen.getByLabelText(/correo del vendedor/i), { target: { value: "nuevo@a.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Invitar" }));
    expect(await screen.findByTestId("clave-temporal")).toHaveTextContent("Temp-123-abc");
    expect(screen.getByText(/no la vas a poder ver de nuevo/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /ya la anoté/i }));
    expect(screen.queryByTestId("clave-temporal")).not.toBeInTheDocument();
  });

  it("reinvitar a alguien que ya estaba avisa y no muestra clave", async () => {
    apiFetchMock
      .mockResolvedValueOnce(ok({ items: [VENDE] }))
      .mockResolvedValueOnce(ok({ status: "already_member", user_id: "u-2", email: "vende@a.com", dealer_id: "d",
        is_active: true, must_change_password: false, temporary_password: null }))
      .mockResolvedValue(ok({ items: [VENDE] }));
    render(<EquipoPantalla />);
    await screen.findByText("vende@a.com");
    fireEvent.change(screen.getByLabelText(/correo del vendedor/i), { target: { value: "vende@a.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Invitar" }));
    expect(await screen.findByText(/ya estaba en tu equipo/i)).toBeInTheDocument();
    expect(screen.queryByTestId("clave-temporal")).not.toBeInTheDocument();
  });

  it("correo de otra empresa muestra el error del servidor", async () => {
    apiFetchMock
      .mockResolvedValueOnce(ok({ items: [] }))
      .mockResolvedValueOnce(ok({ detail: { reason_code: "EMAIL_IN_OTHER_TENANT",
        error: "Ese correo ya está registrado en otra empresa. Usá otro correo." } }, 409));
    render(<EquipoPantalla />);
    await screen.findByText(/todavía no hay nadie/i);
    fireEvent.change(screen.getByLabelText(/correo del vendedor/i), { target: { value: "x@b.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Invitar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/otra empresa/i);
  });

  it("desactivar pide confirmacion; cancelar no llama al servidor", async () => {
    apiFetchMock.mockResolvedValue(ok({ items: [VENDE] }));
    render(<EquipoPantalla />);
    fireEvent.click(await screen.findByRole("button", { name: "Desactivar" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("¿Desactivar a vende@a.com?");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(apiFetchMock.mock.calls.every(([url]) => !String(url).includes("deactivate"))).toBe(true);
  });

  it("confirmar desactiva y recarga", async () => {
    apiFetchMock
      .mockResolvedValueOnce(ok({ items: [VENDE] }))
      .mockResolvedValueOnce(ok({ status: "deactivated", user_id: "u-2", is_active: false }))
      .mockResolvedValue(ok({ items: [{ ...VENDE, is_active: false }] }));
    render(<EquipoPantalla />);
    fireEvent.click(await screen.findByRole("button", { name: "Desactivar" }));
    fireEvent.click(screen.getByRole("button", { name: /sí, desactivar/i }));
    expect(await screen.findByText(/quedó desactivado/i)).toBeInTheDocument();
    expect(apiFetchMock.mock.calls[1][0]).toBe("/api/v1/autos/team/u-2/deactivate");
    await waitFor(() => expect(screen.getByText("Desactivado")).toBeInTheDocument());
  });
});
