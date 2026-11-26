"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { legalCaughtErrorToSpanish } from "@/lib/legal/api-error-es";
import {
  cancelarAmpliacion, comprarAmpliacion, gb, leerEspacio, tamano, usd, verificarAmpliacion,
  type Espacio, type MetodoArchivo, type Nivel, type PaqueteArchivo,
} from "@/lib/legal/archivo-api";
import { genioButton, genioCard, genioField, genioLabel, genioPrimary, genioTitulo } from "@/components/legal/cases/estudio-genio/estilo";
import m from "@/messages/es/legal-archivo.json";

const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));
const barra: Record<Nivel, string> = { ok: "bg-[#2F6B4F]", aviso: "bg-[#B58A3C]", lleno: "bg-[#8E2C3A]" };
const textoNivel: Record<Nivel, string> = { ok: "text-[#2F6B4F]", aviso: "text-[#8A6A2C]", lleno: "text-[#8E2C3A]" };
const errorTexto = (e: unknown) => legalCaughtErrorToSpanish(e, {}) || m.error;

/** Acceso al navegador en un solo lugar (las pruebas lo sustituyen). */
export const navegadorArchivo = {
  url: () => window.location.href,
  search: () => window.location.search,
  ir: (url: string) => window.location.assign(url),
};

export function useEspacio(tenantId: string) {
  return useQuery({ queryKey: ["legal_archivo", tenantId], queryFn: () => leerEspacio(tenantId), enabled: Boolean(tenantId), retry: false });
}

/** Barra de uso del archivo. La usan esta sección y la tarjeta de Mi despacho. */
export function BarraEspacio({ e }: { e: Pick<Espacio, "usado_bytes" | "total_bytes" | "libre_bytes" | "porcentaje" | "nivel"> }) {
  const pct = Number.isFinite(e.porcentaje) ? Math.min(100, Math.max(0, e.porcentaje)) : 0;
  const ancho = Math.max(e.usado_bytes > 0 ? 1.5 : 0, pct);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-2xl font-semibold">{fill(m.usado, { usado: tamano(e.usado_bytes), total: tamano(e.total_bytes) })}</p>
        <p className="text-sm text-[#6B7385]">{fill(m.libre, { libre: tamano(e.libre_bytes) })}</p>
      </div>
      <div role="progressbar" aria-label={m.medidor.titulo} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}
        className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#E3E7EE]">
        <div className={`h-full rounded-full ${barra[e.nivel]}`} style={{ width: `${ancho}%` }} />
      </div>
      <p className={`mt-2 text-sm font-medium ${textoNivel[e.nivel]}`}>{m.niveles[e.nivel]}</p>
    </div>
  );
}

/** Configuración → Plan y almacenamiento: uso, membresías (con el Estudio Genio en todas) y ampliaciones. */
export function PlanYAlmacenamiento({ tenantId }: { tenantId: string }) {
  const q = useEspacio(tenantId);
  if (q.isPending) return <section className={genioCard}><p role="status">{m.cargando}</p></section>;
  if (q.error || !q.data)
    return (
      <section className={genioCard}>
        <p role="alert" className="text-[#8E2C3A]">{m.error}</p>
        <button type="button" className={`${genioButton} mt-3`} onClick={() => void q.refetch()}>{m.reintentar}</button>
      </section>
    );
  return <Contenido tenantId={tenantId} e={q.data} />;
}

function Contenido({ tenantId, e }: { tenantId: string; e: Espacio }) {
  const genio = Object.fromEntries(e.catalogo.estudio_genio.map((p) => [p.paquete, p]));
  return (
    <section aria-labelledby="plan-almacenamiento" className="space-y-6 text-[#17233A]">
      <div>
        <h2 id="plan-almacenamiento" className={genioTitulo}>{m.titulo}</h2>
        <p className="mt-1 max-w-3xl text-sm text-[#3B4558]">{m.ayuda}</p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px] [&>*]:min-w-0">
        <div className={`${genioCard} space-y-5`}>
          <BarraEspacio e={e} />
          <dl className="grid gap-3 border-t border-[#E3E7EE] pt-4 text-sm sm:grid-cols-3">
            <div><dt className="text-[#6B7385]">{m.planActual}</dt><dd className="font-semibold">{e.plan_nombre || m.sinPlan}</dd></div>
            <div><dt className="text-[#6B7385]">{m.incluido}</dt><dd className="font-semibold">{gb(e.incluido_gb)}</dd></div>
            <div><dt className="text-[#6B7385]">{m.ampliado}</dt><dd className="font-semibold">{e.ampliaciones_gb ? `+${gb(e.ampliaciones_gb)}` : "—"}</dd></div>
          </dl>
        </div>
        <Ampliar tenantId={tenantId} e={e} />
      </div>

      {e.catalogo.planes.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-lg font-semibold">{m.planes.titulo}</h3>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {e.catalogo.planes.map((p) => {
              const actual = p.code === e.plan;
              return (
                <li key={p.code} className={`flex flex-col rounded-2xl border bg-white p-5 ${actual ? "border-[#B58A3C] ring-2 ring-[#B58A3C]/40" : "border-[#E3E7EE]"}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-semibold text-[#8A6A2C]">{p.nombre}</p>
                    {actual && <span className="rounded-full bg-[#17233A] px-2.5 py-0.5 text-xs font-semibold text-white">{m.planes.actual}</span>}
                  </div>
                  <p className="mt-2 font-display text-[1.75rem] font-semibold leading-none">
                    {p.precio_usd_mes != null ? usd(p.precio_usd_mes) : "—"}
                    <span className="text-sm font-normal text-[#6B7385]">{p.a_cotizacion ? ` ${m.planes.cotizacion}` : m.planes.mes}</span>
                  </p>
                  <ul className="mt-4 space-y-1.5 text-sm text-[#3B4558]">
                    <li>{p.usuarios ? fill(m.planes.usuarios, { n: p.usuarios }) : m.planes.usuariosIlimitados}</li>
                    {p.espacio_gb != null && <li>{fill(m.planes.espacio, { n: gb(p.espacio_gb) })}</li>}
                  </ul>
                  <div className="mt-4 border-t border-[#EBDDBF] pt-3 text-sm">
                    <p className="font-semibold">{m.planes.genio}</p>
                    {genio.esencial && genio.completo && (
                      <p className="mt-0.5 text-[#3B4558]">{fill(m.planes.genioDetalle, { esencial: usd(genio.esencial.precio_usd), completo: usd(genio.completo.precio_usd) })}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <Link href="/legal/estudio-genio" className={genioPrimary}>{m.planes.genioCta}</Link>
        </div>
      )}
    </section>
  );
}

function Ampliar({ tenantId, e }: { tenantId: string; e: Espacio }) {
  const a = m.ampliar;
  const client = useQueryClient();
  const refrescar = () => client.invalidateQueries({ queryKey: ["legal_archivo", tenantId] });
  const metodos = e.catalogo.metodos_disponibles;
  const [paquete, setPaquete] = useState<PaqueteArchivo | "">("");
  const [metodo, setMetodo] = useState<MetodoArchivo | "">("");
  const [referencia, setReferencia] = useState("");
  const [comprobante, setComprobante] = useState("");
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");
  const [cancelando, setCancelando] = useState("");
  const verificado = useRef(false);
  useEffect(() => { if (!metodo && metodos.length) setMetodo(metodos[0]); }, [metodos, metodo]);
  useEffect(() => {
    if (verificado.current || typeof window === "undefined") return;
    const p = new URLSearchParams(navegadorArchivo.search());
    const id = p.get("ampliacion"), pago = p.get("pago");
    if (!id || !pago) return;
    verificado.current = true;
    if (pago !== "ok") { setAviso(a.pagoCancelado); return; }
    verificarAmpliacion(tenantId, id).then((r) => { setAviso(r.estado === "activa" ? a.pagoOk : a.pagoPendiente); void refrescar(); })
      .catch((err) => setError(errorTexto(err)));
  }, [tenantId]); // eslint-disable-line react-hooks/exhaustive-deps
  const compra = useMutation({ mutationFn: () => comprarAmpliacion(tenantId, {
    paquete: paquete as PaqueteArchivo, metodo: metodo as MetodoArchivo,
    ...(metodo === "transferencia" ? { referencia: referencia.trim(), ...(comprobante.trim() ? { comprobante: comprobante.trim() } : {}) } : {}),
    ...(metodo === "stripe" ? { url_retorno: navegadorArchivo.url().split("?")[0] } : {}),
  }) });
  const cancelar = useMutation({ mutationFn: (id: string) => cancelarAmpliacion(tenantId, id), onSuccess: () => { setCancelando(""); void refrescar(); } });
  const vigentes = useMemo(() => e.ampliaciones.filter((x) => x.estado !== "rechazada"), [e.ampliaciones]);
  const enviar = async () => {
    setError(""); setAviso("");
    if (!paquete) { setError(a.elegir); return; }
    if (metodo === "transferencia" && !referencia.trim()) { setError(a.referenciaFalta); return; }
    try {
      const r = await compra.mutateAsync();
      if (metodo === "stripe" && r.url_pago) { navegadorArchivo.ir(r.url_pago); return; }
      setAviso(a.recibida); setPaquete(""); setReferencia(""); setComprobante(""); void refrescar();
    } catch (err) { setError(errorTexto(err)); }
  };
  return (
    <div className={`${genioCard} space-y-4`}>
      <h3 className="font-display text-lg font-semibold">{a.titulo}</h3>
      <p className="text-sm text-[#3B4558]">{a.ayuda}</p>
      <fieldset className="space-y-2" disabled={compra.isPending}>
        <legend className="sr-only">{a.titulo}</legend>
        {e.catalogo.ampliaciones.map((x) => (
          <label key={x.paquete} className={`flex min-h-[52px] cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 ${paquete === x.paquete ? "border-[#B58A3C] bg-[#FBF7EE]" : "border-[#E3E7EE] hover:border-[#C9CFDA]"}`}>
            <span className="flex items-center gap-3">
              <input type="radio" name="ampliacion" value={x.paquete} checked={paquete === x.paquete} onChange={() => setPaquete(x.paquete)} />
              <span className="font-semibold">{x.nombre}</span>
            </span>
            <span className="text-sm"><span className="font-semibold">{usd(x.precio_usd_mes)}</span><span className="text-[#6B7385]">{m.planes.mes}</span></span>
          </label>
        ))}
      </fieldset>
      {paquete && (metodos.length === 0 ? <p role="status" className="text-sm">{a.sinMetodos}</p> : (
        <div role="group" aria-label={a.metodo} className="space-y-3 rounded-xl border border-[#E3E7EE] bg-[#F5F7FA] p-4">
          <fieldset className="space-y-1"><legend className="text-sm font-medium text-[#3B4558]">{a.metodo}</legend>
            {metodos.map((x) => (
              <label key={x} className="flex min-h-[40px] items-center gap-2 text-sm">
                <input type="radio" name="metodo-archivo" value={x} checked={metodo === x} onChange={() => setMetodo(x)} /> {a[x]}
              </label>
            ))}
          </fieldset>
          {metodo === "transferencia" && <>
            <p className="whitespace-pre-line rounded-lg border border-[#E3E7EE] bg-white p-3 text-sm">{e.catalogo.datos_transferencia}</p>
            <label className={genioLabel}>{a.referencia}<input className={genioField} value={referencia} onChange={(ev) => setReferencia(ev.target.value)} /></label>
            <label className={genioLabel}>{a.comprobante}<input className={genioField} value={comprobante} onChange={(ev) => setComprobante(ev.target.value)} /></label>
          </>}
          <button type="button" className={`${genioPrimary} w-full`} disabled={compra.isPending || !metodo} onClick={() => void enviar()}>
            {compra.isPending ? m.busy : metodo === "stripe" ? a.pagar : a.registrar}
          </button>
        </div>
      ))}
      {aviso && <p role="status" className="text-sm font-medium text-[#2F6B4F]">{aviso}</p>}
      {error && <p role="alert" className="text-sm font-medium text-[#8E2C3A]">{error}</p>}
      {vigentes.length > 0 && (
        <div className="space-y-2 border-t border-[#E3E7EE] pt-4">
          <h4 className="text-sm font-semibold text-[#3B4558]">{a.lista}</h4>
          <ul className="divide-y divide-[#E3E7EE] text-sm">
            {vigentes.map((x) => (
              <li key={x.ampliacion_id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  +{gb(x.gb)} · {usd(x.precio_usd_mes)}{m.planes.mes} · {a.estados[x.estado]}
                  {x.vigente_hasta && (x.estado === "activa" || x.estado === "cancelada")
                    ? ` · ${fill(a.hasta, { fecha: new Date(x.vigente_hasta).toLocaleDateString("es") })}` : ""}
                </span>
                {(x.estado === "activa" || x.estado === "pendiente") && (cancelando === x.ampliacion_id ? (
                  <span className="flex items-center gap-2">
                    <span className="text-[#3B4558]">{a.confirmarCancelar}</span>
                    <button type="button" className={genioButton} disabled={cancelar.isPending} onClick={() => cancelar.mutate(x.ampliacion_id)}>{a.si}</button>
                    <button type="button" className={genioButton} onClick={() => setCancelando("")}>{a.no}</button>
                  </span>
                ) : (
                  <button type="button" className="text-sm font-semibold text-[#8E2C3A] underline-offset-2 hover:underline" onClick={() => setCancelando(x.ampliacion_id)}>{a.cancelar}</button>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Tarjeta compacta para Mi despacho: cuánto ocupa el archivo y un enlace para ampliar. No se muestra si no hay datos. */
export function MedidorArchivo({ tenantId }: { tenantId: string }) {
  const q = useEspacio(tenantId);
  if (!q.data) return null;
  return (
    <section aria-labelledby="medidor-archivo" className={`${genioCard} space-y-3`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="medidor-archivo" className="font-semibold text-[#3B4558]">{m.medidor.titulo}</h2>
        <Link href="/legal/config#plan-almacenamiento" className="text-sm font-semibold text-[#8A6A2C] hover:underline">{m.medidor.ampliar}</Link>
      </div>
      <BarraEspacio e={q.data} />
    </section>
  );
}
