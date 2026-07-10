"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fetchCoresSummary } from "../api/observability";
import { DemoPanelBadge } from "../components/DemoPanelBadge";
import { PanelError, PanelFrame, PanelSkeleton } from "../components/PanelFrame";
import { SparklineSvg } from "../components/SparklineSvg";
import type { CoreSummaryItem } from "../types";

const STATUS_LABELS = { healthy: "Operativo", degraded: "Degradado", down: "Caído", unknown: "Desconocido" };

export function CoresGrid() {
  const [cores, setCores] = useState<CoreSummaryItem[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCoresSummary();
      setCores(res.data.cores ?? []);
      setIsDemo(res.isDemo);
      if (res.error) setError(res.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar cores");
      setCores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PanelFrame title="Cores de la plataforma" badge={isDemo ? <DemoPanelBadge /> : undefined} testId="cockpit-cores-grid">
      {loading ? <PanelSkeleton rows={4} /> : null}
      {!loading && error && cores.length === 0 ? <PanelError message={error} onRetry={load} /> : null}
      {!loading && cores.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cores.map((core) => (
            <CoreCard key={core.core_code} core={core} />
          ))}
        </div>
      ) : null}
    </PanelFrame>
  );
}

function CoreCard({ core }: { core: CoreSummaryItem }) {
  const border = core.color_hex ?? "var(--ch-line)";
  const inner = (
    <div
      className="ch-card h-full"
      style={{ padding: 14, borderLeft: `4px solid ${border}` }}
      data-testid={`core-card-${core.core_code}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold">{core.display_name}</h3>
        <span className="text-xs text-[var(--ch-text-3)]">{STATUS_LABELS[core.status] ?? core.status}</span>
      </div>
      <div className="mb-2 flex flex-wrap gap-3 text-xs text-[var(--ch-text-2)]">
        {(core.metrics ?? []).slice(0, 3).map((m) => (
          <span key={m.label}>
            {m.label}: <strong>{m.value}</strong>
          </span>
        ))}
      </div>
      {core.sparkline_7d?.length ? <SparklineSvg values={core.sparkline_7d} color={border} /> : null}
      {core.core_code === "credit_hub" ? (
        <p className="mt-2 text-xs text-[var(--ch-persona)]">Ver Credit Hub →</p>
      ) : null}
    </div>
  );

  if (core.core_code === "credit_hub") {
    return (
      <Link href="/credit-hub/admin/credit" className="block transition-opacity hover:opacity-90">
        {inner}
      </Link>
    );
  }
  return inner;
}
