import type { ReactNode } from "react";
import { SoloSuperadminDePlataforma } from "@/components/auth/SoloSuperadminDePlataforma";

/**
 * /admin y todas sus subrutas: Panel de Administracion de la plataforma, solo superadmin.
 * Excepcion: /admin/usuarios y /admin/real-estate los administra tambien el tenant_admin; cada pagina valida su
 * rol y falla cerrada (real-estate no pinta nada sin 200 de /acceso), asi el menu no lleva a «Acceso no autorizado».
 */
const RUTAS_EXENTAS = ["/admin/usuarios", "/admin/real-estate"];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <SoloSuperadminDePlataforma rutasExentas={RUTAS_EXENTAS}>{children}</SoloSuperadminDePlataforma>;
}
