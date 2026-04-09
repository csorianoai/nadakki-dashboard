"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { CreditDocument } from "@/lib/credit-api";

function statusBadge(status: string): { label: string; className: string } {
  const u = status.toLowerCase();
  if (u === "verified" || u === "verificado") {
    return { label: "Verificado", className: "bg-emerald-500/20 text-emerald-200" };
  }
  if (u === "rejected" || u === "rechazado") {
    return { label: "Rechazado", className: "bg-red-500/20 text-red-200" };
  }
  if (u === "uploaded" || u === "subido") {
    return { label: "Subido", className: "bg-sky-500/20 text-sky-200" };
  }
  return { label: "Pendiente", className: "bg-slate-600/30 text-slate-400" };
}

export interface DocumentListProps {
  documents: CreditDocument[];
  onDelete?: (id: string) => void;
  loading?: boolean;
}

export function DocumentList({
  documents,
  onDelete,
  loading,
}: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-10 border-b border-white/5 bg-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-slate-500 m-0 py-4 text-center">
        No hay documentos subidos aún
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden text-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10 bg-white/5 text-xs text-slate-500 uppercase">
            <th className="px-3 py-2">Tipo</th>
            <th className="px-3 py-2">Categoría</th>
            <th className="px-3 py-2">Fecha</th>
            <th className="px-3 py-2">Estado</th>
            {onDelete ? <th className="px-3 py-2 w-10">Acción</th> : null}
          </tr>
        </thead>
        <tbody>
          {documents.map((d) => {
            const upload = statusBadge(d.upload_status);
            const ver = statusBadge(d.verification_status);
            const show =
              d.verification_status &&
              d.verification_status.toLowerCase() !== "pending"
                ? ver
                : upload;
            return (
              <tr
                key={d.id}
                className="border-b border-white/5 text-slate-300"
              >
                <td className="px-3 py-2">{d.document_type}</td>
                <td className="px-3 py-2 text-slate-400">{d.document_category}</td>
                <td className="px-3 py-2 text-xs text-slate-500">
                  {d.uploaded_at || "—"}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded ${show.className}`}
                  >
                    {show.label}
                  </span>
                </td>
                {onDelete ? (
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      disabled={deletingId === d.id}
                      onClick={() => {
                        setDeletingId(d.id);
                        try {
                          onDelete(d.id);
                        } finally {
                          setDeletingId(null);
                        }
                      }}
                      className="p-1 rounded hover:bg-white/10 text-slate-400 disabled:opacity-40"
                      aria-label="Eliminar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
