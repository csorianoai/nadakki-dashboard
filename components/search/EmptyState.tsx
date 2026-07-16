"use client";

import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function openConcierge() {
  window.dispatchEvent(new CustomEvent("nadakki:concierge:open"));
}

export function EmptyState({
  onClearFilters,
}: {
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-r border border-dashed border-nk-border bg-nk-surface px-6 py-14 text-center">
      <SearchX className="h-16 w-16 text-nk-fg-subtle" strokeWidth={1.4} aria-hidden />
      <h2 className="mt-4 font-manrope text-xl font-bold text-nk-fg">
        No encontramos vehículos con esos criterios
      </h2>
      <p className="mt-2 max-w-md text-sm text-nk-fg-muted">
        Prueba ajustando los filtros o preguntando al Concierge
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button variant="brand" onClick={onClearFilters}>
          Limpiar filtros
        </Button>
        <Button variant="outline" onClick={openConcierge}>
          Preguntar al Concierge
        </Button>
      </div>
    </div>
  );
}
