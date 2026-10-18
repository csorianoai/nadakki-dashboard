"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FolderOpen, FileText } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { DccEstado } from "@/components/dcc/DccEstado";
import { DccPageMarco } from "@/components/dcc/DccPageMarco";
import { DccSeccion } from "@/components/dcc/DccSeccion";
import { SelloCalidad } from "@/components/dcc/SelloCalidad";
import { getAuditTrail } from "@/lib/credit-hub/api/bankClient";
import { useBankApplication, useBankCompliance } from "@/lib/credit-hub/hooks/useBankDecision";
import { chKeys } from "@/lib/credit-hub/hooks/queryKeys";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import type { BankDocumentPayload, BankReviewPayload } from "@/lib/credit-hub/types/bank-views";
import type { BankReviewApplication } from "@/lib/credit-hub/types/bankDecision";
import { formatEntero, formatMoneda, type LocaleTenant } from "@/lib/dcc/formato";
import { porcentaje } from "../comun/formato";
import type { MarcaDcc } from "@/lib/dcc/marca";
import { BANDA_TEXTO } from "../mesa/mesa";
import { datosCabecera, estadoDocumento, textoActor, textoDecision, textoEvento, textoSeveridad } from "./expediente";
import { NOTA_SIN_DATO, PROXIMAMENTE, hechosComunes } from "./hechos";

type Pestana = "resumen" | "documentos" | "cumplimiento" | "bitacora";
const PESTANAS: Array<[Pestana, string]> = [
  ["resumen", "Resumen"],
  ["documentos", "Documentos"],
  ["cumplimiento", "Cumplimiento"],
  ["bitacora", "Bitácora"],
];
const SELLO_DOC = {
  ok: { estado: "verificado" },
  parcial: { estado: "parcial", cubiertos: null, total: null, motivo: null },
  pendiente: { estado: "no_disponible", motivo: "Documento pendiente" },
} as const;

export type ExpedienteProps = {
  applicationId: string;
  marca: MarcaDcc;
  /** Vista actual del detalle: contraoferta, ofertas, estipulaciones, mensajes, notas y operaciones. */
  hrefVistaActual: string;
  hrefBandeja: string;
  /** Barra de decision (B4b), con la solicitud ya cargada. */
  decision?: (app: BankReviewApplication) => ReactNode;
};

/**
 * Expediente del solicitante (bank-v2), lectura. Mismos datos que el detalle
 * actual: useBankApplication, useBankCompliance y la bitacora de getAuditTrail
 * (misma clave de cache que useBankAuditTrail). Sin UUID, sin RFC y sin tasa
 * por defecto: lo que falta se dice.
 */
export function ExpedienteV2({ applicationId, marca, hrefVistaActual, hrefBandeja, decision }: ExpedienteProps) {
  const { tenantId } = useTenant();
  const appQ = useBankApplication(applicationId);
  const cumplimientoQ = useBankCompliance(applicationId);
  const bitacoraQ = useQuery({
    queryKey: chKeys.bankAuditTrail(tenantId ?? "", applicationId),
    queryFn: () => getAuditTrail({ tenantId: tenantId!, applicationId }),
    enabled: !!tenantId,
    staleTime: 15_000,
  });
  const [pestana, setPestana] = useState<Pestana>("resumen");
  const f = marca.formato;

  if (appQ.isError) return <DccEstado estado="error" detalle="No pudimos cargar el expediente" onReintentar={() => void appQ.refetch()} />;
  if (!appQ.data) return <DccEstado estado="cargando" />;

  const payload = appQ.data.application_payload as BankReviewPayload;
  const c = datosCabecera(payload);
  const hechos = hechosComunes(payload, appQ.data.state, f);
  const estado = hechos.estado;
  const docs = (Array.isArray(payload.documents) ? payload.documents : []) as BankDocumentPayload[];
  const issues = cumplimientoQ.data?.issues ?? [];

  return (
    <DccPageMarco
      titulo={c.nombre}
      marca={marca}
      acciones={<AccionesExpediente hrefBandeja={hrefBandeja} hrefVistaActual={hrefVistaActual} lugar="cabecera" />}
    >
      <div className="grid gap-[var(--dcc-gap)]">
        <section aria-label="Datos de la solicitud" className={DCC_CLASSES.card}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              data-testid="expediente-estado"
              className="rounded-full bg-[var(--dcc-teal-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--dcc-teal-ink)]"
            >
              {estado}
            </span>
            {c.ciudad ? <span className={`text-xs ${DCC_CLASSES.subtle}`}>{c.ciudad}</span> : null}
          </div>
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-7">
            <Hecho k="Vehículo" v={c.vehiculo} />
            <Hecho k="Dealer" v={c.dealer} />
            <Hecho k="Monto solicitado" v={formatMoneda(c.monto, f)} cifra />
            <Hecho k="Plazo" v={c.plazo != null ? `${formatEntero(c.plazo, f)} meses` : null} />
            <Hecho k="Tasa solicitada" v={hechos.tasa} nota={NOTA_SIN_DATO.tasa} testid="expediente-tasa" />
            <Hecho k="Inicial" v={formatMoneda(c.inicial, f)} />
            <Hecho k="Riesgo" v={hechos.riesgo} nota={NOTA_SIN_DATO.riesgo} testid="expediente-riesgo" />
          </dl>
        </section>

        <div role="tablist" aria-label="Secciones del expediente" className="flex gap-1 overflow-x-auto border-b border-[var(--dcc-border)]">
          {PESTANAS.map(([id, texto]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={pestana === id}
              onClick={() => setPestana(id)}
              className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${pestana === id ? "border-[var(--dcc-gold)] text-[var(--dcc-fg)]" : "border-transparent text-[var(--dcc-fg-muted)]"}`}
            >
              {texto}
              {id === "cumplimiento" && issues.length ? ` · ${formatEntero(issues.length, f)}` : ""}
              {id === "documentos" ? ` · ${formatEntero(docs.length, f)}` : ""}
            </button>
          ))}
        </div>

        <div role="tabpanel">
          {pestana === "resumen" ? <Resumen payload={payload} formato={f} /> : null}
          {pestana === "documentos" ? (
            <DccSeccion titulo="Documentos" icono={FileText}>
              {docs.length === 0 ? (
                <DccEstado estado="vacio" detalle="La solicitud no trae documentos." />
              ) : (
                <ul className="divide-y divide-[var(--dcc-border)]">
                  {docs.map((d, i) => {
                    const [texto, tono] = estadoDocumento(d.status ?? d.extraction_status);
                    return (
                      <li key={`${d.name ?? d.label ?? "doc"}-${i}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                        <span>{d.name ?? d.label ?? d.kind ?? "Documento"}</span>
                        <span className="inline-flex items-center gap-2">
                          <span className={DCC_CLASSES.muted}>{texto}</span>
                          <SelloCalidad calidad={SELLO_DOC[tono]} />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </DccSeccion>
          ) : null}
          {pestana === "cumplimiento" ? (
            <DccSeccion titulo="Cumplimiento" icono={FileText}>
              {cumplimientoQ.isError ? (
                <DccEstado estado="error" detalle="No pudimos cargar el cumplimiento" onReintentar={() => void cumplimientoQ.refetch()} />
              ) : !cumplimientoQ.data ? (
                <DccEstado estado="cargando" />
              ) : (
                <div className="grid gap-3 text-sm">
                  <p>
                    Consentimientos {cumplimientoQ.data.consents_complete ? "completos" : "incompletos"} · documentos{" "}
                    {cumplimientoQ.data.documents_complete ? "completos" : "incompletos"}.
                  </p>
                  {issues.length === 0 ? (
                    <p className={DCC_CLASSES.muted}>Sin observaciones abiertas.</p>
                  ) : (
                    <ul className="divide-y divide-[var(--dcc-border)]">
                      {issues.map((x, i) => (
                        <li key={i} className="py-2.5">
                          <p className="font-medium">{x.action_required}</p>
                          <p className={`text-xs ${DCC_CLASSES.subtle}`}>Severidad {textoSeveridad(x.severity).toLowerCase()}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </DccSeccion>
          ) : null}
          {pestana === "bitacora" ? (
            <DccSeccion titulo="Bitácora" icono={FileText} meta="registro de solo lectura">
              {bitacoraQ.isError ? (
                <DccEstado estado="error" detalle="No pudimos cargar la bitácora" onReintentar={() => void bitacoraQ.refetch()} />
              ) : !bitacoraQ.data ? (
                <DccEstado estado="cargando" />
              ) : bitacoraQ.data.events.length === 0 ? (
                <DccEstado estado="vacio" />
              ) : (
                <ol className="divide-y divide-[var(--dcc-border)]">
                  {[...bitacoraQ.data.events].reverse().map((e, i) => (
                    <li key={`${e.timestamp}-${i}`} className="grid gap-1 py-2.5 text-sm sm:grid-cols-[180px_160px_minmax(0,1fr)]">
                      <span className={`tabular-nums ${DCC_CLASSES.muted}`}>{fechaHora(e.timestamp, f)}</span>
                      <span>{textoActor(e.by)}</span>
                      <span title={e.event}>
                        {textoEvento(e.event)}
                        {textoDecision(e.decision) ? ` · ${textoDecision(e.decision)}` : ""}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </DccSeccion>
          ) : null}
        </div>
        {decision?.(appQ.data)}
        <AccionesExpediente hrefBandeja={hrefBandeja} hrefVistaActual={hrefVistaActual} lugar="pie" />
      </div>
    </DccPageMarco>
  );
}

/** Botones del detalle: primario «Abrir expediente completo» y secundario «Volver a la bandeja». Se repiten en cabecera y pie. */
function AccionesExpediente({ hrefBandeja, hrefVistaActual, lugar }: { hrefBandeja: string; hrefVistaActual: string; lugar: "cabecera" | "pie" }) {
  return (
    <div data-testid={`expediente-acciones-${lugar}`} className="flex flex-wrap items-center gap-3">
      <Link href={hrefBandeja} className={DCC_CLASSES.quietButton}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a la bandeja
      </Link>
      <Link href={hrefVistaActual} data-accion="principal" aria-label="Abrir expediente completo" className={`${DCC_CLASSES.actionButton} min-h-11 px-6 text-base`}>
        <FolderOpen className="h-5 w-5" aria-hidden="true" />
        Abrir expediente completo
      </Link>
    </div>
  );
}

function fechaHora(iso: string, f: LocaleTenant): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : new Intl.DateTimeFormat(f.locale, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(d);
}

function Hecho({ k, v, cifra, nota, testid }: { k: string; v: string | null; cifra?: boolean; nota?: string; testid?: string }) {
  return (
    <div className="min-w-0">
      <dt className={`text-[11px] font-semibold uppercase tracking-[0.06em] ${DCC_CLASSES.subtle}`}>{k}</dt>
      <dd className={`mt-1 ${cifra ? `${DCC_CLASSES.cifra} text-base` : "font-medium"}`}>
        {v == null && nota ? (
          <span data-testid={testid}>
            {PROXIMAMENTE}
            <span className={`block text-[11px] font-normal ${DCC_CLASSES.subtle}`}>{nota}</span>
          </span>
        ) : v ?? (
          <SelloCalidad
            calidad={{
              estado: "no_disponible",
              motivo: `La solicitud no trae ${k.toLowerCase()}`,
            }}
          />
        )}
      </dd>
    </div>
  );
}

const AVISO_SIN_SCORING = "Scoring no disponible para este expediente";

function Resumen({ payload, formato }: { payload: BankReviewPayload; formato: LocaleTenant }) {
  const a = payload.analysis;
  const m = a?.metrics;
  // Solo las métricas con dato; las que no tienen fuente no se pintan.
  const metricas: Array<{ k: string; v: string | null; cifra?: boolean }> = a
    ? [
        { k: "Score", v: a.score != null ? formatEntero(a.score, formato) : null, cifra: true },
        { k: "Nivel de riesgo", v: hechosComunes(payload, null, formato).riesgo },
        { k: "Banda del motor", v: BANDA_TEXTO[a.approval_band] ?? null },
        { k: "Deuda / ingreso", v: porcentaje(a.dti, formato) },
        { k: "Ingreso mensual", v: formatMoneda(m?.monthly_income, formato) },
        { k: "Deudas mensuales", v: formatMoneda(m?.monthly_debts, formato) },
        { k: "Cuota estimada", v: formatMoneda(a.estimated_payment, formato) },
        { k: "Capacidad de pago", v: formatMoneda(a.payment_capacity, formato) },
      ].filter((x) => x.v != null)
    : [];
  return (
    <DccSeccion titulo="Resumen del motor" icono={FileText} clave>
      {metricas.length === 0 ? (
        <p role="status" data-testid="aviso-sin-scoring" className={`text-sm ${DCC_CLASSES.muted}`}>
          {AVISO_SIN_SCORING}
        </p>
      ) : (
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {metricas.map((x) => (
            <Hecho key={x.k} k={x.k} v={x.v} cifra={x.cifra} />
          ))}
        </dl>
      )}
      {a && (a.positive_factors?.length || a.negative_factors?.length) ? (
        <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <Lista titulo="A favor" items={a.positive_factors ?? []} />
          <Lista titulo="En contra" items={a.negative_factors ?? []} />
        </div>
      ) : null}
    </DccSeccion>
  );
}

function Lista({ titulo, items }: { titulo: string; items: string[] }) {
  return (
    <div>
      <p className={`mb-1 text-xs font-semibold ${DCC_CLASSES.subtle}`}>{titulo}</p>
      {items.length ? (
        <ul className="list-disc space-y-1 pl-5">
          {items.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      ) : (
        <p className={DCC_CLASSES.muted}>—</p>
      )}
    </div>
  );
}
