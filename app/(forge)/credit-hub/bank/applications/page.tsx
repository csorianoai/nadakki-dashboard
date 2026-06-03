"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, Inbox, Search } from "lucide-react";
import { usePersona } from "@/components/credit-hub/system/PersonaProvider";
import {
  Button,
  Card,
  Checkbox,
  DataTable,
  EmptyState,
  Input,
  Select,
  Skeleton,
  StatusPill,
  Textarea,
} from "@/components/forge";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { BankQueuePagination } from "@/components/credit-hub/bank/BankQueuePagination";
import { BANK_QUEUE_PAGE_SIZE, resolveBankQueueTotal } from "@/lib/credit-hub/bank/queuePagination";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";
import { useBulkActions } from "@/lib/credit-hub/hooks/useBulkActions";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import type { BankBulkRule, BankQueueItem } from "@/lib/credit-hub/types/bankDecision";
import { forgeEmptyCopy } from "@/utils/forge-empty-copy";

function formatShortDateTime(iso: string | null, locale: string): string {
  if (!iso) return "—";
  try {
    const l = locale.toLowerCase().startsWith("es") ? "es-DO" : "en-US";
    return new Intl.DateTimeFormat(l, { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function formatSyncAge(dataUpdatedAt: number | undefined, locale: string): string {
  if (dataUpdatedAt == null || Number.isNaN(dataUpdatedAt)) return "—";
  const sec = Math.max(0, Math.floor((Date.now() - dataUpdatedAt) / 1000));
  const loc = locale.toLowerCase().startsWith("es") ? "es-DO" : "en-US";
  const rtf = new Intl.RelativeTimeFormat(loc, { numeric: "auto" });
  if (sec < 45) return rtf.format(-sec, "second");
  const min = Math.floor(sec / 60);
  if (min < 60) return rtf.format(-min, "minute");
  const hr = Math.floor(min / 60);
  if (hr < 72) return rtf.format(-hr, "hour");
  const day = Math.floor(hr / 24);
  return rtf.format(-day, "day");
}


function formatDop(value: number) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(value || 0);
}

function priorityTone(priority: BankQueueItem["priority"]): "danger" | "warning" | "neutral" {
  if (priority === "ALTA") return "danger";
  if (priority === "MEDIA") return "warning";
  return "neutral";
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

export default function BankApplicationsQueuePage() {
  return (
    <Suspense fallback={<BankApplicationsSkeleton />}>
      <BankApplicationsQueueInner />
    </Suspense>
  );
}

function BankApplicationsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-24 w-full max-w-2xl rounded-forge-md" />
      <Skeleton className="h-12 w-full rounded-forge-md" />
      <Skeleton className="h-48 w-full rounded-forge-md" />
    </div>
  );
}

function BankApplicationsQueueInner() {
  const persona = usePersona();
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { tenantConfig } = useTenantConfig();
  const empty = forgeEmptyCopy(tenantConfig.locale);
  const urlQ = searchParams.get("q") ?? "";
  const urlPageRaw = searchParams.get("page") ?? "1";
  const page = Math.max(1, Number.parseInt(urlPageRaw, 10) || 1);
  const queueFilters = useMemo(() => (urlQ.trim() ? { q: urlQ.trim() } : undefined), [urlQ]);
  const queueQuery = useBankQueue({
    limit: BANK_QUEUE_PAGE_SIZE,
    offset: (page - 1) * BANK_QUEUE_PAGE_SIZE,
    filters: queueFilters,
  });
  const applications = queueQuery.data?.applications ?? [];
  const queueTotal = resolveBankQueueTotal(queueQuery.data);
  const [search, setSearch] = useState(urlQ);
  const [selected, setSelected] = useState<string[]>([]);
  const [rule, setRule] = useState<BankBulkRule>("APROBAR_SCORE_GTE_800");
  const [justification, setJustification] = useState("");
  const bulkMutation = useBulkActions();

  useEffect(() => {
    setSearch(urlQ);
  }, [urlQ]);

  const replaceQuery = useCallback(
    (next: { q?: string; page?: number }) => {
      const p = new URLSearchParams(searchParams.toString());
      if (next.q !== undefined) {
        if (next.q.trim()) p.set("q", next.q.trim());
        else p.delete("q");
        p.delete("page");
      }
      if (next.page !== undefined) {
        if (next.page > 1) p.set("page", String(next.page));
        else p.delete("page");
      }
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (search.trim() === urlQ.trim()) return;
    const id = window.setTimeout(() => replaceQuery({ q: search }), 400);
    return () => window.clearTimeout(id);
  }, [search, urlQ, replaceQuery]);

  const clearFilters = () => {
    setSearch("");
    replaceQuery({ q: "" });
  };

  const goToPage = useCallback(
    (nextPage: number) => {
      replaceQuery({ page: Math.max(1, nextPage) });
    },
    [replaceQuery]
  );

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

  const ruleOptions = useMemo(
    () => [
      { value: "APROBAR_SCORE_GTE_800", label: "Aprobar todas con puntaje ≥ 800" },
      { value: "RECHAZAR_SCORE_LT_580", label: "Rechazar todas con puntaje < 580" },
      { value: "REVISAR_BORDERLINE", label: t.bank.borderline_rule_label },
      { value: "SOLICITAR_DOCUMENTOS", label: "Solicitar documentos" },
    ],
    [t.bank.borderline_rule_label]
  );

  const columns = useMemo(
    () => [
      {
        id: "select",
        header: (
          <span className="inline-flex min-h-9 items-center py-0.5">
            <Checkbox
              label=""
              aria-label="Seleccionar todas las solicitudes visibles"
              checked={filtered.length > 0 && selected.length === filtered.length}
              onChange={(e) => setSelected(e.target.checked ? filtered.map((item) => item.application_id) : [])}
            />
          </span>
        ),
        className: "w-12",
        cell: (row: BankQueueItem) => (
          <Checkbox
            label=""
            aria-label={`Seleccionar solicitud ${row.application_id}`}
            checked={selected.includes(row.application_id)}
            onChange={(e) =>
              setSelected((cur) =>
                e.target.checked ? [...cur, row.application_id] : cur.filter((id) => id !== row.application_id)
              )
            }
          />
        ),
      },
      {
        id: "application_id",
        header: "ID",
        cell: (row: BankQueueItem) => (
          <span className="font-mono text-[13px] font-semibold text-forgeGray-900">{row.application_id}</span>
        ),
      },
      {
        id: "applicant",
        header: "Solicitante",
        cell: (row: BankQueueItem) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium text-forgeGray-800">{row.applicant_name || "Cliente sin nombre"}</span>
            <span className="text-forge-xs text-forgeGray-500">
              {row.vehicle_label || "—"} · {row.dealer_name || "—"}
            </span>
            <span className="text-forge-xs text-forgeGray-500">
              {t.bank.application_score_label}:{" "}
              <span className="font-forgeMono font-semibold tabular-nums text-forgeGray-700">{row.score}</span> ·{" "}
              <StatusPill tone={priorityTone(row.priority)} className="align-middle">
                {row.priority}
              </StatusPill>
            </span>
          </div>
        ),
      },
      {
        id: "amount",
        header: "Monto",
        className: "text-right tabular-nums [font-feature-settings:'tnum']",
        cell: (row: BankQueueItem) => (
          <span className="font-forgeMono text-forge-sm font-medium text-forgeGray-800">{formatDop(row.requested_amount)}</span>
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
        className: "whitespace-nowrap text-forgeGray-600",
        cell: (row: BankQueueItem) => (
          <span className="text-forge-xs">{formatShortDateTime(row.created_at, tenantConfig.locale)}</span>
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
    [filtered, selected, t.bank.application_score_label, tenantConfig.locale]
  );

  const runBulk = async () => {
    await bulkMutation.mutateAsync({
      applicationIds: selected,
      rule,
      analystId: "bank-analyst-demo",
      justification,
    });
    setJustification("");
    setSelected([]);
  };

  return (
    <div className="space-y-6" data-persona={persona}>
      <Card variant="default" className="border-forgeGray-200 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <h1
            className="min-w-0 font-display font-normal leading-tight tracking-[-0.01em] text-forgeGray-800"
            style={{ fontSize: "clamp(28px, 4vw, 40px)" }}
          >
            Solicitudes priorizadas
          </h1>
          <p className="shrink-0 font-sans text-[13px] text-forgeGray-600 sm:text-right">
            <span className="font-medium tabular-nums text-forgeGray-700">
              {queueTotal != null ? queueTotal : filtered.length}
            </span>
            <span className="text-forgeGray-500"> en bandeja · Última sync: </span>
            <span>{formatSyncAge(queueQuery.dataUpdatedAt, tenantConfig.locale)}</span>
          </p>
        </div>
        <p className="mt-2 text-forge-sm text-forgeGray-600">{t.bank.applications_subtitle}</p>
      </Card>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <Input
          name="queue-search"
          label="Buscar en bandeja"
          placeholder={t.bank.queue_search_placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          prefix={<Search className="h-4 w-4" aria-hidden />}
        />
        <Card variant="inset" className="flex items-center px-4 py-3">
          <p className="text-forge-sm text-forgeGray-600">{t.bank.queue_order_caption}</p>
        </Card>
      </div>

      {queueQuery.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-forge-md" />
          <Skeleton className="h-12 w-full rounded-forge-md" />
        </div>
      ) : queueQuery.error ? (
        <EmptyState
          titleLevel={2}
          icon={<AlertCircle className="text-forgeDanger-500" />}
          title={empty.bankAppsErrorTitle}
          description="Error cargando la bandeja. Intente de nuevo."
          action={
            <Button
              type="button"
              variant="secondary"
              className="min-h-12"
              loading={queueQuery.isFetching}
              onClick={() => void queueQuery.refetch()}
            >
              Reintentar
            </Button>
          }
        />
      ) : applications.length === 0 ? (
        <EmptyState titleLevel={2} icon={<Inbox />} title={empty.bankAppsEmptyTitle} description={empty.bankAppsEmptyBody} />
      ) : filtered.length === 0 ? (
        <EmptyState
          titleLevel={2}
          icon={<Search />}
          title={empty.bankAppsFilteredTitle}
          description={empty.bankAppsFilteredBody}
          action={
            <Button type="button" variant="secondary" className="min-h-12" onClick={clearFilters}>
              {empty.bankAppsFilteredCta}
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <DataTable<BankQueueItem>
            getRowId={(r) => r.application_id}
            getRowClassName={(row) =>
              selected.includes(row.application_id)
                ? "before:absolute before:inset-y-0 before:left-0 before:z-0 before:w-0.5 before:bg-forgeBrand-500"
                : undefined
            }
            rows={filtered}
            columns={columns}
            emptyLabel="Sin filas"
          />
          <BankQueuePagination
            page={page}
            pageSize={BANK_QUEUE_PAGE_SIZE}
            rowCount={filtered.length}
            meta={queueQuery.data}
            locale={tenantConfig.locale}
            onPageChange={goToPage}
            disabled={queueQuery.isFetching}
          />
        </div>
      )}

      {selected.length > 0 ? (
        <div className="sticky bottom-4 z-20">
          <Card variant="default" className="border-forgeBrand-500/30 bg-forgeBrand-50/80 p-4 shadow-forge-md backdrop-blur-sm">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <Select
                name="bulk-rule"
                label={`Acción en lote (${selected.length} seleccionadas)`}
                value={rule}
                onChange={(e) => setRule(e.target.value as BankBulkRule)}
                options={ruleOptions}
              />
              <Textarea
                name="bulk-justification"
                label="Justificación obligatoria"
                placeholder={t.bank.bulk_rule_placeholder}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={2}
              />
              <Button
                type="button"
                variant="primary"
                className="min-h-12"
                loading={bulkMutation.isPending}
                disabled={!justification.trim()}
                onClick={() => void runBulk()}
              >
                Confirmar lote
              </Button>
            </div>
          </Card>
          {bulkMutation.data ? (
            <p className="mt-2 rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken p-3 text-forge-sm text-forgeGray-800">
              {t.bank.bulk_result(bulkMutation.data.processed, bulkMutation.data.skipped, bulkMutation.data.errors)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
