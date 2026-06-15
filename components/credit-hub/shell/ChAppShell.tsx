"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ChAppShellProps, ChShellContextValue, PersonaType } from "@/lib/credit-hub/ch-types";
import { ChBottomNav, ChSidebar } from "./ChSidebar";
import { ChTopbar } from "./ChTopbar";

const ChShellCtx = createContext<ChShellContextValue>({
  persona: "bank",
  trail: [],
  openPalette: () => {},
  paletteOpen: false,
});

export function useChShell(): ChShellContextValue {
  return useContext(ChShellCtx);
}

export function ChAppShell({
  persona = "bank",
  tenantName,
  trail = ["Credit Hub", "Panel"],
  mode = "desktop",
  multiTenant = true,
  frame = false,
  children,
  topbar,
  sidebar,
  bottomNav,
  className,
}: ChAppShellProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const isMobile = mode === "mobile";

  const ctx: ChShellContextValue = {
    persona,
    trail,
    openPalette: () => setPaletteOpen(true),
    paletteOpen,
  };

  const resolvedTenant =
    tenantName ?? (persona === "bank" ? "TestBank Mexico" : "Auto Plaza · TestBank");
  const resolvedUser =
    persona === "bank"
      ? { name: "María Reyes", initials: "MR" }
      : { name: "Jorge Salinas", initials: "JS" };

  return (
    <ChShellCtx.Provider value={ctx}>
      <div
        className={cn("credit-hub-forge", className)}
        data-persona={persona}
        style={{
          height: frame ? "100%" : "100vh",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          background: "var(--ch-bg)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <a
          href="#ch-main"
          className="ch-skip-link"
          style={{ position: "absolute", left: -9999, top: 8, zIndex: 100 }}
          onFocus={(e) => {
            e.currentTarget.style.left = "12px";
          }}
          onBlur={(e) => {
            e.currentTarget.style.left = "-9999px";
          }}
        >
          Saltar al contenido
        </a>

        {!isMobile
          ? sidebar ?? <ChSidebar persona={persona} active={active} onNavigate={setActive} />
          : null}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
          {topbar ?? (
            <ChTopbar
              trail={trail}
              multiTenant={multiTenant}
              compact={isMobile}
              tenantName={resolvedTenant}
              user={resolvedUser}
              onOpenSearch={() => setPaletteOpen(true)}
            />
          )}

          <main id="ch-main" style={{ flex: 1, overflowY: "auto", minHeight: 0 }} tabIndex={-1}>
            <div style={{ maxWidth: 1440, margin: "0 auto", padding: isMobile ? "16px 16px 24px" : "24px" }}>{children}</div>
          </main>

          {isMobile ? bottomNav ?? <ChBottomNav persona={persona} active={active} onNavigate={setActive} /> : null}
        </div>

        {paletteOpen ? (
          <div
            role="presentation"
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", zIndex: 50 }}
            onClick={() => setPaletteOpen(false)}
          />
        ) : null}
      </div>
    </ChShellCtx.Provider>
  );
}

export function ChShellEmptyMain({ title = "Área de contenido", note }: { title?: string; note?: string }) {
  return (
    <div
      style={{
        border: "1.5px dashed var(--ch-line-2)",
        borderRadius: "var(--ch-r-xl)",
        padding: "48px 24px",
        textAlign: "center",
        color: "var(--ch-text-3)",
        background: "var(--ch-surface)",
      }}
    >
      <div className="ch-serif" style={{ fontSize: "var(--ch-text-lg)", color: "var(--ch-text-2)" }}>
        {title}
      </div>
      <div style={{ fontSize: "var(--ch-text-sm)", marginTop: 6, maxWidth: 420, margin: "6px auto 0" }}>
        {note ??
          "Las páginas de contenido (Bank · Dealer) se montan aquí en los Paquetes 1 y 2. El chasis ya provee sidebar, topbar, scroll y contexto de persona."}
      </div>
    </div>
  );
}

export type ChAppShellSlotProps = { children: ReactNode };
