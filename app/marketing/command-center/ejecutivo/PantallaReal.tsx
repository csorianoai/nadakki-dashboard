"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { PeriodoAnalitica } from "@/lib/analytics/cifra";
import { formatoDesdeTenant } from "@/lib/analytics/formato";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";
import { EsqueletoCommandCenter } from "./EsqueletoCommandCenter";
import { SelectorCuenta } from "./SelectorCuenta";
import { TEXTO_MONEDA_NO_CONFIRMADA, adaptarResumen, rangoDePeriodo } from "./adaptador-real";
import type { CuentaInsights } from "./contrato";
import type { EstadoPantalla, TemaPantalla } from "./tipos";
import { ErrorInsights, useResumenInsights } from "./usarResumen";

/** La pantalla (kit, graficos) se carga aparte: la primera pintura es el esqueleto y la peticion de datos sale de inmediato. */
const CommandCenterEjecutivo = dynamic(() => import("./CommandCenterEjecutivo").then((m) => m.CommandCenterEjecutivo), {
  ssr: false,
  loading: () => <EsqueletoCommandCenter />,
});

function Mensaje({ id, titulo, texto, children }: { id: string; titulo: string; texto: string; children?: React.ReactNode }) {
  return (
    <div data-testid={id} role="alert" className="flex flex-col gap-2 rounded-[10px] border kit-bd p-4">
      <p className="m-0 text-[15px] font-semibold kit-txt">{titulo}</p>
      <p className="m-0 text-[13px] kit-txt-2">{texto}</p>
      {children}
    </div>
  );
}

/**
 * Pantalla REAL: consulta /api/v1/marketing/insights/summary con el periodo y la cuenta elegidos y adapta la respuesta.
 * Sin datos inventados: cada estado (cargando, sin permiso, sesion caducada, cuenta por elegir, vacio, error) tiene su pantalla.
 */
export function PantallaReal({ ahora, tema }: { ahora: string; tema?: TemaPantalla }) {
  const { tenant } = useAuth();
  const tenantName = tenant?.display_name ?? null;
  const { data: branding } = useTenantBranding();
  const [periodo, setPeriodo] = useState<PeriodoAnalitica>({ tipo: "30d" });
  const [cuenta, setCuenta] = useState<string | null>(null);
  const rango = useMemo(() => rangoDePeriodo(periodo, new Date(ahora)), [periodo, ahora]);
  const q = useResumenInsights(rango ? { ...rango, customerId: cuenta } : null);

  const adaptado = useMemo(() => (q.data ? adaptarResumen(q.data, periodo, { nombreTenant: tenantName }) : null), [q.data, periodo, tenantName]);

  const cuentas: CuentaInsights[] = q.data?.accounts ?? [];
  const selector = cuentas.length > 1 ? <SelectorCuenta cuentas={cuentas} valor={cuenta} onChange={setCuenta} obligatorio={!!q.data?.requires_account_selection} /> : null;

  let estado: EstadoPantalla = "ok";
  let reemplazo: React.ReactNode = undefined;
  let avisos: React.ReactNode = undefined;

  if (!rango) {
    reemplazo = <Mensaje id="aviso-rango" titulo="Rango de fechas no válido" texto="Elige un rango personalizado con la fecha inicial anterior o igual a la final." />;
  } else if (q.isPending || (q.isFetching && !q.data)) {
    estado = "cargando";
  } else if (q.error) {
    const e = q.error;
    const status = e instanceof ErrorInsights ? e.status : 0;
    if (status === 401) {
      reemplazo = <Mensaje id="aviso-sesion" titulo="Tu sesión caducó" texto="Vuelve a iniciar sesión para ver el Command Center." />;
    } else if (status === 403) {
      reemplazo = <Mensaje id="aviso-permiso" titulo="Sin permiso" texto="Las cifras de inversión y valor de conversión son solo para administradores y el equipo de marketing de tu empresa." />;
    } else if (status === 404 && e instanceof ErrorInsights && e.codigo === "account_not_found") {
      reemplazo = <Mensaje id="aviso-cuenta" titulo="Cuenta no encontrada" texto="Esa cuenta de Google Ads no está conectada a tu empresa." />;
    } else {
      estado = "error";
    }
  } else if (adaptado?.tipo === "requiere_cuenta") {
    reemplazo = (
      <Mensaje id="aviso-elegir-cuenta" titulo="Elige una cuenta" texto="Tus cuentas de Google Ads usan monedas distintas, por eso no hay total. Elige una cuenta para ver sus cifras." />
    );
  } else if (adaptado?.tipo === "vacio") {
    estado = "vacio";
  } else if (adaptado?.tipo === "datos" && adaptado.moneda === null) {
    avisos = (
      <p data-testid="aviso-moneda" role="note" className="m-0 rounded-[10px] border kit-bd px-3 py-2 text-[13px] kit-txt-2">
        {TEXTO_MONEDA_NO_CONFIRMADA}
      </p>
    );
  }

  const datos = adaptado?.tipo === "datos" ? adaptado.datos : null;
  // La moneda la trae cada cifra (la de la cuenta, adaptador); TenantBranding solo aporta el locale.
  const formato = formatoDesdeTenant(branding);

  return (
    <CommandCenterEjecutivo
      datos={datos}
      estado={estado}
      ahora={ahora}
      tema={tema}
      periodoDatos={periodo}
      formato={formato}
      onPeriodoChange={setPeriodo}
      controlesExtra={selector}
      avisosExtra={avisos}
      reemplazo={reemplazo}
      onReintentar={() => void q.refetch()}
    />
  );
}
