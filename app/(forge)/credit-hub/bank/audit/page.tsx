"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { usePersona } from "@/components/credit-hub/system/PersonaProvider";
import { AuditTimeline, Card, EmptyState, Skeleton } from "@/components/forge";
import type { AuditTimelineEntry } from "@/components/forge/ui/AuditTimeline";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { forgeEmptyCopy } from "@/utils/forge-empty-copy";

function targetHash(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).slice(0, 12);
}

export default function BankAuditPage() {
  const persona = usePersona();
  const t = useTranslations();
  const { tenantConfig } = useTenantConfig();
  const empty = forgeEmptyCopy(tenantConfig.locale);
  const queue = useBankQueue();

  const entries: AuditTimelineEntry[] = useMemo(() => {
    const apps = queue.data?.applications ?? [];
    return [...apps]
      .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
      .map((application) => ({
        id: application.application_id,
        timestampLabel: application.created_at ? new Date(application.created_at).toLocaleString("es-DO") : "—",
        actorLabel: application.applicant_name ? `${application.applicant_name.slice(0, 1)}•••` : "Sistema",
        actionLabel: `Solicitud ${application.application_id.slice(0, 8)}…`,
        detail: `${t.bank.audit_score_line(
          application.score,
          application.bank_decision ? `Decisión ${application.bank_decision.decision}` : t.bank.no_bank_decision
        )} · Target hash ${targetHash(application.application_id)} · IP —`,
        href: `/credit-hub/bank/applications/${application.application_id}`,
      }));
  }, [queue.data?.applications, t]);

  return (
    <div className="space-y-6" data-persona={persona}>
      <div>
        <p className="text-forge-xs font-semibold uppercase tracking-[0.18em] text-forgeBrand-600">{t.bank.audit_kicker}</p>
        <h1 className="mt-1 font-display text-forge-md font-bold text-forgeGray-800 sm:text-[length:var(--forge-text-2xl)]">Visor de auditoría</h1>
        <p className="mt-2 text-forge-sm text-forgeGray-600">
          Línea de tiempo desde la bandeja activa.{" "}
          <Link href="/credit-hub/bank/applications" className="text-forgeBrand-600 hover:text-forgeBrand-700">
            Abrir bandeja
          </Link>
        </p>
      </div>
      <Card className="p-4 sm:p-6">
        {queue.isLoading ? (
          <Skeleton className="min-h-48 w-full rounded-forge-md" />
        ) : entries.length === 0 ? (
          <EmptyState
            titleLevel={2}
            icon={<Inbox />}
            title={empty.bankAuditFilteredTitle}
            description={empty.bankAuditFilteredBody}
            action={
              <Link
                href="/credit-hub/bank/applications"
                className="inline-flex min-h-12 items-center justify-center rounded-forge-sm border border-forgeGray-200 bg-forgeSurface-card px-4 text-forge-sm font-medium text-forgeGray-800 shadow-forge-xs hover:bg-forgeSurface-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
              >
                {empty.bankAuditClearCta}
              </Link>
            }
          />
        ) : (
          <AuditTimeline entries={entries} />
        )}
      </Card>
    </div>
  );
}
