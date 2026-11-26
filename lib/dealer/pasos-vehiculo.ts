/**
 * Pasos de las dos tareas de un auto (pedido de Cesar, 26-nov): cargarlo por primera vez y registrar su venta.
 * Funciones puras: cada `hecho` sale de un dato que la pantalla ya lee; aca no se pide nada al backend.
 */
import type { PasoTarea } from "./pasos-tarea";

/** Estados en los que el auto ya paso por Disponible (el backend solo publica con precio). */
const YA_PUBLICADO = new Set(["disponible", "reservado", "vendido"]);

export const fichaPath = (vehicleId: string) => `/autos/dealer/inventario/${encodeURIComponent(vehicleId)}`;

/** Anclas de las secciones de la ficha (las pone page.tsx). */
export const ANCLA = { fotos: "fotos", precio: "precio", comisiones: "comisiones" } as const;

export type DatosCargaAuto = {
  vehicleId: string;
  make: string | null;
  model: string | null;
  year: number | null;
  status: string | null;
  price_amount: string | null;
  /** Fecha de adquisicion (GET /days) o compra leida (GET /purchase): cualquiera prueba que se registro. */
  compraRegistrada: boolean;
  /** Cantidad de fotos leidas; null si el plan no incluye fotos. */
  fotos: number | null;
  /** Con `autos.costs.view`. Sin ella la ficha no nombra costos en ningun lado, tampoco aca. */
  verCostos: boolean;
};

/** null = no se muestra: un auto vendido ya cerro su ciclo (la ficha pasa a mostrar la venta y sus comisiones). */
export function pasosCargaAuto(d: DatosCargaAuto): PasoTarea[] | null {
  const estado = (d.status ?? "").trim().toLowerCase();
  if (estado === "vendido") return null;
  const base = fichaPath(d.vehicleId);
  const publicado = YA_PUBLICADO.has(estado);
  const pasos: PasoTarea[] = [
    { id: "datos", titulo: "Datos del auto (marca, modelo y año)", hecho: Boolean(d.make && d.model && d.year), ayuda: "Se cargan al dar de alta el auto." },
    {
      id: "compra", titulo: "Registrar la compra", hecho: d.compraRegistrada, enlace: `${base}/registrar`,
      ayuda: "Cuándo, cómo y en qué país compraste el auto. Se hace en Adquisición.",
    },
    d.fotos === null
      ? { id: "fotos", titulo: "Subir fotos", hecho: false, opcional: true, ayuda: "Tu plan no incluye las fotos del vehículo." }
      : { id: "fotos", titulo: "Subir fotos", hecho: d.fotos > 0, enlace: `#${ANCLA.fotos}`, ayuda: "Al menos una foto, en la sección Fotos de esta ficha." },
    { id: "precio", titulo: "Poner el precio de venta", hecho: Boolean(d.price_amount), enlace: `#${ANCLA.precio}`, ayuda: "Escribí el precio y tocá Guardar cambios." },
    { id: "publicar", titulo: "Pasarlo a Disponible", hecho: publicado, enlace: `#${ANCLA.precio}`, ayuda: "Con el precio guardado, tocá Pasar a Disponible." },
  ];
  if (d.verCostos) {
    // Sin dato fiable de "gastos cargados" (el costo total mezcla la compra): queda opcional y sin tilde.
    pasos.push({
      id: "costos", titulo: "Cargar gastos y facturas", hecho: false, opcional: true,
      ayuda: "Si tuviste gastos (taller, papeles, traslado), cargalos en Adquisición, en Coste.",
    });
  }
  // Siempre presente, para que el total no salte de "de 5" a "de 6" al pasar a Disponible: antes de publicar queda
  // pendiente y sin enlace (la pantalla de venta solo sirve para un auto publicado).
  pasos.push(
    publicado
      ? {
          id: "vender", titulo: "Registrar la venta", hecho: false, enlace: `${base}/vender`,
          ayuda: "Cuando lo vendas, registrá la venta: así entra en la contabilidad.",
        }
      : { id: "vender", titulo: "Registrar la venta", hecho: false, ayuda: "Primero pasalo a Disponible." },
  );
  return pasos;
}

export type DatosVenta = {
  precioYFecha: boolean;
  comprador: boolean;
  formaDePago: boolean;
  fiscal: boolean;
  /** "ITBIS" en Republica Dominicana, "IVA" en el resto. */
  impuesto: "IVA" | "ITBIS";
  registrada: boolean;
};

export function pasosVenta(d: DatosVenta): PasoTarea[] {
  const ok = (v: boolean) => d.registrada || v;
  return [
    { id: "precio", titulo: "Precio y fecha de la venta", hecho: ok(d.precioYFecha), ayuda: "El precio, mayor que cero, y cuándo se vendió." },
    { id: "comprador", titulo: "Elegir el comprador", hecho: ok(d.comprador), ayuda: "Buscalo en tus contactos por nombre, DNI o CUIT." },
    { id: "pago", titulo: "Forma de pago", hecho: ok(d.formaDePago), ayuda: "Contado en efectivo, por banco o a cobrar." },
    { id: "fiscal", titulo: `${d.impuesto} y permuta`, hecho: ok(d.fiscal), ayuda: `Revisá el ${d.impuesto} y, si recibís un usado, sus datos.` },
    // La comision se registra sobre una venta que ya existe (SALE_NOT_FOUND si no): va despues, en la ficha.
    {
      id: "comision", titulo: "Comisión del vendedor", hecho: false, opcional: true,
      ayuda: "Si la venta tiene vendedor, la comisión se carga después, en la ficha del auto.",
    },
    { id: "confirmar", titulo: "Confirmar con Registrar venta", hecho: d.registrada, ayuda: "Revisá los datos y tocá Registrar venta." },
  ];
}

/** Lo que sigue tras registrar la venta. Solo rutas que existen en el panel (libro diario no tiene pantalla). */
export function despuesDeVender(vehicleId: string): { href: string; texto: string }[] {
  return [
    { href: `${fichaPath(vehicleId)}#${ANCLA.comisiones}`, texto: "Cargar la comisión del vendedor" },
    { href: "/contable/libro-mayor", texto: "Ver la venta en la contabilidad (libro mayor)" },
    { href: "/autos/dealer/inventario", texto: "Volver al inventario" },
  ];
}
