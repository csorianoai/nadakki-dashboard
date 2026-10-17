const mockAuth = jest.fn();
jest.mock("@/contexts/AuthContext", () => ({ useAuth: () => mockAuth() }));
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("@/lib/auth/token-storage", () => ({ tokenStorage: { getAccessToken: () => "a.b.c" } }));
jest.mock("@/lib/auth/jwt-decode", () => ({ decodeJWT: () => ({ tid: "tid-1" }) }));

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { UsuariosAdmin } from "@/components/admin/usuarios/UsuariosAdmin";
import AdminUsuariosPage from "@/app/admin/usuarios/page";

const resp = (cuerpo: unknown, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(cuerpo) } as Response);

const USERS = [
  { id: "u1", email: "ana@ejemplo.test", role: "admin", is_active: true },
  { id: "u2", email: "luis@ejemplo.test", role: "viewer", is_active: true },
];

function api(extra?: (ruta: string, init?: RequestInit) => Promise<Response> | undefined) {
  return jest.fn((ruta: string, init?: RequestInit) => {
    const r = extra?.(ruta, init);
    if (r) return r;
    if (ruta.includes("/roles")) return resp({ roles: [{ role: "admin" }, { role: "viewer" }] });
    if (init?.method) return resp({ success: true, temp_password: "temporal-ok" });
    return resp({ users: USERS });
  });
}

describe("UsuariosAdmin", () => {
  it("(a) lista correo y rol del tenant activo", async () => {
    const enviar = api();
    render(<UsuariosAdmin tenantId="tid-1" enviar={enviar} />);
    const fila = await screen.findByTestId("usuario-u1");
    expect(within(fila).getByText("ana@ejemplo.test")).toBeInTheDocument();
    expect(within(fila).getByLabelText("Rol de ana@ejemplo.test")).toHaveValue("admin");
    expect(enviar.mock.calls[0][0]).toContain("tenant_id=tid-1");
  });

  it("(b) alta llama POST con el tenant y refresca", async () => {
    const enviar = api();
    render(<UsuariosAdmin tenantId="tid-1" enviar={enviar} />);
    await screen.findByTestId("usuarios-tabla");
    fireEvent.change(screen.getByLabelText("Correo del nuevo usuario"), { target: { value: "nuevo@ejemplo.test" } });
    fireEvent.click(screen.getByText("Crear usuario"));
    await screen.findByTestId("usuarios-temporal");
    const post = enviar.mock.calls.find(([, i]) => i?.method === "POST")!;
    expect(JSON.parse(post[1]!.body as string)).toMatchObject({ tenant_id: "tid-1", email: "nuevo@ejemplo.test", role: "admin" });
    expect(enviar.mock.calls.filter(([r, i]) => !i?.method && r.includes("tenant_id")).length).toBe(2);
  });

  it("(c) cambio de rol llama PATCH", async () => {
    const enviar = api();
    render(<UsuariosAdmin tenantId="tid-1" enviar={enviar} />);
    fireEvent.change(await screen.findByLabelText("Rol de luis@ejemplo.test"), { target: { value: "admin" } });
    await waitFor(() => expect(enviar.mock.calls.some(([, i]) => i?.method === "PATCH")).toBe(true));
    const [ruta, init] = enviar.mock.calls.find(([, i]) => i?.method === "PATCH")!;
    expect(ruta).toBe("/api/v1/cockpit/users/u2");
    expect(JSON.parse(init!.body as string)).toEqual({ role: "admin" });
  });

  it("(d) baja pide confirmación y envía is_active=false", async () => {
    const enviar = api();
    render(<UsuariosAdmin tenantId="tid-1" enviar={enviar} />);
    fireEvent.click(within(await screen.findByTestId("usuario-u1")).getByText("Desactivar"));
    expect(enviar.mock.calls.some(([, i]) => i?.method === "PATCH")).toBe(false);
    fireEvent.click(screen.getByText("Confirmar"));
    await waitFor(() => expect(enviar.mock.calls.some(([, i]) => i?.method === "PATCH")).toBe(true));
    const [ruta, init] = enviar.mock.calls.find(([, i]) => i?.method === "PATCH")!;
    expect(ruta).toBe("/api/v1/cockpit/users/u1");
    expect(JSON.parse(init!.body as string)).toEqual({ is_active: false });
  });

  it.each([403, 500])("(e) error %s del backend = mensaje, no pantalla en blanco", async (s) => {
    const enviar = api((ruta) => (ruta.includes("/roles") ? undefined : resp({ detail: "fallo" }, s)));
    render(<UsuariosAdmin tenantId="tid-1" enviar={enviar} />);
    expect(await screen.findByTestId("usuarios-error")).toHaveTextContent(`HTTP ${s}`);
    expect(screen.getByRole("heading", { name: "Usuarios y roles" })).toBeInTheDocument();
  });

  it("(e) error de red = mensaje", async () => {
    const enviar = jest.fn(() => Promise.reject(new Error("net")));
    render(<UsuariosAdmin tenantId="tid-1" enviar={enviar} />);
    expect(await screen.findByTestId("usuarios-error")).toHaveTextContent("No se pudo conectar");
  });
});

describe("página /admin/usuarios", () => {
  it.each([
    [{ isAuthenticated: false, isLoading: false, role: "admin" }],
    [{ isAuthenticated: true, isLoading: false, role: "viewer" }],
    [{ isAuthenticated: true, isLoading: true, role: "admin" }],
  ])("(f) sin sesión de administrador no renderiza", (auth) => {
    mockAuth.mockReturnValue(auth);
    const { container } = render(<AdminUsuariosPage />);
    expect(container).toBeEmptyDOMElement();
  });

  it("(f) con administrador renderiza la pantalla", async () => {
    mockAuth.mockReturnValue({ isAuthenticated: true, isLoading: false, role: "platform_admin" });
    const { apiFetch } = jest.requireMock("@/lib/api/fetch-client");
    apiFetch.mockImplementation((r: string) => (r.includes("/roles") ? resp({ roles: [] }) : resp({ users: [] })));
    render(<AdminUsuariosPage />);
    expect(await screen.findByTestId("usuarios-admin")).toBeInTheDocument();
  });
});
