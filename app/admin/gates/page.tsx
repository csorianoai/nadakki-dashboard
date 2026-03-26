"use client";

import { useState, useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Shield, Database, Award, Rocket, Check, X, RefreshCw, Loader2 } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";

/** Same-origin; proxied via next.config rewrites */
const API_URL = "";

type GateStatus = "PENDING" | "APPROVED" | "REJECTED";

interface GateRow {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  status: GateStatus;
}

const STATUS_COLORS: Record<GateStatus, { bg: string; text: string; border: string }> = {
  PENDING: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/40" },
  APPROVED: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/40" },
  REJECTED: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/40" },
};

function normalizeStatus(s: unknown): GateStatus {
  const u = String(s ?? "").toUpperCase();
  if (u === "APPROVED" || u === "REJECTED" || u === "PENDING") return u;
  return "PENDING";
}

function iconForId(id: string): ReactNode {
  switch (id) {
    case "A":
      return <Shield className="w-8 h-8" />;
    case "B":
      return <Database className="w-8 h-8" />;
    case "C":
      return <Award className="w-8 h-8" />;
    case "D":
      return <Rocket className="w-8 h-8" />;
    default:
      return <Shield className="w-8 h-8" />;
  }
}

export default function AdminGatesPage() {
  const [gates, setGates] = useState<GateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchGates = () => {
    setLoading(true);
    setError(null);
    setActionError(null);
    fetch(`${API_URL}/api/v1/gates`)
      .then(async (r) => {
        if (!r.ok) {
          setGates([]);
          setError(`No se pudieron cargar los gates (${r.status}).`);
          return;
        }
        const data = await r.json().catch(() => null);
        const raw = data?.gates ?? data?.data?.gates ?? data;
        if (!Array.isArray(raw)) {
          setGates([]);
          setError("La respuesta de la API no incluye una lista de gates válida.");
          return;
        }
        const rows: GateRow[] = raw.map((item: Record<string, unknown>) => {
          const id = String(item.id ?? "");
          const name = String(item.name ?? item.id ?? "Gate");
          const description = String(item.description ?? "");
          return {
            id,
            name,
            description,
            icon: iconForId(id),
            status: normalizeStatus(item.status),
          };
        }).filter((g) => g.id.length > 0);
        setGates(rows);
      })
      .catch(() => {
        setGates([]);
        setError("Error de red al cargar gates.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGates();
  }, []);

  const handleAction = (gateId: string, action: "approve" | "reject") => {
    setActionError(null);
    setActioning(gateId);
    const path = action === "approve" ? "approve" : "reject";
    fetch(`${API_URL}/api/v1/gates/${gateId}/${path}`, { method: "POST" })
      .then((r) => {
        if (r.ok) {
          fetchGates();
          return;
        }
        setActionError(`No se pudo aplicar la acción al gate ${gateId} (${r.status}).`);
      })
      .catch(() => {
        setActionError(`No se pudo aplicar la acción al gate ${gateId} (error de red).`);
      })
      .finally(() => setActioning(null));
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/admin">
        <button
          onClick={fetchGates}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Actualizar
        </button>
      </NavigationBar>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white">Gates de Configuración</h1>
        <p className="text-gray-400 mt-1">Aprueba o rechaza los gates antes de producción</p>
      </motion.div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
        </div>
      )}

      {!loading && error && (
        <p className="text-red-400">{error}</p>
      )}
      {!loading && !error && actionError && <p className="text-red-400 mb-4">{actionError}</p>}

      {!loading && !error && gates.length === 0 && (
        <p className="text-gray-400">No hay gates en la API o la lista está vacía.</p>
      )}

      {!loading && !error && gates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gates.map((gate, i) => {
            const colors = STATUS_COLORS[gate.status];
            const isActioning = actioning === gate.id;
            return (
              <motion.div
                key={gate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${colors.bg} border ${colors.border}`}>
                      <div className={colors.text}>{gate.icon}</div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}
                    >
                      {gate.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{gate.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{gate.description || "—"}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(gate.id, "approve")}
                      disabled={isActioning || gate.status === "APPROVED"}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(gate.id, "reject")}
                      disabled={isActioning || gate.status === "REJECTED"}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                      Reject
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
