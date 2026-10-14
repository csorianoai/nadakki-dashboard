import fs from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import AdminLayout from "@/app/admin/layout";
import FeatureFlagsLayout from "@/app/feature-flags/layout";
import TenantOnboardingLayout from "@/app/(admin)/tenant-onboarding/layout";
import { useAuth } from "@/hooks/useAuth";
import { esSuperadminDePlataforma, SOLO_SUPERADMIN_TITULO } from "@/lib/auth/platform-staff";

jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/components/admin/onboarding/OnboardingProvider", () => ({
  OnboardingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

type Rol = { core_name: string; role_key: string };

function sesion(roles: Rol[], isLoading = false) {
  mockUseAuth.mockReturnValue({
    user: null,
    tenant: null,
    activeRole: roles[0] ?? null,
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

const BANCO: Rol[] = [{ core_name: "credit", role_key: "bank_analyst" }];
const BANCO_ADMIN: Rol[] = [{ core_name: "credit", role_key: "bank_admin" }];
const DEALER: Rol[] = [{ core_name: "autos", role_key: "dealer" }];
const TENANT_ADMIN: Rol[] = [{ core_name: "platform", role_key: "tenant_admin" }];
const SOPORTE: Rol[] = [{ core_name: "platform", role_key: "support_agent" }];
const SUPERADMIN: Rol[] = [{ core_name: "platform", role_key: "platform_superadmin" }];

const PANEL = <p>Panel de Administración</p>;

afterEach(() => jest.clearAllMocks());

const pantallas: [string, (p: { children: React.ReactNode }) => React.ReactElement][] = [
  ["/admin", AdminLayout],
  ["/feature-flags", FeatureFlagsLayout],
  ["/tenant-onboarding", TenantOnboardingLayout],
];

describe.each(pantallas)("%s: solo platform_superadmin", (_ruta, Layout) => {
  test.each([
    ["usuario de banco", BANCO],
    ["admin de banco", BANCO_ADMIN],
    ["usuario de dealer", DEALER],
    ["tenant_admin", TENANT_ADMIN],
    ["soporte de plataforma", SOPORTE],
    ["sin roles", [] as Rol[]],
  ])("un %s ve 'Acceso no autorizado' y no el panel", (_quien, roles) => {
    sesion(roles);
    render(<Layout>{PANEL}</Layout>);
    expect(screen.getByTestId("solo-superadmin-denegado")).toBeInTheDocument();
    expect(screen.getByText(SOLO_SUPERADMIN_TITULO)).toBeInTheDocument();
    expect(screen.queryByText("Panel de Administración")).toBeNull();
  });

  test("mientras la sesion carga no pinta el panel", () => {
    sesion([], true);
    render(<Layout>{PANEL}</Layout>);
    expect(screen.getByTestId("solo-superadmin-verificando")).toBeInTheDocument();
    expect(screen.queryByText("Panel de Administración")).toBeNull();
  });

  test("el superadmin entra", () => {
    sesion(SUPERADMIN);
    render(<Layout>{PANEL}</Layout>);
    expect(screen.getByText("Panel de Administración")).toBeInTheDocument();
    expect(screen.queryByText(SOLO_SUPERADMIN_TITULO)).toBeNull();
  });
});

describe("esSuperadminDePlataforma", () => {
  test("solo platform_superadmin", () => {
    expect(esSuperadminDePlataforma(SUPERADMIN)).toBe(true);
    expect(esSuperadminDePlataforma([...BANCO, ...SUPERADMIN])).toBe(true);
    for (const r of [BANCO, BANCO_ADMIN, DEALER, TENANT_ADMIN, SOPORTE]) {
      expect(esSuperadminDePlataforma(r)).toBe(false);
    }
  });

  test("fail-closed sin roles", () => {
    expect(esSuperadminDePlataforma([])).toBe(false);
    expect(esSuperadminDePlataforma(null)).toBe(false);
    expect(esSuperadminDePlataforma(undefined)).toBe(false);
  });
});

describe("/admin: la puerta no se puede perder (regresion)", () => {
  // La guarda depende de que `app/admin/layout.tsx` exista y envuelva TODAS las
  // paginas de debajo. Si alguien lo borra o saca una subruta a un grupo de
  // rutas, el panel vuelve a abrirse y los tests de arriba no lo notarian.
  const raiz = path.join(process.cwd(), "app", "admin");

  function paginas(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return paginas(p);
      return /^page\.(tsx|ts|jsx|js)$/.test(e.name) ? [p] : [];
    });
  }

  test("los layouts existen y usan la guarda de superadmin", () => {
    for (const f of [
      path.join(raiz, "layout.tsx"),
      path.join(process.cwd(), "app", "feature-flags", "layout.tsx"),
      path.join(process.cwd(), "app", "(admin)", "tenant-onboarding", "layout.tsx"),
    ]) {
      expect(fs.readFileSync(f, "utf8")).toContain("SoloSuperadminDePlataforma");
    }
  });

  test("ninguna pagina bajo /admin sale de la puerta por un grupo de rutas", () => {
    const encontradas = paginas(raiz).map((p) => path.relative(raiz, p));
    expect(encontradas).toEqual(expect.arrayContaining(["page.tsx", path.join("tenants", "[id]", "page.tsx")]));
    for (const rel of encontradas) {
      expect(rel.split(path.sep).some((seg) => seg.startsWith("("))).toBe(false);
    }
  });
});
