"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { chFetch } from "@/lib/credit-hub/api/client";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

type GateStatus = "PASS" | "FAIL" | "PENDING";

interface ProductionGate {
  name: string;
  status: GateStatus;
  evidence: string[];
  blocking_reason?: string;
}

interface ProductionGatesResponse {
  eligible: boolean;
  gates: ProductionGate[];
}

async function getProductionGates(tenantId: string): Promise<ProductionGatesResponse> {
  return chFetch("/api/v2/institucion/production-gates", {
    tenantId,
    actorRole: "bank_admin",
  });
}

const GATE_LABELS: Record<string, { title: string; description: string }> = {
  IDENTITY_VERIFIED: {
    title: "Identidad verificada",
    description: "RNC verificado, documentos legales validados",
  },
  MFA_PRIVILEGED_USERS: {
    title: "MFA en usuarios privilegiados",
    description: "Autenticación multifactor configurada para administradores",
  },
  LENDERS_CONFIGURED: {
    title: "Prestamistas configurados",
    description: "Al menos un lender activo con productos disponibles",
  },
  CREDIT_POLICY_CONFIGURED: {
    title: "Política de crédito configurada",
    description: "Reglas de aprobación y umbrales definidos",
  },
  DOCUMENT_POLICY_CONFIGURED: {
    title: "Política documental configurada",
    description: "Documentos requeridos por tipo de solicitud definidos",
  },
  COMPLIANCE_COMPLETE: {
    title: "Cumplimiento completo",
    description: "Políticas de KYC, AML y Ley 172-13 configuradas",
  },
  CREDENTIALS_USABLE: {
    title: "Credenciales usables",
    description: "Todas las credenciales LIVE verificadas (no NO_VERIFICABLE)",
  },
  OPERATIONAL_ROLES: {
    title: "Roles operacionales",
    description: "Usuarios con roles necesarios para operación",
  },
  CERTIFICATION_PASSED: {
    title: "Certificación completada",
    description: "Workflow completo probado con datos sintéticos",
  },
};

function GateCard({ gate }: { gate: ProductionGate }) {
  const info = GATE_LABELS[gate.name] || {
    title: gate.name,
    description: "Gate de producción",
  };

  const isPassed = gate.status === "PASS";
  const isFailed = gate.status === "FAIL";
  const isPending = gate.status === "PENDING";

  return (
    <div
      className={`bg-slate-800 border rounded-lg p-4 ${
        isPassed
          ? "border-green-700"
          : isFailed
          ? "border-red-700"
          : "border-yellow-700"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-medium mb-1">{info.title}</h3>
          <p className="text-xs text-slate-400">{info.description}</p>
        </div>
        <div className="ml-3">
          {isPassed ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : isFailed ? (
            <XCircle className="w-5 h-5 text-red-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-500" />
          )}
        </div>
      </div>

      {gate.evidence.length > 0 ? (
        <div className="mb-2">
          <p className="text-xs font-medium text-green-400 mb-1">✓ Evidencia:</p>
          <ul className="text-xs text-slate-300 space-y-0.5">
            {gate.evidence.slice(0, 2).map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
            {gate.evidence.length > 2 ? (
              <li className="text-slate-500">... y {gate.evidence.length - 2} más</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {gate.blocking_reason && !isPassed ? (
        <div className="mt-2 p-2 bg-red-900/20 border border-red-700 rounded text-xs text-red-300">
          <strong>Motivo:</strong> {gate.blocking_reason}
        </div>
      ) : null}
    </div>
  );
}

export function ProductionGatesView() {
  const { apiTenantId } = useTenant();

  const gatesQuery = useQuery({
    queryKey: ["institucion-production-gates", apiTenantId],
    queryFn: () => getProductionGates(apiTenantId!),
    enabled: !!apiTenantId,
    retry: false,
  });

  if (gatesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (gatesQuery.error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
        <p className="text-sm text-red-400">Error al cargar gates de producción</p>
        <p className="text-xs text-red-300 mt-1">
          {gatesQuery.error instanceof Error ? gatesQuery.error.message : "Error desconocido"}
        </p>
      </div>
    );
  }

  const data = gatesQuery.data;
  if (!data) return null;

  const passedGates = data.gates.filter((g) => g.status === "PASS").length;
  const totalGates = data.gates.length;

  return (
    <div className="space-y-6">
      {/* Eligibility banner */}
      <div
        className={`rounded-lg p-6 ${
          data.eligible
            ? "bg-green-900/20 border border-green-700"
            : "bg-red-900/20 border border-red-700"
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            {data.eligible ? (
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">
              {data.eligible ? "Elegible para producción" : "No elegible para producción"}
            </h2>
            <p className={`text-sm ${data.eligible ? "text-green-300" : "text-red-300"}`}>
              {data.eligible
                ? "Todos los gates requeridos están en PASS. Puedes lanzar a producción cuando estés listo."
                : `${passedGates} de ${totalGates} gates completados. Completa los gates pendientes para habilitar producción.`}
            </p>
          </div>
        </div>
      </div>

      {/* Readiness vs Gates callout */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <h3 className="font-medium mb-2">Readiness vs Gates</h3>
        <p className="text-sm text-blue-300">
          <strong>Production readiness</strong> mide qué tan completa está tu configuración (0-100%).{" "}
          <strong>Los gates</strong> son requisitos binarios (PASS/FAIL) que determinan si puedes operar.
        </p>
        <p className="text-sm text-blue-300 mt-2">
          Un readiness de 100% no garantiza que todos los gates pasen. Los gates verifican requisitos críticos
          como identidad, MFA, credenciales usables y certificación completa.
        </p>
      </div>

      {/* Gates grid */}
      <div>
        <h3 className="text-lg font-bold mb-4">Gates de producción ({passedGates}/{totalGates})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.gates.map((gate) => (
            <GateCard key={gate.name} gate={gate} />
          ))}
        </div>
      </div>

      {/* Important note */}
      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
        <p className="text-sm text-yellow-300">
          <strong>Importante:</strong> Solo `ACTIVE` con todos los gates en PASS permite operaciones reales.
          `READY_FOR_PRODUCTION` significa que el sistema no bloquea el lanzamiento, pero aún no puedes operar.
        </p>
      </div>
    </div>
  );
}
