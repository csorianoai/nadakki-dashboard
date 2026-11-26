/**
 * Pasos de "Cargar una factura" (pedido de César, 26-nov): el recorrido de una factura de taller, que en este
 * formulario es un costo de tipo Reparación (POST /repair-invoices: proveedor, n.º de factura y archivo subido).
 *
 * Cada `hecho` sale del estado real: el auto elegido en la pantalla, y del panel los campos y la misma validacion que
 * usa el boton «Registrar costo» (`validateCostForm`). El formulario no tiene IVA aparte: no hay paso de IVA.
 */
import type { PasoTarea } from "@/lib/dealer/pasos-tarea";
import { esReparacion, type CostForm, type CostFormErrors } from "@/lib/dealer-management/vehicle-costs";

export type EstadoFactura = {
  form: CostForm;
  /** La fecha escrita se pudo leer en el formato del tenant. */
  fechaValida: boolean;
  /** Lo que diria «Registrar costo» si se tocara ahora. */
  errores: CostFormErrors;
};

export type FacturaRegistrada = { monto: string; proveedor: string; numero: string };

/** Formulario vacio otra vez (tras registrar se limpia): el final sigue a la vista hasta que se empiece otra carga. */
export function facturaSinEmpezar(estado: EstadoFactura | null): boolean {
  if (!estado) return true;
  const f = estado.form;
  return !f.amount.trim() && !f.supplier_name.trim() && !f.invoice_number.trim() && !f.document_id.trim();
}

export function pasosCargarFactura(
  vehiculoElegido: boolean,
  estado: EstadoFactura | null,
  registrada: FacturaRegistrada | null,
): PasoTarea[] {
  const listo = !!registrada && facturaSinEmpezar(estado);
  const f = estado?.form;
  const rep = !!f && esReparacion(f.cost_type);
  const e = estado?.errores ?? {};
  const paso = (p: Omit<PasoTarea, "hecho"> & { hecho: boolean }): PasoTarea => ({ ...p, hecho: listo || p.hecho });
  return [
    paso({
      id: "auto",
      titulo: "Elegir el auto",
      hecho: vehiculoElegido,
      ayuda: "En «Vehículo», elegí la unidad a la que corresponde la factura.",
    }),
    paso({
      id: "tipo",
      titulo: "Elegir el tipo de costo «Reparación»",
      hecho: rep,
      ayuda: "Las facturas de taller se cargan como Reparación: así te pide proveedor, número y el archivo.",
    }),
    paso({
      id: "proveedor",
      titulo: "Proveedor (quién te facturó)",
      hecho: rep && !e.supplier_name,
      ayuda: "El nombre del taller o del proveedor, como figura en la factura.",
    }),
    paso({
      id: "monto",
      titulo: "Monto de la factura",
      hecho: !!f && !e.amount,
      ayuda: "Si el IVA es recuperable, cargá el neto sin IVA: el IVA recuperable no es costo del auto.",
    }),
    paso({
      id: "numero",
      titulo: "Número de factura",
      hecho: rep && !e.invoice_number,
      ayuda: "Tal como figura en la factura.",
    }),
    paso({
      id: "fecha",
      titulo: "Fecha de la factura",
      hecho: !!estado && estado.fechaValida && !e.incurred_at,
    }),
    paso({
      id: "archivo",
      titulo: "Subir el archivo de la factura",
      hecho: rep && !e.document_id,
      ayuda: "Un PDF o una foto, de hasta 10 MB. Esperá a que diga «Factura subida».",
    }),
    { id: "guardar", titulo: "Tocar «Registrar costo»", hecho: listo },
  ];
}

export function textoFinalFactura(r: FacturaRegistrada): string {
  return (
    `Listo: factura cargada. Quedó registrado un costo de reparación por ${r.monto} de ${r.proveedor} ` +
    `(factura ${r.numero}) y el total del auto ya lo incluye. Se registra como compra nueva, contra Proveedores (2010).`
  );
}
