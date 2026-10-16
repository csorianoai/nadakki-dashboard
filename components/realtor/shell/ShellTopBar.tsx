"use client";

import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";

export type RealtorView = "agente" | "broker";

type Props = {
  center: string;
  /** Id del centro vivo que no es fila de la barra (p. ej. Propietarios): la miga lo señala. */
  offBarId?: string;
  view: RealtorView;
  onView: (v: RealtorView) => void;
  demo: boolean;
  /** `demo` de /acceso: el tenant es DEMO. Independiente de la píldora del entorno. */
  tenantDemo?: boolean;
  onResetDemo: () => void;
};

const VIEWS: { id: RealtorView; label: string }[] = [
  { id: "agente", label: "Agente" },
  { id: "broker", label: "Broker" },
];

/** Barra superior: miga, vista simulada Agente/Broker (sin permisos nuevos), píldora y reinicio solo en DEMO. */
export function ShellTopBar({ center, offBarId, view, onView, demo, tenantDemo = false, onResetDemo }: Props) {
  return (
    <header data-testid="shell-topbar" style={{ position: "sticky", top: 0, zIndex: 20, background: RT.page, borderBottom: `1px solid ${RT.line}` }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 16px", padding: "10px 40px" }}>
        <nav aria-label="Miga" data-testid="shell-crumb" style={{ fontSize: 13, color: RT.muted }}>
          <span style={{ fontFamily: FONT_DISPLAY }}>Nadakki Realtor OS</span> › <strong {...(offBarId ? { "data-testid": `center-${offBarId}`, "data-center-state": "live" } : {})} style={{ color: RT.ink }}>{center}</strong>
        </nav>
        {tenantDemo === true ? (
          <span role="status" data-testid="tenant-demo" style={{ background: RT.demoBg, color: RT.demoText, padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
            Tenant DEMO · los datos de este espacio son de demostración
          </span>
        ) : null}
        <div style={{ marginLeft: "auto", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <span id="vista-nota" style={{ fontSize: 12, color: RT.muted }}>Vista simulada</span>
          <div role="group" aria-label="Vista activa (simulada, sin permisos reales)" aria-describedby="vista-nota"
            style={{ display: "flex", border: `1px solid ${RT.lineStrong}`, borderRadius: 8, overflow: "hidden" }}>
            {VIEWS.map((v) => (
              <button key={v.id} type="button" data-testid={`view-${v.id}`} aria-pressed={view === v.id} onClick={() => onView(v.id)}
                style={{ minHeight: 40, padding: "0 14px", border: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600,
                  background: view === v.id ? RT.ink : RT.white, color: view === v.id ? RT.white : RT.ink }}>
                {v.label}
              </button>
            ))}
          </div>
          {demo ? (
            <>
              <span data-testid="demo-pill" style={{ background: RT.demoBg, color: RT.demoText, padding: "7px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                DEMO · datos sintéticos
              </span>
              <button type="button" data-testid="demo-reset" onClick={onResetDemo}
                style={{ whiteSpace: "nowrap", minHeight: 40, padding: "0 14px", borderRadius: 8, border: `1px solid ${RT.lineStrong}`, background: RT.white, color: RT.ink, fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
                Reiniciar DEMO
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
