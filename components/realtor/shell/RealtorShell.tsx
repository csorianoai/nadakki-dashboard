"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { isDemoAllowed } from "@/lib/realtor/config";
import { centerForPath, OFF_BAR_CENTERS } from "@/lib/realtor/centers";
import { FONT_BODY, RT } from "@/lib/realtor/tokens";
import { useRealtorAccessInfo } from "../useRealtorAccess";
import { ShellFooter } from "./ShellFooter";
import { ShellSidebar } from "./ShellSidebar";
import { ShellTopBar, type RealtorView } from "./ShellTopBar";

/**
 * Armazón de Realtor OS (DL10A). Fail-closed: sin interruptor y sin 200 de /acceso no pinta nada propio;
 * las páginas siguen mostrando su aviso con el motivo. La identidad sale del token.
 */
export function RealtorShell({ children }: { children: React.ReactNode }) {
  const { state: access, roles } = useRealtorAccessInfo();
  const pathname = usePathname();
  const [view, setView] = useState<RealtorView>("agente");
  const [demoRun, setDemoRun] = useState(0);
  if (access !== "ok") return <>{children}</>;

  const demo = isDemoAllowed();
  const offBar = OFF_BAR_CENTERS.find((c) => c.href && pathname?.startsWith(c.href));
  return (
    <div data-testid="realtor-shell" data-view={view}
      style={{ display: "flex", minHeight: "100vh", fontFamily: FONT_BODY, color: RT.ink, background: RT.page }}>
      <ShellSidebar view={view} roles={roles} />
      <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column" }}>
        <ShellTopBar center={centerForPath(pathname)} offBarId={offBar?.id} view={view} onView={setView} demo={demo}
          onResetDemo={() => setDemoRun((n) => n + 1)} />
        <main id="contenido" style={{ flex: "1 1 auto", minWidth: 0 }}>
          <div key={demoRun}>{children}</div>
        </main>
        {demo ? <ShellFooter /> : null}
      </div>
    </div>
  );
}
