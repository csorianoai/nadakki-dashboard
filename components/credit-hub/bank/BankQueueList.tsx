"use client";

import { useMemo, useState } from "react";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";
import { BankApplicationCard } from "./BankApplicationCard";
import { BankBulkActionsBar } from "./BankBulkActionsBar";
import { BankQueueFilters } from "./BankQueueFilters";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";

export function BankQueueList({ applications, loading, error }: { applications: BankQueueItem[]; loading?: boolean; error?: unknown }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return applications;
    return applications.filter((item) =>
      [item.application_id, item.applicant_name, item.dealer_name, item.vehicle_label].some((value) => String(value || "").toLowerCase().includes(q))
    );
  }, [applications, search]);

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-forge-surface" />)}</div>;
  }
  if (error) {
    return <ForgeCard className="py-10 text-center text-forge-danger">No se pudo cargar la bandeja bancaria.</ForgeCard>;
  }

  return (
    <div className="space-y-4">
      <BankQueueFilters search={search} onSearch={setSearch} />
      <label className="flex items-center gap-2 text-sm text-forge-text-muted">
        <input
          type="checkbox"
          checked={filtered.length > 0 && selected.length === filtered.length}
          onChange={(event) => setSelected(event.target.checked ? filtered.map((item) => item.application_id) : [])}
        />
        Seleccionar todas las solicitudes visibles
      </label>
      {filtered.length === 0 ? (
        <ForgeCard className="py-12 text-center text-forge-text-muted">No hay solicitudes pendientes para este filtro.</ForgeCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((application) => (
            <BankApplicationCard
              key={application.application_id}
              application={application}
              selected={selected.includes(application.application_id)}
              onSelect={(checked) => setSelected((current) => checked ? [...current, application.application_id] : current.filter((id) => id !== application.application_id))}
            />
          ))}
        </div>
      )}
      <BankBulkActionsBar selectedIds={selected} onDone={() => setSelected([])} />
    </div>
  );
}
