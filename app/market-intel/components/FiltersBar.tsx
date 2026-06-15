"use client";

import type { Dispatch, SetStateAction } from "react";
import { ICN, Ic } from "./Icons";
import type { MeeFilters } from "../lib/types";

interface FiltersBarProps {
  filters: MeeFilters;
  setFilters: Dispatch<SetStateAction<MeeFilters>>;
}

export function countActiveMeeFilters(filters: MeeFilters): number {
  let n = 0;
  if (filters.segment !== "all") n += 1;
  if (filters.confidence !== "all") n += 1;
  if (filters.tier !== "all") n += 1;
  return n;
}

export function FiltersBar({ filters, setFilters }: FiltersBarProps) {
  const activeCount = countActiveMeeFilters(filters);
  const hasActiveFilters = activeCount > 0;

  const seg = (key: keyof MeeFilters, opts: Array<{ v: MeeFilters[typeof key]; l: string }>) => (
    <div className="seg" role="group" aria-label={key}>
      {opts.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          data-on={filters[key] === o.v}
          aria-pressed={filters[key] === o.v}
          onClick={() => setFilters((f) => ({ ...f, [key]: o.v }))}
        >
          {o.l}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mee-filters-bar">
      <div className="mee-filters-bar__lead">
        <span className="eyebrow">Filtros</span>
        {activeCount > 0 ? (
          <span className="chip amber mee-filters-count" aria-label={`${activeCount} filtros activos`}>
            · {activeCount}
          </span>
        ) : null}
      </div>

      <div className="mee-filters-bar__group">
        <span className="eyebrow">Segmento</span>
        {seg("segment", [
          { v: "all", l: "Todos" },
          { v: "usados", l: "Usados" },
          { v: "nuevos", l: "Nuevos" },
          { v: "comercial", l: "Comercial" },
        ])}
      </div>

      <div className="mee-filters-bar__group">
        <span className="eyebrow">Confianza</span>
        {seg("confidence", [
          { v: "all", l: "Toda" },
          { v: "alto", l: "Alta" },
          { v: "medio", l: "Media" },
          { v: "bajo", l: "Baja" },
        ])}
      </div>

      <div className="mee-filters-bar__group">
        <span className="eyebrow">Tier</span>
        {seg("tier", [
          { v: "all", l: "Todos" },
          { v: "Tier1", l: "T1" },
          { v: "Tier2", l: "T2" },
          { v: "Tier3", l: "T3" },
        ])}
      </div>

      <div className="mee-filters-bar__actions">
        {hasActiveFilters ? (
          <button
            type="button"
            className="mee-filters-clear"
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
