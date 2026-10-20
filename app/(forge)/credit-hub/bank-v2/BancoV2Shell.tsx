"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { BuscadorBanco } from "@/components/credit-hub/bank-v2/cabecera/BuscadorBanco";
import { CampanaBanco } from "@/components/credit-hub/bank-v2/cabecera/CampanaBanco";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { CHPortalAccessGuard } from "@/components/credit-hub/system/CHPortalAccessGuard";
import type { ChromeIdentity } from "@/components/credit-hub/shell/useChromeIdentity";
import { DccThemeProvider, useDccThemeContext } from "@/components/dcc/DccThemeContext";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { dccFontVariables } from "@/components/dcc/shell/DccFonts";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";
import { marcaDesdeBranding, type MarcaDcc } from "@/lib/dcc/marca";
import { dccThemeStyle } from "@/lib/dcc/tokens";
import { BANCO_V2_NAV, BANCO_V2_RAIZ } from "./_nav";

const MarcaBancoContext = createContext<MarcaDcc | null>(null);

export type DccUsuario = { nombre: string; rol: string; iniciales: string };

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
 * Lo de bank-v2 dentro del armazón común (AppGate -> ModuleShell, PS-9-CARCASAS-2): barra, menú, migas y usuario
 * son los de la Suite. Las guardias son LAS MISMAS que BankChShell, en el mismo orden: CHTenantGuard y
 * CHPortalAccessGuard portal="bank". Un rol no bancario ve el mismo rechazo que en /credit-hub/bank.
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

/** Tipografía del banco (Sora, IBM Plex Sans y Mono), la misma que daba DccShell, acotada a su raíz. */
const TIPOGRAFIA_BANCO = [
  "font-[family-name:var(--font-ibm-plex-sans),ui-sans-serif,system-ui,sans-serif]",
  "[&_:is(h1,h2,h3)]:font-[family-name:var(--font-sora),var(--font-ibm-plex-sans),ui-sans-serif,sans-serif]",
  "[&_:is(h1,h2,h3)]:tracking-[-0.01em]",
  "[&_.font-dealer-numeric]:font-[family-name:var(--font-ibm-plex-mono),ui-monospace,monospace]",
  "[&_.font-dealer-numeric]:tabular-nums",
].join(" ");

/**
 * PS-9-CARCASAS-2: la barra, el menú, las migas y el usuario son los del armazón común. Del chrome del banco quedan el
 * tema (recordado con su clave), la tipografía y, en una franja del contenido, el buscador, la
 * campana y el conmutador de tema.
 */
function BancoV2Contenido({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <DccThemeProvider storageKey={BANCO_V2_THEME_STORAGE_KEY} conmutadorEnChrome>
      <BancoV2Tema>
        <div data-testid="banco-acciones" className="mb-4 flex items-center justify-end gap-2">
          <BuscadorBanco grupos={BANCO_V2_NAV} hrefBandeja={`${BANCO_V2_RAIZ}/solicitudes`} onIr={(href) => router.push(href)} />
          <CampanaBanco hrefSolicitud={(id) => `${BANCO_V2_RAIZ}/solicitudes/${encodeURIComponent(id)}`} onIr={(href) => router.push(href)} />
          <ConmutadorTema />
        </div>
        {children}
      </BancoV2Tema>
    </DccThemeProvider>
  );
}

function BancoV2Tema({ children }: { children: ReactNode }) {
  const theme = useDccThemeContext()?.theme ?? "light";
  return (
    <div
      data-dcc-theme={theme}
      style={dccThemeStyle(theme)}
      className={`${dccFontVariables} ${TIPOGRAFIA_BANCO} min-w-0 flex-1 bg-[var(--dcc-canvas)] px-4 py-5 text-[var(--dcc-fg)] antialiased sm:px-5 lg:px-6 lg:py-6`}
    >
      {children}
    </div>
  );
}

function ConmutadorTema() {
  const contexto = useDccThemeContext();
  const theme = contexto?.theme ?? "light";
  const siguiente = theme === "light" ? "dark" : "light";
  return (
    <button
      type="button"
      data-testid="banco-tema"
      aria-label={siguiente === "dark" ? "Cambiar a tema oscuro" : "Cambiar a tema claro"}
      onClick={() => contexto?.setTheme(siguiente)}
      className={DCC_CLASSES.quietButton}
    >
      {theme === "light" ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}

function BancoV2Chrome({ children }: { children: ReactNode }) {
  const branding = useTenantBranding();
  const marca = marcaDesdeBranding(branding.data, "banco");
  return (
    <MarcaBancoContext.Provider value={marca}>
      <BancoV2Contenido>{children}</BancoV2Contenido>
    </MarcaBancoContext.Provider>
  );
}
