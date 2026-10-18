import type { ReactNode } from "react";
import { SoloSuperadminDePlataforma } from "@/components/auth/SoloSuperadminDePlataforma";

/**
 * /admin y todas sus subrutas: Panel de Administracion de la plataforma, solo superadmin.
 * Excepcion: /admin/usuarios lo administra tambien el tenant_admin (la pagina valida el rol).
 */
const RUTAS_EXENTAS = ["/admin/usuarios"];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <SoloSuperadminDePlataforma rutasExentas={RUTAS_EXENTAS}>{children}</SoloSuperadminDePlataforma>;
}
