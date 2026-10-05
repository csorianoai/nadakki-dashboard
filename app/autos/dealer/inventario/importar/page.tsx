"use client";

/**
 * Importar la PLANTILLA_ACTIVOS_v4 (D7, contrato P5).
 *
 * Dos pasos y ninguno se salta: REVISAR no escribe nada y dice fila por fila
 * que pasa; APLICAR solo se ofrece sobre una revision limpia de la v4, del
 * MISMO archivo. Cambiar el archivo tira la revision.
 *
 * El acceso lo decide el batch de las dos claves (vehiculos y asientos); el
 * dealer se usa para construir la peticion, igual que en el inventario. La
 * autoridad sigue siendo el backend: su 403 se pinta con su reason_code.
 */

import Link from "next/link";
import { useState, type ChangeEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AccessApiError } from "@/lib/access/client";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { selectedDealerIdentity } from "@/lib/dealer/access-context";
import { fetchMyDealerContext } from "@/lib/dealer/dealer-context-api";
import {
  IMPORT_CAPABILITY_KEYS,
  ImportRechazado,
  erroresDeArchivo,
  postImportActivos,
  puedeAplicar,
  validarArchivo,
  type ImportResultado,
} from "@/lib/dealer-management/import-activos";

const CAJA = "rounded-xl border border-nk-border bg-nk-surface p-4 text-sm text-nk-fg";
const BOTON =
  "inline-flex min-h-10 items-center rounded-lg border border-nk-border px-4 text-sm font-semibold text-nk-fg hover:bg-nk-surface-2 disabled:cursor-not-allowed disabled:opacity-50";

const COLUMNAS = ["Hoja", "Filas"];
const PLANTILLA = "PLANTILLA_ACTIVOS_v4";
const ACEPTA = ".xlsx,.zip";

function codigoDe(error: unknown): string {
  if (error instanceof AccessApiError) return error.reason_code ?? `HTTP_${error.status}`;
  return "SIN_RESPUESTA";
}

function Resultado({ resultado, testId }: { resultado: ImportResultado; testId: string }) {
  const deArchivo = erroresDeArchivo(resultado);
  return (
    <section data-testid={testId} className={`${CAJA} space-y-3`}>
      {resultado.hojas.length > 0 ? (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-nk-fg-muted">
              {COLUMNAS.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resultado.hojas.map((h) => (
              <tr key={h.hoja} data-testid={`import-hoja-${h.hoja}`} data-filas={h.filas}>
                <td>{h.hoja}</td>
                <td>{h.filas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {resultado.errores.length > 0 ? (
        <div role="alert" data-testid="import-errores" data-cantidad={resultado.errores.length}>
          <p className="font-semibold">
            {deArchivo.length > 0
              ? "El archivo no se puede leer como la plantilla oficial. Ninguna fila se carga."
              : `Hay ${resultado.errores.length} error(es). Corregilos en la planilla y volvé a revisar: no se carga nada a medias.`}
          </p>
          <ul className="mt-2 list-disc pl-5">
            {resultado.errores.map((e, i) => (
              <li key={i}>
                {[e.hoja, e.fila !== null ? `fila ${e.fila}` : null].filter(Boolean).join(" · ")}
                {e.hoja || e.fila !== null ? ": " : ""}
                {e.mensaje}
                {e.codigo && e.codigo !== e.mensaje ? <code className="ml-1">{e.codigo}</code> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {resultado.avisos.length > 0 ? (
        <div data-testid="import-no-aplicado">
          <p className="font-semibold">Se lee pero todavía no se guarda (no lo cargues dos veces):</p>
          <ul className="mt-1 list-disc pl-5 text-nk-fg-muted">
            {resultado.avisos.map((n, i) => (
              <li key={i}>{[n.hoja, n.mensaje].filter(Boolean).join(" · ")}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export default function ImportarActivosPage() {
  const access = useAccessEntitlementsBatch(IMPORT_CAPABILITY_KEYS);
  const cargando = access.isPending || access.isLoading;
  const denegada = IMPORT_CAPABILITY_KEYS.find((key) => access.data?.results[key]?.allowed !== true);
  const allowed = !cargando && !access.error && Boolean(access.data) && !denegada;

  const binding = selectedDealerIdentity()?.dealerId ?? null;
  const [elegido, setElegido] = useState<string | null>(null);
  const asignaciones = useQuery({
    queryKey: ["dealer-assignments"],
    queryFn: fetchMyDealerContext,
    enabled: allowed && binding === null,
    staleTime: Infinity,
    retry: false,
  });
  const porElegir = binding === null ? (asignaciones.data ?? []) : [];
  const dealerId = binding ?? elegido ?? (porElegir.length === 1 ? porElegir[0].dealerId : null);

  const [archivo, setArchivo] = useState<File | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [revision, setRevision] = useState<ImportResultado | null>(null);
  const [clave, setClave] = useState<string | null>(null);

  const revisar = useMutation({
    mutationFn: () => postImportActivos(dealerId as string, archivo as File, (archivo as File).name, "revision"),
    onSuccess: (r) => {
      setRevision(r);
      // Una clave por revision: reintentar el MISMO aplicar no duplica.
      setClave(crypto.randomUUID());
    },
    onError: (e) => setRevision(e instanceof ImportRechazado ? e.resultado : null),
  });

  const aplicar = useMutation({
    mutationFn: () =>
      postImportActivos(dealerId as string, archivo as File, (archivo as File).name, "aplicar", clave as string),
  });

  function elegirArchivo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setArchivo(file);
    setAviso(file ? validarArchivo(file) : null);
    setRevision(null);
    setClave(null);
    revisar.reset();
    aplicar.reset();
  }

  const listoParaRevisar = Boolean(archivo && dealerId && !validarArchivo(archivo)) && !revisar.isPending;
  const listoParaAplicar = puedeAplicar(revision) && Boolean(clave) && !aplicar.isPending && !aplicar.isSuccess;

  return (
    <main className="max-w-full space-y-5 overflow-x-hidden">
      <header>
        <Link href="/autos/dealer/inventario" className="text-sm text-brand-2 underline">
          ← Inventario
        </Link>
        <h1 className="mt-2 font-manrope text-2xl font-extrabold text-nk-fg">Importar planilla de activos</h1>
        <p className="mt-1 text-sm text-nk-fg-muted">
          Subí la plantilla oficial <code>{PLANTILLA}</code> (.xlsx o su .zip de CSV). Primero se
          revisa sin guardar nada; después aplicás.
        </p>
      </header>

      <section data-testid="import-reglas" className={CAJA}>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Stock que ya tenías: <strong>es_stock_inicial=SI</strong> y sus costos con{" "}
            <strong>es_apertura=SI</strong>. Van como saldo inicial: Debe 1220 / Haber 3020 Saldos iniciales.
          </li>
          <li>Compras nuevas: es_apertura=NO. El haber va a 2010 Proveedores.</li>
          <li>Los costos se cargan SIN IVA recuperable. “Comisión” es solo la comisión de compra.</li>
        </ul>
      </section>

      {cargando ? (
        <p className="animate-pulse text-sm text-nk-fg-muted">Verificando acceso…</p>
      ) : access.error || !access.data ? (
        <section role="alert" data-testid="import-error-acceso" data-reason-code={codigoDe(access.error)} className={CAJA}>
          <p className="font-semibold">No se pudo verificar el acceso al importador.</p>
          <p className="mt-1 text-nk-fg-muted">
            reason_code: <code>{codigoDe(access.error)}</code>
          </p>
        </section>
      ) : denegada ? (
        <section
          role="alert"
          data-testid="import-denegado"
          data-capability={denegada}
          data-reason-code={access.data.results[denegada]?.reason_code ?? ""}
          className={CAJA}
        >
          <p className="font-semibold">El importador no está disponible para tu usuario.</p>
          <p className="mt-1 text-nk-fg-muted">
            Falta <code>{denegada}</code> · reason_code:{" "}
            <code>{access.data.results[denegada]?.reason_code ?? "—"}</code>
          </p>
        </section>
      ) : binding === null && asignaciones.isPending ? (
        <p className="animate-pulse text-sm text-nk-fg-muted">Verificando tus concesionarios…</p>
      ) : !dealerId && porElegir.length > 1 ? (
        <section data-testid="import-selector-dealer" className={CAJA}>
          <p className="font-semibold">Elegí el concesionario al que se carga la planilla.</p>
          <ul className="mt-3 grid gap-2">
            {porElegir.map((a) => (
              <li key={a.dealerId}>
                <button type="button" className={BOTON} onClick={() => setElegido(a.dealerId)}>
                  {a.dealerName ?? a.dealerId}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : !dealerId ? (
        <section role="status" data-testid="import-sin-dealer" className={CAJA}>
          <p className="font-semibold">No se pudo identificar el dealer de tu sesión.</p>
        </section>
      ) : (
        <section data-testid="import-formulario" className="space-y-4">
          <div className={CAJA}>
            <label className="block font-semibold" htmlFor="import-archivo">
              Archivo de la plantilla
            </label>
            <input
              id="import-archivo"
              data-testid="import-archivo"
              type="file"
              accept={ACEPTA}
              onChange={elegirArchivo}
              className="mt-2 block"
            />
            {aviso ? (
              <p role="alert" data-testid="import-aviso" className="mt-2 text-nk-fg-muted">
                {aviso}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="import-revisar"
                className={BOTON}
                disabled={!listoParaRevisar}
                onClick={() => revisar.mutate()}
              >
                {revisar.isPending ? "Revisando…" : "Revisar"}
              </button>
              <button
                type="button"
                data-testid="import-aplicar"
                className={BOTON}
                disabled={!listoParaAplicar}
                onClick={() => aplicar.mutate()}
              >
                {aplicar.isPending ? "Aplicando…" : "Aplicar"}
              </button>
            </div>
          </div>

          {revisar.error && !(revisar.error instanceof ImportRechazado) ? (
            <section role="alert" data-testid="import-error" data-reason-code={codigoDe(revisar.error)} className={CAJA}>
              <p className="font-semibold">No se pudo revisar el archivo.</p>
              <p className="mt-1 text-nk-fg-muted">
                reason_code: <code>{codigoDe(revisar.error)}</code>
              </p>
            </section>
          ) : null}
          {revision ? <Resultado resultado={revision} testId="import-revision" /> : null}

          {aplicar.error ? (
            aplicar.error instanceof ImportRechazado ? (
              <Resultado resultado={aplicar.error.resultado} testId="import-aplicar-rechazado" />
            ) : (
              <section role="alert" data-testid="import-aplicar-error" data-reason-code={codigoDe(aplicar.error)} className={CAJA}>
                <p className="font-semibold">No se aplicó la planilla.</p>
                <p className="mt-1 text-nk-fg-muted">
                  reason_code: <code>{codigoDe(aplicar.error)}</code>. Podés reintentar: no duplica.
                </p>
              </section>
            )
          ) : null}
          {aplicar.data ? (
            <div data-testid="import-aplicado">
              <p className="mb-2 font-semibold text-nk-fg">Planilla aplicada.</p>
              <Resultado resultado={aplicar.data} testId="import-aplicado-detalle" />
            </div>
          ) : null}
        </section>
      )}
    </main>
  );
}
