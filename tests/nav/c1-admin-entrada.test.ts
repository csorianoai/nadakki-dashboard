/**
 * C1-ADMIN-SIN-PANTALLA-PROHIBIDA: la entrada del módulo Administración lleva a cada rol a una página que puede abrir.
 * tenant_admin no abre /admin (solo platform_superadmin); superadmin sí.
 */
import { modulosVisibles } from "@/lib/modulos/registro";
import { NAVEGACION } from "@/lib/navigation";
import type { RoleInfo } from "@/lib/api/auth-v2";

const rol = (role_key: string): RoleInfo => ({ core_name: "platform", role_key, display_name: role_key });
const TODOS = ["autos", "credit", "marketing", "accounting", "legal", "projects", "sic", "platform"];
const destino = (role_key: string) => modulosVisibles({ roles: [rol(role_key)], subscribedCores: TODOS }).find((m) => m.id === "administracion")?.raiz;

describe("C1 entrada de Administración", () => {
  test("tenant_admin: no /admin y una ruta que su rol abre", () => {
    const d = destino("tenant_admin");
    expect(d).toBeTruthy();
    expect(d).not.toBe("/admin");
    const admin = NAVEGACION.find((s) => s.id === "admin")!;
    const fila = admin.children.find((c) => c.href === d);
    expect(fila).toBeDefined();
    expect(fila!.superAdminOnly).toBeFalsy();
    expect(fila!.roles ? fila!.roles.includes("tenant_admin") : true).toBe(true);
  });
  test("tenant_admin: es Usuarios y roles", () => {
    expect(destino("tenant_admin")).toBe("/admin/usuarios");
  });
  test("platform_superadmin: /admin", () => {
    expect(destino("platform_superadmin")).toBe("/admin");
  });
});
