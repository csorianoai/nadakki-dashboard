"use client";

import { useState } from "react";
import {
  Users,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { motion } from "@/lib/motion-stub";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { useLeads, useTransitionLead } from "@/lib/autos-portal/hooks";
import type { Lead, LeadStatus } from "@/types/autos";

const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; color: string; bg: string }
> = {
  new: { label: "Nuevo", color: "text-blue-400", bg: "bg-blue-500/20" },
  contacted: {
    label: "Contactado",
    color: "text-cyan-400",
    bg: "bg-cyan-500/20",
  },
  qualified: {
    label: "Calificado",
    color: "text-green-400",
    bg: "bg-green-500/20",
  },
  negotiating: {
    label: "Negociando",
    color: "text-yellow-400",
    bg: "bg-yellow-500/20",
  },
  won: { label: "Ganado", color: "text-emerald-400", bg: "bg-emerald-500/20" },
  lost: { label: "Perdido", color: "text-red-400", bg: "bg-red-500/20" },
  archived: {
    label: "Archivado",
    color: "text-gray-400",
    bg: "bg-gray-500/20",
  },
};

const FILTER_STATUSES: Array<{ value: string; label: string }> = [
  { value: "", label: "Todos" },
  { value: "new", label: "Nuevos" },
  { value: "contacted", label: "Contactados" },
  { value: "qualified", label: "Calificados" },
  { value: "negotiating", label: "Negociando" },
  { value: "won", label: "Ganados" },
  { value: "lost", label: "Perdidos" },
];

export default function LeadsPage() {
  const { tenantId } = useTenant();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // TODO: dealerId should come from the current user's context
  const dealerId = "current-dealer";

  const { data, isLoading, isError, refetch } = useLeads(
    tenantId ?? "",
    dealerId,
    { status: statusFilter || undefined, page },
  );

  const transitionMutation = useTransitionLead(tenantId ?? "", dealerId);

  return (
    <div className="ndk-page ndk-fade-in p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
            <Users className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Leads</h1>
            <p className="text-gray-400">
              Gestión de prospectos y pipeline de ventas
            </p>
          </div>
        </div>
      </motion.div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTER_STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => {
              setStatusFilter(s.value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === s.value
                ? "bg-blue-600 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-white/5 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center py-12">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 mb-4">Error al cargar leads</p>
          <button
            onClick={() => void refetch()}
            className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Lead list */}
      {data && (
        <div className="space-y-3">
          {data.leads.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400">No hay leads con este filtro</p>
            </div>
          ) : (
            data.leads.map((lead: Lead) => {
              const statusCfg =
                STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-white font-medium">
                          {lead.buyer_name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${statusCfg.bg} ${statusCfg.color}`}
                        >
                          {statusCfg.label}
                        </span>
                        {lead.priority === "urgent" && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">
                            Urgente
                          </span>
                        )}
                        {lead.finance_interested && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400">
                            Financiamiento
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        {lead.buyer_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {lead.buyer_phone}
                          </span>
                        )}
                        {lead.buyer_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {lead.buyer_email}
                          </span>
                        )}
                        {lead.created_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(lead.created_at).toLocaleDateString(
                              "es-DO",
                            )}
                          </span>
                        )}
                        <span className="text-gray-500">
                          Fuente: {lead.source}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
