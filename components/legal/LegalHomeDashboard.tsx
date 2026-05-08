"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, Bot, Search, ShieldCheck, Users } from "lucide-react";
import {
  useLegalEffectiveTenantId,
  useLegalAgents,
  useLegalAuditTrail,
  useLegalHealth,
  useKnowledgePackStatus,
} from "@/hooks/useLegal";
import { trackEvent } from "@/lib/legal/telemetry";
import type { AuditTrailEntry } from "@/types/legal";
import { LegalMetricCard } from "@/components/legal/LegalMetricCard";
import { LegalAgentCard } from "@/components/legal/LegalAgentCard";
import { LegalEmptyState } from "@/components/legal/LegalEmptyState";
import { LegalErrorState } from "@/components/legal/LegalErrorState";
import { LegalLoadingSkeleton } from "@/components/legal/LegalLoadingSkeleton";
import { LegalTenantBadge } from "@/components/legal/LegalTenantBadge";
import { LegalStatusBadge } from "@/components/legal/LegalStatusBadge";
import { LEGAL_API_VERSION, LEGAL_API_VALIDATED_COMMIT } from "@/types/legal";

function formatAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const d = Date.now() - t;
  const m = Math.floor(d / 60000);
  if (m < 1) return "hace instantes";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 48) return `hace ${h} h`;
  return new Date(iso).toLocaleString("es-DO");
}

function entry24h(e: AuditTrailEntry): boolean {
  const t = new Date(e.timestamp).getTime();
  return Date.now() - t <= 24 * 60 * 60 * 1000;
}

export default function LegalHomeDashboard() {
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const health = useLegalHealth(effectiveTenantId);
  const agents = useLegalAgents(effectiveTenantId);
  const pack = useKnowledgePackStatus(effectiveTenantId);
  const audit = useLegalAuditTrail(effectiveTenantId, undefined, 100);

  const recent = useMemo(() => (audit.entries ?? []).slice(0, 5), [audit.entries]);
  const count24h = useMemo(() => (audit.entries ?? []).filter(entry24h).length, [audit.entries]);

  const [agentSearch, setAgentSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(agents.agents.map((a) => a.category));
    return Array.from(cats).sort();
  }, [agents.agents]);

  const filteredAgents = useMemo(() => {
    const q = agentSearch.toLowerCase().trim();
    return agents.agents.filter((a) => {
      if (categoryFilter && a.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        (a.description ?? "").toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.agent_id.toLowerCase().includes(q)
      );
    });
  }, [agents.agents, agentSearch, categoryFilter]);

  useEffect(() => {
    if (effectiveTenantId) {
      trackEvent("legal_page_view", { page: "home", tenant_id: effectiveTenantId });
    }
  }, [effectiveTenantId]);

  if (!tenantHydrated) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <LegalLoadingSkeleton key={i} variant="card" />
        ))}
      </div>
    );
  }

  if (tenantError || !effectiveTenantId) {
    return (
      <LegalErrorState
        message={tenantError || "Tenant no disponible. Seleccione un tenant en el selector global."}
      />
    );
  }

  const packHash = pack.data?.pack_hash;
  const packHashShort = packHash && packHash.length > 8 ? `${packHash.slice(0, 8)}…` : packHash || "No disponible";

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Legal Intelligence Core
          </h1>
          <p className="mt-1 max-w-2xl text-slate-600 dark:text-slate-400">
            Análisis legal con IA, RAG y auditoría para compliance bancario — sin datos simulados.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LegalTenantBadge tenantId={effectiveTenantId} />
          <LegalStatusBadge health={health.data} loading={health.loading} />
        </div>
      </header>

      {(health.error || agents.error || pack.error || audit.error) && (
        <LegalErrorState
          message={[health.error, agents.error, pack.error, audit.error].filter(Boolean).join(" · ")}
          onRetry={() => {
            void health.refetch();
            void agents.refetch();
            void pack.refetch();
            void audit.refetch();
          }}
        />
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <LegalMetricCard
          title="Agentes legales activos"
          value={agents.loading ? "…" : agents.agents.length}
          subtitle="Conectados al Knowledge Pack RD"
          icon={<Users className="h-8 w-8" />}
          loading={agents.loading}
        />
        <LegalMetricCard
          title="Knowledge Pack"
          value={
            pack.loading ? (
              "…"
            ) : pack.data?.status ? (
              pack.data.status
            ) : (
              <span className="text-lg">No disponible</span>
            )
          }
          subtitle={
            <>
              Hash: {packHashShort}
              <br />
              {pack.data?.leyes_cargadas != null ? `${pack.data.leyes_cargadas} leyes` : "Leyes: pendiente"} ·{" "}
              {pack.data?.articulos_cargados != null
                ? `${pack.data.articulos_cargados} artículos`
                : "Artículos: pendiente"}
            </>
          }
          icon={<ShieldCheck className="h-8 w-8" />}
          loading={pack.loading}
        />
        <LegalMetricCard
          title="Consultas últimas 24h"
          value={audit.loading ? "…" : count24h}
          subtitle="Basado en audit trail del core"
          icon={<Activity className="h-8 w-8" />}
          loading={audit.loading}
        />
        <LegalMetricCard
          title="Estado del sistema"
          value={
            health.loading ? (
              "…"
            ) : health.data?.status ? (
              health.data.status
            ) : (
              <span className="text-lg">No disponible</span>
            )
          }
          subtitle={
            health.data?.uptime_seconds != null
              ? `Uptime aprox.: ${Math.floor(health.data.uptime_seconds)}s`
              : "Última verificación en vivo"
          }
          icon={<Bot className="h-8 w-8" />}
          loading={health.loading}
        />
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Agentes disponibles
            {!agents.loading && (
              <span className="ml-2 text-sm font-normal text-slate-500">({filteredAgents.length})</span>
            )}
          </h2>
          {!agents.loading && agents.agents.length > 0 && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                type="text"
                placeholder="Buscar agente..."
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900 sm:w-64"
              />
            </div>
          )}
        </div>
        {!agents.loading && categories.length > 1 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryFilter(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${categoryFilter === null ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${categoryFilter === cat ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
        {agents.loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <LegalLoadingSkeleton key={i} variant="card" />
            ))}
          </div>
        ) : agents.agents.length === 0 ? (
          <LegalEmptyState
            title="Sin agentes publicados"
            description="El backend no devolvió agentes para este tenant o aún no hay catálogo."
            action={
              <Link href="/agents" className="text-violet-400 underline underline-offset-2 hover:text-violet-300">
                Ver centro de agentes
              </Link>
            }
          />
        ) : filteredAgents.length === 0 ? (
          <LegalEmptyState
            title="Sin resultados"
            description={`No hay agentes que coincidan con "${agentSearch}"${categoryFilter ? ` en ${categoryFilter}` : ""}.`}
            action={
              <button
                type="button"
                onClick={() => { setAgentSearch(""); setCategoryFilter(null); }}
                className="text-blue-600 underline dark:text-blue-400"
              >
                Limpiar filtros
              </button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAgents.map((a) => (
              <LegalAgentCard key={a.agent_id} agent={a} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Actividad reciente
        </h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Últimas ejecuciones registradas en audit trail</p>
        {audit.loading ? (
          <LegalLoadingSkeleton variant="row" rows={5} />
        ) : recent.length === 0 ? (
          <LegalEmptyState
            title="No hay consultas recientes"
            description="Ejecute una consulta en Research para generar trazas auditables."
            action={
              <Link
                href="/legal/research"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Ir a Research
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {recent.map((e) => (
              <li key={e.request_id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="font-mono text-xs text-slate-500">{e.agent_id}</span>
                <span className="text-slate-600 dark:text-slate-400">{formatAgo(e.timestamp)}</span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{e.status || "—"}</span>
                <span className="text-slate-500">
                  citas: {e.output_metadata?.citations_count ?? "—"} · {e.latency_total_ms ?? "?"}ms
                </span>
                <Link
                  href={`/legal/audit?request_id=${encodeURIComponent(e.request_id)}`}
                  className="ml-auto text-blue-600 hover:underline dark:text-blue-400"
                >
                  Ver en auditoría
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Salud del sistema
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {["knowledge_pack_loaded", "rag_orchestrator_ready", "llm_provider_available", "audit_logger_writable"].map(
            (key) => {
              const v = health.data?.checks?.[key];
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                >
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{key}</span>
                  <span className="text-sm">
                    {v === undefined ? (
                      <span className="text-slate-400">No disponible</span>
                    ) : v ? (
                      <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">✗</span>
                    )}
                  </span>
                </div>
              );
            }
          )}
        </div>
      </section>

      <footer className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
        <p>
          API {LEGAL_API_VERSION} · commit backend ref. {LEGAL_API_VALIDATED_COMMIT} · Control anti-alucinación
          activo a nivel de políticas del core (no métrica % inventada).
        </p>
        {packHash && (
          <p className="mt-2 font-mono break-all">
            Pack hash: {packHash}{" "}
            <button
              type="button"
              className="text-blue-600 underline dark:text-blue-400"
              aria-label="Copiar pack hash completo"
              onClick={() => void navigator.clipboard.writeText(packHash)}
            >
              Copiar
            </button>
          </p>
        )}
        <Link href="/legal/audit" className="mt-2 inline-block text-blue-600 hover:underline dark:text-blue-400">
          Ir a audit trail →
        </Link>
      </footer>
    </div>
  );
}
