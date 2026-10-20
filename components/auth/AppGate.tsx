"use client";

import { usePathname } from "next/navigation";
import OnboardingAgent from "@/components/ai/OnboardingAgent";
import { ProtectedRoute } from "@/components/forge/auth/ProtectedRoute";
import { isAutosConsumerPublicPath, isDealerChromePath } from "@/lib/autos-portal/routes";
import { ContableChrome } from "@/components/dealer/ContableChrome";
import { DealerSuiteGate, isDealerReachableSuitePath } from "@/components/dealer/DealerSuiteGate";
import { MarcoSuite } from "@/components/nav/MarcoSuite";
import { InicioSuite } from "@/components/shell/InicioSuite";
import { ModuleShell } from "@/components/shell/ModuleShell";
import { isForgeMonetizacionEnabled } from "@/lib/env/feature-forge-monetizacion";
import { isMonetizacionPath } from "@/lib/credit-hub/monetizacion/routes";
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

  // Panel del dealer y Centro Operativo (D9): sobre el armazón común (PS-9-CARCASAS-2), con el menú del módulo
  // Concesionarios. Su layout sigue montando DealerShell, que dentro de ModuleShell no pinta menú ni barra propios.
  // Va antes que nada: el Centro Operativo no puede recaer en la Suite (GlobalForgeAppShell).
  if (isDealerChromePath(pathname)) {
    return <ProtectedRoute><ModuleShell modulo={moduloDeRuta(pathname)}>{children}</ModuleShell></ProtectedRoute>;
  }

  // Contabilidad: la abre el menu del dealer. Un usuario de dealer la ve dentro
  // de su panel; el resto, dentro de la Suite como siempre (ContableChrome).
  if (isDealerReachableSuitePath(pathname)) {
    return (
      <ProtectedRoute>
        <ContableChrome>{children}</ContableChrome>
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

  // Armazón común de módulos (PR 6a): Marketing, Legal, Proyectos, Administración, Crédito (Credit Hub, PS-9-CARCASAS-1) y Concesionarios
  // (Dealer OS y Centro Operativo, PS-9-CARCASAS-2: su layout sigue montando DealerShell, sin menú ni barra propios) abren su espacio con su
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

  // Portales de Credit Hub con chrome propio (menú y barra de su módulo): solo la barra de MarcoSuite, sin la Suite debajo.
  if (pathname.startsWith("/credit-hub/dealer") || (isMonetizacionPath(pathname) && isForgeMonetizacionEnabled())) {
    return (
      <ProtectedRoute>
        <>
          <MarcoSuite><DealerSuiteGate>{children}</DealerSuiteGate></MarcoSuite>
          <OnboardingAgent />
        </>
      </ProtectedRoute>
    );
  }

  // Resto (PS-9-CARCASAS-3): también sobre ModuleShell, con el menú de su módulo o, sin módulo, el de la Suite.
  return (
    <ProtectedRoute>
      <>
        <ModuleShell modulo={moduloDeRuta(pathname)}>{children}</ModuleShell>
        <OnboardingAgent />
      </>
    </ProtectedRoute>
  );
}
