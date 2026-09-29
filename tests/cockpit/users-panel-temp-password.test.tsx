/**
 * COCKPIT-RESET-PASSWORD-01 — la clave temporal llega a la pantalla.
 *
 * EL DEFECTO, medido contra el backend en `48a83ff6`: los dos handlers que emiten
 * una clave temporal devuelven `temp_password`
 * (`routers/cockpit_users_router.py:151-156` y `:227-231`), pero `UsersPanel`
 * leia `res.reset_token`, un campo que el backend NUNCA envia. Como
 * `PasswordTokenModal` hace `if (!token) return null`, el modal no abria: la clave
 * YA estaba rotada en la base y el admin no la veia nunca. El usuario quedaba
 * bloqueado en silencio, sin error y sin pista.
 *
 * Por eso el caso que mas importa aqui no es el feliz sino
 * `avisa_cuando_el_backend_no_manda_la_clave`: mientras la ausencia sea silenciosa,
 * cualquier deriva futura del contrato reproduce el mismo bloqueo. El tipo generado
 * no protege --los dos handlers son `dict[str, Any]` sin `response_model`, asi que
 * `types/autos-portal-api.d.ts` los declara `{[key: string]: unknown}`--.
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

const resetUserPassword = jest.fn();
const createUser = jest.fn();
const fetchUsers = jest.fn();
const fetchRoles = jest.fn();

jest.mock("@/lib/cockpit/api/authUsers", () => ({
  resetUserPassword: (...a: unknown[]) => resetUserPassword(...a),
  createUser: (...a: unknown[]) => createUser(...a),
  fetchUsers: (...a: unknown[]) => fetchUsers(...a),
  fetchRoles: (...a: unknown[]) => fetchRoles(...a),
}));

jest.mock("@/lib/cockpit/context", () => ({
  useCockpit: () => ({ tenantFilter: "t-1", isPlatformSuperadmin: true }),
}));

// El import va DESPUES de los jest.mock a proposito por legibilidad; ts-jest
// eleva las llamadas a jest.mock por encima de los imports, asi que los dobles
// ya estan puestos cuando el modulo se evalua.
import { UsersPanel } from "@/lib/cockpit/nivel3/UsersPanel";

const USUARIO = {
  id: "u-1", name: "Ada", email: "ada@test.nadakki.com",
  role_key: "dealer_admin", tenant_id: "t-1",
};

describe("UsersPanel — clave temporal del Cockpit", () => {
  let avisos: string[];

  beforeEach(() => {
    jest.clearAllMocks();
    avisos = [];
    fetchUsers.mockResolvedValue([USUARIO]);
    fetchRoles.mockResolvedValue([{ role_key: "dealer_admin", display_name: "Dealer Admin" }]);
    jest.spyOn(window, "confirm").mockReturnValue(true);
    jest.spyOn(window, "alert").mockImplementation((m?: unknown) => {
      avisos.push(String(m));
    });
  });

  afterEach(() => jest.restoreAllMocks());

  const pulsarReset = async () => {
    render(<UsersPanel />);
    const boton = await screen.findByRole("button", { name: "Reset password" });
    // El click dispara un setState asincrono; envolverlo evita el aviso de act().
    await act(async () => {
      fireEvent.click(boton);
    });
  };

  it("muestra la clave que el backend devuelve en temp_password", async () => {
    // La forma REAL del backend: temp_password, no reset_token.
    resetUserPassword.mockResolvedValue({
      success: true, user_id: "u-1", temp_password: "Zx9-clave-temporal",
    });

    await pulsarReset();

    await waitFor(() => {
      expect(screen.getByText("Zx9-clave-temporal")).toBeInTheDocument();
    });
    expect(screen.getByText("Contraseña temporal")).toBeInTheDocument();
    expect(avisos).toEqual([]);
  });

  it("no depende de reset_token, que el backend nunca envia", async () => {
    // Si alguien vuelve a leer `reset_token`, este caso lo caza: la respuesta
    // trae la clave REAL y ademas un `reset_token` senuelo que no debe ganar.
    resetUserPassword.mockResolvedValue({
      success: true, user_id: "u-1",
      temp_password: "la-verdadera", reset_token: "senuelo-que-no-existe",
    });

    await pulsarReset();

    await waitFor(() => {
      expect(screen.getByText("la-verdadera")).toBeInTheDocument();
    });
    expect(screen.queryByText("senuelo-que-no-existe")).not.toBeInTheDocument();
  });

  it("avisa cuando el backend no manda la clave, en vez de no abrir nada", async () => {
    // EL CASO QUE IMPORTA. Esta era la respuesta efectiva del codigo viejo:
    // sin `temp_password` legible, el modal no abria y no habia error.
    resetUserPassword.mockResolvedValue({ success: true, user_id: "u-1" });

    await pulsarReset();

    await waitFor(() => expect(avisos).toHaveLength(1));
    expect(avisos[0]).toContain("no devolvió la contraseña temporal");
    expect(avisos[0]).toContain("sin acceso");
    // Y no se abre un modal vacio que finja exito.
    expect(screen.queryByText("Contraseña temporal")).not.toBeInTheDocument();
  });

  it("el alta de usuario usa el mismo campo que el reset", async () => {
    // `POST /api/v1/cockpit/users` devuelve temp_password igual que el reset, y
    // tenia el mismo defecto en la linea de al lado.
    createUser.mockResolvedValue({
      success: true, user_id: "u-2", temp_password: "clave-del-alta",
      created_at: "2026-09-29T00:00:00Z",
    });

    render(<UsersPanel />);
    const crear = await screen.findByRole("button", { name: "Crear usuario" });
    await act(async () => {
      fireEvent.click(crear);
    });

    await waitFor(() => {
      expect(screen.getByText("clave-del-alta")).toBeInTheDocument();
    });
    expect(avisos).toEqual([]);
  });

  it("el modal ofrece copiar y advierte que no se repite", async () => {
    resetUserPassword.mockResolvedValue({ success: true, temp_password: "para-copiar" });
    const escribir = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: escribir }, configurable: true,
    });

    await pulsarReset();
    const copiar = await screen.findByRole("button", { name: "Copiar" });
    await act(async () => {
      fireEvent.click(copiar);
    });

    await waitFor(() => expect(escribir).toHaveBeenCalledWith("para-copiar"));
    expect(screen.getByText(/No se mostrará de nuevo/)).toBeInTheDocument();
  });
});
