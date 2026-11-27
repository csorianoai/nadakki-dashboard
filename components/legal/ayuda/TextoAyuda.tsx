import { Fragment, type ReactNode } from "react";

/**
 * Texto de una respuesta del asistente de ayuda (27-nov-2026). La guía y el modelo escriben negritas (**así**) y
 * tablas en markdown («| Membresía | Precio |»); sin esto el abogado veía los asteriscos y las barras. No interpreta
 * HTML ni enlaces: los enlaces del asistente salen aparte, de una lista cerrada.
 */
function enLinea(t: string): ReactNode[] {
  return t.split(/(\*\*[^*\n]+\*\*)/g).filter(Boolean).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") && p.length > 4 ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>);
}

const celdas = (linea: string) => linea.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
const esSeparador = (linea: string) => /^\s*\|?\s*:?-{2,}/.test(linea) && /^[\s|:-]+$/.test(linea);
const esFila = (linea: string) => /^\s*\|.*\|\s*$/.test(linea);

export function TextoAyuda({ texto }: { texto: string }) {
  const lineas = texto.split("\n");
  const bloques: ReactNode[] = [];
  let i = 0;
  while (i < lineas.length) {
    if (esFila(lineas[i]) && i + 1 < lineas.length && esSeparador(lineas[i + 1])) {
      const cabecera = celdas(lineas[i]);
      const filas: string[][] = [];
      i += 2;
      while (i < lineas.length && esFila(lineas[i])) filas.push(celdas(lineas[i++]));
      bloques.push(
        <div key={`t${i}`} className="my-2 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead><tr>{cabecera.map((c, k) => <th key={k} scope="col" className="border-b border-slate-300 px-1.5 py-1 font-semibold">{enLinea(c)}</th>)}</tr></thead>
            <tbody>{filas.map((f, r) => <tr key={r}>{f.map((c, k) => <td key={k} className="border-b border-slate-200 px-1.5 py-1 align-top">{enLinea(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }
    bloques.push(<Fragment key={`l${i}`}>{enLinea(lineas[i])}{i < lineas.length - 1 ? "\n" : ""}</Fragment>);
    i++;
  }
  return <>{bloques}</>;
}
