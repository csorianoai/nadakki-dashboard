"use client";

import Link from "next/link";
import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, BarChart3, Clock, FileText, Sparkles } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { DccEstado } from "@/components/dcc/DccEstado";
import { DccKpiTile } from "@/components/dcc/DccKpiTile";
import { DccPage } from "@/components/dcc/DccPage";
import { DccSeccion } from "@/components/dcc/DccSeccion";
import { DccTooltip } from "@/components/dcc/DccTooltip";
import { SelloCalidad } from "@/components/dcc/SelloCalidad";
import { isAccessQueryFailClosed } from "@/components/dealer/CoreNavigation";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { AuthContext } from "@/lib/auth/auth-context";
import { calidadDesdeEntitlement, type Calidad } from "@/lib/dcc/calidad";
import { formatEntero } from "@/lib/dcc/formato";
import {
  CAPABILITIES_INICIO,
  SECCIONES_SIN_FUENTE,
  TARJETAS_INICIO,
  briefDeterminista,
  detalleDeError,
  esUuid,
  fetchLeadsTotal,
  fetchSolicitudesTotal,
  fetchUnidadesEnStock,
  type Cifra,
  type TarjetaInicio,
} from "@/lib/dcc/inicio";
import { marcaDesdeBranding } from "@/lib/dcc/marca";
import { selectedDealerIdentity } from "@/lib/dealer/access-context";
import { useDealerManagementBranding } from "@/lib/dealer-management/useDealerManagementBranding";

/**
 * Fuente de cada cifra, SOLO para soporte: va en `data-fuente` del contenedor
 * de la tarjeta, que no se anuncia ni se ve. Nunca en `title`, `aria-*` ni
 * `sr-only`: antes viajaba en el tooltip y el lector de pantalla leia
 * "metric_key: ..." y "GET /api/..." como descripcion de la tarjeta.
 */
const EVIDENCIA: Record<string, string> = {
  stock: "GET /api/v1/autos/dealers/{dealer_id}/vehicles — disponible + reservado (D-N6-1)",
  leads: "GET /api/v1/autos/tenants/{tenant_uuid}/dealers/{dealer_id}/leads — total",
  solicitudes: "GET /api/v2/credit/applications — total filtrado por dealer",
};

/**
 * Lo que mide cada tarjeta, en lenguaje llano: es la descripcion accesible
 * (tooltip + lector de pantalla). Sale de la definicion de cada metrica
 * (EVIDENCIA y el motivo `falta` de lib/dcc/inicio), sin anadir datos.
 */
const QUE_MIDE: Record<string, string> = {
  stock: "Vehículos de tu concesionario disponibles o reservados.",
  capital: "Costo del inventario que tienes en stock.",
  margen: "Margen bruto de tu concesionario.",
  leads: "Total de leads recibidos por tu concesionario.",
  solicitudes: "Total de solicitudes de crédito de tu concesionario.",
  caja: "Caja y cobranzas de tu concesionario.",
};

const descripcion = (t: TarjetaInicio) => QUE_MIDE[t.id] ?? null;

function bloqueoPor403(error: unknown): Calidad | null {
  const rec = error && typeof error === "object" ? (error as { status?: unknown; reason_code?: unknown }) : null;
  if (!rec || rec.status !== 403) return null;
  return { estado: "bloqueado", reasonCode: typeof rec.reason_code === "string" ? rec.reason_code : "FORBIDDEN" };
}

export function CommandCenterV2() {
  const access = useAccessEntitlementsBatch(CAPABILITIES_INICIO);
  const failClosed = isAccessQueryFailClosed(access);
  const cargandoAcceso = access.isPending || access.isLoading;
  const formato = marcaDesdeBranding(useDealerManagementBranding().data).formato;
  // El tenant de la ruta de leads sale de /auth/me (UUID), no del Local Storage,
  // que algunos logins rellenan con el slug.
  const tenantUuid = useContext(AuthContext)?.tenant?.id ?? null;
  const dealerId = selectedDealerIdentity()?.dealerId ?? null;
  const permitido = (cap: string | null) => !failClosed && cap !== null && access.data?.results[cap]?.allowed === true;

  const stock = useQuery({
    queryKey: ["dcc-inicio", "stock", dealerId],
    queryFn: () => fetchUnidadesEnStock(dealerId as string),
    enabled: permitido("autos.inventory.list") && Boolean(dealerId),
    retry: false,
  });
  const leads = useQuery({
    queryKey: ["dcc-inicio", "leads", tenantUuid, dealerId],
    queryFn: () => fetchLeadsTotal(tenantUuid as string, dealerId as string),
    enabled: permitido("autos.leads.crm") && Boolean(dealerId) && esUuid(tenantUuid),
    retry: false,
  });
  const solicitudes = useQuery({
    queryKey: ["dcc-inicio", "solicitudes", dealerId],
    queryFn: fetchSolicitudesTotal,
    enabled: permitido("credit.applications.view") && Boolean(dealerId),
    retry: false,
  });
  const consultas: Record<string, typeof stock> = { stock, leads, solicitudes };
  const fmt = (n: number) => formatEntero(n, formato) ?? String(n);
  const brief = briefDeterminista({ stock: stock.data, leads: leads.data, solicitudes: solicitudes.data }, fmt);

  const kpi = (t: TarjetaInicio) => {
    const envolver = (n: React.ReactNode) => (
      <div key={t.id} data-testid={`dcc-tarjeta-${t.id}`} data-metric-key={t.metricKey} data-fuente={EVIDENCIA[t.id]} className="min-w-0">
        {n}
      </div>
    );
    if (t.falta !== null || t.capability === null) {
      return envolver(<DccKpiTile etiqueta={t.titulo} valor={null} calidad={{ estado: "no_disponible", motivo: t.falta }} tecnico={descripcion(t)} />);
    }
    const titulo = <p className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${DCC_CLASSES.muted}`}>{t.titulo}</p>;
    if (cargandoAcceso) return envolver(<>{titulo}<DccEstado estado="cargando" /></>);
    if (failClosed) return envolver(<>{titulo}<DccEstado estado="error" detalle="No se pudieron verificar tus accesos." onReintentar={() => void access.refetch()} /></>);
    const bloqueo = calidadDesdeEntitlement(access.data?.results[t.capability] ?? { allowed: false, reason_code: null });
    if (bloqueo) return envolver(<DccKpiTile etiqueta={t.titulo} valor={null} calidad={bloqueo} tecnico={descripcion(t)} />);
    if (!dealerId) return envolver(<>{titulo}<DccEstado estado="vacio" detalle="Tu usuario no tiene un concesionario resuelto." /></>);
    if (t.id === "leads" && !esUuid(tenantUuid)) {
      return envolver(<>{titulo}<DccEstado estado="error" detalle={`Tenant sin UUID en la sesión (${tenantUuid ?? "vacío"})`} /></>);
    }
    const q = consultas[t.id];
    if (q.isPending) return envolver(<>{titulo}<DccEstado estado="cargando" /></>);
    if (q.isError) {
      const b = bloqueoPor403(q.error);
      if (b) return envolver(<DccKpiTile etiqueta={t.titulo} valor={null} calidad={b} tecnico={descripcion(t)} />);
      return envolver(<>{titulo}<DccEstado estado="error" detalle={detalleDeError(q.error)} onReintentar={() => void q.refetch()} /></>);
    }
    const c: Cifra = q.data;
    return envolver(<DccKpiTile etiqueta={t.titulo} valor={fmt(c.valor)} unidad={t.unidad} calidad={c.calidad} nota={c.nota} tecnico={descripcion(t)} />);
  };

  const proximamente = (motivo: string) => <SelloCalidad calidad={{ estado: "no_disponible", motivo }} />;

  return (
    <DccPage titulo="Command Center">
      <div className="flex flex-col gap-[var(--dcc-gap)]">
        <DccSeccion titulo="Brief del día" icono={Sparkles} clave testId="dcc-seccion-brief">
          <DccTooltip contenido="Texto determinista: solo con las cifras que entregó el backend">
            <p data-testid="dcc-brief" className="text-sm text-[var(--dcc-fg)]">
              {brief ?? "Todavía no hay cifras suficientes para el brief."}
            </p>
          </DccTooltip>
        </DccSeccion>
        <DccSeccion titulo="Estado del negocio" icono={BarChart3} testId="dcc-seccion-negocio">
          <div className="grid grid-cols-2 items-start gap-x-6 gap-y-4 sm:grid-cols-3 xl:grid-cols-6">{TARJETAS_INICIO.map(kpi)}</div>
        </DccSeccion>
        <div className="grid grid-cols-1 items-start gap-[var(--dcc-gap)] lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DccSeccion titulo="Cola de atención" icono={AlertTriangle} clave testId="dcc-seccion-cola">
              <div className="flex flex-wrap items-center gap-3">
                <p className={`text-sm ${DCC_CLASSES.muted}`}>Sin alertas por ahora</p>
                {proximamente(SECCIONES_SIN_FUENTE.cola)}
              </div>
            </DccSeccion>
          </div>
          <DccSeccion titulo="Salud operativa" icono={Activity} testId="dcc-seccion-salud">
            {proximamente(SECCIONES_SIN_FUENTE.salud)}
          </DccSeccion>
        </div>
        <div className="grid grid-cols-1 items-start gap-[var(--dcc-gap)] lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DccSeccion titulo="Hoy" icono={Clock} testId="dcc-seccion-hoy">
              {proximamente(SECCIONES_SIN_FUENTE.hoy)}
            </DccSeccion>
          </div>
          <DccSeccion titulo="Reportes e inteligencia" icono={FileText} testId="dcc-seccion-reportes">
            <p className={`text-sm ${DCC_CLASSES.muted}`}>Reportes contables y ejecutivo de tu país.</p>
            <Link href="/autos/dealer/reportes-v2" className={`mt-3 ${DCC_CLASSES.link}`}>
              Abrir Centro de Reportes →
            </Link>
          </DccSeccion>
        </div>
      </div>
    </DccPage>
  );
}
