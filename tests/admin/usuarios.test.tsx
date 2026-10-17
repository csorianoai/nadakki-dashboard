jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useAuth } from "@/hooks/useAuth";
import { AdminUsuarios } from "@/components/admin/usuarios/AdminUsuarios";

const TENANT = "tenant-uuid-1";
const USUARIOS = [
  { id: "u1", name: "Ana Prueba", email: "ana@example.test", role: "viewer", is_active: true },
  { id: "u2", name: "Beto Prueba", email: "beto@example.test", role: "tenant_admin", is_active: true },
];
const ROLES = [
  { role_key: "viewer", display_name: "Lector" },
  { role_key: "tenant_admin", display_name: "Administrador" },
];

const res = (cuerpo: unknown, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => cuerpo }) as Response;

function sesion(admin: boolean, cargando = false) {
  (useAuth as jest.Mock).mockReturnValue({
    isLoading: cargando,
    isAuthenticated: true,
    tenant: { id: TENANT },
    allRoles: admin ? [{ role_key: "platform_superadmin" }] : [{ role_key: "viewer" }],
  });
}

function api(extra?: (ruta: string, init?: RequestInit) => Response | undefined) {
  return jest.fn(async (ruta: string, init?: RequestInit) => {
    const r = extra?.(ruta, init);
    if (r) return r;
    if (ruta.includes("/roles")) return res({ roles: ROLES });
    if ((init?.method ?? "GET") === "GET") return res({ users: USUARIOS });
    return res({ success: true }, 201);
  });
}

beforeEach(() => sesion(true));

describe("Usuarios y roles", () => {
  it("(a) lista nombre, correo y rol", async () => {
    render(<AdminUsuarios enviar={api()} />);
    expect(await screen.findByText("Ana Prueba")).toBeInTheDocument();
    expect(screen.getByText("ana@example.test")).toBeInTheDocument();
    expect(screen.getByTestId("rol-u2")).toHaveValue("tenant_admin");
  });

  it("(b) alta: POST con el tenant activo y refresca la lista", async () => {
    const enviar = api();
    render(<AdminUsuarios enviar={enviar} />);
    await screen.findByText("Ana Prueba");
    fireEvent.change(screen.getByTestId("alta-correo"), { target: { value: "nuevo@example.test" } });
    fireEvent.change(screen.getByTestId("alta-rol"), { target: { value: "viewer" } });
    fireEvent.click(screen.getByTestId("alta-enviar"));
    await waitFor(() => {
      const post = enviar.mock.calls.find(([, i]) => i?.method === "POST");
      expect(post?.[0]).toBe("/api/v1/cockpit/users");
      expect(JSON.parse(String(post?.[1]?.body))).toEqual({
        tenant_id: TENANT,
        email: "nuevo@example.test",
        role: "viewer",
        is_active: true,
      });
    });
    await waitFor(() => expect(enviar.mock.calls.filter(([, i]) => !i?.method || i.method === "GET").length).toBeGreaterThan(3));
  });

  it("(c) cambio de rol llama a PATCH", async () => {
    const enviar = api();
    render(<AdminUsuarios enviar={enviar} />);
    await screen.findByText("Ana Prueba");
    fireEvent.change(screen.getByTestId("rol-u1"), { target: { value: "tenant_admin" } });
    await waitFor(() => {
      const p = enviar.mock.calls.find(([, i]) => i?.method === "PATCH");
      expect(p?.[0]).toBe("/api/v1/cockpit/users/u1");
      expect(JSON.parse(String(p?.[1]?.body))).toEqual({ role: "tenant_admin" });
    });
  });

  it("(d) baja pide confirmacion y luego PATCH is_active=false", async () => {
    const enviar = api();
    render(<AdminUsuarios enviar={enviar} />);
    await screen.findByText("Ana Prueba");
    fireEvent.click(screen.getByTestId("baja-u1"));
    expect(enviar.mock.calls.some(([, i]) => i?.method === "PATCH")).toBe(false);
    const dialogo = screen.getByTestId("confirmar-baja");
    fireEvent.click(within(dialogo).getByTestId("confirmar-baja-si"));
    await waitFor(() => {
      const p = enviar.mock.calls.find(([, i]) => i?.method === "PATCH");
      expect(p?.[0]).toBe("/api/v1/cockpit/users/u1");
      expect(JSON.parse(String(p?.[1]?.body))).toEqual({ is_active: false });
    });
  });

  it("(d) cancelar la confirmacion no llama al backend", async () => {
    const enviar = api();
    render(<AdminUsuarios enviar={enviar} />);
    await screen.findByText("Ana Prueba");
    fireEvent.click(screen.getByTestId("baja-u1"));
    fireEvent.click(screen.getByTestId("confirmar-baja-no"));
    expect(screen.queryByTestId("confirmar-baja")).toBeNull();
    expect(enviar.mock.calls.some(([, i]) => i?.method === "PATCH")).toBe(false);
  });

  it("(e) error del backend al listar = mensaje, no pantalla en blanco", async () => {
    render(<AdminUsuarios enviar={api((r) => (r.includes("/roles") ? undefined : res({}, 500)))} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("500");
  });

  it("(e) error al dar de alta = mensaje y la lista sigue visible", async () => {
    const enviar = api((_, i) => (i?.method === "POST" ? res({ detail: "Correo ya existe" }, 409) : undefined));
    render(<AdminUsuarios enviar={enviar} />);
    await screen.findByText("Ana Prueba");
    fireEvent.change(screen.getByTestId("alta-correo"), { target: { value: "ana@example.test" } });
    fireEvent.change(screen.getByTestId("alta-rol"), { target: { value: "viewer" } });
    fireEvent.click(screen.getByTestId("alta-enviar"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Correo ya existe");
    expect(screen.getByText("Ana Prueba")).toBeInTheDocument();
  });

  it("(e) fallo de red = mensaje", async () => {
    render(<AdminUsuarios enviar={jest.fn().mockRejectedValue(new Error("net"))} />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("(f) sin sesion de administrador no renderiza ni llama al backend", async () => {
    sesion(false);
    const enviar = api();
    const { container } = render(<AdminUsuarios enviar={enviar} />);
    expect(container).toBeEmptyDOMElement();
    expect(enviar).not.toHaveBeenCalled();
  });

  it("(f) con la sesion cargando no renderiza la gestion", () => {
    sesion(true, true);
    const enviar = api();
    render(<AdminUsuarios enviar={enviar} />);
    expect(screen.queryByTestId("admin-usuarios")).toBeNull();
    expect(enviar).not.toHaveBeenCalled();
  });
});
