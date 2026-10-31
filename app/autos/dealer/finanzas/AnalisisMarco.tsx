"use client";

/**
 * Marco comun de las pantallas de analisis: cierre de acceso, filtro de periodo,
 * carga/errores y el total del endpoint. El cierre es el de Finanzas: sin
 * contexto de dealer, con el batch cargando o en error, o sin la capability,
 * no se pide nada ni se pinta ninguna cifra.
 */

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { resolveDealerAccessContext } from "@/lib/dealer/access-context";
import { formateaMoneda, localeDeTenant, type LocaleTenant } from "@/lib/dealer-management/formato";
import { useDealerManagementBranding } from "@/lib/dealer-management/useDealerManagementBranding";
import { PERIODOS, rangoDePeriodo, type Periodo, type Rango } from "./analisis";

export type Formato = (valor: number) => string;

export function AnalisisMarco<T extends { moneda: string; total: number }>({
  titulo,
  descripcion,
  claves,
  cargar,
  children,
}: {
  titulo: string;
  descripcion: string;
  claves: string[];
  cargar: (rango: Rango) => Promise<T>;
  children: (datos: T, ctx: { rango: Rango; formato: Formato; locale: LocaleTenant }) => ReactNode;
}) {
  const resolved = resolveDealerAccessContext();
  const context = resolved.status === "ready" ? resolved.context : null;
  const access = useAccessEntitlementsBatch(claves);
  const branding = useDealerManagementBranding();
  const locale = localeDeTenant(branding.data);
  const [periodo, setPeriodo] = useState<Periodo>("todo");
  const rango = rangoDePeriodo(periodo);

  const cargando = access.isLoading || access.isPending;
  const permitido = !cargando && !access.error && claves.every((k) => access.data?.results[k]?.allowed === true);

  const consulta = useQuery({
    queryKey: ["finanzas-analisis", titulo, context?.tenantId ?? "none", rango.desde ?? "", rango.hasta ?? ""],
    queryFn: () => cargar(rango),
    enabled: Boolean(context && permitido),
    retry: false,
  });

  const caja = "rounded-xl border border-nk-border bg-nk-surface p-4 text-sm text-nk-fg";
  const datos = consulta.data;
  const formato: Formato = (v) => formateaMoneda(v, { locale: locale.locale, currency: datos?.moneda ?? null });

  return (
    <main className="max-w-full space-y-5 overflow-x-hidden">
      <header>
        <Link href="/autos/dealer/finanzas" className="text-sm text-nk-fg-muted underline">
          ← Finanzas
        </Link>
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">{titulo}</h1>
        <p className="mt-1 text-sm text-nk-fg-muted">{descripcion}</p>
      </header>

      {!context ? (
        <div role="alert" data-testid="analisis-sin-contexto" className={caja}>
          Análisis bloqueado: {resolved.reason_code}
        </div>
      ) : cargando ? (
        <p className="animate-pulse text-sm text-nk-fg-muted">Verificando acceso…</p>
      ) : !permitido ? (
        <div role="alert" data-testid="analisis-bloqueado" className={caja}>
          Estas cifras solo las ve el personal autorizado. Pide acceso al administrador de tu concesionario.
        </div>
      ) : (
        <>
          <label className="block max-w-xs text-sm font-semibold text-nk-fg">
            Periodo
            <select
              data-testid="analisis-periodo"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as Periodo)}
              className="mt-1 min-h-11 w-full rounded-r-sm border border-nk-border bg-nk-surface px-3 text-sm font-normal text-nk-fg"
            >
              {PERIODOS.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.etiqueta}
                </option>
              ))}
            </select>
          </label>
          {consulta.isLoading ? (
            <p className="animate-pulse text-sm text-nk-fg-muted">Cargando…</p>
          ) : consulta.error || !datos ? (
            <div role="alert" data-testid="analisis-error" className={caja}>
              No se pudo cargar el análisis. Inténtalo de nuevo en unos minutos.
            </div>
          ) : (
            <>
              <p className={caja}>
                Total del periodo ({datos.moneda}):{" "}
                <strong data-testid="analisis-total" data-total={datos.total} data-moneda={datos.moneda} className="text-xl tabular-nums">
                  {formato(datos.total)}
                </strong>
              </p>
              {children(datos, { rango, formato, locale })}
            </>
          )}
        </>
      )}
    </main>
  );
}
