/**
 * @jest-environment jsdom
 *
 * BANK-V2-DEFAULT 3/3 — /credit-hub/bank sigue funcionando; con el interruptor
 * encendido muestra al usuario de banco un enlace discreto al panel nuevo.
 * Apagado, o para superadmin y dealer, no pinta nada.
 */
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";
import { equivalenteBancoV2 } from "@/lib/credit-hub/bank/panel-v2-por-defecto";
import { BankChShell } from "@/components/credit-hub/bank/BankChShell";

let pathname = "/credit-hub/bank";
jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@/components/credit-hub/system/CHTenantGuard", () => ({
  CHTenantGuard: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
jest.mock("@/components/credit-hub/system/CHPortalAccessGuard", () => ({
  CHPortalAccessGuard: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
jest.mock("@/components/credit-hub/shell/ChTopbar", () => ({ ChTopbar: () => null }));
jest.mock("@/components/credit-hub/shell/ChSidebar", () => ({
  ChSidebar: () => null,
  ChBottomNav: () => null,
}));
jest.mock("@/components/credit-hub/shell/useChromeIdentity", () => ({
  useChromeIdentity: () => ({ name: "Ana", initials: "A", email: "a@b.c", role: "banker" }),
}));
jest.mock("@/lib/credit-hub/hooks/useNotifications", () => ({
  useNotifications: () => ({ items: [], unreadCount: 0, hidden: true }),
}));
jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => ({
  useTenantConfig: () => ({ tenantConfig: { institution_name: "Banco Demo" } }),
}));
jest.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ logout: jest.fn() }) }));

const VAR = "NEXT_PUBLIC_FF_BANK_V2_DEFAULT";
const original = process.env[VAR];
afterEach(() => {
  if (original === undefined) delete process.env[VAR];
  else process.env[VAR] = original;
  pathname = "/credit-hub/bank";
});

function pintar(roleKeys: string[]) {
  const auth = {
    allRoles: roleKeys.map((role_key) => ({ role_key, core_name: "credit", display_name: role_key })),
  } as unknown as AuthContextValue;
  render(
    <AuthContext.Provider value={auth}>
      <BankChShell>
        <p>contenido del panel actual</p>
      </BankChShell>
    </AuthContext.Provider>,
  );
}

describe("interruptor APAGADO", () => {
  it.each([["banker"], ["credit_admin"], ["bank_analyst"], ["platform_superadmin"], ["dealer"]])(
    "%s: el panel actual se pinta igual y sin enlace",
    (rol) => {
      delete process.env[VAR];
      pintar([rol]);
      expect(screen.getByText("contenido del panel actual")).toBeInTheDocument();
      expect(screen.queryByTestId("ir-al-panel-nuevo")).toBeNull();
    },
  );
});

describe("interruptor ENCENDIDO", () => {
  it("el usuario de banco ve el enlace a la pantalla equivalente", () => {
    process.env[VAR] = "1";
    pathname = "/credit-hub/bank/applications";
    pintar(["banker"]);
    expect(screen.getByText("contenido del panel actual")).toBeInTheDocument();
    const enlace = screen.getByTestId("ir-al-panel-nuevo");
    expect(enlace).toHaveTextContent("Ir al panel nuevo");
    expect(enlace).toHaveAttribute("href", "/credit-hub/bank-v2/solicitudes");
  });

  it.each([["platform_superadmin", "banker"], ["dealer", "credit_admin"]])(
    "%s + %s: sin enlace",
    (...claves) => {
      process.env[VAR] = "1";
      pintar(claves);
      expect(screen.queryByTestId("ir-al-panel-nuevo")).toBeNull();
    },
  );
});

describe("equivalenteBancoV2", () => {
  it.each([
    ["/credit-hub/bank", "/credit-hub/bank-v2"],
    ["/credit-hub/bank/", "/credit-hub/bank-v2"],
    ["/credit-hub/bank/applications", "/credit-hub/bank-v2/solicitudes"],
    ["/credit-hub/bank/applications?page=2", "/credit-hub/bank-v2/solicitudes"],
    ["/credit-hub/bank/applications/app-123", "/credit-hub/bank-v2/solicitudes/app-123"],
    ["/credit-hub/bank/escalations", "/credit-hub/bank-v2/escalaciones"],
    ["/credit-hub/bank/analytics", "/credit-hub/bank-v2/analitica"],
    ["/credit-hub/bank/compliance", "/credit-hub/bank-v2/cumplimiento"],
    ["/credit-hub/bank/audit", "/credit-hub/bank-v2/auditoria"],
    ["/credit-hub/bank/vehicles", "/credit-hub/bank-v2/vehiculos"],
    ["/credit-hub/bank/algo-sin-par", "/credit-hub/bank-v2"],
  ])("%s → %s", (viejo, nuevo) => {
    expect(equivalenteBancoV2(viejo)).toBe(nuevo);
  });
});
