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
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";
import { useBulkActions } from "@/lib/credit-hub/hooks/useBulkActions";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import type { BankBulkRule, BankQueueItem } from "@/lib/credit-hub/types/bankDecision";
import { forgeEmptyCopy } from "@/utils/forge-empty-copy";

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
  const queueQuery = useBankQueue();
  const applications = queueQuery.data?.applications ?? [];
  const urlQ = searchParams.get("q") ?? "";
  const [search, setSearch] = useState(urlQ);
  const [selected, setSelected] = useState<string[]>([]);
  const [rule, setRule] = useState<BankBulkRule>("APROBAR_SCORE_GTE_800");
  const [justification, setJustification] = useState("");
  const bulkMutation = useBulkActions();

  useEffect(() => {
    setSearch(urlQ);
  }, [urlQ]);

  const replaceQuery = useCallback(
    (q: string) => {
      const p = new URLSearchParams(searchParams.toString());
      if (q.trim()) p.set("q", q.trim());
      else p.delete("q");
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (search.trim() === urlQ.trim()) return;
    const id = window.setTimeout(() => replaceQuery(search), 400);
    return () => window.clearTimeout(id);
  }, [search, urlQ, replaceQuery]);

  const clearFilters = () => {
    setSearch("");
    replaceQuery("");
  };

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
          <span className="inline-flex min-h-12 items-center py-1">
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
        id: "applicant",
        header: "Solicitante",
        cell: (row: BankQueueItem) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-forgeInk-800">{row.applicant_name || "Cliente sin nombre"}</span>
            <span className="text-forge-xs text-forgeInk-500">{row.application_id}</span>
            <StatusPill tone={priorityTone(row.priority)}>{row.priority}</StatusPill>
          </div>
        ),
      },
      {
        id: "product",
        header: "Producto / dealer",
        cell: (row: BankQueueItem) => (
          <span className="text-forgeInk-600">
            {row.vehicle_label || "—"} · {row.dealer_name || "—"}
          </span>
        ),
      },
      {
        id: "score",
        header: t.bank.application_score_label,
        cell: (row: BankQueueItem) => <span className="font-forgeMono font-semibold text-forgeInk-800">{row.score}</span>,
      },
      {
        id: "amount",
        header: "Monto",
        cell: (row: BankQueueItem) => <span className="text-forge-sm text-forgeInk-800">{formatDop(row.requested_amount)}</span>,
      },
      {
        id: "status",
        header: "Estado",
        cell: (row: BankQueueItem) => <StatusPill tone={queueTone(row)}>{queueLabel(row)}</StatusPill>,
      },
      {
        id: "action",
        header: "",
        className: "w-28 text-right",
        cell: (row: BankQueueItem) => (
          <Link
            href={`/credit-hub/bank/applications/${row.application_id}`}
            className="inline-flex min-h-12 min-w-[44px] items-center text-forge-sm font-medium text-forgeBrand-600 hover:text-forgeBrand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
          >
            Revisar <ArrowRight className="ml-1 inline h-3 w-3" aria-hidden />
          </Link>
        ),
      },
    ],
    [filtered, selected, t.bank.application_score_label]
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
      <Card variant="default" className="border-forgeInk-200 p-6">
        <p className="text-forge-xs font-semibold uppercase tracking-wide text-forgeBrand-600">Bandeja bancaria</p>
        <h1 className="mt-1 font-display text-forge-md font-bold text-forgeInk-800 sm:text-[length:var(--forge-text-2xl)]">
          Solicitudes priorizadas
        </h1>
        <p className="mt-1 text-forge-sm text-forgeInk-600">{t.bank.applications_subtitle}</p>
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
          <p className="text-forge-sm text-forgeInk-600">{t.bank.queue_order_caption}</p>
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
          description={empty.bankAppsErrorBody}
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
        <DataTable<BankQueueItem> getRowId={(r) => r.application_id} rows={filtered} columns={columns} emptyLabel="Sin filas" />
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
            <p className="mt-2 rounded-forge-md border border-forgeInk-200 bg-forgeSurface-sunken p-3 text-forge-sm text-forgeInk-800">
              {t.bank.bulk_result(bulkMutation.data.processed, bulkMutation.data.skipped, bulkMutation.data.errors)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
