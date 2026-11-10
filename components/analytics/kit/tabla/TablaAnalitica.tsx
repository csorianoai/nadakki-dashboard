"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { DataTable, type DataTableColumn } from "@/components/forge/ui/DataTable";
import { EstadoAnalitica, type EstadoNoOk } from "../EstadoAnalitica";
import { useEsMovil } from "../movil/useEsMovil";
import { CeldaCifra } from "./CeldaCifra";
import { estadoEfectivo, formatearFecha, type Cifra } from "@/lib/analytics/cifra";
import { nivelCalor, normalizarTexto, ordenarPor, paginar, rangoCalor, type Direccion } from "@/lib/analytics/tabla";
import { cn } from "@/lib/utils";

interface ColumnaBase {
  id: string;
  encabezado: string;
  /** Muestra un filtro: texto "contiene" o numero "minimo". */
  filtrable?: boolean;
}
export interface ColumnaTexto<R> extends ColumnaBase {
  tipo: "texto";
  texto: (fila: R) => string;
}
export interface ColumnaCifra<R> extends ColumnaBase {
  tipo: "cifra";
  cifra: (fila: R) => Cifra;
  /** Mapa de calor sobre la columna (escala calculada con TODAS las filas, no solo la pagina visible). */
  calor?: boolean;
}
export type ColumnaAnalitica<R> = ColumnaTexto<R> | ColumnaCifra<R>;

export interface TablaAnaliticaProps<R> {
  /** Nombre accesible de la tabla y encabezado de la lista movil. */
  titulo: string;
  columnas: ColumnaAnalitica<R>[];
  filas: R[];
  obtenerId: (fila: R) => string;
  /** Estado de toda la tabla; reemplaza el contenido por EstadoAnalitica. */
  estado?: EstadoNoOk;
  onReintentar?: () => void;
  tamanoPagina?: number;
  opcionesTamano?: number[];
  ordenInicial?: { columna: string; direccion: Direccion };
}

const BOTON =
  "min-h-[44px] rounded-forge-sm border border-forgeGray-200 bg-forgeSurface-card px-4 text-forge-sm font-medium text-forgeGray-800 hover:bg-forgeGray-50 disabled:cursor-not-allowed disabled:text-forgeGray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-600";
const CAMPO =
  "min-h-[44px] w-full min-w-0 rounded-forge-sm border border-forgeGray-200 bg-forgeSurface-card px-3 text-forge-sm text-forgeGray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-600";

/** "1.250,5" no se interpreta: solo se acepta un numero simple con punto o coma decimal. */
function aNumero(s: string): number | null {
  const t = s.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function TablaAnalitica<R>({
  titulo,
  columnas,
  filas,
  obtenerId,
  estado,
  onReintentar,
  tamanoPagina,
  opcionesTamano,
  ordenInicial,
}: TablaAnaliticaProps<R>) {
  const uid = useId();
  const movil = useEsMovil();
  const [orden, setOrden] = useState<{ columna: string; direccion: Direccion } | null>(ordenInicial ?? null);
  const [filtros, setFiltros] = useState<Record<string, string>>({});
  const [pagina, setPagina] = useState(1);
  const [tamano, setTamano] = useState(tamanoPagina ?? opcionesTamano?.[0] ?? 10);

  const rangos = useMemo(() => {
    const out: Record<string, { min: number; max: number } | null> = {};
    for (const c of columnas) {
      if (c.tipo !== "cifra" || !c.calor) continue;
      out[c.id] = rangoCalor(
        filas.map((f) => {
          const cifra = c.cifra(f);
          return estadoEfectivo(cifra) === "ok" ? cifra.valor : null;
        })
      );
    }
    return out;
  }, [columnas, filas]);

  const hayFiltros = Object.values(filtros).some((v) => v.trim() !== "");

  const filtradas = useMemo(
    () =>
      filas.filter((f) =>
        columnas.every((c) => {
          const v = filtros[c.id];
          if (!c.filtrable || !v || v.trim() === "") return true;
          if (c.tipo === "texto") return normalizarTexto(c.texto(f)).includes(normalizarTexto(v));
          const min = aNumero(v);
          if (min === null) return true; // minimo no numerico: se ignora
          const cifra = c.cifra(f);
          return estadoEfectivo(cifra) === "ok" && (cifra.valor as number) >= min;
        })
      ),
    [filas, columnas, filtros]
  );

  const ordenadas = useMemo(() => {
    const col = orden && columnas.find((c) => c.id === orden.columna);
    if (!orden || !col) return filtradas;
    return ordenarPor(
      filtradas,
      (f) => {
        if (col.tipo === "texto") return col.texto(f);
        const cifra = col.cifra(f);
        return estadoEfectivo(cifra) === "ok" ? cifra.valor : null;
      },
      orden.direccion
    );
  }, [filtradas, columnas, orden]);

  const pag = paginar(ordenadas, pagina, tamano);

  const fuentes = useMemo(() => {
    const set = new Set<string>();
    for (const c of columnas) {
      if (c.tipo !== "cifra") continue;
      for (const f of filas) {
        const cifra = c.cifra(f);
        if (estadoEfectivo(cifra) === "ok") set.add(`${cifra.fuente} · dato al ${formatearFecha(cifra.fecha_dato)}`);
      }
    }
    return Array.from(set);
  }, [columnas, filas]);

  if (estado || filas.length === 0) {
    return <EstadoAnalitica estado={estado ?? "vacio"} onReintentar={onReintentar} />;
  }

  function cambiarFiltro(id: string, v: string) {
    setFiltros((prev) => ({ ...prev, [id]: v }));
    setPagina(1);
  }
  function quitarFiltros() {
    setFiltros({});
    setPagina(1);
  }
  function alternarOrden(id: string) {
    setOrden((prev) => (!prev || prev.columna !== id ? { columna: id, direccion: "asc" } : prev.direccion === "asc" ? { columna: id, direccion: "desc" } : null));
    setPagina(1);
  }

  const nivel = (c: ColumnaCifra<R>, fila: R): number | undefined => {
    if (!c.calor) return undefined;
    const r = rangos[c.id];
    const cifra = c.cifra(fila);
    if (!r || estadoEfectivo(cifra) !== "ok") return undefined;
    return nivelCalor(cifra.valor, r.min, r.max) ?? undefined;
  };
  const celda = (c: ColumnaAnalitica<R>, fila: R): ReactNode =>
    c.tipo === "texto" ? c.texto(fila) : <CeldaCifra cifra={c.cifra(fila)} nivel={nivel(c, fila)} />;

  const filtrables = columnas.filter((c) => c.filtrable);
  const sinResultados = filtradas.length === 0;

  const barraFiltros =
    filtrables.length > 0 ? (
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" role="group" aria-label={`Filtros de ${titulo}`}>
        {filtrables.map((c) => {
          const campo = `${uid}-f-${c.id}`;
          return (
            <div key={c.id} className="min-w-0">
              <label htmlFor={campo} className="mb-1 block text-forge-xs font-medium text-forgeGray-700">
                {c.tipo === "texto" ? `Filtrar ${c.encabezado}` : `${c.encabezado} — mínimo`}
              </label>
              <input
                id={campo}
                type="text"
                inputMode={c.tipo === "cifra" ? "decimal" : "text"}
                value={filtros[c.id] ?? ""}
                onChange={(e) => cambiarFiltro(c.id, e.target.value)}
                className={CAMPO}
              />
            </div>
          );
        })}
        {hayFiltros && !sinResultados ? (
          <div className="flex items-end">
            <button type="button" onClick={quitarFiltros} className={BOTON}>
              Quitar filtros
            </button>
          </div>
        ) : null}
      </div>
    ) : null;

  const controlesOrdenMovil = movil ? (
    <div className="mb-3 flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <label htmlFor={`${uid}-orden`} className="mb-1 block text-forge-xs font-medium text-forgeGray-700">
          Ordenar por
        </label>
        <select
          id={`${uid}-orden`}
          value={orden?.columna ?? ""}
          onChange={(e) => {
            setOrden(e.target.value ? { columna: e.target.value, direccion: orden?.direccion ?? "asc" } : null);
            setPagina(1);
          }}
          className={CAMPO}
        >
          <option value="">Sin orden</option>
          {columnas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.encabezado}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        disabled={!orden}
        aria-label={`Dirección del orden: ${orden?.direccion === "desc" ? "descendente" : "ascendente"}`}
        onClick={() => orden && (setOrden({ ...orden, direccion: orden.direccion === "asc" ? "desc" : "asc" }), setPagina(1))}
        className={BOTON}
      >
        {orden?.direccion === "desc" ? "↓ Desc." : "↑ Asc."}
      </button>
    </div>
  ) : null;

  let cuerpo: ReactNode;
  if (sinResultados) {
    cuerpo = (
      <EstadoAnalitica
        estado="vacio"
        accion={
          <button type="button" onClick={quitarFiltros} className={BOTON}>
            Quitar filtros
          </button>
        }
      />
    );
  } else if (movil) {
    const [titular, ...resto] = columnas;
    cuerpo = (
      <ul role="list" aria-label={titulo} className="m-0 list-none space-y-3 p-0">
        {pag.items.map((fila) => (
          <li key={obtenerId(fila)} className="min-w-0 rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card p-4">
            <p className="mb-2 break-words font-semibold text-forgeGray-900">{celda(titular, fila)}</p>
            <dl className="grid grid-cols-1 gap-2">
              {resto.map((c) => (
                <div key={c.id} className="flex min-w-0 items-baseline justify-between gap-3">
                  <dt className="shrink-0 text-forge-xs text-forgeGray-600">{c.encabezado}</dt>
                  <dd className="m-0 min-w-0 text-right text-forge-sm text-forgeGray-800">{celda(c, fila)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    );
  } else {
    const cols: DataTableColumn<R>[] = columnas.map((c) => ({
      id: c.id,
      header: c.encabezado,
      cell: (fila) => celda(c, fila),
      className: c.tipo === "cifra" ? "tabular-nums" : undefined,
      sort: orden?.columna === c.id ? (orden.direccion === "asc" ? "ascending" : "descending") : "none",
      onSort: () => alternarOrden(c.id),
    }));
    cuerpo = (
      <div role="region" aria-label={titulo}>
        <TablaConNombre titulo={titulo}>
          <DataTable columns={cols} rows={pag.items} getRowId={obtenerId} density="comfortable" />
        </TablaConNombre>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      {barraFiltros}
      {controlesOrdenMovil}
      {cuerpo}
      {fuentes.length > 0 ? (
        <p data-testid="tabla-fuentes" className="mt-3 text-forge-xs text-forgeGray-500">
          {fuentes.map((f) => `Fuente: ${f}`).join(" | ")}
        </p>
      ) : null}
      {sinResultados ? null : (
        <nav aria-label={`Paginación de ${titulo}`} className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-forge-sm text-forgeGray-700">
            {`Mostrando ${pag.desde}–${pag.hasta} de ${pag.total}`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {opcionesTamano && opcionesTamano.length > 1 ? (
              <div className="flex items-center gap-2">
                <label htmlFor={`${uid}-tam`} className="text-forge-xs text-forgeGray-700">
                  Filas por página
                </label>
                <select
                  id={`${uid}-tam`}
                  value={tamano}
                  onChange={(e) => {
                    setTamano(Number(e.target.value));
                    setPagina(1);
                  }}
                  className={cn(CAMPO, "w-auto")}
                >
                  {opcionesTamano.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <button type="button" className={BOTON} disabled={pag.pagina <= 1} onClick={() => setPagina(pag.pagina - 1)}>
              Anterior
            </button>
            <span className="text-forge-xs text-forgeGray-600" aria-hidden>{`${pag.pagina} / ${pag.paginas}`}</span>
            <button type="button" className={BOTON} disabled={pag.pagina >= pag.paginas} onClick={() => setPagina(pag.pagina + 1)}>
              Siguiente
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

/**
 * DataTable no acepta nombre accesible: se lo ponemos a su <table> desde un contenedor, sin editar el componente base.
 * (aria-label en el <table> se aplica en un efecto de capa fina via ref callback.)
 */
function TablaConNombre({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div
      ref={(el) => {
        el?.querySelector("table")?.setAttribute("aria-label", titulo);
      }}
    >
      {children}
    </div>
  );
}
