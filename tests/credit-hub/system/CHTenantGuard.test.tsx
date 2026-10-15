import { render, screen } from "@testing-library/react";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";

let mockTenantId: string | null = null;
let mockSession = { isAuthenticated: true, isLoading: false };
const mockReplace = jest.fn();
jest.mock("@/contexts/TenantContext", () => ({ useTenant: () => ({ tenantId: mockTenantId }) }));
jest.mock("@/hooks/useAuth", () => ({ useAuth: () => mockSession }));
jest.mock("next/navigation", () => ({
  usePathname: () => "/credit-hub",
  useRouter: () => ({ replace: mockReplace }),
}));

const pintar = () => render(<CHTenantGuard><p>EXPEDIENTE PRIVADO</p></CHTenantGuard>);
let mockNavigationErrors: jest.SpyInstance;
const previousDefaultTenant = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID;

beforeEach(() => {
  mockTenantId = null;
  mockSession = { isAuthenticated: true, isLoading: false };
  mockReplace.mockClear();
  delete process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID;
  // jsdom reports native location.replace through console.error. Observe it too:
  // otherwise the original hard navigation could escape the router assertion.
  mockNavigationErrors = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => mockNavigationErrors.mockRestore());
afterAll(() => {
  if (previousDefaultTenant === undefined) delete process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID;
  else process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID = previousDefaultTenant;
});

it("autenticado con tenantId=null: permite seleccionar organizacion sin volver al login ni revelar hijos", () => {
  pintar();
  expect(screen.getByTestId("ch-tenant-guard-blocked")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Ir al selector" })).toBeInTheDocument();
  expect(screen.queryByText("EXPEDIENTE PRIVADO")).not.toBeInTheDocument();
  expect(mockReplace).not.toHaveBeenCalled();
  expect(mockNavigationErrors).not.toHaveBeenCalled();
});

it("sesion cargando con tenantId=null: espera sin redirigir ni revelar hijos", () => {
  mockSession.isLoading = true;
  pintar();
  expect(screen.getByText("Cargando...")).toBeInTheDocument();
  expect(screen.queryByText("EXPEDIENTE PRIVADO")).not.toBeInTheDocument();
  expect(mockReplace).not.toHaveBeenCalled();
  expect(mockNavigationErrors).not.toHaveBeenCalled();
});

it("sin sesion ni tenant: redirige al login conservando el destino", () => {
  mockSession.isAuthenticated = false;
  pintar();
  expect(mockReplace).toHaveBeenCalledWith("/login?next=%2Fcredit-hub");
  expect(screen.queryByText("EXPEDIENTE PRIVADO")).not.toBeInTheDocument();
});

it("sesion y tenant resueltos: muestra hijos sin redirigir", () => {
  mockTenantId = "00000000-0000-4000-8000-000000000001";
  pintar();
  expect(screen.getByText("EXPEDIENTE PRIVADO")).toBeInTheDocument();
  expect(mockReplace).not.toHaveBeenCalled();
  expect(mockNavigationErrors).not.toHaveBeenCalled();
});
