import { Children, type ReactNode } from "react";

type Columna = { peso: number; minimo: number };

/**
 * Dos columnas en proporción `peso` (como `minmax(minimo, peso fr)`) que pasan a una sola cuando el ancho no da para los
 * dos mínimos (LAYOUT-RESPONSIVE: a 511 px la rejilla fija desbordaba y el contenedor recortaba «Editar contacto» y
 * «Plantillas»). Base 0 y `flex-grow` = peso reparten igual que `fr`; el salto de línea usa los mínimos, que nunca
 * pasan del 100 % del contenedor. Con un solo hijo, una columna.
 */
export function DosColumnas({ columnas, children, testId }: { columnas: readonly [Columna, Columna]; children: ReactNode; testId?: string }) {
  const hijos = Children.toArray(children);
  return (
    <div data-testid={testId} data-columnas={hijos.length} style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
      {hijos.map((hijo, i) => {
        const c = hijos.length === 1 ? { peso: 1, minimo: columnas[0].minimo } : columnas[i] ?? columnas[1];
        return <div key={i} style={{ flex: `${c.peso} 1 0`, minWidth: `min(100%, ${c.minimo}px)` }}>{hijo}</div>;
      })}
    </div>
  );
}
