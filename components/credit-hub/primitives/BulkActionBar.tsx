"use client";

import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BulkActionBarProps } from "@/lib/credit-hub/ch-types";

export function BulkActionBar({ count, selectedCount, onClear, onApply, className }: BulkActionBarProps) {
  const n = count ?? selectedCount ?? 0;
  if (n <= 0) return null;

  return (
    <div
      className={cn(className)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 14px",
        background: "var(--ch-text)",
        color: "#fff",
        borderRadius: "var(--ch-r-lg)",
        boxShadow: "var(--ch-sh-3)",
        flexWrap: "wrap",
      }}
      role="region"
      aria-label="Acciones masivas"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          className="ch-mono"
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: "rgba(255,255,255,0.15)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {n}
        </span>
        <span style={{ fontSize: 13, fontWeight: 500 }}>seleccionadas</span>
        <button
          type="button"
          onClick={onClear}
          style={{
            border: "none",
            background: "transparent",
            color: "rgba(255,255,255,0.7)",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 12,
            textDecoration: "underline",
          }}
        >
          limpiar
        </button>
      </div>
      <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.2)" }} />
      <select
        style={{
          height: 32,
          borderRadius: "var(--ch-r-md)",
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(255,255,255,0.08)",
          color: "#fff",
          fontFamily: "inherit",
          fontSize: 12.5,
          padding: "0 10px",
        }}
        defaultValue=""
      >
        <option style={{ color: "#000" }}>Aplicar regla de decisión…</option>
      </select>
      <input
        placeholder="Justificación para el lote…"
        style={{
          flex: 1,
          minWidth: 180,
          height: 32,
          borderRadius: "var(--ch-r-md)",
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(255,255,255,0.08)",
          color: "#fff",
          fontFamily: "inherit",
          fontSize: 12.5,
          padding: "0 11px",
        }}
      />
      <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
        <button type="button" className="ch-btn ch-btn-sm" style={{ background: "transparent", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.25)" }} onClick={onClear}>
          Cancelar
        </button>
        <button type="button" className="ch-btn ch-btn-primary ch-btn-sm" onClick={onApply}>
          <Zap className="h-3.5 w-3.5" aria-hidden />
          Aplicar a {n}
        </button>
      </div>
    </div>
  );
}
