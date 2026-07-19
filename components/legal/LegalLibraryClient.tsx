"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { fetchLibrarySearch, fetchLibraryStatus } from "@/lib/legal/library-api";
import { LegalApiErrorPanel } from "@/components/legal/cases/LegalApiErrorPanel";

export default function LegalLibraryClient() {
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const [query, setQuery] = useState("cobro de pesos");

  const statusQ = useQuery({
    queryKey: ["legal_library_status", effectiveTenantId],
    enabled: Boolean(effectiveTenantId?.trim()),
    queryFn: () => fetchLibraryStatus(effectiveTenantId!),
  });

  const searchQ = useQuery({
    queryKey: ["legal_library_search", effectiveTenantId, query],
    enabled: Boolean(effectiveTenantId?.trim() && query.trim().length >= 2),
    queryFn: () => fetchLibrarySearch(effectiveTenantId!, query.trim()),
  });

  if (!tenantHydrated) return <p className="text-sm text-zinc-500">Cargando…</p>;
  if (!effectiveTenantId || tenantError) {
    return <p className="text-sm text-red-400">{tenantError ?? "Tenant no disponible"}</p>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-medium">Biblioteca legal</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Búsqueda normativa indexada — datos reales desde{" "}
          <code className="font-mono text-xs">GET /library/status</code> y{" "}
          <code className="font-mono text-xs">GET /library/search</code>.
        </p>
      </header>

      {statusQ.error ? (
        <LegalApiErrorPanel title="No se pudo cargar el estado de la biblioteca" error={statusQ.error} />
      ) : statusQ.data ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm">
          <p>
            <span className="text-zinc-400">Servicio:</span> {String(statusQ.data.service ?? "—")}
          </p>
          <p>
            <span className="text-zinc-400">Estado:</span> {String(statusQ.data.status ?? "—")}
          </p>
          {statusQ.data.strategies ? (
            <p className="mt-1 text-xs text-zinc-500">
              Estrategias: {(statusQ.data.strategies as string[]).join(", ")}
            </p>
          ) : null}
          {statusQ.data.note ? <p className="mt-2 text-xs text-amber-200/90">{String(statusQ.data.note)}</p> : null}
        </section>
      ) : (
        <p className="text-sm text-zinc-500">Cargando estado…</p>
      )}

      <section className="space-y-3">
        <label className="block text-sm font-medium text-zinc-300" htmlFor="library-search">
          Buscar en biblioteca
        </label>
        <input
          id="library-search"
          className="w-full max-w-xl rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej.: cobro de pesos, prescripción penal…"
        />
        {searchQ.isFetching ? <p className="text-xs text-zinc-500">Buscando…</p> : null}
        {searchQ.error ? (
          <LegalApiErrorPanel title="Error en búsqueda de biblioteca" error={searchQ.error} />
        ) : null}
        {searchQ.data?.results?.length ? (
          <ul className="space-y-2">
            {(searchQ.data.results as Array<{ id?: string; contenido?: string }>).slice(0, 8).map((row) => (
              <li key={row.id ?? row.contenido?.slice(0, 24)} className="rounded-lg border border-zinc-800 p-3 text-xs text-zinc-300">
                <p className="line-clamp-4 whitespace-pre-wrap">{row.contenido ?? "—"}</p>
              </li>
            ))}
          </ul>
        ) : searchQ.isSuccess && !searchQ.isFetching ? (
          <p className="text-sm text-zinc-500">Sin resultados para esta consulta.</p>
        ) : null}
      </section>
    </div>
  );
}
