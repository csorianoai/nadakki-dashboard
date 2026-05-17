"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { BankQueueErrorBoundary } from "@/components/bank-queue/BankQueueErrorBoundary";
import {
  BANK_QUEUE_DEFAULT_LIMIT,
  BANK_QUEUE_VIRTUALIZATION_ROW_CAP,
  OPTIMISTIC_CLAIM_TIMEOUT_MS,
  QUEUE_POLLING_INTERVAL_SEC,
} from "@/lib/bank-queue/constants";
import { BankQueueAuthError, BankQueueHttpError } from "@/lib/bank-queue/errors";
import { fetchBankApplicationsQueue, postBankApplicationClaim } from "@/lib/bank-queue/fetch-queue";
import type { BankQueueApplication, BankQueueTenantThresholds } from "@/lib/bank-queue/types";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import type { QueueFiltersState } from "./components/QueueFilters";
import { QueueFilters } from "./components/QueueFilters";
import { QueueSkeleton } from "./components/QueueSkeleton";
import { QueueTable } from "./components/QueueTable";

const CREDIT_HUB_BANK_DETAIL_BASE = "/credit-hub/bank/applications";

function clampLimit(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return BANK_QUEUE_DEFAULT_LIMIT;
  return Math.min(100, Math.max(1, Math.floor(n)));
}

function BankApplicationsQueueInner() {
  const router = useRouter();
  const pathname = usePathname();

  const searchRef = useRef<HTMLInputElement | null>(null);
  const rowElementsRef = useRef<(HTMLTableRowElement | null)[]>([]);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<QueueFiltersState>({
    status: "",
    sortBy: "sla_priority",
    limit: BANK_QUEUE_DEFAULT_LIMIT,
  });

  const [applications, setApplications] = useState<BankQueueApplication[]>([]);
  const applicationsRef = useRef(applications);
  applicationsRef.current = applications;

  const [totalCount, setTotalCount] = useState(0);
  const [thresholds, setThresholds] = useState<BankQueueTenantThresholds | null>(null);

  const [initialLoad, setInitialLoad] = useState(true);
  const [pollStale, setPollStale] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  const [focusedRowIndex, setFocusedRowIndex] = useState(0);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  useEffect(() => {
    const onlineHandler = () => setOnline(true);
    const offlineHandler = () => setOnline(false);
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);
    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
    };
  }, []);

  const filteredApplications = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter((row) =>
      [row.borrower_name, row.dealer_name, row.application_id, row.status].some((field) =>
        String(field || "").toLowerCase().includes(q),
      ),
    );
  }, [applications, search]);

  useEffect(() => {
    setFocusedRowIndex((idx) => Math.min(Math.max(0, idx), Math.max(0, filteredApplications.length - 1)));
  }, [filteredApplications.length]);

  const captureRowRef = useCallback((index: number, el: HTMLTableRowElement | null) => {
    rowElementsRef.current[index] = el;
  }, []);

  const handleHttpError = useCallback((err: unknown, context: string) => {
    if (err instanceof BankQueueAuthError) {
      window.location.href = `/login?next=${encodeURIComponent(pathname)}`;
      return;
    }
    if (err instanceof BankQueueHttpError) {
      if (err.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(pathname)}`;
        return;
      }
      if (err.status === 403) {
        setForbidden(true);
        console.error(`${context}.forbidden`, { status: err.status, code: err.code });
        return;
      }
      if (err.status === 400) {
        setValidationMessage(err.message);
        toast.error("Parámetros inválidos para la bandeja.");
        console.error(`${context}.validation`, { status: err.status, message: err.message });
        return;
      }
      if (err.status === 503) {
        toast.error("Servicio no disponible. Intenta de nuevo.");
        console.error(`${context}.unavailable`, { status: err.status });
        return;
      }
      if (err.status >= 500) {
        toast.error("Error del servidor. Usa Reintentar o espera el siguiente refresco.");
        console.error(`${context}.server_error`, { status: err.status });
        return;
      }
    }
    console.error(`${context}.unexpected`, { error: err });
    toast.error("No se pudo completar la operación.");
  }, [pathname]);

  const loadPage = useCallback(
    async (offset: number, mode: "replace" | "append") => {
      const f = filtersRef.current;
      const payload = await fetchBankApplicationsQueue({
        status: f.status || undefined,
        sortBy: f.sortBy,
        limit: clampLimit(f.limit),
        offset: Math.max(0, offset),
      });
      setTotalCount(payload.total_count);
      setThresholds(payload.tenant_thresholds);
      setForbidden(false);
      setValidationMessage(null);
      if (mode === "replace") {
        setApplications(payload.applications);
      } else {
        setApplications((prev) => {
          const seen = new Set(prev.map((a) => a.application_id));
          const next = [...prev];
          for (const row of payload.applications) {
            if (!seen.has(row.application_id)) {
              seen.add(row.application_id);
              next.push(row);
            }
          }
          return next;
        });
      }
    },
    [],
  );

  const handleOpenApplication = useCallback(
    async (applicationId: string) => {
      const detailHref = `${CREDIT_HUB_BANK_DETAIL_BASE}/${applicationId}`;
      const returnHref = pathname || "/bank/applications/queue";

      router.push(detailHref);

      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), OPTIMISTIC_CLAIM_TIMEOUT_MS);

      try {
        const res = await postBankApplicationClaim(applicationId, controller.signal);
        window.clearTimeout(timer);

        if (res.status === 401) {
          window.location.href = `/login?next=${encodeURIComponent(returnHref)}`;
          return;
        }
        if (res.status === 403) {
          toast.error("Permiso denegado para reclamar esta solicitud.");
          router.replace(returnHref);
          return;
        }
        if (res.status === 409) {
          toast.message("Esta solicitud ya está tomada por otro analista.", { duration: 4000 });
          return;
        }
        if (res.status === 503) {
          toast.error("Servicio no disponible. Volviendo a la bandeja.");
          router.replace(returnHref);
          return;
        }
        if (res.status >= 500) {
          toast.error("Error del servidor al reclamar. Volviendo a la bandeja.");
          router.replace(returnHref);
          return;
        }
        if (!res.ok) {
          router.replace(returnHref);
          toast.error("No se pudo iniciar la revisión.");
        }
      } catch (err) {
        window.clearTimeout(timer);
        console.error("bank_queue.claim_failed", { applicationId, error: err });
        toast.error("Sin conexión o tiempo agotado. Volviendo a la bandeja.");
        router.replace(returnHref);
      }
    },
    [pathname, router],
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!online) return;
      try {
        await loadPage(0, "replace");
        if (cancelled) return;
        setPollStale(false);
        setInitialLoad(false);
      } catch (err) {
        if (cancelled) return;
        if (applicationsRef.current.length > 0) setPollStale(true);
        handleHttpError(err, "bank_queue.bootstrap");
        setInitialLoad(false);
      }
    };

    void run();

    const id = window.setInterval(() => {
      if (document.hidden || !online) return;
      void (async () => {
        try {
          await loadPage(0, "replace");
          setPollStale(false);
        } catch (err) {
          if (applicationsRef.current.length > 0) setPollStale(true);
          handleHttpError(err, "bank_queue.interval");
        }
      })();
    }, QUEUE_POLLING_INTERVAL_SEC * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [filters.sortBy, filters.limit, filters.status, handleHttpError, loadPage, online]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = Boolean(target?.matches?.("input, textarea, select"));

      if (e.key === "Escape") {
        setShortcutsOpen(false);
      }

      if (isInput) return;

      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen(true);
      }
      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        const max = filteredApplications.length - 1;
        if (max < 0) return;
        const next = Math.min(max, focusedRowIndex + 1);
        setFocusedRowIndex(next);
        queueMicrotask(() => rowElementsRef.current[next]?.focus());
      }
      if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        const max = filteredApplications.length - 1;
        if (max < 0) return;
        const next = Math.max(0, focusedRowIndex - 1);
        setFocusedRowIndex(next);
        queueMicrotask(() => rowElementsRef.current[next]?.focus());
      }
      if (e.key === "Enter") {
        const row = filteredApplications[focusedRowIndex];
        if (!row) return;
        const active = document.activeElement as HTMLElement | undefined;
        if (active?.closest?.("button,a,input,textarea")) return;
        e.preventDefault();
        void handleOpenApplication(row.application_id);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filteredApplications, focusedRowIndex, handleOpenApplication]);

  const patchFilters = useCallback((patch: Partial<QueueFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setFocusedRowIndex(0);
  }, []);

  const canLoadMore = applications.length > 0 && applications.length < totalCount;

  const handleLoadMore = useCallback(async () => {
    try {
      await loadPage(applications.length, "append");
    } catch (err) {
      handleHttpError(err, "bank_queue.load_more");
    }
  }, [applications.length, handleHttpError, loadPage]);

  const virtualizationBanner =
    filteredApplications.length > BANK_QUEUE_VIRTUALIZATION_ROW_CAP ? (
      <div
        role="status"
        aria-live="polite"
        className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-forge-xs text-amber-950"
      >
        Mostrando las primeras {BANK_QUEUE_VIRTUALIZATION_ROW_CAP} filas visibles de{" "}
        {filteredApplications.length}. Refina filtros o usa &quot;Cargar más&quot; para paginar desde el servidor.
      </div>
    ) : null;

  return (
    <main className="bank-queue-page mx-auto max-w-7xl space-y-6 p-4 md:p-8" aria-label="Application queue">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-normal tracking-tight text-forgeGray-900 md:text-4xl">
          Bandeja de solicitudes
        </h1>
        <p className="max-w-3xl text-forge-sm text-forgeGray-600">
          Priorización por SLA, métricas PTI/DTI y refresco automático cada {QUEUE_POLLING_INTERVAL_SEC}s cuando la pestaña está visible.
        </p>
      </header>

      {!online ? (
        <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-forge-sm text-amber-950">
          Sin conexión: los datos pueden estar desactualizados hasta recuperar red.
        </div>
      ) : null}

      {pollStale ? (
        <div role="status" aria-live="polite" className="rounded-lg border border-forgeGray-300 bg-forgeGray-50 px-4 py-3 text-forge-sm text-forgeGray-900">
          La última actualización falló; mostramos datos previos. Prueba Reintentar o espera el siguiente ciclo.
        </div>
      ) : null}

      {forbidden ? (
        <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-forge-sm text-rose-950">
          Tu rol no está autorizado para esta bandeja (403).
        </div>
      ) : null}

      {validationMessage ? (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-forge-sm text-rose-950">
          {validationMessage}
        </div>
      ) : null}

      <QueueFilters
        searchRef={searchRef}
        search={search}
        filters={filters}
        onSearchChange={setSearch}
        onFiltersChange={patchFilters}
      />

      <div aria-live="polite" className="sr-only">
        Total en servidor: {totalCount}. Filas cargadas: {applications.length}.
      </div>

      {initialLoad ? (
        <QueueSkeleton />
      ) : filteredApplications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-forgeGray-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-medium text-forgeGray-900">No hay solicitudes en esta vista</p>
          <p className="mt-2 text-forge-sm text-forgeGray-600">
            Cambia filtros o espera nuevas aplicaciones desde dealer.
          </p>
          <button
            type="button"
            className="mt-6 rounded-lg border border-forgeGray-300 px-4 py-2 text-forge-sm font-medium text-forgeGray-800 hover:bg-forgeGray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
            onClick={() => void loadPage(0, "replace").catch((err) => handleHttpError(err, "bank_queue.retry_empty"))}
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <QueueTable
            applications={filteredApplications}
            thresholds={thresholds}
            focusedRowIndex={focusedRowIndex}
            captureRowRef={captureRowRef}
            onFocusRowIndex={setFocusedRowIndex}
            onOpenApplication={handleOpenApplication}
            virtualizationBanner={virtualizationBanner}
          />

          {canLoadMore ? (
            <div className="flex justify-center">
              <button
                type="button"
                className="rounded-lg bg-forgeGray-900 px-4 py-2 text-forge-sm font-medium text-white hover:bg-forgeGray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
                onClick={() => void handleLoadMore()}
              >
                Cargar más
              </button>
            </div>
          ) : null}
        </>
      )}

      <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      {!initialLoad ? (
        <div className="flex justify-end">
          <button
            type="button"
            className="text-forge-sm font-medium text-forgeBrand-700 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
            onClick={() => void loadPage(0, "replace").catch((err) => handleHttpError(err, "bank_queue.manual_refresh"))}
          >
            Actualizar ahora
          </button>
        </div>
      ) : null}
    </main>
  );
}

export default function BankApplicationsQueuePage() {
  return (
    <BankQueueErrorBoundary>
      <BankApplicationsQueueInner />
    </BankQueueErrorBoundary>
  );
}
