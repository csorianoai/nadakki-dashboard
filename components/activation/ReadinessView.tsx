"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { chFetch } from "@/lib/credit-hub/api/client";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

interface ReadinessDimension {
  name: string;
  score: number;
  evidence: string[];
  missing: string[];
}

interface ReadinessResponse {
  account_created: number;
  production_readiness: number;
  ai_optimization: number;
  dimensions: ReadinessDimension[];
}

async function getReadiness(tenantId: string): Promise<ReadinessResponse> {
  return chFetch("/api/v2/institucion/readiness", {
    tenantId,
    actorRole: "bank_admin",
  });
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const percentage = Math.min(100, Math.max(0, score));
  const color = percentage >= 100 ? "bg-green-500" : percentage >= 70 ? "bg-blue-500" : "bg-yellow-500";

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold">{percentage}%</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function DimensionCard({ dimension }: { dimension: ReadinessDimension }) {
  const percentage = Math.min(100, Math.max(0, dimension.score));
  const isComplete = percentage >= 100;
  const hasEvidence = dimension.evidence.length > 0;
  const hasMissing = dimension.missing.length > 0;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium">{dimension.name}</h3>
          <p className="text-sm text-slate-400 mt-1">{percentage}% completo</p>
        </div>
        {isComplete ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : hasMissing ? (
          <AlertCircle className="w-5 h-5 text-yellow-500" />
        ) : (
          <XCircle className="w-5 h-5 text-slate-500" />
        )}
      </div>

      {hasEvidence ? (
        <div className="mb-3">
          <p className="text-xs font-medium text-green-400 mb-1">✓ Completado:</p>
          <ul className="text-xs text-slate-300 space-y-1">
            {dimension.evidence.slice(0, 3).map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
            {dimension.evidence.length > 3 ? (
              <li className="text-slate-500">... y {dimension.evidence.length - 3} más</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {hasMissing ? (
        <div>
          <p className="text-xs font-medium text-yellow-400 mb-1">⚠ Pendiente:</p>
          <ul className="text-xs text-slate-300 space-y-1">
            {dimension.missing.slice(0, 3).map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
            {dimension.missing.length > 3 ? (
              <li className="text-slate-500">... y {dimension.missing.length - 3} más</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function ReadinessView() {
  const { apiTenantId } = useTenant();

  const readinessQuery = useQuery({
    queryKey: ["institucion-readiness", apiTenantId],
    queryFn: () => getReadiness(apiTenantId!),
    enabled: !!apiTenantId,
    retry: false,
  });

  if (readinessQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (readinessQuery.error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
        <p className="text-sm text-red-400">Error al cargar el estado de readiness</p>
        <p className="text-xs text-red-300 mt-1">
          {readinessQuery.error instanceof Error ? readinessQuery.error.message : "Error desconocido"}
        </p>
      </div>
    );
  }

  const data = readinessQuery.data;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Overview scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <ScoreBar score={data.account_created} label="Cuenta creada" />
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <ScoreBar score={data.production_readiness} label="Production readiness" />
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <ScoreBar score={data.ai_optimization} label="AI optimization" />
        </div>
      </div>

      {/* Readiness vs Gates callout */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <strong>Production readiness</strong> mide qué tan completa está tu configuración.{" "}
          <strong>Los gates de producción</strong> determinan si puedes operar. Un readiness de 100% no garantiza
          que todos los gates pasen.
        </p>
      </div>

      {/* Dimensions */}
      <div>
        <h2 className="text-lg font-bold mb-4">Dimensiones de configuración</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.dimensions.map((dim) => (
            <DimensionCard key={dim.name} dimension={dim} />
          ))}
        </div>
      </div>

      {/* Note about gates */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="font-medium mb-2">Gates de producción</h3>
        <p className="text-sm text-slate-400">
          Los gates de producción se mostrarán aquí cuando estén disponibles. Estos gates verifican requisitos
          críticos como identidad verificada, MFA, políticas configuradas y certificación completa.
        </p>
      </div>
    </div>
  );
}
