"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BuscadorBanco } from "@/components/credit-hub/bank-v2/cabecera/BuscadorBanco";
import { CampanaBanco } from "@/components/credit-hub/bank-v2/cabecera/CampanaBanco";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { CHPortalAccessGuard } from "@/components/credit-hub/system/CHPortalAccessGuard";
import { useChromeIdentity, type ChromeIdentity } from "@/components/credit-hub/shell/useChromeIdentity";
import { DccShell, itemActivo, type DccUsuario } from "@/components/dcc/shell/DccShell";
import { useAuth } from "@/hooks/useAuth";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";
import { marcaDesdeBranding, type MarcaDcc } from "@/lib/dcc/marca";
import { BANCO_V2_NAV, BANCO_V2_RAIZ } from "./_nav";

const MarcaBancoContext = createContext<MarcaDcc | null>(null);

/** Clave de Local Storage del tema del banco v2 (solo "light" | "dark"), como la del dealer. */
export const BANCO_V2_THEME_STORAGE_KEY = "nadakki-banco-v2-theme";

/**
 * Usuario de la cabecera: el nombre de la sesion; sin nombre, el email (nunca
 * el generico "Usuario" si hay email). useChromeIdentity es compartido con el
 * dealer y el banco actual, asi que el respaldo vive aqui.
 */
export function usuarioCabecera(identidad: ChromeIdentity): DccUsuario {
  const conNombre = identidad.initials !== "—";
  if (conNombre || !identidad.email) return { nombre: identidad.name, rol: identidad.role, iniciales: identidad.initials };
  const local = identidad.email.split("@")[0]?.replace(/[^\p{L}\p{N}]/gu, "") ?? "";
  return { nombre: identidad.email, rol: identidad.role, iniciales: local.slice(0, 2).toUpperCase() || "—" };
}

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
        usuario={usuarioCabecera(identidad)}
        onSalir={() => void salir()}
        temaStorageKey={BANCO_V2_THEME_STORAGE_KEY}
        extrasCabecera={
          <>
            <BuscadorBanco grupos={BANCO_V2_NAV} hrefBandeja={`${BANCO_V2_RAIZ}/solicitudes`} onIr={(href) => router.push(href)} />
            <CampanaBanco hrefSolicitud={(id) => `${BANCO_V2_RAIZ}/solicitudes/${encodeURIComponent(id)}`} onIr={(href) => router.push(href)} />
          </>
        }
      >
        {children}
      </DccShell>
    </MarcaBancoContext.Provider>
  );
}
