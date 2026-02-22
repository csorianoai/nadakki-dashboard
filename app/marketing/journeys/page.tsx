"use client";

import { useState, useEffect } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Plus, GitBranch, Play, Pause, Trash2, Copy, Edit, 
  MoreVertical, Users, Target, Clock, TrendingUp,
  Search, Filter, Calendar, CheckCircle, AlertCircle,
  Loader2, Eye, Zap
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com";

interface Journey {
  id: string;
  name: string;
  description: string;
  status: "draft" | "active" | "paused" | "completed";
  nodes: any[];
  connections: any[];
  stats: { contacts: number; completed: number; conversion_rate: number };
  created_at: string;
  updated_at: string;
}

export default function JourneysListPage() {
  const { tenantId } = useTenant();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    fetchJourneys();
  }, []);

  const fetchJourneys = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/journeys?tenant_id=${tenantId}`);
      const data = await res.json();
      setJourneys(data.journeys || []);
    } catch (error) {
      console.error("Error fetching journeys:", error);
      // Fallback to localStorage
      const saved = localStorage.getItem("nadakki_journeys");
      if (saved) {
        setJourneys(JSON.parse(saved));
      }
    }
    setLoading(false);
  };

  const createNewJourney = async () => {
    try {
      const res = await fetch(`${API_URL}/api/journeys?tenant_id=${tenantId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Nuevo Journey", description: "Sin descripcion" })
      });
      const data = await res.json();
      if (data.id) {
        window.location.href = `/marketing/journeys/${data.id}`;
      }
    } catch (error) {
      // Fallback: crear localmente
      const newId = `journey-${Date.now()}`;
      window.location.href = `/marketing/journeys/${newId}?new=true`;
    }
  };

  const toggleJourneyStatus = async (journeyId: string, currentStatus: string) => {
    setActionLoading(journeyId);
    const newStatus = currentStatus === "active" ? "paused" : "active";
    const endpoint = newStatus === "active" ? "activate" : "pause";
    
    try {
      await fetch(`${API_URL}/api/journeys/${journeyId}/${endpoint}?tenant_id=${tenantId}`, {
        method: "POST"
      });
      setJourneys(journeys?.map(j => j.id === journeyId ? { ...j, status: newStatus } : j));
    } catch (error) {
      console.error("Error toggling status:", error);
    }
    setActionLoading(null);
  };

  const duplicateJourney = async (journey: Journey) => {
    setActionLoading(journey.id);
    try {
      const res = await fetch(`${API_URL}/api/journeys?tenant_id=${tenantId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${journey.name} (Copia)`,
          description: journey.description,
          nodes: journey.nodes,
          connections: journey.connections
        })
      });
      const data = await res.json();
      if (data.journey) {
        setJourneys([...journeys, data.journey]);
      }
    } catch (error) {
      console.error("Error duplicating:", error);
    }
    setActionLoading(null);
  };

  const deleteJourney = async (journeyId: string) => {
    setActionLoading(journeyId);
    try {
      await fetch(`${API_URL}/api/journeys/${journeyId}?tenant_id=${tenantId}`, {
        method: "DELETE"
      });
      setJourneys(journeys.filter(j => j.id !== journeyId));
    } catch (error) {
      console.error("Error deleting:", error);
    }
    setActionLoading(null);
    setShowDeleteModal(null);
  };

  const filteredJourneys = journeys.filter(j => {
    const matchesSearch = j.name.toLowerCase().includes(search.toLowerCase()) ||
                         j.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: journeys.length,
    active: journeys.filter(j => j.status === "active").length,
    totalContacts: journeys.reduce((acc, j) => acc + (j.stats?.contacts || 0), 0),
    avgConversion: journeys.length > 0 
      ? (journeys.reduce((acc, j) => acc + (j.stats?.conversion_rate || 0), 0) / journeys.length).toFixed(1)
      : "0"
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400";
      case "paused": return "bg-yellow-500/20 text-yellow-400";
      case "draft": return "bg-gray-500/20 text-gray-400";
      case "completed": return "bg-blue-500/20 text-blue-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Play className="w-3 h-3" />;
      case "paused": return <Pause className="w-3 h-3" />;
      case "draft": return <Edit className="w-3 h-3" />;
      case "completed": return <CheckCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="active" label="Customer Journeys" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30">
              <GitBranch className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Customer Journeys</h1>
              <p className="text-gray-400">Automatiza el ciclo de vida de tus clientes</p>
            </div>
          </div>
          <button
            onClick={createNewJourney}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 rounded-xl text-white font-medium transition-all"
          >
            <Plus className="w-5 h-5" /> Crear Journey
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value={stats.total.toString()} label="Total Journeys" icon={<GitBranch className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
        <StatCard value={stats.active.toString()} label="Activos" icon={<Play className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value={stats.totalContacts.toLocaleString()} label="Contactos en Journeys" icon={<Users className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value={stats.avgConversion + "%"} label="Conversion Promedio" icon={<Target className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar journeys..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "paused", "draft"].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg capitalize transition-all ${
                statusFilter === status
                  ? "bg-purple-500 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {status === "all" ? "Todos" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Journeys List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
          <p className="text-gray-400">Cargando journeys...</p>
        </div>
      ) : filteredJourneys.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <GitBranch className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            {journeys.length === 0 ? "No hay journeys creados" : "No se encontraron resultados"}
          </h3>
          <p className="text-gray-400 mb-6">
            {journeys.length === 0 
              ? "Crea tu primer journey para automatizar la comunicacion con tus clientes"
              : "Intenta con otros filtros de busqueda"}
          </p>
          {journeys.length === 0 && (
            <button
              onClick={createNewJourney}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-medium"
            >
              <Plus className="w-5 h-5" /> Crear mi primer Journey
            </button>
          )}
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {filteredJourneys?.map((journey, i) => (
            <motion.div
              key={journey.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard className="p-5 hover:border-purple-500/30 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 rounded-xl ${
                      journey.status === "active" ? "bg-green-500/20" : 
                      journey.status === "paused" ? "bg-yellow-500/20" : "bg-gray-500/20"
                    }`}>
                      <GitBranch className={`w-6 h-6 ${
                        journey.status === "active" ? "text-green-400" : 
                        journey.status === "paused" ? "text-yellow-400" : "text-gray-400"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                          {journey.name}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${getStatusColor(journey.status)}`}>
                          {getStatusIcon(journey.status)}
                          {journey.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{journey.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" /> {journey.nodes?.length || 0} nodos
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {journey.stats?.contacts?.toLocaleString() || 0} contactos
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" /> {journey.stats?.conversion_rate || 0}% conversion
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(journey.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {journey.status !== "draft" && (
                      <button
                        onClick={() => toggleJourneyStatus(journey.id, journey.status)}
                        disabled={actionLoading === journey.id}
                        className={`p-2 rounded-lg transition-colors ${
                          journey.status === "active"
                            ? "hover:bg-yellow-500/20 text-yellow-400"
                            : "hover:bg-green-500/20 text-green-400"
                        }`}
                        title={journey.status === "active" ? "Pausar" : "Activar"}
                      >
                        {actionLoading === journey.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : journey.status === "active" ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => duplicateJourney(journey)}
                      disabled={actionLoading === journey.id}
                      className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                      title="Duplicar"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <Link
                      href={`/marketing/journeys/${journey.id}`}
                      className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => setShowDeleteModal(journey.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <Link
                      href={`/marketing/journeys/${journey.id}`}
                      className="ml-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> Abrir
                    </Link>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0a0f1c] border border-white/10 rounded-2xl w-full max-w-md p-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-red-500/20">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Eliminar Journey</h3>
                <p className="text-sm text-gray-400">Esta accion no se puede deshacer</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6">
              Â¿Estas seguro de que quieres eliminar este journey? Todos los datos asociados se perderan.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteJourney(showDeleteModal)}
                disabled={actionLoading === showDeleteModal}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium flex items-center gap-2"
              >
                {actionLoading === showDeleteModal ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Eliminar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}


