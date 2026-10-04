import fs from "fs";
import path from "path";
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

describe("/tenants: la puerta no se puede perder (regresion)", () => {
  // El cierre de /tenants depende de que `app/tenants/layout.tsx` exista y
  // envuelva TODAS las paginas de debajo. Si alguien borra el layout, lo vacia o
  // saca una pagina a un grupo de rutas fuera de el, los tenants inventados de
  // `TENANTS_INITIAL` vuelven a verse y los tests de arriba no lo notarian.
  const raiz = path.join(process.cwd(), "app", "tenants");

  function paginas(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return paginas(p);
      return /^page\.(tsx|ts|jsx|js)$/.test(e.name) ? [p] : [];
    });
  }

  test("el layout existe y usa el predicado de plataforma", () => {
    const layout = fs.readFileSync(path.join(raiz, "layout.tsx"), "utf8");
    expect(layout).toContain("esPersonalDePlataforma");
  });

  test("ninguna pagina bajo /tenants trae su propio layout que la saque de la puerta", () => {
    const encontradas = paginas(raiz).map((p) => path.relative(raiz, p));
    expect(encontradas).toEqual(expect.arrayContaining(["page.tsx", path.join("[tenantId]", "page.tsx")]));
    for (const rel of encontradas) {
      expect(rel.split(path.sep).some((seg) => seg.startsWith("("))).toBe(false);
    }
  });
});
