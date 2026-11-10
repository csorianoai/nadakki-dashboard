/**
 * PROTOTIPO — filas deterministas SOLO para tests y capturas. No son datos reales de ningun tenant.
 * Prohibido importarlas desde components/analytics/kit o lib/analytics (lo comprueba aislamiento.test.ts).
 */
import type { Cifra } from "@/lib/analytics/cifra";
import { FECHA_FIJA, PERIODO_30D } from "./cifras.fixture";

export interface FilaCampana {
  id: string;
  nombre: string;
  clics: Cifra;
  ctr: Cifra;
  costo: Cifra;
}

const base = { periodo: PERIODO_30D, fuente: "PROTOTIPO · fixture de pruebas", fecha_dato: FECHA_FIJA, estado: "ok" as const };

export const cifra = (id: string, etiqueta: string, valor: number | null, unidad: Cifra["unidad"], extra: Partial<Cifra> = {}): Cifra => ({
  ...base,
  id,
  etiqueta,
  valor,
  valor_anterior: null,
  unidad,
  ...(unidad === "moneda" ? { moneda: "USD" } : {}),
  ...extra,
});

export function fila(id: string, nombre: string, clics: number | null, ctr: number | null, costo: number | null, extra: Partial<FilaCampana> = {}): FilaCampana {
  return {
    id,
    nombre,
    clics: cifra(`${id}-clics`, "Clics", clics, "numero"),
    ctr: cifra(`${id}-ctr`, "CTR", ctr, "porcentaje"),
    costo: cifra(`${id}-costo`, "Costo", costo, "moneda"),
    ...extra,
  };
}

/** 5 filas con valores distintos, una con valor nulo y una con fuente ausente. */
export const FILAS_CINCO: FilaCampana[] = [
  fila("a", "Alfa", 100, 2.5, 50),
  fila("b", "Beta", 400, 1.0, 20),
  fila("c", "Gamma", 250, 4.0, 80),
  fila("d", "Delta", null, null, null),
  fila("e", "Épsilon", 400, 3.0, 35, { costo: cifra("e-costo", "Costo", 35, "moneda", { fuente: null }) }),
];

/** 25 filas: nombres "Camp 01".."Camp 25", clics = indice * 10. */
export const FILAS_VEINTICINCO: FilaCampana[] = Array.from({ length: 25 }, (_, i) => {
  const n = i + 1;
  return fila(`c${n}`, `Camp ${String(n).padStart(2, "0")}`, n * 10, n / 10, n * 2);
});

/** Todos los clics iguales: la escala de calor no puede dividir por cero. */
export const FILAS_IGUALES: FilaCampana[] = [fila("x", "Uno", 7, 1, 1), fila("y", "Dos", 7, 1, 1)];
