// COPIA SIN ENLACE. La viva es app/(forge)/credit-hub/**
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Filter, Loader2, RotateCcw, Save } from "lucide-react";
import { CreditTenantGate } from "@/app/credit/CreditTenantGate";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import { useTenant } from "@/contexts/TenantContext";
import { apiFetch } from "@/lib/api/fetch-client";

const POOL_FILTERS_PATH = "/api/v2/credit/pool-filters";

type PoolFilterConfig = Record<string, unknown>;

interface PoolFiltersResponse {
  lender_code: string;
  filter_config: PoolFilterConfig;
  status?: string;
}

type PageState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; lenderCode: string; config: PoolFilterConfig };

function parseApiError(status: number, body: unknown): string {
  if (body && typeof body === "object" && body !== null) {
    const root = body as Record<string, unknown>;
    const detail = root.detail;
    if (typeof detail === "string") return detail;
    if (detail && typeof detail === "object") {
      const inner = detail as Record<string, unknown>;
      if (typeof inner.message === "string") return inner.message;
      if (typeof inner.error === "string") return inner.error;
    }
    if (typeof root.message === "string") return root.message;
  }
  return `Error HTTP ${status}`;
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function commaListToArray(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function arrayToCommaList(value: unknown): string {
  return Array.isArray(value) ? value.map(String).join(", ") : "";
}

function numOrEmpty(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number" && !Number.isNaN(value)) return String(value);
  return "";
}

function buildConfigFromForm(form: FormData): PoolFilterConfig {
  const config: PoolFilterConfig = {};

  const yearMin = String(form.get("vehicle_year_min") ?? "").trim();
  const yearMax = String(form.get("vehicle_year_max") ?? "").trim();
  const condition = String(form.get("vehicle_condition") ?? "").trim();
  const amountMin = String(form.get("amount_min") ?? "").trim();
  const amountMax = String(form.get("amount_max") ?? "").trim();
  const termMax = String(form.get("term_months_max") ?? "").trim();

  const makesInclude = commaListToArray(String(form.get("vehicle_makes_include") ?? ""));
  const makesExclude = commaListToArray(String(form.get("vehicle_makes_exclude") ?? ""));
  const provincesInclude = commaListToArray(String(form.get("provinces_include") ?? ""));
  const provincesExclude = commaListToArray(String(form.get("provinces_exclude") ?? ""));

  if (yearMin) config.vehicle_year_min = Number.parseInt(yearMin, 10);
  if (yearMax) config.vehicle_year_max = Number.parseInt(yearMax, 10);
  if (condition) config.vehicle_condition = condition;
  if (amountMin) config.amount_min = Number.parseFloat(amountMin);
  if (amountMax) config.amount_max = Number.parseFloat(amountMax);
  if (termMax) config.term_months_max = Number.parseInt(termMax, 10);
  if (makesInclude.length) config.vehicle_makes_include = makesInclude;
  if (makesExclude.length) config.vehicle_makes_exclude = makesExclude;
  if (provincesInclude.length) config.provinces_include = provincesInclude;
  if (provincesExclude.length) config.provinces_exclude = provincesExclude;

  return config;
}

function PoolFiltersContent() {
  const { tenantId } = useTenant();
  const tid = tenantId?.trim() ?? "";

  const [pageState, setPageState] = useState<PageState>({ phase: "loading" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadFilters = useCallback(async () => {
    if (!tid) return;
    setPageState({ phase: "loading" });
    setActionError(null);

    try {
      const res = await apiFetch(POOL_FILTERS_PATH, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Tenant-ID": tid,
        },
        cache: "no-store",
      });
      const body = await readJson(res);
      if (!res.ok) {
        setPageState({
          phase: "error",
          message: parseApiError(res.status, body),
        });
        return;
      }
      const data = body as PoolFiltersResponse;
      setPageState({
        phase: "ready",
        lenderCode: data.lender_code ?? "—",
        config: data.filter_config ?? {},
      });
    } catch (err) {
      setPageState({
        phase: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }, [tid]);

  useEffect(() => {
    void loadFilters();
  }, [loadFilters]);

  const initialConfig = pageState.phase === "ready" ? pageState.config : {};

  const isEmptyConfig = useMemo(
    () => pageState.phase === "ready" && Object.keys(pageState.config).length === 0,
    [pageState]
  );

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tid || pageState.phase !== "ready") return;

    setSaving(true);
    setActionError(null);

    const filter_config = buildConfigFromForm(new FormData(event.currentTarget));

    try {
      const res = await apiFetch(POOL_FILTERS_PATH, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Tenant-ID": tid,
        },
        body: JSON.stringify({ filter_config }),
      });
      const body = await readJson(res);
      if (!res.ok) {
        setActionError(parseApiError(res.status, body));
        return;
      }
      const data = body as PoolFiltersResponse;
      setPageState({
        phase: "ready",
        lenderCode: data.lender_code ?? pageState.lenderCode,
        config: data.filter_config ?? filter_config,
      });
      setConfirmDelete(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!tid || pageState.phase !== "ready" || !confirmDelete) return;

    setDeleting(true);
    setActionError(null);

    try {
      const res = await apiFetch(POOL_FILTERS_PATH, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "X-Tenant-ID": tid,
        },
      });
      const body = await readJson(res);
      if (!res.ok) {
        setActionError(parseApiError(res.status, body));
        return;
      }
      const data = body as PoolFiltersResponse;
      setPageState({
        phase: "ready",
        lenderCode: data.lender_code ?? pageState.lenderCode,
        config: data.filter_config ?? {},
      });
      setConfirmDelete(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleting(false);
    }
  }

  if (pageState.phase === "loading") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-6 text-amber-200/90">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" aria-hidden />
        <p className="text-sm">Cargando filtros de pool…</p>
      </div>
    );
  }

  if (pageState.phase === "error") {
    return (
      <div className="p-6 max-w-2xl">
        <ForgeCard className="border-red-500/30 bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden />
            <div>
              <h2 className="text-sm font-semibold text-red-200">No se pudieron cargar los filtros</h2>
              <p className="mt-1 text-sm text-red-200/80">{pageState.message}</p>
              <button
                type="button"
                onClick={() => void loadFilters()}
                className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-500/20"
              >
                Reintentar
              </button>
            </div>
          </div>
        </ForgeCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <header>
        <p className="text-xs uppercase tracking-widest font-semibold text-amber-400">
          Credit · Configuración
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold text-forge-text-primary">
          <Filter className="h-5 w-5 text-amber-400" aria-hidden />
          Filtros de pool bancario
        </h1>
        <p className="mt-2 text-sm text-forge-text-secondary">
          Define qué solicitudes ve tu institución en el pool abierto. Config vacía = pool completo.
        </p>
        <p className="mt-2 text-sm text-forge-text-secondary">
          Este módulo está configurado para la institución: {pageState.lenderCode}
        </p>
      </header>

      {isEmptyConfig && (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          Sin filtros activos — el banco ve el pool completo del tenant.
        </div>
      )}

      {actionError && (
        <ForgeCard className="border-red-500/30 bg-red-950/20 py-4">
          <p className="text-sm text-red-200">{actionError}</p>
        </ForgeCard>
      )}

      <ForgeCard>
        <form key={JSON.stringify(initialConfig)} onSubmit={(e) => void handleSave(e)} className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-forge-text-primary">Vehículo</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Año mínimo" name="vehicle_year_min" type="number" defaultValue={numOrEmpty(initialConfig.vehicle_year_min)} placeholder="2020" />
              <Field label="Año máximo" name="vehicle_year_max" type="number" defaultValue={numOrEmpty(initialConfig.vehicle_year_max)} placeholder="2026" />
              <Field label="Condición" name="vehicle_condition" defaultValue={String(initialConfig.vehicle_condition ?? "")} placeholder="new | used" className="sm:col-span-2" />
              <Field label="Marcas incluidas (coma)" name="vehicle_makes_include" defaultValue={arrayToCommaList(initialConfig.vehicle_makes_include)} placeholder="Toyota, Honda" className="sm:col-span-2" />
              <Field label="Marcas excluidas (coma)" name="vehicle_makes_exclude" defaultValue={arrayToCommaList(initialConfig.vehicle_makes_exclude)} placeholder="Kia" className="sm:col-span-2" />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-forge-text-primary">Geografía</h2>
            <div className="mt-3 grid gap-4">
              <Field label="Provincias incluidas (coma)" name="provinces_include" defaultValue={arrayToCommaList(initialConfig.provinces_include)} placeholder="Santiago, Santo Domingo" />
              <Field label="Provincias excluidas (coma)" name="provinces_exclude" defaultValue={arrayToCommaList(initialConfig.provinces_exclude)} placeholder="Barahona" />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-forge-text-primary">Monto y plazo</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <Field label="Monto mínimo" name="amount_min" type="number" defaultValue={numOrEmpty(initialConfig.amount_min)} placeholder="300000" />
              <Field label="Monto máximo" name="amount_max" type="number" defaultValue={numOrEmpty(initialConfig.amount_max)} placeholder="5000000" />
              <Field label="Plazo máx. (meses)" name="term_months_max" type="number" defaultValue={numOrEmpty(initialConfig.term_months_max)} placeholder="72" />
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3 border-t border-forge-border pt-4">
            <button
              type="submit"
              disabled={saving || deleting}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
              Guardar filtros
            </button>

            {!confirmDelete ? (
              <button
                type="button"
                disabled={saving || deleting}
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-forge-border px-4 py-2 text-sm text-forge-text-secondary hover:border-red-500/40 hover:text-red-300 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                Restablecer pool completo
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-500/40 bg-red-950/20 px-3 py-2">
                <span className="text-xs text-red-200">¿Eliminar todos los filtros?</span>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => void handleDelete()}
                  className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {deleting ? "Eliminando…" : "Confirmar eliminación"}
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-md border border-forge-border px-3 py-1 text-xs text-forge-text-secondary hover:bg-forge-surface-hover"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </form>
      </ForgeCard>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs text-forge-text-secondary">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-forge-border bg-forge-surface px-3 py-2 text-sm text-forge-text-primary placeholder:text-forge-text-muted focus-visible:outline focus-visible:ring-2 focus-visible:ring-amber-500/40"
      />
    </label>
  );
}

export default function PoolFiltersPage() {
  return (
    <CreditTenantGate>
      <PoolFiltersContent />
    </CreditTenantGate>
  );
}
