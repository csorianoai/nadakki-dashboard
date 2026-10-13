"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { isDemoAllowed } from "@/lib/realtor/config";
import { centerForPath } from "@/lib/realtor/centers";
import { FONT_BODY, RT } from "@/lib/realtor/tokens";
import { useRealtorAccess } from "../useRealtorAccess";
import { ShellFooter } from "./ShellFooter";
import { ShellSidebar } from "./ShellSidebar";
import { ShellTopBar, type RealtorView } from "./ShellTopBar";

/**
 * Armazón de Realtor OS (DL10A). Fail-closed: sin interruptor y sin 200 de /acceso no pinta nada propio;
 * las páginas siguen mostrando su aviso con el motivo. La identidad sale del token.
 */
export function RealtorShell({ children }: { children: React.ReactNode }) {
  const access = useRealtorAccess();
  const pathname = usePathname();
  const [view, setView] = useState<RealtorView>("agente");
  const [demoRun, setDemoRun] = useState(0);
  if (access !== "ok") return <>{children}</>;

  const demo = isDemoAllowed();
  return (
    <div data-testid="realtor-shell" data-view={view}
      style={{ display: "flex", minHeight: "var(--alto-marco, 100vh)", fontFamily: FONT_BODY, color: RT.ink, background: RT.page }}>
      <ShellSidebar view={view} />
      <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column" }}>
        <ShellTopBar center={centerForPath(pathname)} view={view} onView={setView} demo={demo}
          onResetDemo={() => setDemoRun((n) => n + 1)} />
        <main id="contenido" style={{ flex: "1 1 auto", minWidth: 0 }}>
          <div key={demoRun}>{children}</div>
        </main>
        {demo ? <ShellFooter /> : null}
      </div>
    </div>
  );
}
