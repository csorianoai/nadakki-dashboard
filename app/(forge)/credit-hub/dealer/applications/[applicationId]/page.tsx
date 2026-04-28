"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Brain, Car, Clock, DollarSign, Mail, Phone, ShieldCheck, User } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/credit-hub/dealer/ApplicationStatusBadge";
import { CreditAnalysisPanel } from "@/components/credit-hub/dealer/analysis/CreditAnalysisPanel";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import { ForgeButton } from "@/components/credit-hub/primitives/ForgeButton";
import { CreditCoreApiError } from "@/lib/credit-hub/api/creditCoreClient";
import { useCreditApplicationDetail } from "@/lib/credit-hub/hooks/useCreditApplicationDetail";
import { useProcessCreditApplication } from "@/lib/credit-hub/hooks/useProcessCreditApplication";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { cn } from "@/lib/utils";

export default function DealerApplicationDetailPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);
  const router = useRouter();
  const t = useTranslations();
  const tabs = useMemo(
    () => [
      { id: "summary", label: t.dealer.detail_tabs.summary, icon: User },
      { id: "analysis", label: t.dealer.detail_tabs.analysis, icon: Brain },
      { id: "vehicle", label: t.dealer.detail_tabs.vehicle, icon: Car },
      { id: "timeline", label: t.dealer.detail_tabs.timeline, icon: Clock },
    ],
    [t]
  );
  const { application: data, events, isLoading, error, refetch } = useCreditApplicationDetail(applicationId);
  const processMutation = useProcessCreditApplication(applicationId);
  const [activeTab, setActiveTab] = useState("summary");

  const handleProcess = async () => {
    try {
      await processMutation.mutateAsync("ai");
      forgeToast.success(t.toasts.process_started);
      await refetch();
    } catch (processError) {
      forgeToast.error(processError instanceof Error ? processError.message : t.toasts.process_failed);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-forge-surface-elevated" />
          <div className="h-64 rounded-2xl bg-forge-surface" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    const notFound = error instanceof CreditCoreApiError && error.status === 404;
    return (
      <div className="p-4 md:p-8">
        <ForgeCard className="py-12 text-center">
          <p className="mb-2 text-forge-danger">{notFound ? t.dealer.detail_not_found : t.dealer.detail_load_error}</p>
          <p className="mb-4 text-sm text-forge-text-muted">
            {notFound ? t.dealer.detail_not_found_hint : error instanceof Error ? error.message : t.dealer.detail_retry_hint}
          </p>
          <div className="flex justify-center gap-3">
            <ForgeButton variant="secondary" onClick={() => router.back()}>
              {t.common.go_back}
            </ForgeButton>
            {!notFound && (
              <ForgeButton variant="primary" onClick={() => void refetch()}>
                {t.common.retry}
              </ForgeButton>
            )}
          </div>
        </ForgeCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <ForgeButton variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.back()} className="-ml-3 mb-2">
            {t.common.go_back}
          </ForgeButton>
          <h1 className="font-display text-3xl font-bold text-forge-text">{data.applicant_name}</h1>
          <div className="mt-2">
            <ApplicationStatusBadge status={data.status} />
          </div>
        </div>
        <ForgeButton variant="primary" onClick={handleProcess} loading={processMutation.isPending} leftIcon={<Brain className="h-4 w-4" />}>
          {t.dealer.process_with_ai}
        </ForgeButton>
      </div>

      <div className="flex items-center gap-1 border-b border-forge-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-selected={isActive}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                isActive ? "border-forge-primary text-forge-primary" : "border-transparent text-forge-text-muted hover:text-forge-text"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {activeTab === "summary" && (
          <ForgeCard padding="lg">
            <h2 className="mb-4 font-semibold text-forge-text">{t.dealer.client_info_heading}</h2>
            <dl className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="mt-1 h-4 w-4 text-forge-text-muted" />
                <div>
                  <dt className="text-xs text-forge-text-muted">{t.dealer.field_name}</dt>
                  <dd className="text-forge-text">{data.applicant_name}</dd>
                </div>
              </div>
              {data.applicant_email && (
                <div className="flex items-start gap-3">
                  <Mail className="mt-1 h-4 w-4 text-forge-text-muted" />
                  <div>
                    <dt className="text-xs text-forge-text-muted">{t.dealer.field_email}</dt>
                    <dd className="text-forge-text">{data.applicant_email}</dd>
                  </div>
                </div>
              )}
              {data.applicant_phone && (
                <div className="flex items-start gap-3">
                  <Phone className="mt-1 h-4 w-4 text-forge-text-muted" />
                  <div>
                    <dt className="text-xs text-forge-text-muted">{t.dealer.field_phone}</dt>
                    <dd className="text-forge-text">{data.applicant_phone}</dd>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 border-t border-forge-border pt-3">
                <DollarSign className="mt-1 h-4 w-4 text-forge-text-muted" />
                <div>
                  <dt className="text-xs text-forge-text-muted">{t.dealer.field_amount}</dt>
                  <dd className="font-mono font-semibold text-forge-text">RD$ {Number(data.requested_amount || 0).toLocaleString("es-DO")}</dd>
                </div>
              </div>
              {(data.score !== null || data.risk_score !== null || data.decision || data.recommendation) && (
                <div className="flex items-start gap-3 border-t border-forge-border pt-3">
                  <ShieldCheck className="mt-1 h-4 w-4 text-forge-text-muted" />
                  <div>
                    <dt className="text-xs text-forge-text-muted">{t.dealer.decision_risk_heading}</dt>
                    <dd className="space-y-1 text-forge-text">
                      {data.score !== null && <div>{t.dealer.score_line(data.score)}</div>}
                      {data.risk_score !== null && <div>{t.dealer.risk_score_line(data.risk_score)}</div>}
                      {data.decision && <div>{t.dealer.decision_line(data.decision)}</div>}
                      {data.recommendation && <div>{t.dealer.recommendation_line(data.recommendation)}</div>}
                    </dd>
                  </div>
                </div>
              )}
            </dl>
          </ForgeCard>
        )}

        {activeTab === "analysis" && <CreditAnalysisPanel applicationId={applicationId} />}

        {activeTab === "vehicle" && (
          <ForgeCard padding="lg">
            <h2 className="mb-4 font-semibold text-forge-text">{t.dealer.vehicle_heading}</h2>
            {!data.vehicle_year && !data.vehicle_make && !data.vehicle_model && !data.vehicle_vin ? (
              <p className="py-4 text-center text-forge-text-muted">Sin información de vehículo</p>
            ) : (
              <dl className="grid grid-cols-2 gap-4">
                {data.vehicle_year && (
                  <div>
                    <dt className="text-xs text-forge-text-muted">Año</dt>
                    <dd className="text-forge-text">{data.vehicle_year}</dd>
                  </div>
                )}
                {data.vehicle_make && (
                  <div>
                    <dt className="text-xs text-forge-text-muted">Marca</dt>
                    <dd className="text-forge-text">{data.vehicle_make}</dd>
                  </div>
                )}
                {data.vehicle_model && (
                  <div>
                    <dt className="text-xs text-forge-text-muted">Modelo</dt>
                    <dd className="text-forge-text">{data.vehicle_model}</dd>
                  </div>
                )}
                {data.vehicle_vin && (
                  <div className="col-span-2">
                    <dt className="text-xs text-forge-text-muted">VIN</dt>
                    <dd className="font-mono text-sm text-forge-text">{data.vehicle_vin}</dd>
                  </div>
                )}
              </dl>
            )}
          </ForgeCard>
        )}

        {activeTab === "timeline" && (
          <ForgeCard padding="lg">
            <h2 className="mb-4 font-semibold text-forge-text">{t.dealer.timeline_heading}</h2>
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-forge-info" />
                  <div>
                    <p className="font-medium text-forge-text">{event.title}</p>
                    {event.description && <p className="text-sm text-forge-text-muted">{event.description}</p>}
                    <p className="text-xs text-forge-text-muted">{new Date(event.created_at).toLocaleString("es-DO")}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-forge-success" />
                <div>
                  <p className="font-medium text-forge-text">{t.dealer.application_created}</p>
                  <p className="text-sm text-forge-text-muted">{new Date(data.created_at).toLocaleString("es-DO")}</p>
                </div>
              </div>
              {data.updated_at !== data.created_at && (
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-forge-info" />
                  <div>
                    <p className="font-medium text-forge-text">{t.dealer.last_updated}</p>
                    <p className="text-sm text-forge-text-muted">{new Date(data.updated_at).toLocaleString("es-DO")}</p>
                  </div>
                </div>
              )}
            </div>
          </ForgeCard>
        )}
      </div>
    </div>
  );
}
