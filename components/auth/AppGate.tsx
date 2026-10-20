"use client";

import { usePathname } from "next/navigation";
import OnboardingAgent from "@/components/ai/OnboardingAgent";
import { ProtectedRoute } from "@/components/forge/auth/ProtectedRoute";
import { GlobalForgeAppShell } from "@/components/forge/layout/GlobalForgeAppShell";
import { isAutosConsumerPublicPath, isDealerChromePath } from "@/lib/autos-portal/routes";
import { ContableChrome } from "@/components/dealer/ContableChrome";
import { isDealerReachableSuitePath } from "@/components/dealer/DealerSuiteGate";
import { MarcoSuite } from "@/components/nav/MarcoSuite";
import { InicioSuite } from "@/components/shell/InicioSuite";
import { ModuleShell } from "@/components/shell/ModuleShell";
import { moduloDeRuta, usaCarcasaComun } from "@/lib/modulos/registro";

function getEffectivePathname(pathname: string | null): string {
  if (pathname) {
    return pathname;
  }

  return typeof window !== "undefined" ? window.location.pathname : "";
}

// Toda pantalla autenticada va dentro de MarcoSuite: la barra con logotipo, Inicio, Atrás/Adelante y migas
// queda encima de cualquier carcasa (Suite, Credit Hub, Dealer OS, Realtor OS, Cockpit, Contabilidad, Crédito),
// y desde cualquier core se vuelve al Inicio con un clic (César, 2026-10-13).
export default function AppGate({ children }: { children: React.ReactNode }) {
  const pathname = getEffectivePathname(usePathname());

  if (!pathname) {
    return null;
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  // /logout se pinta solo, como /login. Dentro del GlobalForgeAppShell, el
  // DealerSuiteGate (#582) lleva a un dealer a /autos/dealer antes de que la
  // pagina monte: el logout no se ejecutaba y el binding del dealer y el
  // refresh token sobrevivian (D1).
  if (pathname === "/logout") {
    return <>{children}</>;
  }

  if (pathname.startsWith("/consent")) {
    return <>{children}</>;
  }

  // Public Nadakki Auto marketplace (autos.nadakki.com consumer)
  if (isAutosConsumerPublicPath(pathname)) {
    return <>{children}</>;
  }

  // Panel del dealer: autenticado, pero con su propio chrome. Fuera del
  // GlobalForgeAppShell, que es el que pinta la barra "Suite operativa" con
  // todos los hubs y se apilaba sobre el menu del dealer.
  //
  // Incluye el Centro Operativo, que es la guia de carga del dealer y se lee
  // dentro de su panel (decision de Cesar, D9).
  if (isDealerChromePath(pathname)) {
    return <ProtectedRoute><MarcoSuite>{children}</MarcoSuite></ProtectedRoute>;
  }

  // Contabilidad: la abre el menu del dealer. Un usuario de dealer la ve dentro
  // de su panel; el resto, dentro de la Suite como siempre (ContableChrome).
  if (isDealerReachableSuitePath(pathname)) {
    return (
      <ProtectedRoute>
        <MarcoSuite>
          <ContableChrome>{children}</ContableChrome>
        </MarcoSuite>
      </ProtectedRoute>
    );
  }

  if (pathname.startsWith("/cockpit")) {
    return <ProtectedRoute><MarcoSuite>{children}</MarcoSuite></ProtectedRoute>;
  }

  // Realtor OS: autenticado, pero con su propio armazón (DL10A: barra de centros, Career Director, Smart
  // Calendar), que pinta app/realtor/layout.tsx. Dentro del GlobalForgeAppShell se apilaba sobre el
  // menú genérico de la Suite (decisión de César, 2026-10-12, tarea RE-SHELL).
  if (pathname === "/realtor" || pathname.startsWith("/realtor/")) {
    return <ProtectedRoute><MarcoSuite>{children}</MarcoSuite></ProtectedRoute>;
  }

  // Armazón común de módulos (PR 6a): Marketing, Legal, Proyectos, Administración y Crédito (Credit Hub, PS-9-CARCASAS-1) abren su espacio con su
  // propio menú lateral; la portada y las notificaciones son la Suite (menú = elegir módulo). Los cores con
  // carcasa propia (arriba) y las rutas sin módulo siguen como estaban.
  const sinSlash = pathname.replace(/\/+$/, "") || "/";
  const enSuite = sinSlash === "/" || sinSlash === "/notifications";
  if (enSuite || usaCarcasaComun(pathname)) {
    return (
      <ProtectedRoute>
        <>
          {enSuite ? <InicioSuite>{children}</InicioSuite> : <ModuleShell modulo={moduloDeRuta(pathname)}>{children}</ModuleShell>}
          <OnboardingAgent />
        </>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <>
        <MarcoSuite>
          <GlobalForgeAppShell>{children}</GlobalForgeAppShell>
        </MarcoSuite>
        <OnboardingAgent />
      </>
    </ProtectedRoute>
  );
}
