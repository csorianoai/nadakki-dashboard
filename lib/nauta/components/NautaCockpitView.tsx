"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNautaEmployees } from "@/hooks/nauta/useNautaEmployees";
import { useNautaSummary } from "@/hooks/nauta/useNautaSummary";
import { enrichEmployees } from "@/lib/nauta/employeeModel";
import type { NautaExpedienteView } from "@/lib/nauta/employeeModel";
import { NautaRail, type NautaViewId } from "./v2/NautaRail";
import { NautaHeader } from "./v2/NautaHeader";
import { NautaKpiHeader } from "./v2/NautaKpiHeader";
import type { PisoMode } from "./v2/SegmentedControl";
import { PisoView } from "./v2/views/PisoView";
import { TableroView } from "./v2/views/TableroView";
import { ExpedienteE1View } from "./v2/views/ExpedienteE1View";
import { ExpedienteE2View } from "./v2/views/ExpedienteE2View";
import { ExpedienteE16View } from "./v2/views/ExpedienteE16View";
import { SupervisionView } from "./v2/views/SupervisionView";
import { NautaViewErrorBoundary } from "./NautaViewErrorBoundary";

export function NautaCockpitView({
  initialPisoMode,
}: {
  initialPisoMode?: PisoMode;
} = {}) {
  const [view, setView] = useState<NautaViewId>("piso");
  const [pisoMode, setPisoMode] = useState<PisoMode>(initialPisoMode ?? "dept");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPisoMode) {
      setView("piso");
      setPisoMode(initialPisoMode);
    }
  }, [initialPisoMode]);

  const employeesQuery = useNautaEmployees();
  const summaryQuery = useNautaSummary();
  const employees = useMemo(
    () => enrichEmployees(employeesQuery.data ?? []),
    [employeesQuery.data],
  );

  const baseSummary = summaryQuery.data ?? {
    total_runs: 48217,
    success_rate: 99.2,
    cost_usd_month: 3667,
    hours_saved: 3940,
    pending_approvals: 7,
  };

  const [pendingCount, setPendingCount] = useState(baseSummary.pending_approvals);

  useEffect(() => {
    setPendingCount(baseSummary.pending_approvals);
  }, [baseSummary.pending_approvals]);

  const summary = useMemo(
    () => ({ ...baseSummary, pending_approvals: pendingCount }),
    [baseSummary, pendingCount],
  );

  const showKpis = view === "piso" || view === "tablero";

  const navigate = useCallback((next: NautaViewId, mode?: PisoMode) => {
    setView(next);
    if (next === "piso" && mode) setPisoMode(mode);
    if (next === "piso" && !mode) setPisoMode("dept");
    scrollRef.current?.scrollTo({ top: 0 });
  }, []);

  const openExpediente = useCallback(
    (exp: NautaExpedienteView) => {
      setView(exp);
      scrollRef.current?.scrollTo({ top: 0 });
    },
    [],
  );

  return (
    <div className="app" data-testid="nauta-cockpit-v2">
      <NautaRail view={view} pisoMode={pisoMode} pendingCount={pendingCount} onNavigate={navigate} />
      <div className="main">
        <NautaHeader view={view} />
        <div className="scroll" ref={scrollRef}>
          <NautaViewErrorBoundary scope="cockpit" onReset={() => navigate("piso")}>
            {showKpis ? <NautaKpiHeader summary={summary} /> : null}

            <section className={`view${view === "piso" ? " on" : ""}`} aria-hidden={view !== "piso"}>
              <PisoView
                employees={employees}
                mode={pisoMode}
                onModeChange={setPisoMode}
                onOpenExpediente={openExpediente}
                onOpenSupervision={() => navigate("super")}
              />
            </section>

            <section className={`view${view === "tablero" ? " on" : ""}`} aria-hidden={view !== "tablero"}>
              <TableroView hoursSaved={summary.hours_saved} />
            </section>

            <section className={`view${view === "expediente" ? " on" : ""}`} aria-hidden={view !== "expediente"}>
              <ExpedienteE1View />
            </section>

            <section className={`view${view === "expediente-e2" ? " on" : ""}`} aria-hidden={view !== "expediente-e2"}>
              <ExpedienteE2View />
            </section>

            <section className={`view${view === "expediente-e16" ? " on" : ""}`} aria-hidden={view !== "expediente-e16"}>
              <ExpedienteE16View onOpenSupervision={() => navigate("super")} />
            </section>

            <section className={`view${view === "super" ? " on" : ""}`} aria-hidden={view !== "super"}>
              <SupervisionView pendingCount={pendingCount} onPendingChange={setPendingCount} />
            </section>
          </NautaViewErrorBoundary>
        </div>
      </div>
    </div>
  );
}
