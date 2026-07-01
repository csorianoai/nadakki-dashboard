"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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

const DEFAULT_TENANT_ID = "nadakki-operador";
const TENANT_IDS = new Set<string>(DEMO_TENANTS.map((t) => t.id));
let sessionTenantId: string | null = null;

function resolveTenantId(param: string | null): string {
  if (param && TENANT_IDS.has(param)) return param;
  if (sessionTenantId && TENANT_IDS.has(sessionTenantId)) return sessionTenantId;
  return DEFAULT_TENANT_ID;
}

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
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [tenantId, setTenantIdState] = useState(() => resolveTenantId(searchParams.get("tenant")));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPayload, setDrawerPayload] = useState<TraceDrawerPayload>(null);

  const setTenantId = useCallback(
    (id: string) => {
      if (!TENANT_IDS.has(id)) return;
      sessionTenantId = id;
      setTenantIdState(id);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tenant", id);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (searchParams.get("tenant") === tenantId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tenant", tenantId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams, tenantId]);

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
