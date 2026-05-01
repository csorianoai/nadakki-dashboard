"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, Building2 } from "lucide-react";
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
import { useBankAnalytics } from "@/lib/credit-hub/hooks/useBankAnalytics";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";

function formatDop(value: number) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(value || 0);
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

export default function BankDashboardPage() {
  const router = useRouter();
  const persona = usePersona();
  const t = useTranslations();
  const queueQuery = useBankQueue();
  const analyticsQuery = useBankAnalytics();
  const applications = useMemo(() => (queueQuery.data?.applications ?? []).slice(0, 5), [queueQuery.data?.applications]);
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

  const columns = useMemo(
    () => [
      {
        id: "applicant",
        header: "Solicitante",
        cell: (row: BankQueueItem) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-forgeInk-800">{row.applicant_name || "Cliente sin nombre"}</span>
            <span className="text-forge-xs text-forgeInk-500">{row.application_id}</span>
            <div className="flex flex-wrap gap-1">{priorityBadge(row.priority)}</div>
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
        cell: (row: BankQueueItem) => <span className="font-forgeMono text-forge-sm font-semibold text-forgeInk-800">{row.score}</span>,
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
    [t.bank.application_score_label]
  );

  return (
    <div className="space-y-8" data-persona={persona}>
      <Card variant="default" className="border-forgeInk-200 bg-forgeSurface-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-forge-xs font-semibold uppercase tracking-wide text-forgeBrand-600">Portal bancario</p>
            <h1 className="mt-2 font-display text-forge-md font-bold text-forgeInk-800 sm:text-[length:var(--forge-text-2xl)]">
              Mesa de decisiones CrediCefi
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
          label="Solicitudes"
          value={analyticsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (analytics?.total_applications ?? "—")}
        />
        <KpiCard
          label="Pendientes"
          value={analyticsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : pending ?? "—"}
        />
        <KpiCard
          label="Aprobación %"
          value={
            analyticsQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : analytics ? (
              `${Math.round(analytics.approval_rate * 100)}%`
            ) : (
              "—"
            )
          }
        />
        <KpiCard
          label="Cartera activa"
          value={
            analyticsQuery.isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : analytics ? (
              `RD$ ${Math.round(analytics.portfolio_value).toLocaleString("es-DO")}`
            ) : (
              "—"
            )
          }
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
          <EmptyState titleLevel={2} title="No se pudo cargar la bandeja" description="Reintente en unos momentos o abra la bandeja completa." />
        ) : filtered.length === 0 ? (
          <EmptyState titleLevel={2} title="Sin solicitudes en esta vista" description="Ajuste el filtro o abra la bandeja completa." />
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
