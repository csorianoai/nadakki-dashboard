"use client";

/** Finanzas del inventario (F4E-2): filtros en la URL, graficos, tabla por unidad y CSV con los mismos filtros. */

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { resolveDealerAccessContext } from "@/lib/dealer/access-context";
import { formateaMoneda, localeDeTenant } from "@/lib/dealer-management/formato";
import { useDealerManagementBranding } from "@/lib/dealer-management/useDealerManagementBranding";
import { COSTS_CAPABILITY_KEYS } from "@/lib/dealer-management/vehicle-costs";
import { useUsuarioCache } from "../usuarioCache";
import { Resultados } from "./Resultados";
import { fetchInventario, fetchInventarioCsv, filtrosDeParams, queryDeFiltros, type Filtros } from "./inventario";

const caja = "rounded-xl border border-nk-border bg-nk-surface p-4 text-sm text-nk-fg";
const campo = "mt-1 min-h-11 w-full rounded-r-sm border border-nk-border bg-nk-surface px-3 text-sm font-normal text-nk-fg";

function Vista() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const activos = filtrosDeParams(new URLSearchParams(params?.toString() ?? ""));
  const [borrador, setBorrador] = useState<Filtros>(activos);
  const [csvError, setCsvError] = useState(false);

  const resolved = resolveDealerAccessContext();
  const context = resolved.status === "ready" ? resolved.context : null;
  const access = useAccessEntitlementsBatch(COSTS_CAPABILITY_KEYS);
  const branding = useDealerManagementBranding();
  const locale = localeDeTenant(branding.data);
  const userId = useUsuarioCache();

  const cargandoAcceso = access.isLoading || access.isPending;
  const permitido =
    !cargandoAcceso && !access.error && COSTS_CAPABILITY_KEYS.every((k) => access.data?.results[k]?.allowed === true);

  const consulta = useQuery({
    queryKey: ["finanzas-inventario-vista", context?.tenantId ?? "none", userId, queryDeFiltros(activos)],
    queryFn: () => fetchInventario(activos),
    enabled: Boolean(context && permitido),
    // Cifras filtradas por rol: no se retienen al desmontar.
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  const aplicar = (e: FormEvent) => {
    e.preventDefault();
    const qs = queryDeFiltros(borrador);
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const exportar = async () => {
    setCsvError(false);
    try {
      const url = URL.createObjectURL(await fetchInventarioCsv(activos));
      const a = document.createElement("a");
      a.href = url;
      a.download = "inventario-finanzas.csv";
      a.click();
      URL.revokeObjectURL?.(url);
    } catch {
      setCsvError(true);
    }
  };

  const datos = consulta.data;
  const formatoEn = (v: number, moneda: string) => formateaMoneda(v, { locale: locale.locale, currency: moneda });
  const sinPermiso = consulta.error instanceof Error && consulta.error.message === "HTTP_403";

  return (
    <main className="max-w-full space-y-5 overflow-x-hidden">
      <header>
        <Link href="/autos/dealer/finanzas" className="text-sm text-nk-fg-muted underline">← Finanzas</Link>
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">Finanzas del inventario</h1>
        <p className="mt-1 text-sm text-nk-fg-muted">Costo neto de cada unidad, con filtros que puedes compartir por enlace.</p>
      </header>

      {!context ? (
        <div role="alert" className={caja}>Finanzas bloqueadas: {resolved.reason_code}</div>
      ) : cargandoAcceso ? (
        <p className="animate-pulse text-sm text-nk-fg-muted">Verificando acceso…</p>
      ) : !permitido ? (
        <div role="alert" data-testid="inv-sin-permiso" className={caja}>
          Estas cifras solo las ve el personal autorizado. Pide acceso al administrador de tu concesionario.
        </div>
      ) : (
        <>
          <form onSubmit={aplicar} aria-label="Filtros" className="grid max-w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-sm font-semibold text-nk-fg">
              Marca
              <input value={borrador.marca} onChange={(e) => setBorrador({ ...borrador, marca: e.target.value })} className={campo} />
            </label>
            <label className="block text-sm font-semibold text-nk-fg">
              Estado
              <input value={borrador.estado} onChange={(e) => setBorrador({ ...borrador, estado: e.target.value })} className={campo} />
            </label>
            <label className="block text-sm font-semibold text-nk-fg">
              Adquirida desde
              <input type="date" value={borrador.desde} onChange={(e) => setBorrador({ ...borrador, desde: e.target.value })} className={campo} />
            </label>
            <label className="block text-sm font-semibold text-nk-fg">
              Adquirida hasta
              <input type="date" value={borrador.hasta} onChange={(e) => setBorrador({ ...borrador, hasta: e.target.value })} className={campo} />
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
              <button type="submit" className="min-h-11 rounded-r-sm bg-nk-fg px-4 text-sm font-semibold text-nk-surface">
                Aplicar filtros
              </button>
              <button type="button" onClick={exportar} className="min-h-11 rounded-r-sm border border-nk-border px-4 text-sm font-semibold text-nk-fg">
                Exportar CSV
              </button>
            </div>
          </form>
          {csvError ? <p role="alert" className="text-sm text-nk-fg">No se pudo exportar el CSV. Inténtalo de nuevo.</p> : null}

          {consulta.isLoading ? (
            <p className="animate-pulse text-sm text-nk-fg-muted">Cargando…</p>
          ) : sinPermiso ? (
            <div role="alert" data-testid="inv-sin-permiso" className={caja}>
              No tienes permiso para ver el inventario financiero. Pide acceso al administrador de tu concesionario.
            </div>
          ) : consulta.error || !datos ? (
            <div role="alert" data-testid="inv-error" className={caja}>
              No se pudo cargar el inventario.{" "}
              <button type="button" onClick={() => consulta.refetch()} className="min-h-11 font-semibold underline">Reintentar</button>
            </div>
          ) : datos.filas.length === 0 ? (
            <p data-testid="inv-vacio" className={caja}>No hay unidades con estos filtros.</p>
          ) : (
            <Resultados datos={datos} formato={(v) => formatoEn(v, datos.moneda)} formatoEn={formatoEn} />
          )}
        </>
      )}
    </main>
  );
}

export default function InventarioFinanzasPage() {
  return (
    <Suspense fallback={<p className="animate-pulse text-sm text-nk-fg-muted">Cargando…</p>}>
      <Vista />
    </Suspense>
  );
}
