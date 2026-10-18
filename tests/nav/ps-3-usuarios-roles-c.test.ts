/** @jest-environment node */
/**
 * PS-3-USUARIOS-ROLES-C: «Usuarios y roles» apunta a /admin/usuarios y la fila «Compuertas» conserva /admin/gates.
 * Ejecutar: NEXT_PUBLIC_BACKEND_URL=http://backend.invalid npx jest tests/nav/ps-3-usuarios-roles-c.test.ts
 */
import fs from "fs";
import path from "path";
import type { RoleInfo } from "@/lib/api/auth-v2";
import { NAVEGACION, type NavItem } from "@/lib/navigation";
import { NAV_SECTIONS, filterSectionsForUser, userCanAccessAdminNav } from "@/components/forge/layout/forge-global-sidebar-nav";
import { MANIFIESTO_PAGINAS } from "@/lib/paginas/manifiesto";

const rol = (role_key: string): RoleInfo => ({ core_name: "platform", role_key, display_name: role_key });
const filas = (items: NavItem[]): NavItem[] => items.flatMap((i) => [i, ...filas(i.children ?? [])]);
const todas = NAVEGACION.flatMap((s) => filas(s.children));
const visibles = (r: string) => {
  const roles = [rol(r)];
  return filterSectionsForUser(NAV_SECTIONS, roles, [], userCanAccessAdminNav(roles)).flatMap((s) => filas(s.children));
};

describe("PS-3 Usuarios y roles (menú)", () => {
  it("(a) «Usuarios y roles» → /admin/usuarios, para todo ROLES_ADMINISTRACION", () => {
    const f = todas.filter((i) => i.label === "Usuarios y roles");
    expect(f).toHaveLength(1);
    expect(f[0].href).toBe("/admin/usuarios");
    expect(f[0].superAdminOnly).toBeUndefined();
  });

  it("(b) visible para tenant_admin y platform_superadmin, oculta para agent y dealer", () => {
    for (const r of ["tenant_admin", "platform_superadmin"]) {
      expect(visibles(r).some((i) => i.href === "/admin/usuarios")).toBe(true);
    }
    for (const r of ["agent", "dealer"]) {
      expect(visibles(r).some((i) => i.href === "/admin/usuarios")).toBe(false);
    }
  });

  it("(b2) «Compuertas» → /admin/gates, solo platform_superadmin", () => {
    const f = todas.find((i) => i.label === "Compuertas");
    expect(f?.href).toBe("/admin/gates");
    expect(f?.superAdminOnly).toBe(true);
    expect(visibles("tenant_admin").some((i) => i.href === "/admin/gates")).toBe(false);
    expect(visibles("platform_superadmin").some((i) => i.href === "/admin/gates")).toBe(true);
  });

  it("(c) ninguna fila del menú apunta a una ruta sin archivo en el manifiesto", () => {
    const raiz = path.resolve(__dirname, "..", "..");
    for (const href of todas.map((i) => i.href).filter((h): h is string => Boolean(h))) {
      const ruta = href.split(/[?#]/)[0];
      const e = MANIFIESTO_PAGINAS.find((p) => p.ruta === ruta);
      expect({ href, entrada: Boolean(e) }).toEqual({ href, entrada: true });
      expect({ href, archivo: fs.existsSync(path.join(raiz, e!.archivo)) }).toEqual({ href, archivo: true });
    }
  });
});
