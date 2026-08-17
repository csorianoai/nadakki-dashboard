"use client";

import { useMemo, useState } from "react";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";
import { BankApplicationCard } from "./BankApplicationCard";
import { BankBulkActionsBar } from "./BankBulkActionsBar";
import { BankQueueFilters } from "./BankQueueFilters";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";

type MessageFilter = "all" | "awaiting_bank" | "awaiting_dealer";

function getMessageStatusType(application: BankQueueItem): MessageFilter | null {
  if (application.pendiente_respuesta_banco && application.pendiente_respuesta_banco > 0) {
    return "awaiting_bank";
  }
  if (application.last_message_sender === "BANK") {
    return "awaiting_dealer";
  }
  return null;
}

export function BankQueueList({ applications, loading, error }: { applications: BankQueueItem[]; loading?: boolean; error?: unknown }) {
  const [search, setSearch] = useState("");
  const [messageFilter, setMessageFilter] = useState<MessageFilter>("all");
  const [selected, setSelected] = useState<string[]>([]);
  
  const filtered = useMemo(() => {
    let result = applications;

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((item) =>
        [item.application_id, item.applicant_name, item.dealer_name, item.vehicle_label].some((value) => String(value || "").toLowerCase().includes(q))
      );
    }

    // Message status filter
    if (messageFilter !== "all") {
      result = result.filter((item) => {
        const status = getMessageStatusType(item);
        return status === messageFilter;
      });
    }

    return result;
  }, [applications, search, messageFilter]);

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-forge-surface" />)}</div>;
  }
  if (error) {
    return <ForgeCard className="py-10 text-center text-forge-danger">No se pudo cargar la bandeja bancaria.</ForgeCard>;
  }

  return (
    <div className="space-y-4">
      <BankQueueFilters search={search} onSearch={setSearch} />
      
      {/* Message status filter */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ch-text-2)" }}>Estado de mensajes:</span>
        <button
          onClick={() => setMessageFilter("all")}
          style={{
            padding: "4px 12px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            border: messageFilter === "all" ? "1px solid var(--ch-accent)" : "1px solid var(--ch-line)",
            background: messageFilter === "all" ? "var(--ch-accent-soft)" : "transparent",
            color: messageFilter === "all" ? "var(--ch-accent)" : "var(--ch-text-3)",
            cursor: "pointer",
          }}
        >
          Todas
        </button>
        <button
          onClick={() => setMessageFilter("awaiting_bank")}
          style={{
            padding: "4px 12px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            border: messageFilter === "awaiting_bank" ? "1px solid var(--ch-accent)" : "1px solid var(--ch-line)",
            background: messageFilter === "awaiting_bank" ? "var(--ch-accent-soft)" : "transparent",
            color: messageFilter === "awaiting_bank" ? "var(--ch-accent)" : "var(--ch-text-3)",
            cursor: "pointer",
          }}
        >
          Esperando tu respuesta
        </button>
        <button
          onClick={() => setMessageFilter("awaiting_dealer")}
          style={{
            padding: "4px 12px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            border: messageFilter === "awaiting_dealer" ? "1px solid var(--ch-accent)" : "1px solid var(--ch-line)",
            background: messageFilter === "awaiting_dealer" ? "var(--ch-accent-soft)" : "transparent",
            color: messageFilter === "awaiting_dealer" ? "var(--ch-accent)" : "var(--ch-text-3)",
            cursor: "pointer",
          }}
        >
          Esperando al concesionario
        </button>
      </div>

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
