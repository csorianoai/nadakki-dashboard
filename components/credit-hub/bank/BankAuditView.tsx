"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EmptyStateRich, TableSkeleton } from "@/components/credit-hub/primitives";
import { SectionHeader } from "@/components/credit-hub/bank/shared/bankUi";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import type { BankAuditEventView, BankAuditViewProps } from "@/lib/credit-hub/types/bank-views";

const A_LABEL: Record<string, string> = {
  submitted: "Solicitud recibida",
  analyzed: "Análisis del motor",
  claimed: "Reclamada por analista",
  requested_document: "Documento solicitado",
  compliance_checked: "Compliance verificado",
  compliance_approved: "Compliance aprobado",
  comment_added: "Comentario interno",
  decided: "Decisión registrada",
};

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long" });
}

export function BankAuditView({ events, isLoading, isError, onRetry }: BankAuditViewProps) {
  const [actor, setActor] = useState("all");
  const [action, setAction] = useState("all");

  const actors = useMemo(() => [...new Set(events.map((e) => e.actor))], [events]);
  const actions = useMemo(() => [...new Set(events.map((e) => e.action))], [events]);

  const filtered = useMemo(
    () =>
      events
        .filter((e) => (actor === "all" || e.actor === actor) && (action === "all" || e.action === action))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [events, actor, action]
  );

  const groups = useMemo(() => {
    const g: Record<string, BankAuditEventView[]> = {};
    filtered.forEach((e) => {
      const k = dayKey(e.timestamp);
      (g[k] = g[k] ?? []).push(e);
    });
    return g;
  }, [filtered]);

  if (isLoading) return <TableSkeleton rows={6} />;
  if (isError) return <EmptyStateRich variant="error" primary={<button type="button" className="ch-btn ch-btn-secondary" onClick={onRetry}>Reintentar</button>} />;

  return (
    <div data-testid="bank-audit-trust">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span className="ch-eyebrow">Compliance & Trust Layer</span>
        <DataTruthBadge level="REAL" />
      </div>
      <SectionHeader
        eyebrow="Bank · Auditoría"
        title="Visor de auditoría"
        sub={`${filtered.length} eventos · orden cronológico inverso`}
        actions={
          <>
            <select className="ch-select" value={actor} onChange={(e) => setActor(e.target.value)} style={{ width: 160, height: 30 }}>
              <option value="all">Todos los actores</option>
              {actors.map((a) => (
                <option key={a} value={a}>
                  {a === "system" ? "Sistema" : a}
                </option>
              ))}
            </select>
            <select className="ch-select" value={action} onChange={(e) => setAction(e.target.value)} style={{ width: 180, height: 30 }}>
              <option value="all">Todas las acciones</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {A_LABEL[a] ?? a}
                </option>
              ))}
            </select>
          </>
        }
      />

      {filtered.length === 0 ? (
        <EmptyStateRich variant="filter-empty" title="Sin eventos en el rango seleccionado" body="Ajusta los filtros de actor o acción." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {Object.entries(groups).map(([day, evs]) => (
            <div key={day}>
              <div style={{ position: "sticky", top: 0, zIndex: 2, background: "var(--ch-bg)", padding: "6px 0 8px" }}>
                <span className="ch-eyebrow" style={{ textTransform: "capitalize" }}>
                  {day}
                </span>
                <span className="ch-mono" style={{ fontSize: 11, color: "var(--ch-text-4)", marginLeft: 8 }}>
                  {evs.length} eventos
                </span>
              </div>
              <div className="ch-card" style={{ padding: "4px 0" }}>
                {evs.map((e, i) => (
                  <div
                    key={e.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "70px 1fr auto",
                      gap: 12,
                      alignItems: "center",
                      padding: "12px 18px",
                      borderTop: i ? "1px solid var(--ch-line)" : "none",
                    }}
                  >
                    <span className="ch-mono" style={{ fontSize: 11, color: "var(--ch-text-3)" }}>
                      {new Date(e.timestamp).toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {A_LABEL[e.action] ?? e.action}
                        <span style={{ fontWeight: 400, color: "var(--ch-text-3)" }}> · {e.actor === "system" ? "Sistema" : e.actor}</span>
                      </div>
                      {e.details && Object.keys(e.details).length > 0 ? (
                        <div style={{ fontSize: 12, color: "var(--ch-text-2)", marginTop: 3 }}>
                          {Object.entries(e.details).map(([k, v]) => (
                            <span key={k} style={{ marginRight: 14 }}>
                              <span style={{ color: "var(--ch-text-3)" }}>{k}:</span> <span className="ch-mono">{String(v)}</span>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    {e.applicationId ? (
                      <Link href={`/credit-hub/bank/applications/${e.applicationId}`} className="ch-mono" style={{ fontSize: 12, color: "var(--ch-accent)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                        {e.applicationId}
                        <ArrowUpRight className="h-3 w-3" aria-hidden />
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
