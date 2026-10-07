import type { ReactNode } from "react";
import { SoloSuperadminDePlataforma } from "@/components/auth/SoloSuperadminDePlataforma";

/** /admin y todas sus subrutas: Panel de Administracion de la plataforma, solo superadmin. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <SoloSuperadminDePlataforma>{children}</SoloSuperadminDePlataforma>;
}
