"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  CheckCircle2,
  Lock,
  AlertTriangle,
  Clock,
  Play,
  Eye,
  Loader2,
  ChevronRight,
  Zap,
} from "lucide-react";
import { postGoogleAdsPreflight, type GoogleAdsPreflightResult } from "@/lib/api/googleAdsPreflight";
import PreflightResultModal from "@/components/preflight/PreflightResultModal";
import { useTenant } from "@/contexts/TenantContext";

// ── Types ────────────────────────────────────────────────
type ModuleStatus = "completed" | "ready" | "blocked" | "in_progress" | "not_ready";

type GoogleAdsModuleStep = {
  id: string;
  title: string;
  description: string;
  status: ModuleStatus;
  dependencies: string[];
  blockedReason?: string;
  lastRunAt?: string | null;
  score?: number | null;
  actionKey: string;
};

const INITIAL_MODULES: GoogleAdsModuleStep[] = [
  {
    id: "m01",
    title: "Platform Fundamentals",
    description: "Entender la plataforma y métricas clave",
    status: "completed",
    dependencies: [],
    lastRunAt: "2026-04-10T10:00:00Z",
    score: 92,
    actionKey: "google_ads_m01_fundamentals",
  },
  {
    id: "m02",
    title: "Account Structure",
    description: "Jerarquía de cuenta y campaña",
    status: "completed",
    dependencies: ["m01"],
    lastRunAt: "2026-04-11T10:00:00Z",
    score: 88,
    actionKey: "google_ads_m02_account_structure",
  },
  {
    id: "m03",
    title: "Keyword Research",
    description: "Investigación de palabras clave y match types",
    status: "ready",
    dependencies: ["m02"],
    actionKey: "google_ads_m03_keyword_research",
  },
  {
    id: "m04",
    title: "Negative Keywords",
    description: "Limpieza de search terms y listas negativas",
    status: "blocked",
    dependencies: ["m03"],
    blockedReason: "Requiere completar M03 primero",
    actionKey: "google_ads_m04_negative_keywords",
  },
  {
    id: "m05",
    title: "Quality Score & Ad Rank",
    description: "Diagnóstico de calidad y ad rank",
    status: "blocked",
    dependencies: ["m03"],
    blockedReason: "Requiere completar M03 primero",
    actionKey: "google_ads_m05_quality_score",
  },
  {
    id: "m06",
    title: "Smart Bidding",
    description: "Estrategias de puja automática",
    status: "blocked",
    dependencies: ["m05"],
    blockedReason: "Requiere completar M05 primero",
    actionKey: "google_ads_m06_smart_bidding",
  },
  {
    id: "m07",
    title: "RSA Ad Copy",
    description: "Creativos responsivos y ad strength",
    status: "ready",
    dependencies: ["m02"],
    actionKey: "google_ads_m07_rsa_copy",
  },
  {
    id: "m08",
    title: "Extensions & Assets",
    description: "Extensiones de anuncio y activos",
    status: "ready",
    dependencies: ["m02"],
    actionKey: "google_ads_m08_extensions",
  },
  {
    id: "m09",
    title: "Audiences",
    description: "Segmentación y señales de audiencia",
    status: "blocked",
    dependencies: ["m03"],
    blockedReason: "Requiere completar M03 primero",
    actionKey: "google_ads_m09_audiences",
  },
  {
    id: "m10",
    title: "Performance Max",
    description: "Campañas PMax y asset groups",
    status: "blocked",
    dependencies: ["m13"],
    blockedReason: "Requiere configurar Conversion Tracking (M13)",
    actionKey: "google_ads_m10_pmax",
  },
  {
    id: "m11",
    title: "Shopping Campaigns",
    description: "Shopping estándar y Merchant Center",
    status: "blocked",
    dependencies: ["m13"],
    blockedReason: "Requiere configurar Conversion Tracking (M13)",
    actionKey: "google_ads_m11_shopping",
  },
  {
    id: "m12",
    title: "Demand Gen",
    description: "Campañas de generación de demanda",
    status: "blocked",
    dependencies: ["m13"],
    blockedReason: "Requiere configurar Conversion Tracking (M13)",
    actionKey: "google_ads_m12_demand_gen",
  },
  {
    id: "m13",
    title: "Conversion Tracking",
    description: "Tracking y enhanced conversions",
    status: "not_ready",
    blockedReason: "Google Tag no detectado en la cuenta",
    dependencies: ["m02"],
    actionKey: "google_ads_m13_conversion_tracking",
  },
  {
    id: "m14",
    title: "Attribution & GA4",
    description: "Modelo de atribución y consent mode v2",
    status: "blocked",
    dependencies: ["m13"],
    blockedReason: "Requiere configurar Conversion Tracking (M13)",
    actionKey: "google_ads_m14_attribution",
  },
  {
    id: "m15",
    title: "API Primer",
    description: "Google Ads API y operaciones programáticas",
    status: "ready",
    dependencies: [],
    actionKey: "google_ads_m15_api",
  },
];

async function getModules(): Promise<GoogleAdsModuleStep[]> {
  // TODO: swap for real endpoint when ready:
  // GET /api/v1/google-ads/modules/status
  // const res = await fetch("/api/v1/google-ads/modules/status", {
  //   headers: { "X-Tenant-ID": tenantId }
  // })
  // if (res.ok) return res.json()
  return INITIAL_MODULES;
}

function notReadyFallback(
  actionKey: string,
  tenantId: string,
  detail: string
): GoogleAdsPreflightResult {
  return {
    action_key: actionKey,
    tenant_id: tenantId,
    status: "not_ready",
    reasons: ["Preflight service unavailable"],
    required_fixes: ["Verificar conectividad del backend"],
    approval_required: false,
    next_step: detail,
  };
}

// ── Helpers ──────────────────────────────────────────────
function progressCount(modules: GoogleAdsModuleStep[]) {
  return modules.filter((m) => m.status === "completed").length;
}

function readinessScore(modules: GoogleAdsModuleStep[]) {
  const completed = modules.filter((m) => m.status === "completed").length;
  const ready = modules.filter((m) => m.status === "ready").length;
  return Math.round(((completed * 2 + ready) / (modules.length * 2)) * 100);
}

function relativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "hace segundos";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

// ── Status badge ─────────────────────────────────────────
function ModuleStatusBadge({ status }: { status: ModuleStatus }) {
  const MAP = {
    completed: { label: "Completado", cls: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30" },
    ready: { label: "Listo", cls: "bg-blue-500/20 text-blue-400 ring-blue-500/30" },
    blocked: { label: "Bloqueado", cls: "bg-slate-500/20 text-slate-400 ring-slate-500/30" },
    not_ready: { label: "No listo", cls: "bg-amber-500/20 text-amber-400 ring-amber-500/30" },
    in_progress: { label: "En curso", cls: "bg-indigo-500/20 text-indigo-400 ring-indigo-500/30" },
  };
  const { label, cls } = MAP[status];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ring-1 ${cls}`}>{label}</span>
  );
}

function StepIcon({ status }: { status: ModuleStatus }) {
  if (status === "completed") return <CheckCircle2 size={18} className="text-emerald-400" />;
  if (status === "ready") return <Play size={18} className="text-blue-400" />;
  if (status === "blocked") return <Lock size={18} className="text-slate-500" />;
  if (status === "not_ready") return <AlertTriangle size={18} className="text-amber-400" />;
  if (status === "in_progress") return <Loader2 size={18} className="text-indigo-400 animate-spin" />;
  return <Clock size={18} className="text-slate-500" />;
}

// ── Module card ──────────────────────────────────────────
interface CardProps {
  module: GoogleAdsModuleStep;
  isRunning: boolean;
  onRun: (m: GoogleAdsModuleStep) => void;
}

function ModuleCard({ module, isRunning, onRun }: CardProps) {
  const borderColor =
    module.status === "completed"
      ? "border-emerald-500/20"
      : module.status === "ready"
        ? "border-blue-500/20"
        : module.status === "not_ready"
          ? "border-amber-500/20"
          : "border-slate-700/40";

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-200 ${borderColor} ${
        module.status === "ready" ? "hover:border-blue-400/40 hover:bg-blue-500/5" : ""
      } ${module.status === "blocked" ? "opacity-60" : ""}`}
      style={{ backgroundColor: "rgba(15, 20, 40, 0.6)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-0.5 shrink-0">
            <StepIcon status={module.status} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono text-slate-500 uppercase">{module.id.toUpperCase()}</span>
              <ModuleStatusBadge status={module.status} />
              {module.score != null && (
                <span className="text-xs text-slate-400">
                  Score: <span className="text-indigo-400 font-medium">{module.score}</span>
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-100 mb-0.5">{module.title}</p>
            <p className="text-xs text-slate-500 mb-2">{module.description}</p>
            {module.blockedReason && (
              <p className="text-xs text-amber-400/80 flex items-center gap-1">
                <Lock size={10} />
                {module.blockedReason}
              </p>
            )}
            {module.dependencies.length > 0 && module.status !== "completed" && (
              <p className="text-xs text-slate-600 mt-1">
                Requiere: {module.dependencies.map((d) => d.toUpperCase()).join(", ")}
              </p>
            )}
            {module.lastRunAt && (
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                <Clock size={10} />
                {relativeTime(module.lastRunAt)}
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0">
          {module.status === "completed" && (
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-600/50 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors flex items-center gap-1"
            >
              <Eye size={12} /> Ver
            </button>
          )}
          {module.status === "ready" && (
            <button
              type="button"
              onClick={() => onRun(module)}
              disabled={isRunning}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Verificando...
                </>
              ) : (
                <>
                  <Play size={12} /> Ejecutar
                </>
              )}
            </button>
          )}
          {module.status === "not_ready" && (
            <button
              type="button"
              onClick={() => onRun(module)}
              disabled={isRunning}
              className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <AlertTriangle size={12} /> Ver estado
            </button>
          )}
          {module.status === "in_progress" && (
            <span className="text-xs text-indigo-400 flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" /> Ejecutando…
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────
export default function GoogleAdsExecutionFlow() {
  const { tenantId } = useTenant();
  const safeTenantId = tenantId?.trim() || "sf-rentals-nadaki-excursions";

  const [modules, setModules] = useState<GoogleAdsModuleStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);
  const runningRef = useRef<Set<string>>(new Set());
  const [preflightResult, setPreflightResult] = useState<GoogleAdsPreflightResult | null>(null);
  const [pendingModule, setPendingModule] = useState<GoogleAdsModuleStep | null>(null);

  useEffect(() => {
    let alive = true;
    getModules().then((data) => {
      if (!alive) return;
      setModules(data);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const handleRun = useCallback(
    async (module: GoogleAdsModuleStep) => {
      if (runningRef.current.has(module.id)) return;
      runningRef.current.add(module.id);
      setRunningId(module.id);

      try {
        const pfRes = await postGoogleAdsPreflight(safeTenantId, module.actionKey, { module_id: module.id });
        if (pfRes.ok === false) {
          setPreflightResult(
            notReadyFallback(
              module.actionKey,
              safeTenantId,
              pfRes.error || "Revisa que el backend esté activo en Render"
            )
          );
          setPendingModule(module);
          return;
        }
        setPreflightResult(pfRes.data);
        setPendingModule(module);
      } catch {
        setPreflightResult(
          notReadyFallback(module.actionKey, safeTenantId, "Revisa que el backend esté activo en Render")
        );
        setPendingModule(module);
      } finally {
        runningRef.current.delete(module.id);
        setRunningId(null);
      }
    },
    [safeTenantId]
  );

  const handleContinue = useCallback(() => {
    if (!pendingModule) return;
    if (
      !preflightResult ||
      (preflightResult.status !== "allowed" && preflightResult.status !== "proposal_only")
    ) {
      return;
    }
    setModules((prev) =>
      prev.map((x) => (x.id === pendingModule.id ? { ...x, status: "in_progress" as ModuleStatus } : x))
    );
    const id = pendingModule.id;
    setTimeout(() => {
      setModules((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                status: "completed" as ModuleStatus,
                lastRunAt: new Date().toISOString(),
                score: Math.floor(Math.random() * 20) + 78,
              }
            : m
        )
      );
    }, 2000);
  }, [pendingModule, preflightResult]);

  const completed = progressCount(modules);
  const readiness = readinessScore(modules);

  const completedModules = modules.filter((m) => m.status === "completed");
  const activeModules = modules.filter(
    (m) => m.status === "ready" || m.status === "in_progress" || m.status === "not_ready"
  );
  const blockedModules = modules.filter((m) => m.status === "blocked");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-slate-500" />
        <span className="ml-3 text-sm text-slate-500">Cargando módulos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className="rounded-xl border border-slate-700/40 p-5"
        style={{ backgroundColor: "rgba(15, 20, 40, 0.8)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Zap size={16} className="text-indigo-400" />
              Flujo de Ejecución Google Ads
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Progreso guiado M01–M15 · Pre-flight automático antes de ejecutar
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-100">
                {completed}
                <span className="text-slate-500 text-sm font-normal"> / {modules.length}</span>
              </p>
              <p className="text-xs text-slate-500">completados</p>
            </div>
            <div className="text-center">
              <p
                className={`text-2xl font-bold ${
                  readiness >= 70 ? "text-emerald-400" : readiness >= 40 ? "text-amber-400" : "text-rose-400"
                }`}
              >
                {readiness}%
              </p>
              <p className="text-xs text-slate-500">preparación</p>
            </div>
          </div>
        </div>
        <div className="mt-4 h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-400 transition-all duration-500"
            style={{ width: `${(completed / modules.length) * 100}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {[
            { cls: "bg-emerald-500/20 text-emerald-400", label: "Completado" },
            { cls: "bg-blue-500/20 text-blue-400", label: "Listo para ejecutar" },
            { cls: "bg-amber-500/20 text-amber-400", label: "Configuración pendiente" },
            { cls: "bg-slate-500/20 text-slate-400", label: "Bloqueado" },
          ].map(({ cls, label }) => (
            <span key={label} className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {activeModules.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <ChevronRight size={14} className="text-blue-400" />
            Disponibles ahora
          </h3>
          <div className="grid gap-3">
            {activeModules.map((m) => (
              <ModuleCard key={m.id} module={m} isRunning={runningId === m.id} onRun={handleRun} />
            ))}
          </div>
        </div>
      )}

      {completedModules.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400" />
            Completados
          </h3>
          <div className="grid gap-3">
            {completedModules.map((m) => (
              <ModuleCard key={m.id} module={m} isRunning={false} onRun={handleRun} />
            ))}
          </div>
        </div>
      )}

      {blockedModules.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Lock size={14} className="text-slate-500" />
            Pendientes de desbloquear
          </h3>
          <div className="grid gap-3">
            {blockedModules.map((m) => (
              <ModuleCard key={m.id} module={m} isRunning={false} onRun={handleRun} />
            ))}
          </div>
        </div>
      )}

      <PreflightResultModal
        result={preflightResult}
        onClose={() => {
          setPreflightResult(null);
          setPendingModule(null);
        }}
        onContinue={handleContinue}
      />
    </div>
  );
}
