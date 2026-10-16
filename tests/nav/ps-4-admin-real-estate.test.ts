/** @jest-environment node */
/**
 * PS-4-ADMIN-REAL-ESTATE: Administración › Real Estate enlaza a /admin/real-estate (ya no «Pronto»).
 * Ejecutar: NEXT_PUBLIC_BACKEND_URL=http://backend.invalid npx jest tests/nav/ps-4-admin-real-estate.test.ts
 */
import fs from "fs";
import path from "path";
import type { RoleInfo } from "@/lib/api/auth-v2";
import { NAVEGACION, ROLES_ADMINISTRACION, type NavItem } from "@/lib/navigation";
import { NAV_SECTIONS, filterSectionsForUser, userCanAccessAdminNav } from "@/components/forge/layout/forge-global-sidebar-nav";
import { MANIFIESTO_PAGINAS } from "@/lib/paginas/manifiesto";

const rol = (role_key: string): RoleInfo => ({ core_name: "platform", role_key, display_name: role_key });
const aplanar = (items: NavItem[], seccion: string): string[] =>
  items.flatMap((i) => [`${seccion}/${i.id}|${i.href ?? ""}|${i.pronto ?? ""}`, ...aplanar(i.children ?? [], seccion)]);
const todas = NAVEGACION.flatMap((s) => aplanar(s.children, s.id));

describe("PS-4 Administración › Real Estate", () => {
  it("(a) la fila adm-real-estate tiene href y no pronto", () => {
    const fila = NAVEGACION.flatMap((s) => s.children).find((i) => i.id === "adm-real-estate");
    expect(fila?.href).toBe("/admin/real-estate");
    expect(fila?.pronto).toBeUndefined();
    expect(fila?.superAdminOnly).toBeUndefined(); // misma visibilidad que el resto de Administración
  });

  it("(b) tenant_admin y platform_superadmin ven el enlace en Administración, sin «Pronto»", () => {
    expect([...ROLES_ADMINISTRACION].sort()).toEqual(["platform_superadmin", "tenant_admin"]);
    for (const r of ROLES_ADMINISTRACION) {
      const roles = [rol(r)];
      const admin = filterSectionsForUser(NAV_SECTIONS, roles, [], userCanAccessAdminNav(roles)).find((s) => s.id === "admin");
      const fila = admin?.children.find((i) => i.id === "adm-real-estate");
      expect(fila?.href).toBe("/admin/real-estate");
      expect(fila?.pronto).toBeUndefined();
    }
  });

  it("(c) el manifiesto tiene la ruta con su archivo, desde la fuente navegacion", () => {
    const e = MANIFIESTO_PAGINAS.find((p) => p.ruta === "/admin/real-estate");
    expect(e).toMatchObject({ archivo: "app/admin/real-estate/page.tsx", categoria: "menu", fuente: "navegacion", href: "/admin/real-estate" });
    expect(fs.existsSync(path.resolve(__dirname, "..", "..", e!.archivo))).toBe(true);
  });

  it("(d) ninguna otra fila del menú cambia (instantánea id|href|pronto)", () => {
    const esperado: string[] = JSON.parse(fs.readFileSync(path.join(__dirname, "ps-4-menu.snapshot.json"), "utf8"));
    expect(todas).toEqual(esperado);
  });
});
