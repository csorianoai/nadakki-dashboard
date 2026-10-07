/**
 * @jest-environment jsdom
 *
 * BANK-V2-DEFAULT 2/3 — el sidebar persona "bank" del Credit Hub enlaza bank-v2
 * solo con el interruptor encendido y un usuario de banco. Persona dealer: igual
 * siempre.
 */
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { ForgeCreditHubSidebar } from "@/components/forge/layout/ForgeCreditHubSidebar";
import { PersonaProvider } from "@/components/credit-hub/system/PersonaProvider";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";
import type { ForgePersona } from "@/lib/credit-hub/design/persona";

jest.mock("next/navigation", () => ({ usePathname: () => "/credit-hub/preview" }));
jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => ({
  useTenantConfig: () => ({ tenantConfig: { branding: {}, institution_name: "Banco Demo" } }),
}));
jest.mock("@/lib/hooks/useTenantBranding", () => ({
  useTenantBranding: () => ({ data: null, isPending: false }),
}));

const VAR = "NEXT_PUBLIC_FF_BANK_V2_DEFAULT";
const original = process.env[VAR];
afterEach(() => {
  if (original === undefined) delete process.env[VAR];
  else process.env[VAR] = original;
});

function pintar(persona: ForgePersona, roleKeys: string[] | null) {
  const auth = roleKeys
    ? ({ allRoles: roleKeys.map((role_key) => ({ role_key, core_name: "credit", display_name: role_key })) } as unknown as AuthContextValue)
    : null;
  const Envoltura = ({ children }: { children: ReactNode }) =>
    auth ? <AuthContext.Provider value={auth}>{children}</AuthContext.Provider> : <>{children}</>;
  render(
    <Envoltura>
      <PersonaProvider persona={persona}>
        <ForgeCreditHubSidebar />
      </PersonaProvider>
    </Envoltura>,
  );
  const nav = screen.getByRole("navigation", { name: "Primary" });
  return Array.from(nav.querySelectorAll("a")).map((a) => a.getAttribute("href"));
}

const BANCO_HOY = [
  "/credit-hub/bank",
  "/credit-hub/bank/applications",
  "/credit-hub/bank/analytics",
  "/credit-hub/bank/compliance",
  "/credit-hub/bank/audit",
];

describe("apagado", () => {
  it.each([["banker"], ["credit_admin"], ["platform_superadmin"]])("%s ve el menu de siempre", (rol) => {
    delete process.env[VAR];
    expect(pintar("bank", [rol])).toEqual(BANCO_HOY);
  });
});

describe("encendido", () => {
  it("un banker ve las pantallas de bank-v2", () => {
    process.env[VAR] = "1";
    expect(pintar("bank", ["banker"])).toEqual([
      "/credit-hub/bank-v2",
      "/credit-hub/bank-v2/solicitudes",
      "/credit-hub/bank-v2/analitica",
      "/credit-hub/bank-v2/cumplimiento",
      "/credit-hub/bank-v2/auditoria",
    ]);
  });

  it.each([["platform_superadmin"], ["dealer"]])("%s ve el menu de siempre", (rol) => {
    process.env[VAR] = "1";
    expect(pintar("bank", [rol, "banker"])).toEqual(BANCO_HOY);
  });

  it("sin AuthProvider no rompe y deja el menu de siempre", () => {
    process.env[VAR] = "1";
    expect(pintar("bank", null)).toEqual(BANCO_HOY);
  });

  it("la persona dealer no cambia", () => {
    process.env[VAR] = "1";
    const enlaces = pintar("dealer", ["banker"]);
    expect(enlaces[0]).toBe("/credit-hub/dealer");
    expect(enlaces.some((h) => h?.includes("bank"))).toBe(false);
  });
});
