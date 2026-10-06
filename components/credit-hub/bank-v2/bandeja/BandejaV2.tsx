"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, Inbox, Search } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { DccEstado } from "@/components/dcc/DccEstado";
import { DccPageMarco } from "@/components/dcc/DccPageMarco";
import { DccSeccion } from "@/components/dcc/DccSeccion";
import { STATE_LABEL, chRelTime, sortQueueItems } from "@/lib/credit-hub/bank/bankFormat";
import { BANK_QUEUE_PAGE_SIZE, resolveBankQueueTotal } from "@/lib/credit-hub/bank/queuePagination";
import { isChPanelLoading } from "@/lib/credit-hub/hooks/chQueryPanel";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";
import { useBulkActions } from "@/lib/credit-hub/hooks/useBulkActions";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";
import { formatEntero, formatMoneda } from "@/lib/dcc/formato";
import type { MarcaDcc } from "@/lib/dcc/marca";
import { BANDA_TEXTO, PRIORIDAD_TEXTO } from "../mesa/mesa";
import { exportarBandeja, type ResultadoExportar } from "./exportarBandeja";

const ESTADOS = [["all", "Todos"], ["pending", "Pendientes"], ["review", "En revisión"], ["decided", "Decididas"]] as const;
const PRIORIDADES = [["all", "Todas"], ["ALTA", "Alta"], ["MEDIA", "Media"], ["BAJA", "Baja"]] as const;
const EXPORTAR_TEXTO: Record<ResultadoExportar, string> = {
  descargado: "Excel descargado.",
  no_disponible: "La exportación a Excel aún no está disponible.",
  error: "No pudimos exportar. Vuelve a intentarlo.",
};

function coincideEstado(item: BankQueueItem, estado: string): boolean {
  const s = (item.state ?? "").toLowerCase();
  if (estado === "pending") return s === "submitted";
  if (estado === "review") return s === "claimed";
  if (estado === "decided") return s === "decided";
  return true;
}

export type BandejaProps = {
  marca: MarcaDcc;
  q: string;
  page: number;
  onParams: (q: string, page: number) => void;
  hrefSolicitud: (id: string) => string;
  /** Analista que firma la accion masiva; mismo valor que la Bandeja actual. */
  analistaId: string;
};

/**
 * Bandeja (bank-v2). Misma consulta paginada que la actual (limit 20, offset,
 * `q`), los mismos filtros locales, la misma exportacion y la misma accion
 * masiva (regla APROBAR_SCORE_GTE_800). Cambia la lectura: estados
 * traducidos, sin UUID, montos en la moneda del branding.
 */
export function BandejaV2({ marca, q, page, onParams, hrefSolicitud, analistaId }: BandejaProps) {
  const { apiTenantId } = useTenant();
  const filtros = useMemo(() => (q.trim() ? { q: q.trim() } : undefined), [q]);
  const colaQ = useBankQueue({ limit: BANK_QUEUE_PAGE_SIZE, offset: (page - 1) * BANK_QUEUE_PAGE_SIZE, filters: filtros });
  const masiva = useBulkActions();
  const [estado, setEstado] = useState("all");
  const [prioridad, setPrioridad] = useState("all");
  const [scoreMin, setScoreMin] = useState("");
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [confirmar, setConfirmar] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const formato = marca.formato;
  const items = colaQ.data?.applications ?? [];
  const total = resolveBankQueueTotal(colaQ.data) ?? 0;
  const paginas = Math.max(1, Math.ceil(total / BANK_QUEUE_PAGE_SIZE));
  const visibles = sortQueueItems(
    items.filter((i) => coincideEstado(i, estado) && (prioridad === "all" || i.priority === prioridad) && (!scoreMin || i.score >= Number(scoreMin))),
    "priority",
    "asc",
  );

  const alternar = (id: string) =>
    setSeleccion((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const aplicarMasiva = async () => {
    setConfirmar(false);
    try {
      const r = await masiva.mutateAsync({
        applicationIds: [...seleccion],
        rule: "APROBAR_SCORE_GTE_800",
        analystId: analistaId,
        justification: "Acción masiva desde bandeja",
      });
      setAviso(`Regla aplicada: ${formatEntero(r.processed, formato)} procesadas, ${formatEntero(r.skipped, formato)} sin cambios.`);
      setSeleccion(new Set());
    } catch {
      setAviso("No pudimos aplicar la regla. Vuelve a intentarlo.");
    }
  };

  const exportar = async () => {
    if (!apiTenantId) return;
    setAviso(EXPORTAR_TEXTO[await exportarBandeja(apiTenantId)]);
  };

  return (
    <DccPageMarco
      titulo="Bandeja"
      marca={marca}
      acciones={
        <button type="button" onClick={() => void exportar()} className={DCC_CLASSES.quietButton}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Exportar Excel
        </button>
      }
    >
      <DccSeccion titulo="Solicitudes" icono={Inbox} meta={colaQ.data ? `${formatEntero(total, formato)} en total · ${formatEntero(visibles.length, formato)} visibles` : null}>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Buscar</span>
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--dcc-fg-subtle)]" aria-hidden="true" />
            <input
              type="search"
              defaultValue={q}
              placeholder="Buscar por nombre o concesionario"
              onChange={(e) => onParams(e.target.value, 1)}
              className="h-9 w-full rounded-lg border border-[var(--dcc-border-strong)] bg-[var(--dcc-surface)] pl-9 pr-3 text-sm"
            />
          </label>
          <Segmento etiqueta="Estado" valor={estado} opciones={ESTADOS} onCambio={setEstado} />
          <Segmento etiqueta="Prioridad" valor={prioridad} opciones={PRIORIDADES} onCambio={setPrioridad} />
          <label className={`flex items-center gap-2 text-xs ${DCC_CLASSES.muted}`}>
            Score ≥
            <input inputMode="numeric" value={scoreMin} onChange={(e) => setScoreMin(e.target.value.replace(/\D/g, ""))} placeholder="300" className="h-8 w-16 rounded-lg border border-[var(--dcc-border-strong)] bg-[var(--dcc-surface)] px-2 text-sm" />
          </label>
        </div>
        {aviso ? (
          <p role="status" className={`mt-3 text-sm ${DCC_CLASSES.muted}`}>
            {aviso}
          </p>
        ) : null}
        <div className="mt-4">
          {colaQ.isError ? (
            <DccEstado estado="error" detalle="No pudimos cargar la bandeja" onReintentar={() => void colaQ.refetch()} />
          ) : isChPanelLoading(colaQ, !!apiTenantId) ? (
            <DccEstado estado="cargando" />
          ) : visibles.length === 0 ? (
            <DccEstado estado="vacio" detalle={q || estado !== "all" || prioridad !== "all" || scoreMin ? "Ninguna solicitud coincide con los filtros." : null} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className={`text-left text-[11px] uppercase tracking-[0.06em] ${DCC_CLASSES.subtle}`}>
                    <th className="w-8 pb-2" />
                    <th className="pb-2 pr-3 font-semibold">Solicitante</th>
                    <th className="pb-2 pr-3 font-semibold">Dealer</th>
                    <th className="pb-2 pr-3 text-right font-semibold">Monto</th>
                    <th className="pb-2 pr-3 text-right font-semibold">Score</th>
                    <th className="pb-2 pr-3 font-semibold">Prioridad</th>
                    <th className="pb-2 pr-3 font-semibold">Estado</th>
                    <th className="pb-2 pr-3 font-semibold">Recibida</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((i) => (
                    <tr key={i.application_id} data-testid="bandeja-fila" className="border-t border-[var(--dcc-border)] align-top">
                      <td className="py-2.5">
                        <input type="checkbox" aria-label={`Seleccionar ${i.applicant_name ?? "solicitud"}`} checked={seleccion.has(i.application_id)} onChange={() => alternar(i.application_id)} />
                      </td>
                      <td className="py-2.5 pr-3">
                        <Link href={hrefSolicitud(i.application_id)} className={`min-h-0 ${DCC_CLASSES.link}`}>
                          {i.applicant_name ?? "Solicitante sin nombre"}
                        </Link>
                        <p className={`text-xs ${DCC_CLASSES.subtle}`}>{i.vehicle_label ?? "Vehículo sin datos"}</p>
                      </td>
                      <td className="py-2.5 pr-3">{i.dealer_name ?? "—"}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{formatMoneda(i.requested_amount, formato) ?? "—"}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">
                        {formatEntero(i.score, formato)}
                        <p className={`text-xs ${DCC_CLASSES.subtle}`}>{(i.approval_band && BANDA_TEXTO[i.approval_band.toUpperCase()]) ?? ""}</p>
                      </td>
                      <td className="py-2.5 pr-3">{PRIORIDAD_TEXTO[i.priority] ?? "—"}</td>
                      <td className="py-2.5 pr-3">{STATE_LABEL[i.state]?.[0] ?? (i.bank_decision ? "Decidida" : "Pendiente")}</td>
                      <td className={`py-2.5 ${DCC_CLASSES.muted}`}>{chRelTime(i.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className={DCC_CLASSES.muted}>
            Página {formatEntero(page, formato)} de {formatEntero(paginas, formato)}
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => onParams(q, page - 1)} className={DCC_CLASSES.quietButton}>
              Anterior
            </button>
            <button type="button" disabled={page >= paginas} onClick={() => onParams(q, page + 1)} className={DCC_CLASSES.quietButton}>
              Siguiente
            </button>
          </div>
        </div>
      </DccSeccion>

      {seleccion.size > 0 ? (
        <div role="region" aria-label="Acción masiva" className="sticky bottom-4 z-10 mt-4 flex flex-wrap items-center gap-3 rounded-[var(--dcc-radius)] border border-[var(--dcc-border-strong)] bg-[var(--dcc-surface)] p-3 shadow-[var(--dcc-shadow)]">
          <span className="text-sm font-semibold">{formatEntero(seleccion.size, formato)} seleccionadas</span>
          <span className={`text-sm ${DCC_CLASSES.muted}`}>Regla: aprobar las que tengan score de 800 o más.</span>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={() => setSeleccion(new Set())} className={DCC_CLASSES.quietButton}>
              Limpiar
            </button>
            {confirmar ? (
              <button type="button" disabled={masiva.isPending} onClick={() => void aplicarMasiva()} className={DCC_CLASSES.actionButton}>
                Confirmar
              </button>
            ) : (
              <button type="button" onClick={() => setConfirmar(true)} className={DCC_CLASSES.actionButton}>
                Aplicar regla
              </button>
            )}
          </div>
        </div>
      ) : null}
    </DccPageMarco>
  );
}

function Segmento({ etiqueta, valor, opciones, onCambio }: { etiqueta: string; valor: string; opciones: ReadonlyArray<readonly [string, string]>; onCambio: (v: string) => void }) {
  return (
    <div role="group" aria-label={etiqueta} className="flex overflow-hidden rounded-lg border border-[var(--dcc-border-strong)] text-xs">
      {opciones.map(([v, l]) => (
        <button
          key={v}
          type="button"
          aria-pressed={valor === v}
          onClick={() => onCambio(v)}
          className={`px-2.5 py-1.5 ${valor === v ? "bg-[var(--dcc-action)] text-[var(--dcc-on-action)]" : "bg-[var(--dcc-surface)] text-[var(--dcc-fg-muted)]"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
