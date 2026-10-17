const mockAuth = jest.fn();
jest.mock("@/contexts/AuthContext", () => ({ useAuth: () => mockAuth() }));
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("@/lib/auth/token-storage", () => ({ tokenStorage: { getAccessToken: () => "a.b.c" } }));
jest.mock("@/lib/auth/jwt-decode", () => ({ decodeJWT: () => ({ tid: "tid-1" }) }));

import { render, screen } from "@testing-library/react";
import AdminUsuariosPage from "@/app/admin/usuarios/page";

const resp = (cuerpo: unknown, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(cuerpo) } as Response);

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
