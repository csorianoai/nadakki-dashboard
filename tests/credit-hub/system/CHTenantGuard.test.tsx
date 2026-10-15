import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";

let mockTenantId: string | null = null;
const mockSetTenantId = jest.fn();
const mockReplace = jest.fn();
const mockSwitchTenant = jest.fn();
jest.mock("@/contexts/TenantContext", () => ({ useTenant: () => ({ tenantId: mockTenantId, setTenantId: mockSetTenantId }) }));
jest.mock("next/navigation", () => ({ usePathname: () => "/credit-hub", useRouter: () => ({ replace: mockReplace }) }));
const own = { id: "00000000-0000-4000-8000-000000000001", slug: "own", display_name: "Organización autorizada", subscribed_cores: ["credit"] };
let session: AuthContextValue;
const pintar = () => render(<AuthContext.Provider value={session}><CHTenantGuard><p>EXPEDIENTE PRIVADO</p></CHTenantGuard></AuthContext.Provider>);
let navigationErrors: jest.SpyInstance;
const previousDefaultTenant = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID;

beforeEach(() => {
  jest.clearAllMocks();
  mockTenantId = null;
  session = {
    user: { id: "user-test", email: "test@example.invalid", is_active: true, mfa_enabled: false },
    tenant: own, activeRole: null, allRoles: [], allTenants: [own], isAuthenticated: true, isLoading: false,
    initError: null, initProgress: null, retryInit: jest.fn(), login: jest.fn(), logout: jest.fn(),
    switchTenant: mockSwitchTenant, switchRole: jest.fn(), refreshSession: jest.fn(),
  };
  delete process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID;
  navigationErrors = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => navigationErrors.mockRestore());
afterAll(() => {
  if (previousDefaultTenant === undefined) delete process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID;
  else process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID = previousDefaultTenant;
});

it("proveedor nuevo autenticado y tenantId=null: permanece en selección, nunca /login ni /", () => {
  pintar();
  expect(screen.getByRole("heading", { name: "Selecciona tu organización" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Seleccionar Organización autorizada" })).toBeInTheDocument();
  expect(screen.queryByText("EXPEDIENTE PRIVADO")).not.toBeInTheDocument();
  expect(mockReplace).not.toHaveBeenCalled();
  expect(navigationErrors).not.toHaveBeenCalled();
});

it("sesión cargando: espera sin redirigir ni revelar hijos", () => {
  session.isLoading = true;
  pintar();
  expect(screen.getByText("Cargando...")).toBeInTheDocument();
  expect(screen.queryByText("EXPEDIENTE PRIVADO")).not.toBeInTheDocument();
  expect(mockReplace).not.toHaveBeenCalled();
});

it.each([null, own.id])("sin sesión, incluso con tenant local %s: /login", (local) => {
  mockTenantId = local;
  session.isAuthenticated = false;
  session.user = null;
  pintar();
  expect(mockReplace).toHaveBeenCalledWith("/login?next=%2Fcredit-hub");
  expect(screen.queryByText("EXPEDIENTE PRIVADO")).not.toBeInTheDocument();
});

it("tenant local ajeno al activo del proveedor nuevo: denegado", () => {
  mockTenantId = "00000000-0000-4000-8000-000000000002";
  pintar();
  expect(screen.getByRole("alert")).toHaveTextContent("Acceso denegado");
  expect(screen.queryByText("EXPEDIENTE PRIVADO")).not.toBeInTheDocument();
  expect(mockReplace).not.toHaveBeenCalled();
});

it("sesión y tenant activo coincidentes: muestra hijos", () => {
  mockTenantId = own.id;
  pintar();
  expect(screen.getByText("EXPEDIENTE PRIVADO")).toBeInTheDocument();
  expect(mockReplace).not.toHaveBeenCalled();
});

it("selección autorizada permanece en el hub y sincroniza solo tras éxito del servidor", async () => {
  let resolve!: (value: { ok: boolean }) => void;
  mockSwitchTenant.mockReturnValue(new Promise((done) => { resolve = done; }));
  const view = pintar();
  fireEvent.click(screen.getByRole("button", { name: "Seleccionar Organización autorizada" }));
  expect(mockSwitchTenant).toHaveBeenCalledWith(own.id);
  expect(mockSetTenantId).not.toHaveBeenCalled();
  resolve({ ok: true });
  await waitFor(() => expect(mockSetTenantId).toHaveBeenCalledWith(own.id));
  mockTenantId = own.id;
  view.rerender(<AuthContext.Provider value={session}><CHTenantGuard><p>EXPEDIENTE PRIVADO</p></CHTenantGuard></AuthContext.Provider>);
  expect(screen.getByText("EXPEDIENTE PRIVADO")).toBeInTheDocument();
  expect(mockReplace).not.toHaveBeenCalled();
  expect(navigationErrors).not.toHaveBeenCalled();
});

it("switchTenant rechazado: no cambia tenant ni expone contenido", async () => {
  mockSwitchTenant.mockResolvedValue({ ok: false });
  pintar();
  fireEvent.click(screen.getByRole("button", { name: "Seleccionar Organización autorizada" }));
  await screen.findByRole("alert");
  expect(mockSetTenantId).not.toHaveBeenCalled();
  expect(screen.queryByText("EXPEDIENTE PRIVADO")).not.toBeInTheDocument();
  expect(mockReplace).not.toHaveBeenCalled();
});

it("sin organizaciones autorizadas: estado vacío honesto, sin salida a /", () => {
  session.tenant = null;
  session.allTenants = [];
  pintar();
  expect(screen.getByText(/No hay organizaciones disponibles/)).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(mockReplace).not.toHaveBeenCalled();
});
