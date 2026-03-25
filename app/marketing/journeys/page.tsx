"use client";

/**
 * Journeys — same-origin GET/POST /api/marketing/journeys (X-Tenant-ID).
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  GitBranch,
  Loader2,
  Pause,
  Play,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  Copy,
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { useTenant } from "@/contexts/TenantContext";
import {
  fetchMarketingJourneys,
  fetchMarketingJourneyById,
  createMarketingJourney,
  activateMarketingJourney,
  pauseMarketingJourney,
  deleteMarketingJourney,
} from "@/lib/api/marketing";

function rowId(r: Record<string, unknown>): string {
  return String(r.id ?? "");
}

function rowUpdated(r: Record<string, unknown>): string {
  const u = r.updated_at;
  if (typeof u === "string" && u) {
    try {
      return new Date(u).toLocaleString();
    } catch {
      return u;
    }
  }
  return "—";
}

export default function JourneysListPage() {
  const { tenantId } = useTenant();
  const [journeys, setJourneys] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) {
      setJourneys([]);
      setLoading(false);
      setError("Selecciona un tenant.");
      return;
    }
    setLoading(true);
    setError(null);
    const r = await fetchMarketingJourneys(tenantId);
    setJourneys(r.journeys);
    setError(r.error);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onActivate = async (id: string) => {
    if (!tenantId) return;
    setBusyId(id);
    const r = await activateMarketingJourney(tenantId, id);
    setBusyId(null);
    if (!r.ok) {
      setError(r.error ?? "Activate failed");
      return;
    }
    void load();
  };

  const onPause = async (id: string) => {
    if (!tenantId) return;
    setBusyId(id);
    const r = await pauseMarketingJourney(tenantId, id);
    setBusyId(null);
    if (!r.ok) {
      setError(r.error ?? "Pause failed");
      return;
    }
    void load();
  };

  const onDelete = async (id: string) => {
    if (!tenantId || !confirm("¿Archivar este journey?")) return;
    setBusyId(id);
    const r = await deleteMarketingJourney(tenantId, id);
    setBusyId(null);
    if (!r.ok) {
      setError(r.error ?? "Delete failed");
      return;
    }
    void load();
  };

  const onDuplicate = async (id: string) => {
    if (!tenantId) return;
    setBusyId(id);
    const got = await fetchMarketingJourneyById(tenantId, id);
    if (!got.data) {
      setBusyId(null);
      setError(got.error ?? "Could not load journey");
      return;
    }
    const j = got.data;
    const steps = Array.isArray(j.steps) ? j.steps : [];
    const body = {
      name: `${String(j.name ?? "Journey")} (copia)`,
      description: String(j.description ?? ""),
      status: "draft",
      objective: String(j.objective ?? "convert"),
      channel: String(j.channel ?? "email"),
      trigger_type: String(j.trigger_type ?? "manual"),
      segment_id: j.segment_id ?? undefined,
      template_id: j.template_id ?? undefined,
      campaign_id: j.campaign_id ?? undefined,
      steps,
    };
    const created = await createMarketingJourney(tenantId, body);
    setBusyId(null);
    if (!created.ok || !created.data?.id) {
      setError(created.error ?? "Duplicate failed");
      return;
    }
    void load();
  };

  const filtered = journeys.filter((j) => {
    const name = String(j.name ?? "").toLowerCase();
    const desc = String(j.description ?? "").toLowerCase();
    const q = search.toLowerCase();
    const st = String(j.status ?? "draft");
    return (name.includes(q) || desc.includes(q)) && (statusFilter === "all" || st === statusFilter);
  });

  const stats = {
    total: journeys.length,
    active: journeys.filter((j) => j.status === "active").length,
    paused: journeys.filter((j) => j.status === "paused").length,
    draft: journeys.filter((j) => j.status === "draft").length,
  };

  return (
    <div className="ndk-page ndk-fade-in min-h-screen text-white p-6">
      <NavigationBar backHref="/marketing">
        <span className="text-sm text-gray-400">Journeys</span>
      </NavigationBar>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30">
            <GitBranch className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white m-0">Customer Journeys</h1>
            <p className="text-gray-400 text-sm m-0 mt-1">
              Datos persistidos vía <code className="text-gray-500">/api/marketing/journeys</code> ·{" "}
              <code className="text-gray-500">X-Tenant-ID</code>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          <Link
            href="/marketing/journeys/new"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo journey
          </Link>
        </div>
      </div>

      {error ? (
        <GlassCard className="p-4 mb-6 border-amber-500/30 bg-amber-500/5">
          <p className="text-amber-200/90 text-sm m-0">{error}</p>
        </GlassCard>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <GlassCard className="p-4">
          <p className="text-2xl font-bold text-white m-0">{stats.total}</p>
          <p className="text-gray-400 text-xs m-0 mt-1">Total</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-2xl font-bold text-emerald-400 m-0">{stats.active}</p>
          <p className="text-gray-400 text-xs m-0 mt-1">Activos</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-2xl font-bold text-amber-400 m-0">{stats.paused}</p>
          <p className="text-gray-400 text-xs m-0 mt-1">Pausados</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-2xl font-bold text-gray-300 m-0">{stats.draft}</p>
          <p className="text-gray-400 text-xs m-0 mt-1">Borradores</p>
        </GlassCard>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="search"
          placeholder="Buscar por nombre o descripción…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500"
        />
        <div className="flex flex-wrap gap-2">
          {["all", "draft", "active", "paused"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm capitalize ${
                statusFilter === s ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {s === "all" ? "Todos" : s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin mb-2" />
          Cargando journeys…
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-12 text-center border-white/10">
          <GitBranch className="w-14 h-14 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2 m-0">
            {journeys.length === 0 ? "No hay journeys todavía" : "Sin resultados con estos filtros"}
          </h3>
          <p className="text-gray-400 mb-6 m-0">
            Crea un journey con segmento/plantilla opcionales. La ejecución programada no forma parte de este MVP.
          </p>
          {journeys.length === 0 ? (
            <Link
              href="/marketing/journeys/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-medium"
            >
              <Plus className="w-5 h-5" />
              Crear journey
            </Link>
          ) : null}
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((j) => {
            const id = rowId(j);
            if (!id) return null;
            const st = String(j.status ?? "draft");
            return (
              <GlassCard key={id} className="p-5 border-white/10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white m-0 truncate">{String(j.name ?? "—")}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">{st}</span>
                    </div>
                    <p className="text-sm text-gray-400 m-0 line-clamp-2">{String(j.description ?? "")}</p>
                    <dl className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-gray-500">
                      <div>
                        <dt className="text-gray-600">Objetivo</dt>
                        <dd className="text-gray-300 m-0">{String(j.objective ?? "—")}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">Canal</dt>
                        <dd className="text-gray-300 m-0">{String(j.channel ?? "—")}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">Trigger</dt>
                        <dd className="text-gray-300 m-0">{String(j.trigger_type ?? "—")}</dd>
                      </div>
                      {j.segment_id ? (
                        <div>
                          <dt className="text-gray-600">Segmento</dt>
                          <dd className="text-gray-300 m-0 font-mono truncate">{String(j.segment_id)}</dd>
                        </div>
                      ) : null}
                      {j.template_id ? (
                        <div>
                          <dt className="text-gray-600">Plantilla</dt>
                          <dd className="text-gray-300 m-0 font-mono truncate">{String(j.template_id)}</dd>
                        </div>
                      ) : null}
                      {j.campaign_id ? (
                        <div>
                          <dt className="text-gray-600">Campaña</dt>
                          <dd className="text-gray-300 m-0 font-mono truncate">{String(j.campaign_id)}</dd>
                        </div>
                      ) : null}
                      <div className="col-span-2 sm:col-span-3">
                        <dt className="text-gray-600">Actualizado</dt>
                        <dd className="text-gray-300 m-0">{rowUpdated(j)}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {st === "active" ? (
                      <button
                        type="button"
                        disabled={busyId === id}
                        onClick={() => void onPause(id)}
                        className="p-2 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                        title="Pausar"
                      >
                        {busyId === id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Pause className="w-5 h-5" />}
                      </button>
                    ) : st !== "archived" ? (
                      <button
                        type="button"
                        disabled={busyId === id}
                        onClick={() => void onActivate(id)}
                        className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                        title="Activar"
                      >
                        {busyId === id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={busyId === id}
                      onClick={() => void onDuplicate(id)}
                      className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10"
                      title="Duplicar"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <Link
                      href={`/marketing/journeys/${encodeURIComponent(id)}`}
                      className="p-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 inline-flex"
                      title="Ver / editar"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <button
                      type="button"
                      disabled={busyId === id}
                      onClick={() => void onDelete(id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      title="Archivar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
