"use client";

import Link from "next/link";
import { useContext } from "react";
import { usePathname } from "next/navigation";
import { AuthContext } from "@/lib/auth/auth-context";
import { aplicaPanelBancoV2, equivalenteBancoV2 } from "@/lib/credit-hub/bank/panel-v2-por-defecto";

/**
 * BANK-V2-DEFAULT 3/3 — enlace discreto del panel actual al nuevo durante la
 * transicion. No pinta nada con el interruptor apagado, ni para superadmin o
 * dealer: solo lo ve el usuario de banco al que el interruptor ya manda a bank-v2.
 */
export function IrAlPanelNuevo() {
  const pathname = usePathname() ?? "";
  const roles = useContext(AuthContext)?.allRoles ?? [];
  if (!aplicaPanelBancoV2(roles)) return null;
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
      <Link
        href={equivalenteBancoV2(pathname)}
        data-testid="ir-al-panel-nuevo"
        style={{ fontSize: 12, color: "var(--ch-text-3)", textDecoration: "underline", textUnderlineOffset: 2 }}
      >
        Ir al panel nuevo →
      </Link>
    </div>
  );
}
