"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Brain,
  ChevronRight,
  Home,
  RefreshCw,
  Wand2,
} from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import type { FetchSource } from "@/lib/api/client";
import { normalizeMarketingTemplates } from "@/lib/api/marketing";
import { MARKETING_ENDPOINTS } from "@/lib/api/endpoints";
import { DataSourceBadge } from "@/components/ui/DataSourceBadge";

export default function TemplatesPage() {
  const { tenantId } = useTenant();
  const [data, setData] = useState<unknown>({});
  const [source, setSource] = useState<FetchSource>("fallback");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(
    async (signal: AbortSignal) => {
      if (!tenantId?.trim()) {
        setLoading(false);
        setSource("fallback");
        setError(null);
        setData({});
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(MARKETING_ENDPOINTS.TEMPLATES, {
          method: "GET",
          signal,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Tenant-ID": tenantId.trim(),
          },
        });
        if (res.status === 429) {
          setSource("fallback");
          setError("HTTP 429");
          setData({});
          return;
        }
        if (!res.ok) {
          setSource("fallback");
          setError(`HTTP ${res.status}`);
          setData({});
          return;
        }
        const json = (await res.json().catch(() => null)) as unknown;
        setData(json ?? {});
        setSource("live");
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
        setSource("fallback");
        setError((e as Error)?.message ?? String(e));
        setData({});
      } finally {
        setLoading(false);
      }
    },
    [tenantId]
  );

  useEffect(() => {
    if (!tenantId?.trim()) {
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [tenantId, refreshKey, load]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const { templates, total } = normalizeMarketingTemplates(
    source === "live" ? data : {}
  );

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0f1c]/95 backdrop-blur-xl">
        <div className="max-w-[1200px] mx-auto px-6 py-4">
          <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
            <Link href="/" className="inline-flex items-center gap-1 hover:text-gray-300">
              <Home className="w-4 h-4" />
              Inicio
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/marketing" className="hover:text-gray-300">
              Marketing
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-violet-400 font-medium">Templates</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/marketing"
                className="p-2 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 m-0">
                  <Brain className="w-7 h-7 text-violet-400" />
                  Plantillas
                </h1>
                <p className="text-sm text-gray-400 m-0 mt-1 flex flex-wrap items-center gap-2">
                  <DataSourceBadge source={source} error={error} />
                  {loading ? (
                    <span>Cargando…</span>
                  ) : (
                    <span>
                      {total} desde <code className="text-xs text-gray-500">/marketing/templates</code>
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => refresh()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-sm text-gray-200 hover:bg-white/15"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </button>
              <Link
                href="/marketing/templates/create"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-sm font-medium text-white hover:bg-violet-500"
              >
                <Wand2 className="w-4 h-4" />
                Generar con IA
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-8">
        {error && source === "fallback" && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            No se pudo cargar el API ({error}). Sin datos mock locales.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24 text-gray-500 text-sm">Cargando plantillas…</div>
        ) : templates.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-16 text-center">
            <p className="text-gray-300 text-lg m-0">No hay plantillas todavía</p>
            <p className="text-gray-500 text-sm mt-2 m-0">
              Cuando el backend devuelva registros en{" "}
              <code className="text-gray-400">/marketing/templates</code>, aparecerán aquí.
            </p>
            <Link
              href="/marketing/templates/create"
              className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm hover:bg-violet-500"
            >
              <Wand2 className="w-4 h-4" />
              Crear con IA
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {templates.map((t, i) => {
              const id = String(t.id ?? t.template_id ?? i);
              const name = String(t.name ?? t.title ?? "Sin nombre");
              const desc = String(t.description ?? t.preview ?? "");
              return (
                <li
                  key={id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 hover:border-violet-500/40 transition-colors"
                >
                  <div className="font-medium text-white">{name}</div>
                  {desc ? (
                    <p className="text-sm text-gray-400 mt-1 m-0 line-clamp-2">{desc}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
