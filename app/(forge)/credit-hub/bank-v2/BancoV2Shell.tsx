"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { CHPortalAccessGuard } from "@/components/credit-hub/system/CHPortalAccessGuard";
import { useChromeIdentity } from "@/components/credit-hub/shell/useChromeIdentity";
import { DccShell, itemActivo } from "@/components/dcc/shell/DccShell";
import { useAuth } from "@/hooks/useAuth";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";
import { marcaDesdeBranding, type MarcaDcc } from "@/lib/dcc/marca";
import { BANCO_V2_NAV, BANCO_V2_RAIZ } from "./_nav";

const MarcaBancoContext = createContext<MarcaDcc | null>(null);

/** Marca del banco (nombre, logo, locale y moneda del branding) para las paginas de bank-v2. */
export function useMarcaBanco(): MarcaDcc {
  return useContext(MarcaBancoContext) ?? marcaDesdeBranding(null, "banco");
}

/**
 * Chrome de bank-v2. Las guardias son LAS MISMAS que BankChShell, en el mismo
 * orden: CHTenantGuard y CHPortalAccessGuard portal="bank". Un rol no
 * bancario ve el mismo rechazo que en /credit-hub/bank.
 */
export function BancoV2Shell({ children }: { children: ReactNode }) {
  return (
    <CHTenantGuard>
      <CHPortalAccessGuard portal="bank">
        <BancoV2Chrome>{children}</BancoV2Chrome>
      </CHPortalAccessGuard>
    </CHTenantGuard>
  );
}

function BancoV2Chrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? BANCO_V2_RAIZ;
  const router = useRouter();
  const { logout } = useAuth();
  const identidad = useChromeIdentity();
  const branding = useTenantBranding();
  const marca = marcaDesdeBranding(branding.data, "banco");
  const activo = itemActivo(BANCO_V2_NAV, pathname, BANCO_V2_RAIZ);
  const item = BANCO_V2_NAV.flatMap((g) => g.items).find((i) => i.id === activo);

  const salir = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <MarcaBancoContext.Provider value={marca}>
      <DccShell
        firma={marca.plataforma ?? ""}
        marca={{ nombre: marca.nombre, logoUrl: marca.logoUrl }}
        grupos={BANCO_V2_NAV}
        activo={activo}
        migas={[{ label: "Banco", href: BANCO_V2_RAIZ }, ...(item ? [{ label: item.label }] : [])]}
        usuario={{ nombre: identidad.name, rol: identidad.role, iniciales: identidad.initials }}
        onSalir={() => void salir()}
      >
        {children}
      </DccShell>
    </MarcaBancoContext.Provider>
  );
}
