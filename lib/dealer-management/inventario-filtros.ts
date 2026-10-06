/**
 * Busqueda, filtro por estado y orden del inventario del dealer (auditoria
 * Mapaal QA, P1). Todo en el cliente: la lista privada ya trae lo necesario y
 * el backend no tiene parametros de busqueda en esa ruta. "Más recientes" es el
 * orden en que llega (created_at desc en el backend), sin reordenar.
 */
import type { DealerInventoryVehicle } from "@/lib/dealer-management/inventory";

export type OrdenInventario = "recientes" | "anio-desc" | "anio-asc" | "marca" | "precio-asc" | "precio-desc";

export const ORDENES: { value: OrdenInventario; label: string }[] = [
  { value: "recientes", label: "Más recientes" },
  { value: "anio-desc", label: "Año: más nuevo primero" },
  { value: "anio-asc", label: "Año: más viejo primero" },
  { value: "marca", label: "Marca y modelo (A-Z)" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
];

export type FiltrosInventario = { texto: string; estado: string; orden: OrdenInventario };

export const FILTROS_VACIOS: FiltrosInventario = { texto: "", estado: "", orden: "recientes" };

/** Sin tildes ni mayusculas: "Peugeot 208" encuentra "peugeot". */
function normal(valor: string | null | undefined): string {
  return (valor ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function coincide(v: DealerInventoryVehicle, texto: string): boolean {
  const pajar = normal([v.year, v.make, v.model, v.plate, v.stock_number, v.vin].filter(Boolean).join(" "));
  const pajarSinEspacios = pajar.replace(/[\s-]/g, "");
  return normal(texto)
    .split(/\s+/)
    .filter(Boolean)
    .every((palabra) => pajar.includes(palabra) || pajarSinEspacios.includes(palabra.replace(/-/g, "")));
}

/** Los vehiculos sin el dato van al final en cualquier sentido del orden. */
function porNumero(a: number | null, b: number | null, sentido: 1 | -1): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return (a - b) * sentido;
}

const anio = (v: DealerInventoryVehicle) => (v.year && Number.isFinite(Number(v.year)) ? Number(v.year) : null);

export function filtrarInventario(
  vehiculos: DealerInventoryVehicle[],
  { texto, estado, orden }: FiltrosInventario,
): DealerInventoryVehicle[] {
  const filtrados = vehiculos.filter((v) => (!estado || v.status === estado) && coincide(v, texto));
  const copia = [...filtrados];
  switch (orden) {
    case "anio-desc":
      return copia.sort((a, b) => porNumero(anio(a), anio(b), -1));
    case "anio-asc":
      return copia.sort((a, b) => porNumero(anio(a), anio(b), 1));
    case "precio-asc":
      return copia.sort((a, b) => porNumero(a.price_amount ?? null, b.price_amount ?? null, 1));
    case "precio-desc":
      return copia.sort((a, b) => porNumero(a.price_amount ?? null, b.price_amount ?? null, -1));
    case "marca":
      return copia.sort((a, b) =>
        `${a.make ?? ""} ${a.model ?? ""}`.localeCompare(`${b.make ?? ""} ${b.model ?? ""}`, "es", { sensitivity: "base" }),
      );
    default:
      return copia;
  }
}

/** Los estados presentes, en el orden del ciclo de vida, para el filtro. */
export function estadosPresentes(vehiculos: DealerInventoryVehicle[], ciclo: string[]): string[] {
  const hay = new Set(vehiculos.map((v) => v.status).filter((s): s is string => Boolean(s)));
  return [...ciclo.filter((s) => hay.has(s)), ...[...hay].filter((s) => !ciclo.includes(s))];
}
