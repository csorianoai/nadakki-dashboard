"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/contexts/TenantContext";

import { LegalCockpitShell } from "@/components/legal-cockpit/LegalCockpitShell";
import { LegalCockpitShell } from "@/components/legal-cockpit/LegalCockpitShell";
import { LegalKPIRow } from "@/components/legal-cockpit/LegalKPIRow";
import { LegalCommandCenter } from "@/components/legal-cockpit/LegalCommandCenter";
import { LegalUrgentMatters } from "@/components/legal-cockpit/LegalUrgentMatters";
import { LegalGoldenPath } from "@/components/legal-cockpit/LegalGoldenPath";
import { LegalAgentGrid } from "@/components/legal-cockpit/LegalAgentGrid";
import { LegalTrustPanel } from "@/components/legal-cockpit/LegalTrustPanel";
import { LegalActionFallbackPanel } from "@/components/legal-cockpit/LegalActionFallbackPanel";

import {
  fetchLegalHealth,
  fetchLegalAgents,
  normalizeAgentsResponse,
} from "@/lib/legal-cockpit/api";
import { detectIntent } from "@/lib/legal-cockpit/intent-router";
import { agentHref, caseHref } from "@/lib/legal-cockpit/routes";
import {
  DEMO_KPIS,
  DEMO_URGENT_MATTERS,
  DEMO_GOLDEN_PATH,
  DEMO_AGENTS,
} from "@/lib/legal-cockpit/demo-data";
import type {
  LegalSystemStatus,
  LegalKPI,
  LegalUrgentMatter,
  GoldenPathStep,
  LegalAgent,
  TrustItem,
  FallbackAction,
} from "@/lib/legal-cockpit/types";

const DEFAULT_TRUST_ITEMS: TrustItem[] = [
  { key: "rag", label: "Citas verificadas contra RAG", status: "pending" },
  { key: "halluc", label: "Rechazo de citas fantasma", status: "pending" },
  { key: "audit", label: "Audit trail por consulta", status: "pending" },
  { key: "sha", label: "Snapshot SHA-256 disponible", status: "pending" },
  { key: "isolation", label: "Aislamiento por bufete (RLS)", status: "verified" },
  { key: "human", label: "Revisión humana obligatoria", status: "verified" },
];

export default function LegalGuidePage() {
  const router = useRouter();
  const { tenantId } = useTenant();

  const [loading, setLoading] = useState(true);
  const [fallback, setFallback] = useState<FallbackAction | null>(null);

  const [status, setStatus] = useState<LegalSystemStatus>({
    agentsCount: DEMO_AGENTS.length,
    agentsSource: "demo",
    ragStatus: "unknown",
    auditTrailStatus: "unknown",
    jurisdictions: ["DO", "CO", "MX"],
    demoData: true,
  });

  const [kpis] = useState<LegalKPI[]>(DEMO_KPIS);
  const [matters] = useState<LegalUrgentMatter[]>(DEMO_URGENT_MATTERS);
  const [goldenPath] = useState<GoldenPathStep[]>(DEMO_GOLDEN_PATH);
  const [agents, setAgents] = useState<LegalAgent[]>(DEMO_AGENTS);
  const [trustItems, setTrustItems] = useState<TrustItem[]>(DEFAULT_TRUST_ITEMS);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const tid = tenantId ?? undefined;
      const [healthRes, agentsRes] = await Promise.all([
        fetchLegalHealth(tid),
        fetchLegalAgents(tid),
      ]);

      if (cancelled) return;

      let newStatus: LegalSystemStatus = {
        agentsCount: DEMO_AGENTS.length,
        agentsSource: "demo" as const,
        ragStatus: "unknown" as const,
        auditTrailStatus: "unknown" as const,
        jurisdictions: ["DO", "CO", "MX"],
        demoData: true,
      };

      if (healthRes.ok) {
        const h = healthRes.data;
        const ragOk = h.checks["rag_orchestrator_ready"] === true;
        const auditOk = h.checks["audit_logger_writable"] === true;
        const kpOk = h.checks["knowledge_pack_loaded"] === true;

        newStatus = {
          ...newStatus,
          ragStatus: ragOk ? "verified" : "degraded",
          auditTrailStatus: auditOk ? "on" : "off",
          demoData: false,
        };

        setTrustItems((prev) =>
          prev.map((item) => {
            if (item.key === "rag")
              return { ...item, status: ragOk ? "verified" : "pending" };
            if (item.key === "halluc")
              return { ...item, status: kpOk ? "verified" : "pending" };
            if (item.key === "audit")
              return { ...item, status: auditOk ? "verified" : "pending" };
            if (item.key === "sha")
              return { ...item, status: auditOk ? "verified" : "pending" };
            return item;
          })
        );
      }

      if (agentsRes.ok) {
        const normalized = normalizeAgentsResponse(agentsRes.data);
        newStatus.agentsCount = normalized.total;
        newStatus.agentsSource = "backend";
      }

      setStatus(newStatus);
      setAgents(DEMO_AGENTS); // Keep rich demo descriptions
      setLoading(false);
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const navigate = useCallback(
    (href: string) => {
      if (href.startsWith("#")) {
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      } else {
        router.push(href);
      }
    },
    [router]
  );

  const openFallback = useCallback(
    (query: string) => {
      const intent = detectIntent(query);
      if (intent.found) {
        router.push(intent.href);
        return;
      }
      setFallback({
        title: `Consulta: ${query}`,
        agentId: "agente_orquestador_legal",
        prompt: `Como abogado dominicano, necesito ayuda con: ${query}. Por favor oriéntame sobre el procedimiento correcto según la legislación dominicana.`,
      });
    },
    [router]
  );

  const handleMatterAction = useCallback(
    (matter: LegalUrgentMatter, actionKey: string) => {
      const intent = detectIntent(actionKey.replace(/_/g, " "));
      if (intent.found) {
        router.push(intent.href + `?case=${matter.id}`);
        return;
      }
      router.push(caseHref(matter.id));
    },
    [router]
  );

  const handleAgent = useCallback(
    (agentId: string) => {
      router.push(agentHref(agentId));
    },
    [router]
  );

  return (
    <LegalCockpitShell status={status}>
      <LegalKPIRow kpis={kpis} loading={loading} />

      <LegalCommandCenter onNavigate={navigate} onFallback={openFallback} />

      <LegalUrgentMatters
        matters={matters}
        onAction={handleMatterAction}
        loading={loading}
      />

      <LegalGoldenPath steps={goldenPath} onStep={navigate} />

      {fallback && (
        <LegalActionFallbackPanel
          action={fallback}
          onDismiss={() => setFallback(null)}
        />
      )}

      <LegalAgentGrid agents={agents} onAgent={handleAgent} loading={loading} />

      <LegalTrustPanel items={trustItems} />
    </div>
  );
}
