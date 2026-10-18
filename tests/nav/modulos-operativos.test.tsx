import { render, screen } from "@testing-library/react";
import { NAV_SECTIONS } from "@/components/forge/layout/forge-global-sidebar-nav";
import { SinModulos, MENSAJE_SIN_MODULOS } from "@/components/nav/SinModulos";
import { menuVisible, modulosVisibles } from "@/lib/modulos/registro";

const rol = (core_name: string, role_key: string) => ({ core_name, role_key });
const TENANT_ADMIN = [rol("platform", "tenant_admin")];
const OPERATOR = [rol("platform", "operator")];

const hrefsAdmin = (u: Parameters<typeof modulosVisibles>[0]) => {
  const m = modulosVisibles(u).find((x) => x.seccion === "admin");
  return m ? menuVisible(m, u).flatMap((g) => g.items.map((i) => i.href)) : null;
};

describe("PS-11-MODULOS-OPS-B", () => {
  it("(a) tenant_admin con cores [platform]: Administración con /admin/usuarios y sin /admin de plataforma", () => {
    const u = { roles: TENANT_ADMIN, subscribedCores: ["platform"] };
    const hrefs = hrefsAdmin(u)!;
    expect(hrefs).toContain("/admin/usuarios");
    expect(hrefs).not.toContain("/admin");
  });

  it("(b) operator con cores [credit, legal]: módulos según NAV_SECTIONS y sin Administración", () => {
    const u = { roles: OPERATOR, subscribedCores: ["credit", "legal"] };
    const ids = modulosVisibles(u).map((m) => m.seccion);
    expect(ids).not.toContain("admin");
    expect(ids.length).toBeGreaterThan(0);
    const conocidos = NAV_SECTIONS.map((s) => s.id);
    ids.forEach((id) => expect(conocidos).toContain(id));
  });

  it("(c) operator con cores []: sin módulos y pantalla llana, no un menú vacío", () => {
    const u = { roles: OPERATOR, subscribedCores: [] as string[] };
    expect(modulosVisibles(u).map((m) => m.seccion)).not.toContain("admin");
    render(<SinModulos />);
    expect(screen.getByTestId("sin-modulos")).toHaveTextContent(MENSAJE_SIN_MODULOS);
    expect(MENSAJE_SIN_MODULOS).toBe("Tu organización no tiene módulos habilitados para tu rol; pide acceso a un administrador");
  });
});
