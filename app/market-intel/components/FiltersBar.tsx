"use client";

import type { Dispatch, SetStateAction } from "react";
import { ICN, Ic } from "./Icons";
import type { MeeFilters } from "../lib/types";

interface FiltersBarProps {
  filters: MeeFilters;
  setFilters: Dispatch<SetStateAction<MeeFilters>>;
}

export function FiltersBar({ filters, setFilters }: FiltersBarProps) {
  const seg = (key: keyof MeeFilters, opts: Array<{ v: MeeFilters[typeof key]; l: string }>) => (
    <div className="seg" role="group" aria-label={key}>
      {opts.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          data-on={filters[key] === o.v}
          onClick={() => setFilters((f) => ({ ...f, [key]: o.v }))}
        >
          {o.l}
        </button>
      ))}
    </div>
  );

  const hasActiveFilters =
    filters.segment !== "all" || filters.confidence !== "all" || filters.tier !== "all";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
        padding: "10px 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="eyebrow">Segmento</span>
        {seg("segment", [
          { v: "all", l: "Todos" },
          { v: "usados", l: "Usados" },
          { v: "nuevos", l: "Nuevos" },
          { v: "comercial", l: "Comercial" },
        ])}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="eyebrow">Confianza</span>
        {seg("confidence", [
          { v: "all", l: "Toda" },
          { v: "alto", l: "Alta" },
          { v: "medio", l: "Media" },
          { v: "bajo", l: "Baja" },
        ])}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="eyebrow">Tier</span>
        {seg("tier", [
          { v: "all", l: "Todos" },
          { v: "Tier1", l: "T1" },
          { v: "Tier2", l: "T2" },
          { v: "Tier3", l: "T3" },
        ])}
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        {hasActiveFilters ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() =>
              setFilters({ segment: "all", confidence: "all", tier: "all" })
            }
          >
            <Ic d={ICN.x} s={12} />
            Limpiar
          </button>
        ) : null}
      </div>
    </div>
  );
}
