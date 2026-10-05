"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { DccCard } from "@/components/dcc/DccCard";
import { DccEstado } from "@/components/dcc/DccEstado";
import { DccGrid, DccPage } from "@/components/dcc/DccPage";
import { DccSeccion } from "@/components/dcc/DccSeccion";
import { SelloCalidad } from "@/components/dcc/SelloCalidad";
import { isAccessQueryFailClosed } from "@/components/dealer/CoreNavigation";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { evaluaCuadre } from "@/lib/contable/cuadre";
import { calidadDesdeEntitlement, type Calidad } from "@/lib/dcc/calidad";
import { formatMoneda, formatMonedaCompacta, type LocaleTenant } from "@/lib/dcc/formato";
import { marcaDesdeBranding } from "@/lib/dcc/marca";
import {
  CAPABILITY_REPORTES_CONTABLES,
  REPORT_DEFINITIONS,
  fetchBalanceComprobacion,
  paisDelTenant,
  reportesDelPais,
  type ReportDefinition,
} from "@/lib/dcc/reportes";
import { useDealerManagementBranding } from "@/lib/dealer-management/useDealerManagementBranding";

/** N6 no registra metricas contables: el sello es PARCIAL y dice por que. */
const CALIDAD_BALANCE: Calidad = {
  estado: "parcial",
  cubiertos: null,
  total: null,
  motivo: "Métrica contable pendiente de registro (N6); la respuesta no declara moneda: se muestra en la del tenant",
};

function Naturaleza({ valor }: { valor: ReportDefinition["naturaleza"] }) {
  return (
    <span
      data-testid="dcc-naturaleza"
      title={valor === "LIVE" ? "Se calcula en cada consulta" : "Lee datos guardados"}
      className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
        valor === "LIVE"
          ? "border-[var(--dcc-teal)] bg-[var(--dcc-teal-bg)] text-[var(--dcc-teal-ink)]"
          : "border-[var(--dcc-border-strong)] text-[var(--dcc-fg-muted)]"
      }`}
    >
      {valor === "LIVE" ? "En vivo" : "Guardado"}
    </span>
  );
}

/** Titular compacto ("$ 182,4 M"); el importe completo va en el tooltip y en el desglose. */
function Importe({ etiqueta, valor, formato }: { etiqueta: string; valor: number | null; formato: LocaleTenant }) {
  return (
    <div className="min-w-0">
      <p className={`text-xs ${DCC_CLASSES.subtle}`}>{etiqueta}</p>
      <p title={formatMoneda(valor, formato) ?? undefined} className={`${DCC_CLASSES.cifra} break-words text-lg`}>
        {formatMonedaCompacta(valor, formato) ?? "—"}
      </p>
    </div>
  );
}

function BalanceComprobacion({ formato }: { formato: LocaleTenant }) {
  const [pedido, setPedido] = useState(false);
  const query = useQuery({ queryKey: ["dcc-balance-comprobacion"], queryFn: fetchBalanceComprobacion, enabled: pedido, retry: false });
  if (!pedido) {
    return (
      <button type="button" data-testid="dcc-ver-totales" onClick={() => setPedido(true)} className={DCC_CLASSES.actionButton}>
        Ver totales
      </button>
    );
  }
  if (query.isPending) return <DccEstado estado="cargando" />;
  if (query.isError) return <DccEstado estado="error" onReintentar={() => void query.refetch()} />;
  if (!formato.currency) return <DccEstado estado="no_disponible" detalle="El tenant no tiene moneda configurada." />;
  const b = query.data;
  return (
    <div data-testid="dcc-balance-totales">
      <div className="grid grid-cols-2 gap-3">
        <Importe etiqueta="Total debe" valor={b.totalDebe} formato={formato} />
        <Importe etiqueta="Total haber" valor={b.totalHaber} formato={formato} />
      </div>
      <p className={`mt-2 text-xs ${DCC_CLASSES.muted}`}>
        Todos los períodos ·{" "}
        {evaluaCuadre(b.totalDebe, b.totalHaber) ? "Debe y haber cuadran" : "Debe y haber no cuadran"}
      </p>
      <details data-testid="dcc-explicar-cifra" className="mt-3">
        <summary className={`cursor-pointer ${DCC_CLASSES.link}`}>Explicar cifra</summary>
        {b.cuentas.length === 0 ? (
          <DccEstado estado="vacio" />
        ) : (
          <ul className="mt-2 divide-y divide-[var(--dcc-border-strong)] text-xs">
            {b.cuentas.map((c) => (
              <li key={`${c.codigo}-${c.nombre}`} className="py-1.5">
                <p className="font-medium">{c.codigo} {c.nombre}</p>
                <p className={`font-dealer-numeric ${DCC_CLASSES.muted}`}>
                  Debe {formatMoneda(c.debe, formato) ?? "—"} · Haber {formatMoneda(c.haber, formato) ?? "—"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </details>
    </div>
  );
}

/** "Abrir" lleva a la pantalla existente de ese reporte; si no hay, "Próximamente". */
function Abrir({ r }: { r: ReportDefinition }) {
  if (!r.pantalla) return <SelloCalidad calidad={{ estado: "no_disponible", motivo: "Sin pantalla para este reporte todavía" }} />;
  return (
    <Link href={r.pantalla} data-testid="dcc-reporte-abrir" className={DCC_CLASSES.link}>
      Abrir →
    </Link>
  );
}

export function CentroReportesV2() {
  const access = useAccessEntitlementsBatch([CAPABILITY_REPORTES_CONTABLES]);
  const failClosed = isAccessQueryFailClosed(access);
  const cargando = access.isPending || access.isLoading;
  const bloqueoContable = failClosed
    ? null
    : calidadDesdeEntitlement(access.data?.results[CAPABILITY_REPORTES_CONTABLES] ?? { allowed: false, reason_code: null });
  const branding = useDealerManagementBranding().data;
  const formato = marcaDesdeBranding(branding).formato;
  const pais = paisDelTenant(branding);
  const nombrePais = pais ? new Intl.DisplayNames([formato.locale], { type: "region" }).of(pais) ?? pais : null;
  const visibles = reportesDelPais(REPORT_DEFINITIONS, pais);

  const tarjeta = (r: ReportDefinition) => {
    const contable = r.grupo === "Contabilidad";
    const comun = { titulo: r.titulo, tecnico: `${r.key} · ${r.endpoint} · Pendiente: ${r.pendiente}`, testId: `dcc-reporte-${r.key.split("@")[0]}` };
    const cabecera = <Naturaleza valor={r.naturaleza} />;
    if (contable && cargando) return <DccCard key={r.key} {...comun} acciones={cabecera}><DccEstado estado="cargando" /></DccCard>;
    if (contable && failClosed) {
      return <DccCard key={r.key} {...comun} acciones={cabecera}><DccEstado estado="error" detalle="No se pudieron verificar tus accesos." onReintentar={() => void access.refetch()} /></DccCard>;
    }
    if (contable && bloqueoContable) return <DccCard key={r.key} {...comun} acciones={cabecera} calidad={bloqueoContable}><DccEstado estado="bloqueado" /></DccCard>;
    return (
      <DccCard key={r.key} {...comun} acciones={cabecera} calidad={r.explicable ? CALIDAD_BALANCE : null}>
        {r.explicable ? <div className="mb-3"><BalanceComprobacion formato={formato} /></div> : null}
        <Abrir r={r} />
      </DccCard>
    );
  };
  const contables = visibles.filter((r) => r.grupo === "Contabilidad");
  const ejecutivos = visibles.filter((r) => r.grupo === "Ejecutivo");

  return (
    <DccPage titulo="Centro de Reportes">
      <div className="flex flex-col gap-[var(--dcc-gap)]">
        <DccSeccion titulo="Contabilidad" icono={BookOpen} meta={nombrePais ? `Reportes de ${nombrePais}` : "País del tenant sin configurar: se ocultan los reportes fiscales"} testId="dcc-seccion-contabilidad">
          <DccGrid>{contables.map(tarjeta)}</DccGrid>
        </DccSeccion>
        {ejecutivos.length ? (
          <DccSeccion titulo="Ejecutivo" icono={BarChart3} testId="dcc-seccion-ejecutivo">
            <DccGrid>{ejecutivos.map(tarjeta)}</DccGrid>
          </DccSeccion>
        ) : null}
      </div>
    </DccPage>
  );
}
