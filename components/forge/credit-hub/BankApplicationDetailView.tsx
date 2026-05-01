"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { FileText, MessageSquareText, ScrollText, Shield, Sparkles } from "lucide-react";
import { CreditAnalysisPanel } from "@/components/credit-hub/dealer/analysis/CreditAnalysisPanel";
import { ScoreVisual } from "@/components/credit-hub/dealer/analysis/ScoreVisual";
import { usePersona } from "@/components/credit-hub/system/PersonaProvider";
import {
  AuditTimeline,
  type AuditTimelineEntry,
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  EvidenceCard,
  Input,
  Modal,
  StatusPill,
  Tabs,
  Textarea,
  toast,
  type StatusPillTone,
} from "@/components/forge";
import { useBankCounterOffer, useBankDecision } from "@/lib/credit-hub/hooks/useBankDecision";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { forgeBankDecisionToasts, forgeToastLangFromLocale, formatToastApplicationId } from "@/utils/forge-toast-copy";
import { forgeEmptyCopy } from "@/utils/forge-empty-copy";
import type {
  BankAuditTrail,
  BankDecisionRequest,
  BankDecisionTerms,
  BankDecisionType,
  BankReviewApplication,
  ComplianceReport,
} from "@/lib/credit-hub/types/bankDecision";

function defaultTerms(application: BankReviewApplication): BankDecisionTerms {
  const analysis = application.application_payload.analysis;
  const metrics = analysis?.metrics;
  return {
    approved_amount: Number(analysis?.financed_amount ?? 0),
    interest_rate: Number(metrics?.annual_rate ?? 18),
    term_months: Number(metrics?.term_months ?? 36),
    down_payment_required: Number(metrics?.down_payment ?? 0),
    conditions: ["Validación documental final"],
  };
}

function riskTone(risk: string | undefined): StatusPillTone {
  switch (risk) {
    case "BAJO":
      return "success";
    case "MEDIO_BAJO":
    case "MEDIO":
      return "warning";
    case "ALTO":
    case "MUY_ALTO":
      return "danger";
    default:
      return "neutral";
  }
}

function stateTone(state: string): StatusPillTone {
  const s = state.toUpperCase();
  if (s.includes("APROB")) return "success";
  if (s.includes("RECHAZ") || s.includes("DENEG")) return "danger";
  if (s.includes("REVIS") || s.includes("PEND")) return "warning";
  return "info";
}

function formatDop(value: number) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(value || 0);
}

function DecisionCommentsPanel({ existingJustification }: { existingJustification?: string }) {
  const { tenantConfig } = useTenantConfig();
  const empty = forgeEmptyCopy(tenantConfig.locale);
  const [internalNote, setInternalNote] = useState("");
  const noteFieldId = "forge-bank-internal-note-draft";
  const showEmpty = !existingJustification?.trim() && !internalNote.trim();

  return (
    <div className="space-y-4">
      {existingJustification ? (
        <Card className="p-4">
          <p className="text-forge-xs font-semibold text-forgeInk-500">Justificación de decisión registrada</p>
          <p className="mt-2 text-forge-sm text-forgeInk-800">{existingJustification}</p>
        </Card>
      ) : null}
      {showEmpty ? (
        <EmptyState
          titleLevel={2}
          icon={<MessageSquareText />}
          title={empty.bankDetailCommentsEmptyTitle}
          description={empty.bankDetailCommentsEmptyBody}
          action={
            <Button
              type="button"
              variant="secondary"
              className="min-h-12"
              onClick={() => document.getElementById(noteFieldId)?.focus()}
            >
              {empty.bankDetailCommentsCta}
            </Button>
          }
        />
      ) : null}
      <div>
        <Textarea
          id={noteFieldId}
          label="Comentario interno (borrador local)"
          value={internalNote}
          onChange={(e) => setInternalNote(e.target.value)}
          rows={4}
        />
        <p className="mt-2 text-forge-xs text-forgeInk-500">
          La persistencia de comentarios sigue el flujo de API del banco; este campo no envía datos hasta integrarse con el endpoint de notas.
        </p>
      </div>
    </div>
  );
}

export interface BankApplicationDetailViewProps {
  application: BankReviewApplication;
  compliance?: ComplianceReport;
  audit?: BankAuditTrail;
}

export function BankApplicationDetailView({ application, compliance, audit }: BankApplicationDetailViewProps) {
  const persona = usePersona();
  const t = useTranslations();
  const payload = application.application_payload;
  const analysis = payload.analysis;
  const applicant = payload.applicant as Record<string, unknown> | undefined;
  const financial = payload.financial as Record<string, unknown> | undefined;
  const vehicle = payload.vehicle as Record<string, unknown> | undefined;
  const rawDocs = payload.documents;

  const decisionMutation = useBankDecision(application.application_id);
  const counterOfferQuery = useBankCounterOffer(application.application_id);
  const existing = payload.bank_decision;

  const [tab, setTab] = useState("overview");
  const [terms, setTerms] = useState<BankDecisionTerms>(() => defaultTerms(application));
  const [decisionModal, setDecisionModal] = useState<null | { decision: BankDecisionType; title: string }>(null);
  const [modalComment, setModalComment] = useState("");
  const [drawer, setDrawer] = useState<null | { title: string; description: string }>(null);

  const applyCounterOffer = useCallback(() => {
    const o = counterOfferQuery.data;
    if (!o) return;
    setTerms(o.counter_offer_terms);
    setDecisionModal({ decision: "CONTRA_OFERTA", title: "Confirmar contra-oferta" });
    setModalComment("");
  }, [counterOfferQuery.data]);

  const updateTerm = useCallback((key: keyof BankDecisionTerms, value: string) => {
    setTerms((current) => ({
      ...current,
      [key]: key === "conditions" ? value.split("\n").filter(Boolean) : Number(value || 0),
    }));
  }, []);

  const { tenantConfig } = useTenantConfig();
  const empty = forgeEmptyCopy(tenantConfig.locale);

  const submitDecision = useCallback(async () => {
    if (!decisionModal || !modalComment.trim()) return;
    const body: BankDecisionRequest = {
      decision: decisionModal.decision,
      justification: modalComment.trim(),
      analyst_id: "bank-analyst-demo",
      terms,
    };
    const lang = forgeToastLangFromLocale(tenantConfig.locale);
    const copy = forgeBankDecisionToasts(lang);
    const displayId = formatToastApplicationId(application.application_id);
    try {
      await decisionMutation.mutateAsync(body);
      if (body.decision === "APROBADO") {
        toast.success(copy.applicationApproved(displayId), { duration: 4000 });
      } else if (body.decision === "RECHAZADO") {
        toast.success(copy.applicationRejected(displayId), { duration: 4000 });
      } else {
        toast.success(t.toasts.decision_confirmed, { duration: 4000 });
      }
      setDecisionModal(null);
      setModalComment("");
    } catch (err) {
      const detail = err instanceof Error ? err.message : undefined;
      toast.error(copy.decisionSaveError(detail), { duration: 6000 });
    }
  }, [
    application.application_id,
    decisionModal,
    modalComment,
    terms,
    decisionMutation,
    tenantConfig.locale,
    t.toasts.decision_confirmed,
  ]);

  const documents = useMemo(() => {
    if (Array.isArray(rawDocs)) {
      return rawDocs as Array<{ id?: string; label?: string; name?: string; type?: string }>;
    }
    return [];
  }, [rawDocs]);

  const evidenceCards = useMemo(() => {
    if (!analysis) return [];
    const m = analysis.metrics;
    const cards: Array<{ key: string; title: string; body: ReactNode; sourceLabel: string; confidence?: "high" | "medium" | "low" }> = [
      {
        key: "score",
        title: "Puntaje y banda",
        body: (
          <>
            <p>
              Puntaje <strong>{analysis.score}</strong> · Banda <strong>{analysis.approval_band}</strong>
            </p>
            <p className="mt-2 text-forge-xs text-forgeInk-500">Confianza del motor: {(analysis.confidence * 100).toFixed(0)}%</p>
          </>
        ),
        sourceLabel: analysis.engine,
        confidence: analysis.score >= 720 ? "high" : analysis.score >= 580 ? "medium" : "low",
      },
      {
        key: "risk",
        title: "Riesgo crediticio",
        body: <p>{analysis.explanation || `Nivel de riesgo declarado: ${analysis.risk_level}.`}</p>,
        sourceLabel: "forge_rule_based_v1",
        confidence: analysis.risk_level === "BAJO" ? "high" : analysis.risk_level === "MUY_ALTO" ? "low" : "medium",
      },
      {
        key: "capacity",
        title: "Capacidad de pago",
        body: m ? (
          <ul className="list-inside list-disc space-y-1">
            <li>DTI: {(m.dti * 100).toFixed(1)}%</li>
            <li>Capacidad de pago: {formatDop(m.payment_capacity)}</li>
            <li>Cuota estimada: {formatDop(m.estimated_payment)}</li>
          </ul>
        ) : (
          <p>Capacidad estimada desde el motor sin desglose de métricas extendidas.</p>
        ),
        sourceLabel: "metrics_block",
        confidence: "medium",
      },
      {
        key: "factors",
        title: "Factores positivos y negativos",
        body: (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-forge-xs font-semibold text-forgeSuccess-700">Positivos</p>
              <ul className="mt-1 list-inside list-disc text-forge-xs">
                {(analysis.positive_factors?.length ? analysis.positive_factors : analysis.factors?.positive ?? []).slice(0, 6).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-forge-xs font-semibold text-forgeDanger-700">Negativos</p>
              <ul className="mt-1 list-inside list-disc text-forge-xs">
                {(analysis.negative_factors?.length ? analysis.negative_factors : analysis.factors?.negative ?? []).slice(0, 6).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        ),
        sourceLabel: "factors_block",
        confidence: "medium",
      },
      {
        key: "compliance",
        title: "Cumplimiento Ley 172-13",
        body: compliance ? (
          <ul className="list-inside list-disc space-y-1 text-forge-xs">
            <li>Consentimientos completos: {compliance.consents_complete ? "Sí" : "No"}</li>
            <li>Documentación mínima: {compliance.documents_complete ? "Sí" : "No"}</li>
            <li>Conforme: {compliance.ley_172_13_compliant ? "Sí" : "Revisar hallazgos"}</li>
          </ul>
        ) : (
          <p>Sin informe de cumplimiento cargado para esta solicitud.</p>
        ),
        sourceLabel: "compliance_api",
        confidence: compliance?.ley_172_13_compliant ? "high" : "medium",
      },
      {
        key: "recs",
        title: "Recomendaciones del motor",
        body:
          analysis.recommendations?.length ? (
            <ul className="list-inside list-disc space-y-2">
              {analysis.recommendations.slice(0, 3).map((r) => (
                <li key={r.title}>
                  <strong>{r.title}</strong> — {r.explanation}
                </li>
              ))}
            </ul>
          ) : (
            <p>Sin recomendaciones estructuradas adicionales.</p>
          ),
        sourceLabel: "recommendations",
        confidence: "medium",
      },
    ];
    return cards;
  }, [analysis, compliance]);

  const auditEntries: AuditTimelineEntry[] = useMemo(() => {
    const events = audit?.events ?? [];
    return events.map((ev, i) => ({
      id: `${application.application_id}-${i}`,
      timestampLabel: new Date(ev.timestamp).toLocaleString("es-DO"),
      actorLabel: ev.by || "Sistema",
      actionLabel: ev.event,
      detail: ev.decision ? `Decisión registrada: ${ev.decision}` : undefined,
    }));
  }, [audit?.events, application.application_id]);

  const overviewPanel = (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        {analysis ? <ScoreVisual analysis={analysis} /> : null}
        <Card className="p-4">
          <h2 className="font-display text-forge-sm font-semibold text-forgeInk-800">Resumen del solicitante</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-forge-xs text-forgeInk-500">Nombre</dt>
              <dd className="text-forge-sm font-medium text-forgeInk-800">{String(applicant?.full_name || "Cliente sin nombre")}</dd>
            </div>
            <div>
              <dt className="text-forge-xs text-forgeInk-500">ID solicitud</dt>
              <dd className="font-forgeMono text-forge-xs text-forgeInk-700">{application.application_id}</dd>
            </div>
            <div>
              <dt className="text-forge-xs text-forgeInk-500">Monto solicitado</dt>
              <dd className="text-forge-sm font-medium text-forgeInk-800">{formatDop(Number(financial?.requested_amount || 0))}</dd>
            </div>
            <div>
              <dt className="text-forge-xs text-forgeInk-500">Vehículo</dt>
              <dd className="text-forge-sm font-medium text-forgeInk-800">
                {String(vehicle?.make || "")} {String(vehicle?.model || "")}
              </dd>
            </div>
          </dl>
        </Card>
        <CreditAnalysisPanel applicationId={application.application_id} />
      </div>
      <aside className="space-y-4 lg:col-span-4">
        <Card className={`p-4 ${compliance?.ley_172_13_compliant ? "ring-1 ring-forgeSuccess-500/30" : "ring-1 ring-forgeWarning-500/30"}`}>
          <div className="flex items-start gap-3">
            {compliance?.ley_172_13_compliant ? (
              <Shield className="h-5 w-5 shrink-0 text-forgeSuccess-600" aria-hidden />
            ) : (
              <Shield className="h-5 w-5 shrink-0 text-forgeWarning-600" aria-hidden />
            )}
            <div>
              <h2 className="font-display text-forge-sm font-semibold text-forgeInk-800">{t.bank_ui.compliance_card_title}</h2>
              <Badge variant={compliance?.ley_172_13_compliant ? "success" : "warning"} className="mt-2">
                {compliance?.ley_172_13_compliant ? t.bank_ui.compliance_ok : t.bank_ui.compliance_attention}
              </Badge>
              {compliance?.issues?.length ? (
                <ul className="mt-3 space-y-1 text-forge-xs text-forgeInk-600">
                  {compliance.issues.map((issue) => (
                    <li key={issue.type}>
                      {issue.type}: {issue.action_required}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-forge-xs text-forgeInk-500">Consentimientos y documentos mínimos según informe.</p>
              )}
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="font-display text-forge-sm font-semibold text-forgeInk-800">Recomendación IA (no ejecuta decisiones)</h2>
          <p className="mt-2 text-forge-sm text-forgeInk-700">
            {analysis?.explanation || "El motor emitió una recomendación; la decisión final y su justificación son siempre humanas y auditables."}
          </p>
          {existing ? (
            <p className="mt-3 text-forge-xs text-forgeInk-500">
              Decisión registrada: <strong>{existing.decision}</strong> por {existing.decided_by}
            </p>
          ) : null}
        </Card>
      </aside>
    </div>
  );

  const documentsPanel =
    documents.length === 0 ? (
      <EmptyState titleLevel={2} icon={<FileText />} title={empty.bankDetailDocumentsTitle} description={empty.bankDetailDocumentsBody} />
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc, idx) => {
          const label = String(doc.label || doc.name || doc.type || `Documento ${idx + 1}`);
          const key = String(doc.id || doc.type || idx);
          return (
            <button
              key={key}
              type="button"
              onClick={() => setDrawer({ title: label, description: `Vista previa local · ${application.application_id}` })}
              className="flex min-h-12 flex-col items-center justify-center gap-2 rounded-forge-md border border-forgeInk-200 bg-forgeSurface-sunken p-4 text-center transition-colors hover:border-forgeBrand-400 hover:bg-forgeSurface-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
            >
              <FileText className="h-8 w-8 text-forgeInk-400" aria-hidden />
              <span className="text-forge-xs font-medium text-forgeInk-700">{label}</span>
            </button>
          );
        })}
      </div>
    );

  const evidencePanel = (
    <div className="space-y-4">
      {evidenceCards.length === 0 ? (
        <EmptyState titleLevel={2} icon={<Sparkles />} title={empty.bankDetailEvidencePendingTitle} description={empty.bankDetailEvidencePendingBody} />
      ) : (
        evidenceCards.map((c) => <EvidenceCard key={c.key} title={c.title} body={c.body} sourceLabel={c.sourceLabel} confidence={c.confidence} />)
      )}
    </div>
  );

  const statementPanel =
    analysis?.metrics ? (
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <p className="text-forge-xs text-forgeInk-500">DTI</p>
          <p className="mt-1 font-display text-forge-lg font-semibold text-forgeInk-800">{(analysis.metrics.dti * 100).toFixed(1)}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-forge-xs text-forgeInk-500">Capacidad de pago</p>
          <p className="mt-1 font-display text-forge-lg font-semibold text-forgeInk-800">{formatDop(analysis.metrics.payment_capacity)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-forge-xs text-forgeInk-500">Cuota estimada</p>
          <p className="mt-1 font-display text-forge-lg font-semibold text-forgeInk-800">{formatDop(analysis.metrics.estimated_payment)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-forge-xs text-forgeInk-500">Monto financiado (motor)</p>
          <p className="mt-1 font-display text-forge-lg font-semibold text-forgeInk-800">{formatDop(analysis.metrics.financed_amount)}</p>
        </Card>
      </div>
    ) : (
      <EmptyState titleLevel={2} icon={<ScrollText />} title={empty.bankDetailStatementTitle} description={empty.bankDetailStatementBody} />
    );

  const auditPanel =
    auditEntries.length === 0 ? (
      <EmptyState titleLevel={2} icon={<ScrollText />} title={empty.bankDetailAuditEmptyTitle} description={empty.bankDetailAuditEmptyBody} />
    ) : (
      <AuditTimeline entries={auditEntries} />
    );

  const tabDefs = [
    { id: "overview", label: "Resumen", panel: overviewPanel },
    { id: "documents", label: "Documentos", panel: documentsPanel },
    { id: "evidence", label: "Evidencia IA", panel: evidencePanel },
    { id: "statement", label: "Análisis de estado", panel: statementPanel },
    { id: "audit", label: "Auditoría", panel: auditPanel },
    { id: "comments", label: "Comentarios", panel: <DecisionCommentsPanel existingJustification={existing?.justification} /> },
  ];

  const showTermsInModal =
    decisionModal?.decision === "APROBADO" || decisionModal?.decision === "CONTRA_OFERTA";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={stateTone(application.state)}>{application.state}</StatusPill>
            {analysis ? <StatusPill tone={riskTone(analysis.risk_level)}>Riesgo: {analysis.risk_level}</StatusPill> : null}
            {persona === "bank" ? (
              <Badge variant="neutral" className="uppercase">
                Portal banco
              </Badge>
            ) : null}
          </div>
          <h1 className="mt-2 font-display text-forge-md font-bold text-forgeInk-800 sm:text-[length:var(--forge-text-2xl)]">
            {String(applicant?.full_name || "Cliente sin nombre")}
          </h1>
          <p className="font-forgeMono text-forge-xs text-forgeInk-500">{application.application_id}</p>
          <p className="mt-1 text-forge-sm text-forgeInk-600">
            <Link href="/credit-hub/bank/applications" className="inline-flex min-h-12 items-center text-forgeBrand-600 hover:text-forgeBrand-700">
              ← Volver a la bandeja
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="danger"
            className="min-h-12 min-w-[44px]"
            onClick={() => {
              setTerms(defaultTerms(application));
              setDecisionModal({ decision: "RECHAZADO", title: "Rechazar solicitud" });
              setModalComment("");
            }}
          >
            Rechazar
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-12 min-w-[44px]"
            onClick={() => {
              setTerms(defaultTerms(application));
              setDecisionModal({ decision: "EN_REVISION", title: "Solicitar más información" });
              setModalComment("");
            }}
          >
            Solicitar información
          </Button>
          <Button
            type="button"
            variant="primary"
            className="min-h-12 min-w-[44px]"
            onClick={() => {
              setTerms(defaultTerms(application));
              setDecisionModal({ decision: "APROBADO", title: "Aprobar solicitud" });
              setModalComment("");
            }}
          >
            Aprobar
          </Button>
        </div>
      </div>

      {counterOfferQuery.data ? (
        <Card className="border border-forgeInfo-200 bg-forgeInfo-50/40 p-4">
          <h2 className="font-display text-forge-sm font-semibold text-forgeInk-800">Contra-oferta sugerida</h2>
          <p className="mt-1 text-forge-sm text-forgeInk-600">{counterOfferQuery.data.explanation}</p>
          <Button type="button" variant="secondary" className="mt-3 min-h-12" onClick={applyCounterOffer}>
            Usar contra-oferta en la decisión
          </Button>
        </Card>
      ) : null}

      <Tabs tabs={tabDefs} value={tab} onValueChange={setTab} />

      <Modal
        open={!!decisionModal}
        onClose={() => {
          setDecisionModal(null);
          setModalComment("");
        }}
        title={decisionModal?.title ?? ""}
        description="La decisión final es humana y queda auditada. Comentario obligatorio."
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" className="min-h-12" onClick={() => setDecisionModal(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" className="min-h-12" loading={decisionMutation.isPending} disabled={!modalComment.trim()} onClick={() => void submitDecision()}>
              Confirmar
            </Button>
          </div>
        }
      >
        {showTermsInModal ? (
          <div className="space-y-3">
            <Input label="Monto aprobado" inputMode="decimal" value={String(terms.approved_amount)} onChange={(e) => updateTerm("approved_amount", e.target.value)} />
            <Input label="Tasa anual (%)" inputMode="decimal" value={String(terms.interest_rate)} onChange={(e) => updateTerm("interest_rate", e.target.value)} />
            <Input label="Plazo (meses)" inputMode="numeric" value={String(terms.term_months)} onChange={(e) => updateTerm("term_months", e.target.value)} />
            <Input label="Inicial requerida" inputMode="decimal" value={String(terms.down_payment_required)} onChange={(e) => updateTerm("down_payment_required", e.target.value)} />
            <Textarea label="Condiciones (una por línea)" value={terms.conditions.join("\n")} onChange={(e) => updateTerm("conditions", e.target.value)} rows={3} />
          </div>
        ) : null}
        <Textarea className={showTermsInModal ? "mt-4" : ""} label="Comentario / justificación" value={modalComment} onChange={(e) => setModalComment(e.target.value)} rows={4} />
      </Modal>

      <Drawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawer?.title ?? ""}
        description={drawer?.description}
        footer={
          <Button type="button" variant="secondary" className="min-h-12" onClick={() => setDrawer(null)}>
            Cerrar
          </Button>
        }
      >
        <p className="text-forge-sm text-forgeInk-700">
          Vista previa del documento (contenido binario no incrustado). Use el sistema documental del banco para la versión firmada.
        </p>
      </Drawer>
    </div>
  );
}
