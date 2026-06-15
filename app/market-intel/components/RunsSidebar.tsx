"use client";

import { useMemo, useState } from "react";
import { countryFlag } from "../lib/tenant-config";
import type { RunResponse, RunStatus } from "../lib/types";
import { ICN, Ic } from "./Icons";

interface RunsSidebarProps {
  runs: RunResponse[];
  activeId: string | null;
  onPick: (id: string) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onCreate?: () => void;
  creating?: boolean;
}

function runStatusChip(status: RunStatus): [string, string] {
  const map: Record<string, [string, string]> = {
    draft: ["", "Borrador"],
    researching: ["info", "Investigando"],
    needs_validation: ["warn", "Pendiente"],
    pending_human_review: ["warn", "Pendiente"],
    validated: ["pos", "Validado"],
    archived: ["", "Archivado"],
  };
  return map[status] ?? ["", status];
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return "—";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `hace ${days} día${days > 1 ? "s" : ""}`;
  return new Date(iso).toLocaleDateString("es-DO");
}

export function RunsSidebar({
  runs,
  activeId,
  onPick,
  collapsed,
  setCollapsed,
  onCreate,
  creating,
}: RunsSidebarProps) {
  const [q, setQ] = useState("");

  const list = useMemo(
    () =>
      runs.filter(
        (r) =>
          !q ||
          r.id.toLowerCase().includes(q.toLowerCase()) ||
          r.vertical.toLowerCase().includes(q.toLowerCase()) ||
          r.product.toLowerCase().includes(q.toLowerCase())
      ),
    [runs, q]
  );

  if (collapsed) {
    return (
      <aside
        style={{
          width: 52,
          borderRight: "1px solid var(--mee-line)",
          background: "var(--mee-surface)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 12,
          gap: 8,
        }}
      >
        <button
          type="button"
          className="icon-btn"
          onClick={() => setCollapsed(false)}
          aria-label="Expandir"
        >
          <Ic d={ICN.layers} s={16} />
        </button>
      </aside>
    );
  }

  return (
    <aside
      style={{
        width: 264,
        borderRight: "1px solid var(--mee-line)",
        background: "var(--mee-surface)",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--mee-line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span className="eyebrow">Investigaciones</span>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setCollapsed(true)}
          aria-label="Colapsar"
          style={{ width: 24, height: 24 }}
        >
          <Ic d={ICN.chevL} s={14} />
        </button>
      </div>

      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid var(--mee-line)",
          position: "relative",
        }}
      >
        <Ic
          d={ICN.search}
          s={14}
          style={{ position: "absolute", left: 22, top: 18, color: "var(--mee-ink-4)" }}
        />
        <input
          className="input"
          placeholder="Buscar run o vertical…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
        {list.map((r) => {
          const [cls, label] = runStatusChip(r.status);
          const on = r.id === activeId;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onPick(r.id)}
              style={{
                width: "100%",
                textAlign: "left",
                border: "1px solid",
                borderColor: on ? "var(--mee-accent-line)" : "transparent",
                background: on ? "var(--mee-accent-soft)" : "transparent",
                borderRadius: 8,
                padding: "10px 11px",
                marginBottom: 4,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                if (!on) e.currentTarget.style.background = "var(--mee-surface-2)";
              }}
              onMouseLeave={(e) => {
                if (!on) e.currentTarget.style.background = "transparent";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 14 }}>{countryFlag(r.country_iso)}</span>
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    flex: 1,
                    minWidth: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {r.product || r.vertical}
                </span>
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  color: "var(--mee-ink-4)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginBottom: 7,
                }}
              >
                {r.id}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span className={`chip ${cls}`} style={{ height: 19, fontSize: 10 }}>
                  {cls === "warn" ? <span className="dot" /> : null}
                  {label}
                </span>
                <span style={{ fontSize: 10.5, color: "var(--mee-ink-4)" }}>
                  {formatRelativeTime(r.updated_at)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {onCreate ? (
        <div style={{ padding: 12, borderTop: "1px solid var(--mee-line)" }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ width: "100%" }}
            onClick={onCreate}
            disabled={creating}
          >
            <Ic d={ICN.plus} s={13} />
            {creating ? "Creando…" : "Nueva investigación"}
          </button>
        </div>
      ) : null}
    </aside>
  );
}
