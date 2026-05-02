"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertCircle, ArrowRight, Building2, CheckCircle2, ClipboardList, Inbox, Search, TrendingUp, XCircle } from "lucide-react";
import { usePersona } from "@/components/credit-hub/system/PersonaProvider";
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Input,
  KpiCard,
  Skeleton,
  StatusPill,
} from "@/components/forge";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useBankAnalytics } from "@/lib/credit-hub/hooks/useBankAnalytics";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";
import { forgeEmptyCopy } from "@/utils/forge-empty-copy";
import { formatForgeCurrency } from "@/utils/forge-locale";

function forgeTimeGreeting(locale: string): string {
  const h = new Date().getHours();
  if (locale.toLowerCase().startsWith("es")) {
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  }
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function priorityBadge(priority: BankQueueItem["priority"]) {
  if (priority === "ALTA") return <Badge variant="danger">Alta</Badge>;
  if (priority === "MEDIA") return <Badge variant="warning">Media</Badge>;
  return <Badge variant="neutral">Baja</Badge>;
}

function queueTone(item: BankQueueItem): "success" | "warning" | "info" | "neutral" {
  const d = item.bank_decision?.decision;
  if (d === "APROBADO") return "success";
  if (d === "RECHAZADO") return "warning";
  if (d === "EN_REVISION") return "info";
  return "neutral";
}

function queueLabel(item: BankQueueItem): string {
  return item.bank_decision?.decision ?? item.state ?? "—";
}

function isSameLocalDay(iso: string, ref: Date): boolean {
  try {
    const d = new Date(iso);
    return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
  } catch {
    return false;
  }
}

export default function BankDashboardPage() {
  const router = useRouter();
  const persona = usePersona();
  const t = useTranslations();
  const { tenantConfig } = useTenantConfig();
  const empty = forgeEmptyCopy(tenantConfig.locale);
  const queueQuery = useBankQueue();
  const analyticsQuery = useBankAnalytics();
  const queueApps = useMemo(() => queueQuery.data?.applications ?? [], [queueQuery.data?.applications]);
  const applications = useMemo(() => queueApps.slice(0, 5), [queueApps]);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return applications;
    return applications.filter((item) =>
      [item.application_id, item.applicant_name, item.dealer_name, item.vehicle_label].some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(q)
      )
    );
  }, [applications, search]);

  const analytics = analyticsQuery.data;
  const pending =
    analytics != null
      ? Object.entries(analytics.applications_by_status).reduce(
          (sum, [status, count]) => (["APROBADO", "RECHAZADO", "CONTRA_OFERTA"].includes(status) ? sum : sum + count),
          0
        )
      : null;

  const kpiFromQueue = useMemo(() => {
    const now = new Date();
    let approvedToday = 0;
    let rejectedToday = 0;
    let volumeMonth = 0;
    const y = now.getFullYear();
    const m = now.getMonth();
    for (const row of queueApps) {
      const decided = row.bank_decision;
      if (decided?.decided_at) {
        if (decided.decision === "APROBADO" && isSameLocalDay(decided.decided_at, now)) approvedToday += 1;
        if (decided.decision === "RECHAZADO" && isSameLocalDay(decided.decided_at, now)) rejectedToday += 1;
      }
      if (row.created_at) {
        const c = new Date(row.created_at);
        if (c.getFullYear() === y && c.getMonth() === m) volumeMonth += Number(row.requested_amount) || 0;
      }
    }
    return { approvedToday, rejectedToday, volumeMonth };
  }, [queueApps]);

  const volumeTrend = useMemo(() => {
    const cohort = analytics?.cohort_analysis;
    if (!cohort || cohort.length < 2) return undefined;
    const sorted = [...cohort].sort((a, b) => a.period.localeCompare(b.period));
    const prev = sorted[sorted.length - 2]!.approved;
    const cur = sorted[sorted.length - 1]!.approved;
    if (prev === 0 && cur === 0) return undefined;
    const diff = cur - prev;
    const pct = prev === 0 ? 100 : Math.round((diff / prev) * 100);
    const es = tenantConfig.locale.toLowerCase().startsWith("es");
    return {
      direction: diff > 0 ? ("up" as const) : diff < 0 ? ("down" as const) : ("neutral" as const),
      value: `${diff >= 0 ? "+" : "−"}${Math.abs(pct)}%`,
      label: es ? "aprobadas vs cohorte previa" : "approved vs prior cohort",
    };
  }, [analytics, tenantConfig.locale]);

  const columns = useMemo(
    () => [
      {
        id: "applicant",
        header: "Solicitante",
        cell: (row: BankQueueItem) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-forgeInk-800">{row.applicant_name || "Cliente sin nombre"}</span>
            <span className="font-mono text-[13px] font-semibold text-forgeInk-700">{row.application_id}</span>
            <span className="text-forge-xs text-forgeInk-500">
              {t.bank.application_score_label}:{" "}
              <span className="font-forgeMono font-semibold tabular-nums">{row.score}</span>
            </span>
            <div className="flex flex-wrap gap-1">{priorityBadge(row.priority)}</div>
          </div>
        ),
      },
      {
        id: "product",
        header: "Producto / dealer",
        cell: (row: BankQueueItem) => (
          <span className="text-forge-sm text-forgeInk-600">
            {row.vehicle_label || "—"} · {row.dealer_name || "—"}
          </span>
        ),
      },
      {
        id: "amount",
        header: "Monto",
        className: "text-right tabular-nums [font-feature-settings:'tnum']",
        cell: (row: BankQueueItem) => (
          <span className="font-forgeMono text-forge-sm font-medium text-forgeInk-800">
            {formatForgeCurrency(Number(row.requested_amount) || 0, tenantConfig.locale, tenantConfig.currency_code)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Estado",
        className: "w-[1%] whitespace-nowrap",
        cell: (row: BankQueueItem) => <StatusPill tone={queueTone(row)}>{queueLabel(row)}</StatusPill>,
      },
      {
        id: "submitted",
        header: "Enviada",
        className: "whitespace-nowrap text-forgeInk-600",
        cell: (row: BankQueueItem) => (
          <span className="text-forge-xs">
            {row.created_at
              ? new Intl.DateTimeFormat(tenantConfig.locale.toLowerCase().startsWith("es") ? "es-DO" : "en-US", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date(row.created_at))
              : "—"}
          </span>
        ),
      },
      {
        id: "action",
        header: "",
        className: "w-28 text-right",
        cell: (row: BankQueueItem) => (
          <Link
            href={`/credit-hub/bank/applications/${row.application_id}`}
            className="inline-flex min-h-9 min-w-[44px] items-center justify-end gap-0.5 text-forge-sm font-medium text-forgeBrand-600 hover:text-forgeBrand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
          >
            Revisar
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </Link>
        ),
      },
    ],
    [t.bank.application_score_label, tenantConfig.currency_code, tenantConfig.locale]
  );

  return (
    <div className="space-y-8" data-persona={persona}>
      <Card variant="default" className="border-forgeInk-200 bg-forgeSurface-card px-6 pt-8 pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 font-sans text-[14px] font-normal leading-snug text-forgeInk-500">
              {forgeTimeGreeting(tenantConfig.locale)}, {tenantConfig.institution_name}
            </p>
            <h1
              className="font-display font-normal leading-[1.1] tracking-[-0.015em] text-forgeInk-800"
              style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
            >
              Mesa de decisiones
            </h1>
            <p className="mt-2 max-w-2xl text-forge-sm text-forgeInk-600">{t.bank.hero_compliance_line}</p>
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-forge-md bg-forgeBrand-50 text-forgeBrand-600">
            <Building2 className="h-8 w-8" aria-hidden />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={ClipboardList}
          label="Solicitudes pendientes"
          value={analyticsQuery.isLoading ? <Skeleton className="h-10 w-16" /> : String(pending ?? "—")}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Aprobadas hoy"
          value={queueQuery.isLoading ? <Skeleton className="h-10 w-12" /> : String(kpiFromQueue.approvedToday)}
        />
        <KpiCard
          icon={XCircle}
          label="Rechazadas hoy"
          value={queueQuery.isLoading ? <Skeleton className="h-10 w-12" /> : String(kpiFromQueue.rejectedToday)}
        />
        <KpiCard
          icon={TrendingUp}
          label="Volumen del mes"
          value={
            queueQuery.isLoading ? (
              <Skeleton className="h-10 w-28" />
            ) : (
              formatForgeCurrency(kpiFromQueue.volumeMonth, tenantConfig.locale, tenantConfig.currency_code)
            )
          }
          trend={volumeTrend}
        />
      </div>

      <section className="space-y-4" aria-labelledby="bank-queue-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="bank-queue-heading" className="font-display text-forge-md font-bold text-forgeInk-800 sm:text-[length:var(--forge-text-xl)]">
            Bandeja priorizada
          </h2>
          <Button
            type="button"
            variant="ghost"
            trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden />}
            onClick={() => router.push("/credit-hub/bank/applications")}
          >
            Ver bandeja completa
          </Button>
        </div>
        <div className="max-w-md">
          <Input
            name="queue-search"
            label="Filtrar vista"
            placeholder="Nombre, ID, dealer, vehículo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {queueQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-forge-md" />
            <Skeleton className="h-12 w-full rounded-forge-md" />
            <Skeleton className="h-12 w-full rounded-forge-md" />
          </div>
        ) : queueQuery.error ? (
          <EmptyState
            titleLevel={2}
            icon={<AlertCircle className="text-forgeDanger-500" />}
            title={empty.bankQueueErrorTitle}
            description={empty.bankQueueErrorBody}
            action={
              <Button type="button" variant="secondary" className="min-h-12" onClick={() => router.push("/credit-hub/bank/applications")}>
                {empty.bankQueueErrorCta}
              </Button>
            }
          />
        ) : queueApps.length === 0 ? (
          <EmptyState
            titleLevel={2}
            icon={<Inbox />}
            title={empty.bankQueueZeroTitle}
            description={empty.bankQueueZeroBody}
            action={
              <Button type="button" variant="primary" className="min-h-12" trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden />} onClick={() => router.push("/credit-hub/bank/applications")}>
                {empty.bankQueueZeroCta}
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            titleLevel={2}
            icon={<Search />}
            title={empty.bankQueueFilteredTitle}
            description={empty.bankQueueFilteredBody}
            action={
              <Button type="button" variant="secondary" className="min-h-12" onClick={() => setSearch("")}>
                {empty.bankQueueFilteredCta}
              </Button>
            }
          />
        ) : (
          <DataTable<BankQueueItem>
            getRowId={(r) => r.application_id}
            rows={filtered}
            columns={columns}
            emptyLabel="Sin filas"
          />
        )}
      </section>
    </div>
  );
}
