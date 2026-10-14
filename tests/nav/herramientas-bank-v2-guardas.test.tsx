/**
 * DASH-NAV: /credit-hub/bank-v2/solicitudes/[id]/herramientas hereda las guardas de bank-v2
 * (BancoV2Shell: CHTenantGuard + CHPortalAccessGuard portal="bank"). Las guardas son las REALES; solo se
 * sustituye el cuerpo de la página v1 (sus datos no importan aquí).
 */
import fs from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BancoV2Layout from "@/app/(forge)/credit-hub/bank-v2/layout";
import HerramientasPage from "@/app/(forge)/credit-hub/bank-v2/solicitudes/[applicationId]/herramientas/page";

type Sesion = { tenant: string | null; autenticado: boolean; rol: string | null };
let sesion: Sesion = { tenant: "t-1", autenticado: true, rol: "bank_analyst" };

jest.mock("next/navigation", () => ({
  usePathname: () => "/credit-hub/bank-v2/solicitudes/APP-42/herramientas",
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    isLoading: false,
    isAuthenticated: sesion.autenticado,
    activeRole: sesion.rol ? { role_key: sesion.rol, display_name: "Rol" } : null,
    logout: jest.fn(),
  }),
}));
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: sesion.tenant, loading: false }) }));
jest.mock("@/lib/hooks/useTenantBranding", () => ({
  useTenantBranding: () => ({ data: { display_name: "Banco Ejemplo", logo_url: null, locale: "es-DO", currency: "DOP" } }),
}));
jest.mock("@/app/(forge)/credit-hub/bank/applications/[applicationId]/page", () => ({
  __esModule: true,
  default: () => <p>HERRAMIENTAS V1 VISIBLES</p>,
}));

const resuelto = <T,>(v: T): Promise<T> => Object.assign(Promise.resolve(v), { status: "fulfilled", value: v }) as Promise<T>;
const pintar = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <BancoV2Layout>
        <HerramientasPage params={resuelto({ applicationId: "APP-42" })} />
      </BancoV2Layout>
    </QueryClientProvider>,
  );

describe("herramientas bajo las guardas de bank-v2", () => {
  it("la ruta cuelga de bank-v2/layout.tsx (BancoV2Shell) y ningún layout intermedio lo sustituye", () => {
    const app = path.join(process.cwd(), "app");
    const pagina = path.join(app, "(forge)/credit-hub/bank-v2/solicitudes/[applicationId]/herramientas/page.tsx");
    expect(fs.existsSync(pagina)).toBe(true);
    const layouts: string[] = [];
    for (let d = path.dirname(pagina); d.startsWith(app); d = path.dirname(d)) {
      const l = path.join(d, "layout.tsx");
      if (fs.existsSync(l)) layouts.push(path.relative(app, l));
    }
    // Del más cercano al raíz: el primero debe ser el de bank-v2, que monta BancoV2Shell.
    expect(layouts[0]).toBe("(forge)/credit-hub/bank-v2/layout.tsx");
    expect(layouts.filter((l) => l.includes("credit-hub/bank-v2/") && l !== layouts[0])).toEqual([]);
    expect(fs.readFileSync(path.join(app, layouts[0]!), "utf8")).toContain("BancoV2Shell");
    const shell = fs.readFileSync(path.join(app, "(forge)/credit-hub/bank-v2/BancoV2Shell.tsx"), "utf8");
    expect(shell).toContain("CHTenantGuard");
    expect(shell).toMatch(/CHPortalAccessGuard portal="bank"/);
  });

  it.each(["bank_analyst", "bank_admin", "compliance_officer", "credit_admin", "tenant_admin"])("rol %s: ve las herramientas", (rol) => {
    sesion = { tenant: "t-1", autenticado: true, rol };
    pintar();
    expect(screen.getByText("HERRAMIENTAS V1 VISIBLES")).toBeInTheDocument();
    expect(screen.getByTestId("herramientas-volver-expediente")).toHaveAttribute("href", "/credit-hub/bank-v2/solicitudes/APP-42");
  });

  it.each<[string, Sesion, string]>([
    ["rol dealer", { tenant: "t-1", autenticado: true, rol: "dealer" }, "ch-portal-forbidden"],
    ["rol de marketing", { tenant: "t-1", autenticado: true, rol: "marketing_manager" }, "ch-portal-forbidden"],
    ["sin rol", { tenant: "t-1", autenticado: true, rol: null }, "ch-portal-forbidden"],
    ["sin sesión", { tenant: "t-1", autenticado: false, rol: null }, "ch-portal-auth-required"],
    ["sin tenant", { tenant: null, autenticado: true, rol: "bank_analyst" }, "ch-tenant-guard-blocked"],
  ])("%s: no ve las herramientas", (_caso, s, testId) => {
    sesion = s;
    const { container } = pintar();
    expect(container.querySelector(`[data-testid="${testId}"]`)).not.toBeNull();
    expect(screen.queryByText("HERRAMIENTAS V1 VISIBLES")).not.toBeInTheDocument();
    expect(screen.queryByTestId("herramientas-volver-expediente")).not.toBeInTheDocument();
  });
});
