import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";
import TenantsLayout from "@/app/tenants/layout";
import { useAuth } from "@/hooks/useAuth";
import { SOLO_PLATAFORMA_TITULO } from "@/lib/auth/platform-staff";

jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/app/hooks/useAgentRegistrySummary", () => ({
  useAgentRegistrySummary: () => ({
    loading: false,
    available: false,
    summary: null,
    error: null,
    tooltip: "",
    refresh: jest.fn(),
  }),
}));
jest.mock("@/components/agent-registry/AgentRegistryStatHome", () => ({
  AgentRegistryStatHome: () => <span>stat</span>,
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function sesion(roles: { core_name: string; role_key: string }[], isLoading = false) {
  mockUseAuth.mockReturnValue({
    user: null,
    tenant: null,
    activeRole: null,
    allRoles: roles,
    isAuthenticated: !isLoading,
    isLoading,
    initError: null,
    retryInit: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    switchTenant: jest.fn(),
    switchRole: jest.fn(),
    refreshSession: jest.fn(),
  } as unknown as ReturnType<typeof useAuth>);
}

const TENANT_ADMIN = [{ core_name: "platform", role_key: "tenant_admin" }];
const SUPERADMIN = [{ core_name: "platform", role_key: "platform_superadmin" }];

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => null }) as jest.Mock;
});

afterEach(() => jest.clearAllMocks());

describe("Inicio: metricas de plataforma", () => {
  test("un tenant_admin NO ve la tira de metricas de plataforma", () => {
    sesion(TENANT_ADMIN);
    render(<HomePage />);
    expect(screen.queryByTestId("home-metricas-plataforma")).toBeNull();
    expect(screen.queryByText("Dominios (catálogo)")).toBeNull();
  });

  test("mientras la sesion carga no asoman", () => {
    sesion([], true);
    render(<HomePage />);
    expect(screen.queryByTestId("home-metricas-plataforma")).toBeNull();
  });

  test("el personal de plataforma si las ve", () => {
    sesion(SUPERADMIN);
    render(<HomePage />);
    expect(screen.getByTestId("home-metricas-plataforma")).toBeInTheDocument();
  });
});

describe("/tenants: cerrado para usuarios de tenant", () => {
  const dentro = <p>Enterprise One</p>;

  test("un tenant_admin ve el aviso y no el contenido", () => {
    sesion(TENANT_ADMIN);
    render(<TenantsLayout>{dentro}</TenantsLayout>);
    expect(screen.getByTestId("tenants-solo-plataforma")).toBeInTheDocument();
    expect(screen.getByText(SOLO_PLATAFORMA_TITULO)).toBeInTheDocument();
    expect(screen.queryByText("Enterprise One")).toBeNull();
  });

  test("mientras la sesion carga no pinta el contenido", () => {
    sesion([], true);
    render(<TenantsLayout>{dentro}</TenantsLayout>);
    expect(screen.getByTestId("tenants-verificando")).toBeInTheDocument();
    expect(screen.queryByText("Enterprise One")).toBeNull();
  });

  test("el personal de plataforma entra", () => {
    sesion(SUPERADMIN);
    render(<TenantsLayout>{dentro}</TenantsLayout>);
    expect(screen.getByText("Enterprise One")).toBeInTheDocument();
  });
});
