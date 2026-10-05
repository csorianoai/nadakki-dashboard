"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, BarChart3, Clock, FileText, Gauge, Sparkles } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { DccEstado } from "@/components/dcc/DccEstado";
import { DccKpiTile } from "@/components/dcc/DccKpiTile";
import { DccPage } from "@/components/dcc/DccPage";
import { DccSeccion } from "@/components/dcc/DccSeccion";
import { isAccessQueryFailClosed } from "@/components/dealer/CoreNavigation";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { calidadDesdeEntitlement, type Calidad } from "@/lib/dcc/calidad";
import { formatEntero, type LocaleTenant } from "@/lib/dcc/formato";
import {
  CAPABILITIES_INICIO,
  SECCIONES_SIN_FUENTE,
  TARJETAS_INICIO,
  fetchLeadsTotal,
  fetchSolicitudesTotal,
  fetchUnidadesEnStock,
  type Cifra,
  type TarjetaInicio,
} from "@/lib/dcc/inicio";
import { marcaDesdeBranding } from "@/lib/dcc/marca";
import { selectedDealerIdentity } from "@/lib/dealer/access-context";
import { useDealerManagementBranding } from "@/lib/dealer-management/useDealerManagementBranding";

/** Evidencia de cada cifra conectada (tooltip): de donde sale. */
const EVIDENCIA: Record<string, string> = {
  stock: "GET /api/v1/autos/dealers/{dealer_id}/vehicles — disponible + reservado (D-N6-1)",
  leads: "GET /api/v1/autos/tenants/{tenant_id}/dealers/{dealer_id}/leads — total",
  solicitudes: "GET /api/v2/credit/applications — total filtrado por dealer",
};

function cargador(id: string, tenantId: string, dealerId: string): () => Promise<Cifra> {
  if (id === "stock") return () => fetchUnidadesEnStock(dealerId);
  if (id === "leads") return () => fetchLeadsTotal(tenantId, dealerId);
  return () => fetchSolicitudesTotal();
}

function reasonCode(error: unknown): string | null {
  const rec = error && typeof error === "object" ? (error as { status?: unknown; reason_code?: unknown }) : null;
  if (!rec || rec.status !== 403) return null;
  return typeof rec.reason_code === "string" ? rec.reason_code : "FORBIDDEN";
}

const tecnico = (t: TarjetaInicio, extra?: string | null) =>
  [`metric_key: ${t.metricKey}`, extra].filter(Boolean).join(" · ");

function Envoltorio({ tarjeta, children }: { tarjeta: TarjetaInicio; children: React.ReactNode }) {
  return (
    <div data-testid={`dcc-tarjeta-${tarjeta.id}`} className="min-w-0">
      {children}
    </div>
  );
}

function TileConectado({ tarjeta, ids, formato }: { tarjeta: TarjetaInicio; ids: { tenantId: string; dealerId: string }; formato: LocaleTenant }) {
  const query = useQuery({
    queryKey: ["dcc-inicio", tarjeta.id, ids.tenantId, ids.dealerId],
    queryFn: cargador(tarjeta.id, ids.tenantId, ids.dealerId),
    retry: false,
  });
  if (query.isPending || query.isError) {
    const codigo = query.isError ? reasonCode(query.error) : null;
    if (codigo) {
      return <DccKpiTile etiqueta={tarjeta.titulo} valor={null} calidad={{ estado: "bloqueado", reasonCode: codigo }} tecnico={tecnico(tarjeta)} />;
    }
    return (
      <div className="rounded-[10px] border border-[var(--dcc-border)] p-4">
        <p className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${DCC_CLASSES.muted}`}>{tarjeta.titulo}</p>
        <div className="mt-2">
          {query.isPending ? <DccEstado estado="cargando" /> : <DccEstado estado="error" onReintentar={() => void query.refetch()} />}
        </div>
      </div>
    );
  }
  const cifra = query.data;
  return (
    <DccKpiTile
      etiqueta={tarjeta.titulo}
      valor={formatEntero(cifra.valor, formato)}
      unidad={tarjeta.unidad}
      calidad={cifra.calidad}
      nota={cifra.nota}
      tecnico={tecnico(tarjeta, EVIDENCIA[tarjeta.id])}
    />
  );
}

function SinFuente({ motivo }: { motivo: string }) {
  return <DccEstado estado="no_disponible" detalle={motivo} />;
}

export function CommandCenterV2() {
  const access = useAccessEntitlementsBatch(CAPABILITIES_INICIO);
  const failClosed = isAccessQueryFailClosed(access);
  const cargandoAcceso = access.isPending || access.isLoading;
  const formato = marcaDesdeBranding(useDealerManagementBranding().data).formato;
  const identidad = selectedDealerIdentity();

  const tile = (tarjeta: TarjetaInicio) => {
    let contenido: React.ReactNode;
    if (tarjeta.falta !== null || tarjeta.capability === null) {
      const calidad: Calidad = { estado: "no_disponible", motivo: tarjeta.falta };
      contenido = <DccKpiTile etiqueta={tarjeta.titulo} valor={null} calidad={calidad} nota={tarjeta.falta} tecnico={tecnico(tarjeta)} />;
    } else if (cargandoAcceso) {
      contenido = <DccEstado estado="cargando" />;
    } else if (failClosed) {
      contenido = <DccEstado estado="error" detalle="No se pudieron verificar tus accesos." onReintentar={() => void access.refetch()} />;
    } else {
      const bloqueo = calidadDesdeEntitlement(access.data?.results[tarjeta.capability] ?? { allowed: false, reason_code: null });
      if (bloqueo) contenido = <DccKpiTile etiqueta={tarjeta.titulo} valor={null} calidad={bloqueo} tecnico={tecnico(tarjeta)} />;
      else if (!identidad) contenido = <DccEstado estado="vacio" detalle="Tu usuario no tiene un concesionario resuelto." />;
      else contenido = <TileConectado tarjeta={tarjeta} ids={identidad} formato={formato} />;
    }
    return <Envoltorio key={tarjeta.id} tarjeta={tarjeta}>{contenido}</Envoltorio>;
  };

  const negocio = TARJETAS_INICIO.filter((x) => x.grupo === "negocio");
  const mas = TARJETAS_INICIO.filter((x) => x.grupo === "mas");

  return (
    <DccPage titulo="Command Center">
      <div className="flex flex-col gap-[var(--dcc-gap)]">
        <DccSeccion titulo="Brief del día" icono={Sparkles} tono="dorado" testId="dcc-seccion-brief">
          <SinFuente motivo={SECCIONES_SIN_FUENTE.brief} />
        </DccSeccion>
        <div className="grid grid-cols-1 items-start gap-[var(--dcc-gap)] lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DccSeccion titulo="Cola de atención" icono={AlertTriangle} tono="dorado" testId="dcc-seccion-cola">
              <SinFuente motivo={SECCIONES_SIN_FUENTE.cola} />
            </DccSeccion>
          </div>
          <DccSeccion titulo="Salud operativa" icono={Activity} testId="dcc-seccion-salud">
            <SinFuente motivo={SECCIONES_SIN_FUENTE.salud} />
          </DccSeccion>
        </div>
        <DccSeccion titulo="Estado del negocio" icono={BarChart3} tono="azul" meta="totales del backend" testId="dcc-seccion-negocio">
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">{negocio.map(tile)}</div>
        </DccSeccion>
        <DccSeccion titulo="Más indicadores" icono={Gauge} meta="registrados en N6, sin fuente todavía" testId="dcc-seccion-mas">
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">{mas.map(tile)}</div>
        </DccSeccion>
        <div className="grid grid-cols-1 items-start gap-[var(--dcc-gap)] lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DccSeccion titulo="Hoy" icono={Clock} testId="dcc-seccion-hoy">
              <SinFuente motivo={SECCIONES_SIN_FUENTE.hoy} />
            </DccSeccion>
          </div>
          <DccSeccion titulo="Reportes e inteligencia" icono={FileText} tono="azul" testId="dcc-seccion-reportes">
            <p className={`text-sm ${DCC_CLASSES.muted}`}>Reportes contables y ejecutivo con su naturaleza (en vivo o guardado).</p>
            <Link href="/autos/dealer/reportes-v2" className={`mt-3 ${DCC_CLASSES.actionButton}`}>
              Abrir Centro de Reportes
            </Link>
          </DccSeccion>
        </div>
      </div>
    </DccPage>
  );
}
