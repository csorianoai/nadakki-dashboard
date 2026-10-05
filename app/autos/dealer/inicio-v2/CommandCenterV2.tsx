"use client";

import { useQuery } from "@tanstack/react-query";
import { DccCard } from "@/components/dcc/DccCard";
import { DccEstado } from "@/components/dcc/DccEstado";
import { DccKpi } from "@/components/dcc/DccKpi";
import { DccGrid, DccPage } from "@/components/dcc/DccPage";
import { isAccessQueryFailClosed } from "@/components/dealer/CoreNavigation";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { calidadDesdeEntitlement, type Calidad } from "@/lib/dcc/calidad";
import { formatEntero, type LocaleTenant } from "@/lib/dcc/formato";
import {
  CAPABILITIES_INICIO,
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

const NO_DISPONIBLE = (motivo: string | null): Calidad => ({ estado: "no_disponible", motivo });

/** Evidencia plegada: de donde sale la cifra. */
const EVIDENCIA: Record<string, string> = {
  stock: "GET /api/v1/autos/dealers/{dealer_id}/vehicles — conteo de estados disponible y reservado (D-N6-1).",
  leads: "GET /api/v1/autos/tenants/{tenant_id}/dealers/{dealer_id}/leads — campo total.",
  solicitudes: "GET /api/v2/credit/applications — campo total, filtrado por el dealer en el backend.",
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

function TarjetaConectada({
  tarjeta,
  ids,
  formato,
}: {
  tarjeta: TarjetaInicio;
  ids: { tenantId: string; dealerId: string };
  formato: LocaleTenant;
}) {
  const query = useQuery({
    queryKey: ["dcc-inicio", tarjeta.id, ids.tenantId, ids.dealerId],
    queryFn: cargador(tarjeta.id, ids.tenantId, ids.dealerId),
    retry: false,
  });
  const comun = { titulo: tarjeta.titulo, tecnico: `metric_key: ${tarjeta.metricKey}`, testId: `dcc-tarjeta-${tarjeta.id}` };
  if (query.isPending) return <DccCard {...comun}><DccEstado estado="cargando" /></DccCard>;
  if (query.isError) {
    const codigo = reasonCode(query.error);
    if (codigo) {
      const calidad: Calidad = { estado: "bloqueado", reasonCode: codigo };
      return <DccCard {...comun} calidad={calidad}><DccKpi valor={null} calidad={calidad} /></DccCard>;
    }
    return <DccCard {...comun}><DccEstado estado="error" onReintentar={() => void query.refetch()} /></DccCard>;
  }
  const cifra = query.data;
  return (
    <DccCard {...comun} calidad={cifra.calidad} evidencia={<p>{EVIDENCIA[tarjeta.id]}</p>}>
      <DccKpi valor={formatEntero(cifra.valor, formato)} calidad={cifra.calidad} nota={cifra.nota} />
    </DccCard>
  );
}

export function CommandCenterV2() {
  const access = useAccessEntitlementsBatch(CAPABILITIES_INICIO);
  const failClosed = isAccessQueryFailClosed(access);
  const cargandoAcceso = access.isPending || access.isLoading;
  const branding = useDealerManagementBranding();
  const formato = marcaDesdeBranding(branding.data).formato;
  const identidad = selectedDealerIdentity();

  return (
    <DccPage titulo="Command Center">
      <DccGrid>
        {TARJETAS_INICIO.map((tarjeta) => {
          const comun = { titulo: tarjeta.titulo, tecnico: `metric_key: ${tarjeta.metricKey}`, testId: `dcc-tarjeta-${tarjeta.id}` };
          if (tarjeta.falta !== null || tarjeta.capability === null) {
            const calidad = NO_DISPONIBLE(tarjeta.falta);
            return <DccCard key={tarjeta.id} {...comun} calidad={calidad}><DccKpi valor={null} calidad={calidad} /></DccCard>;
          }
          if (cargandoAcceso) return <DccCard key={tarjeta.id} {...comun}><DccEstado estado="cargando" /></DccCard>;
          if (failClosed) {
            return (
              <DccCard key={tarjeta.id} {...comun}>
                <DccEstado estado="error" detalle="No se pudieron verificar tus accesos." onReintentar={() => void access.refetch()} />
              </DccCard>
            );
          }
          const bloqueo = calidadDesdeEntitlement(access.data?.results[tarjeta.capability] ?? { allowed: false, reason_code: null });
          if (bloqueo) return <DccCard key={tarjeta.id} {...comun} calidad={bloqueo}><DccKpi valor={null} calidad={bloqueo} /></DccCard>;
          if (!identidad) {
            return <DccCard key={tarjeta.id} {...comun}><DccEstado estado="vacio" detalle="Tu usuario no tiene un concesionario resuelto." /></DccCard>;
          }
          return <TarjetaConectada key={tarjeta.id} tarjeta={tarjeta} ids={identidad} formato={formato} />;
        })}
      </DccGrid>
    </DccPage>
  );
}
