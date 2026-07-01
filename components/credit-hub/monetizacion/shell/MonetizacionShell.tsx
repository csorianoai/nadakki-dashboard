"use client";

import { createContext, useCallback, useContext, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { ForgeToaster, toast } from "@/components/forge/ui/Toast";
import { DEMO_TENANTS } from "./TenantSwitcher";
import { DemoBanner } from "./DemoBanner";
import { MonetizacionFonts } from "./MonetizacionFonts";
import { NavRail } from "./NavRail";
import { TopBar } from "./TopBar";
import { TraceDrawer, type TraceDrawerPayload } from "./TraceDrawer";
import "./tokens.css";
import "./shell-layout.css";
import "../ui/components-presentational.css";
import "../ui/components-controls.css";
import "../ui/screen-states.css";

type MonetizacionShellContextValue = {
  tenantId: string;
  setTenantId: (id: string) => void;
  openTrace: (payload: TraceDrawerPayload) => void;
  closeTrace: () => void;
};

const MonetizacionShellContext = createContext<MonetizacionShellContextValue | null>(null);

export function useMonetizacionShell(): MonetizacionShellContextValue {
  const ctx = useContext(MonetizacionShellContext);
  if (!ctx) {
    throw new Error("useMonetizacionShell must be used within MonetizacionShell");
  }
  return ctx;
}

type Props = {
  pageTitle: string;
  children: ReactNode;
};

export function MonetizacionShell({ pageTitle, children }: Props) {
  const [tenantId, setTenantId] = useState<string>(DEMO_TENANTS[0].id);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPayload, setDrawerPayload] = useState<TraceDrawerPayload>(null);

  const tenantAccent = DEMO_TENANTS.find((t) => t.id === tenantId)?.accent ?? DEMO_TENANTS[0].accent;

  const openTrace = useCallback((payload: TraceDrawerPayload) => {
    setDrawerPayload(payload);
    setDrawerOpen(Boolean(payload));
  }, []);

  const closeTrace = useCallback(() => {
    setDrawerOpen(false);
    setDrawerPayload(null);
  }, []);

  const ctx = useMemo(
    () => ({ tenantId, setTenantId, openTrace, closeTrace }),
    [tenantId, openTrace, closeTrace],
  );

  return (
    <MonetizacionShellContext.Provider value={ctx}>
      <MonetizacionFonts>
        <div style={{ "--fm-tenant": tenantAccent } as CSSProperties}>
          <DemoBanner />
          <div className="fm-body">
            {mobileNavOpen ? (
              <button
                type="button"
                className="fm-nav-backdrop"
                aria-label="Cerrar menú"
                onClick={() => setMobileNavOpen(false)}
              />
            ) : null}
            <NavRail mobileOpen={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />
            <div className="fm-main-col">
              <TopBar
                title={pageTitle}
                tenantId={tenantId}
                onTenantChange={setTenantId}
                onMobileNavToggle={() => setMobileNavOpen((o) => !o)}
                onGenerateInvoice={() => toast.success("Factura generada · demo")}
              />
              <div className="fm-workspace">
                <div className="fm-content">
                  <div className="fm-content-inner">{children}</div>
                </div>
                <TraceDrawer open={drawerOpen} payload={drawerPayload} onClose={closeTrace} />
              </div>
            </div>
          </div>
          <ForgeToaster />
        </div>
      </MonetizacionFonts>
    </MonetizacionShellContext.Provider>
  );
}
